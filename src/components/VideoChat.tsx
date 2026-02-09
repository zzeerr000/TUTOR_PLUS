import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Settings,
  Users,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";
import { api } from "../services/api";

// Dynamic import for Zoom SDK to reduce initial bundle size
let ZoomMtg: any = null;

const loadZoomSDK = async () => {
  if (ZoomMtg) return ZoomMtg;

  // Zoom SDK expects React and ReactDOM to be global
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;

  const scripts = [
    "https://cdnjs.cloudflare.com/ajax/libs/redux/4.2.1/redux.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/redux-thunk/2.4.2/redux-thunk.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
    "https://cdn.jsdelivr.net/npm/@zoomus/websdk@2.18.3/dist/zoom-meeting-2.18.2.min.js",
  ];

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.crossOrigin = "anonymous"; // Add crossOrigin for jsDelivr
      script.onload = () => {
        console.log(`Script loaded: ${src}`);
        resolve();
      };
      script.onerror = (e) => {
        console.error(`Script load error: ${src}`, e);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.body.appendChild(script);
    });
  };

  try {
    console.log("Loading Zoom SDK dependencies dynamically from mirrors...");
    for (const src of scripts) {
      await loadScript(src);
    }

    const getSDK = () => (window as any).ZoomMtg;

    // Final wait for initialization
    if (!getSDK()) {
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if (getSDK()) break;
      }
    }

    const sdk = getSDK();
    if (!sdk) {
      throw new Error("ZoomMtg global object not found after script loading.");
    }

    // Load Zoom CSS from jsDelivr
    const loadCSS = (url: string) => {
      if (!document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    };

    loadCSS(
      "https://cdn.jsdelivr.net/npm/@zoomus/websdk@2.18.3/dist/css/bootstrap.css",
    );
    loadCSS(
      "https://cdn.jsdelivr.net/npm/@zoomus/websdk@2.18.3/dist/css/react-select.css",
    );

    sdk.setZoomJSLib(
      "https://cdn.jsdelivr.net/npm/@zoomus/websdk@2.18.3/dist/lib",
      "https://cdn.jsdelivr.net/npm/@zoomus/websdk@2.18.3/dist/lib/av",
    );
    sdk.preLoadWasm();
    sdk.prepareWebSDK();
    sdk.i18n.load("ru-RU");
    sdk.i18n.reload("ru-RU");

    ZoomMtg = sdk;
    return ZoomMtg;
  } catch (error) {
    console.error("Zoom SDK loading failed:", error);
    throw error;
  }
};

interface User {
  id: number;
  email: string;
  name: string;
  role: "tutor" | "student";
}

interface VideoChatProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export function VideoChat({ user, onNavigate }: VideoChatProps) {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [password, setPassword] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [zoomConnected, setZoomConnected] = useState(true); // Default to true to avoid flicker

  useEffect(() => {
    if (user.role === "tutor") {
      api.getZoomStatus().then((status) => setZoomConnected(status.connected));
    }
  }, [user.role]);

  useEffect(() => {
    // Zoom SDK creates its own UI elements, we need to handle their visibility
    const zoomRoot = document.getElementById("zmmtg-root");
    if (isInMeeting && zoomRoot) {
      zoomRoot.style.display = "block";
    } else if (zoomRoot) {
      zoomRoot.style.display = "none";
    }
  }, [isInMeeting]);

  const handleJoinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!meetingId.trim()) return;

    setLoading(true);
    setError(null);

    const cleanMeetingId = meetingId.replace(/\s/g, "");

    try {
      // 1. Get signature and sdkKey from backend
      const role = user.role === "tutor" ? 1 : 0;
      const { signature, sdkKey } = await api.getZoomSignature(
        cleanMeetingId,
        role,
      );

      console.log("Zoom signature received, initializing SDK...");

      // 2. Load Zoom SDK dynamically if not already loaded
      const sdk = await loadZoomSDK();

      // 3. Initialize and join meeting
      sdk.init({
        leaveUrl: window.location.origin,
        patchJs: true,
        debug: true,
        success: () => {
          sdk.join({
            meetingNumber: cleanMeetingId,
            signature: signature,
            sdkKey: sdkKey,
            userName: user.name,
            passWord: password,
            success: (success: any) => {
              console.log("Joined meeting successfully", success);
              setIsInMeeting(true);
            },
            error: (error: any) => {
              console.error("Failed to join meeting", error);
              setError(error.errorMessage || "Ошибка при входе в конференцию");
              setLoading(false);
            },
          });
        },
        error: (error: any) => {
          console.error("Failed to initialize Zoom SDK", error);
          setError("Ошибка инициализации Zoom SDK");
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "Не удалось подключиться к Zoom");
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    setLoading(true);
    setError(null);

    try {
      const topic = `Урок с ${user.name}`;
      const meeting = await api.createZoomMeeting(topic, 60);

      setMeetingId(meeting.id);
      setPassword(meeting.password || "");

      // Join the meeting automatically
      const { signature, sdkKey } = await api.getZoomSignature(meeting.id, 1);

      // Load Zoom SDK dynamically
      const sdk = await loadZoomSDK();

      sdk.init({
        leaveUrl: window.location.origin,
        patchJs: true,
        debug: true,
        success: () => {
          sdk.join({
            meetingNumber: meeting.id,
            signature: signature,
            sdkKey: sdkKey,
            userName: user.name,
            passWord: meeting.password || "",
            success: () => {
              setIsInMeeting(true);
              setLoading(false);
            },
            error: (error: any) => {
              console.error(error);
              setError("Ошибка при входе в созданную конференцию");
              setLoading(false);
            },
          });
        },
        error: (error: any) => {
          console.error(error);
          setError("Ошибка инициализации SDK");
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "Не удалось создать конференцию");
      console.error(err);
      setLoading(false);
    }
  };

  const handleLeaveMeeting = () => {
    setIsInMeeting(false);
  };

  if (isInMeeting) {
    return (
      <div className="flex flex-col h-[calc(100vh-220px)] bg-black rounded-xl overflow-hidden relative mb-4">
        {/* Meeting Area */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-[#1db954]">
                {user.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-medium">{user.name} (Вы)</h2>
            <p className="text-gray-500 mt-2">
              Ожидание подключения других участников...
            </p>
          </div>

          {/* Settings Modal/Popover */}
          {showSettings && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-[#181818] border border-gray-800 rounded-xl p-6 z-30 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Настройки</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Камера
                  </label>
                  <select className="w-full bg-[#282828] border border-gray-700 rounded px-2 py-1 text-sm outline-none">
                    <option>Встроенная камера</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Микрофон
                  </label>
                  <select className="w-full bg-[#282828] border border-gray-700 rounded px-2 py-1 text-sm outline-none">
                    <option>Встроенный микрофон</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Динамики
                  </label>
                  <select className="w-full bg-[#282828] border border-gray-700 rounded px-2 py-1 text-sm outline-none">
                    <option>Системные динамики</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-6 bg-[#1db954] text-black font-bold py-2 rounded hover:bg-[#1ed760] transition-colors"
              >
                Готово
              </button>
            </div>
          )}

          {/* Zoom Meeting SDK Container would be here */}
          <div id="zmmtg-root" className="absolute inset-0 z-10 hidden"></div>
        </div>

        {/* Controls Overlay */}
        <div className="bg-[#121212]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-colors cursor-pointer ${isMuted ? "bg-red-500 text-white" : "bg-[#282828] hover:bg-[#333333] text-white"}`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-full transition-colors cursor-pointer ${isVideoOff ? "bg-red-500 text-white" : "bg-[#282828] hover:bg-[#333333] text-white"}`}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 rounded-full bg-[#282828] hover:bg-[#333333] text-white transition-colors cursor-pointer">
              <Monitor size={20} />
            </button>
            <button className="p-3 rounded-full bg-[#282828] hover:bg-[#333333] text-white transition-colors cursor-pointer">
              <Users size={20} />
            </button>
            <button className="p-3 rounded-full bg-[#282828] hover:bg-[#333333] text-white transition-colors cursor-pointer">
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full transition-colors cursor-pointer ${showSettings ? "bg-[#1db954] text-black" : "bg-[#282828] hover:bg-[#333333] text-white"}`}
            >
              <Settings size={20} />
            </button>
          </div>

          <button
            onClick={handleLeaveMeeting}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
          >
            <PhoneOff size={20} />
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#1db954]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Video className="text-[#1db954]" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Видеочат Zoom</h1>
        <p className="text-gray-400">
          Присоединяйтесь к онлайн-занятию с помощью идентификатора конференции
        </p>
      </div>

      <div className="bg-[#181818] rounded-xl border border-gray-800 p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {user.role === "tutor" && !zoomConnected && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-yellow-500 text-sm flex flex-col gap-2">
            <p className="font-medium">Zoom не подключен</p>
            <p className="text-gray-400">
              Чтобы создавать конференции, необходимо подключить ваш аккаунт
              Zoom в настройках.
            </p>
            <button
              onClick={() => onNavigate("settings")}
              className="text-yellow-500 hover:text-yellow-400 font-bold text-left underline"
            >
              Перейти в настройки
            </button>
          </div>
        )}

        <form onSubmit={handleJoinMeeting} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Идентификатор конференции (Meeting ID)
            </label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Например: 123 456 7890"
              className="w-full bg-[#282828] border border-gray-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#1db954] transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Код доступа (Passcode)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите код доступа"
              className="w-full bg-[#282828] border border-gray-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#1db954] transition-all"
              disabled={loading}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Video size={20} />
              )}
              Присоединиться к конференции
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-800 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#282828]/50 border border-gray-800">
            <h3 className="text-sm font-medium mb-1">Создать встречу</h3>
            <p className="text-xs text-gray-500 mb-3">
              Сгенерировать новую ссылку для ученика
            </p>
            <button
              onClick={handleCreateMeeting}
              disabled={loading}
              className="text-[#1db954] text-sm font-medium hover:underline flex items-center gap-1 disabled:text-gray-500 disabled:no-underline"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Сгенерировать →
            </button>
          </div>
          <div className="p-4 rounded-lg bg-[#282828]/50 border border-gray-800">
            <h3 className="text-sm font-medium mb-1">Инструкция</h3>
            <p className="text-xs text-gray-500 mb-3">
              Как пользоваться видеочатом Zoom
            </p>
            <button className="text-[#1db954] text-sm font-medium hover:underline">
              Читать →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Интегрировано с использованием Zoom Meeting SDK. Ваши звонки защищены
          сквозным шифрованием.
        </p>
      </div>
    </div>
  );
}
