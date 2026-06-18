  import React from "react";
  import { createRoot } from "react-dom/client";
  import { Capacitor } from "@capacitor/core";
  import { StatusBar, Style } from "@capacitor/status-bar";
  import App from "./App.tsx";
  import "./styles/globals.css";

  async function bootstrap() {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#252525" });
      } catch {
        // Status bar plugin is optional during web preview
      }
    }

    createRoot(document.getElementById("root")!).render(<App />);
  }

  bootstrap();
  