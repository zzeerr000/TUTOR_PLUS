import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import axios from "axios";
import { User } from "../users/entities/user.entity";

@Injectable()
export class ZoomService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private get zoomSdkKey() {
    return this.configService.get<string>("ZOOM_SDK_KEY");
  }

  private get zoomSdkSecret() {
    return this.configService.get<string>("ZOOM_SDK_SECRET");
  }

  private get zoomClientId() {
    return this.configService.get<string>("ZOOM_CLIENT_ID");
  }

  private get zoomClientSecret() {
    return this.configService.get<string>("ZOOM_CLIENT_SECRET");
  }

  private get redirectUri() {
    return this.configService.get<string>("ZOOM_REDIRECT_URI");
  }

  getAuthUrl(userId: number) {
    const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${this.zoomClientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${userId}`;
    console.log("Generated Zoom Auth URL:", url);
    console.log("Using Redirect URI:", this.redirectUri);
    return url;
  }

  async exchangeCodeForTokens(code: string, userId: number) {
    try {
      const auth = Buffer.from(
        `${this.zoomClientId}:${this.zoomClientSecret}`,
      ).toString("base64");

      const response = await axios.post(
        "https://zoom.us/oauth/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = Date.now() + expires_in * 1000;

      await this.userRepository.update(userId, {
        zoomAccessToken: access_token,
        zoomRefreshToken: refresh_token,
        zoomTokenExpires: expiresAt,
      });

      return { access_token };
    } catch (error) {
      console.error(
        "Error exchanging Zoom code:",
        error.response?.data || error.message,
      );
      throw new HttpException(
        "Failed to link Zoom account",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async refreshUserToken(user: User) {
    try {
      const auth = Buffer.from(
        `${this.zoomClientId}:${this.zoomClientSecret}`,
      ).toString("base64");

      const response = await axios.post(
        "https://zoom.us/oauth/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: user.zoomRefreshToken,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = Date.now() + expires_in * 1000;

      await this.userRepository.update(user.id, {
        zoomAccessToken: access_token,
        zoomRefreshToken: refresh_token,
        zoomTokenExpires: expiresAt,
      });

      return access_token;
    } catch (error) {
      console.error(
        "Error refreshing Zoom token:",
        error.response?.data || error.message,
      );
      throw new HttpException(
        "Zoom session expired. Please reconnect your Zoom account.",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getUserAccessToken(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.zoomAccessToken) {
      throw new HttpException(
        "Zoom account not linked",
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    // Check if token is expired or expires in next 5 minutes
    if (Date.now() + 300000 >= user.zoomTokenExpires) {
      return this.refreshUserToken(user);
    }

    return user.zoomAccessToken;
  }

  generateSignature(meetingNumber: string, role: number) {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const oHeader = { alg: "HS256", typ: "JWT" };

    const oPayload = {
      sdkKey: this.zoomSdkKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      appKey: this.zoomSdkKey,
      tokenExp: iat + 60 * 60 * 2,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);

    const base64Header = Buffer.from(sHeader).toString("base64url");
    const base64Payload = Buffer.from(sPayload).toString("base64url");

    const signature = crypto
      .createHmac("sha256", this.zoomSdkSecret)
      .update(base64Header + "." + base64Payload)
      .digest("base64url");

    return `${base64Header}.${base64Payload}.${signature}`;
  }

  async createMeeting(userId: number, topic: string, duration: number = 60) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const response = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          topic,
          type: 2, // Scheduled meeting
          duration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            waiting_room: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return {
        id: response.data.id.toString(),
        password: response.data.password,
        start_url: response.data.start_url,
        join_url: response.data.join_url,
      };
    } catch (error) {
      console.error(
        "Error creating Zoom meeting:",
        error.response?.data || error.message,
      );
      // Fallback to mock if client credentials are not provided or for local development debugging
      if (
        !this.zoomClientId ||
        !this.zoomClientSecret ||
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        console.log("Using Mock fallback due to API error:", error.message);
        return {
          id: Math.floor(Math.random() * 10000000000).toString(),
          password: Math.random().toString(36).slice(-8),
          start_url: "https://zoom.us/s/example",
          join_url: "https://zoom.us/j/example",
        };
      }
      throw new HttpException(
        `Failed to create Zoom meeting: ${error.response?.data?.message || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
