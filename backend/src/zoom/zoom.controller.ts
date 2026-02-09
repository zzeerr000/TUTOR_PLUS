import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ZoomService } from "./zoom.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response } from "express";

@Controller("zoom")
export class ZoomController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("connect")
  async connect(@Req() req) {
    // sub comes from JwtStrategy.validate
    const userId = req.user.sub || req.user.id;
    const url = this.zoomService.getAuthUrl(userId);
    return { url };
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") userId: string,
    @Res() res: Response,
  ) {
    await this.zoomService.exchangeCodeForTokens(code, parseInt(userId));
    // Redirect back to frontend settings using query parameter instead of path
    return res.redirect(
      `${this.configService.get("FRONTEND_URL")}/?tab=settings&zoom=connected`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("status")
  async getStatus(@Req() req) {
    try {
      const userId = req.user.sub || req.user.id;
      await this.zoomService.getUserAccessToken(userId);
      return { connected: true };
    } catch (e) {
      return { connected: false };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("signature")
  getSignature(
    @Query("meetingNumber") meetingNumber: string,
    @Query("role") role: string,
  ) {
    const signature = this.zoomService.generateSignature(
      meetingNumber,
      parseInt(role) || 0,
    );
    return {
      signature,
      sdkKey: this.configService.get("ZOOM_SDK_KEY"),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("create-meeting")
  async createMeeting(
    @Req() req,
    @Body() data: { topic: string; duration?: number },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.zoomService.createMeeting(userId, data.topic, data.duration);
  }
}
