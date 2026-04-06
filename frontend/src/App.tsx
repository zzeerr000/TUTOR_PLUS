import React, { useState, useEffect } from "react";
import {
  Home,
  Calendar,
  FolderOpen,
  MessageCircle,
  DollarSign,
  Users,
  CheckSquare,
  TrendingUp,
  LogOut,
  Copy,
  Check,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { Homework } from "./components/Homework";
import { CalendarView } from "./components/CalendarView";
import { FileManager } from "./components/FileManager";
import { Messenger } from "./components/Messenger";
import { Finance } from "./components/Finance";
import { StudentManager } from "./components/StudentManager";
import { Progress } from "./components/Progress";
import { Menu } from "./components/Menu";
import { Auth } from "./components/Auth";
import { Connections } from "./components/Connections";
import { Settings } from "./components/Settings";
import { api } from "./services/api";

interface User {
  id: number;
  email: string;
  name: string;
  role: "tutor" | "student";
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userCode, setUserCode] = useState<string>("");
  const [showCodeMenu, setShowCodeMenu] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      return "dark"; // Default to dark
    }
    return "dark";
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Tabs that should highlight the Menu icon
  const menuTabs = [
    "menu",
    "connections",
    "materials",
    "settings",
    "students",
    "finance",
  ];

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      console.log("Auth status:", api.getAuthStatus());
    } else {
      console.log("No authentication found");
      // Clear any potentially corrupted data
      api.clearAuth();
    }
  }, []);

  useEffect(() => {
    console.log("User state changed:", user);
    if (user) {
      loadUserCode();
    }
  }, [user]);

  const loadUserCode = async () => {
    try {
      const data = await api.getCode();
      setUserCode(data.code);
    } catch (error) {
      console.error("Failed to load user code:", error);
    }
  };

  const copyCode = async () => {
    if (userCode) {
      await navigator.clipboard.writeText(userCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    console.log("handleAuthSuccess called with:", { userData, token });
    setUser(userData);
    console.log("User state set, current user:", userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setActiveTab("dashboard");
  };

  const handleNameUpdate = (newName: string) => {
    if (user) {
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const handleAccountDelete = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setActiveTab("dashboard");
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const userType = user.role;

  const tutorTabs = [
    { id: "dashboard", label: "Главная", icon: Home },
    { id: "calendar", label: "Календарь", icon: Calendar },
    { id: "homework", label: "ДЗ", icon: CheckSquare },
    { id: "messenger", label: "Чат", icon: MessageCircle },
    { id: "menu", label: "Меню", icon: MenuIcon },
  ];

  const studentTabs = [
    { id: "dashboard", label: "Главная", icon: Home },
    { id: "calendar", label: "Календарь", icon: Calendar },
    { id: "homework", label: "ДЗ", icon: CheckSquare },
    { id: "progress", label: "Прогресс", icon: TrendingUp },
    { id: "messenger", label: "Чат", icon: MessageCircle },
    { id: "menu", label: "Меню", icon: MenuIcon },
  ];

  const tabs = userType === "tutor" ? tutorTabs : studentTabs;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard userType={userType} onNavigate={setActiveTab} />;
      case "homework":
        return <Homework userType={userType} />;
      case "calendar":
        return <CalendarView userType={userType} />;
      case "students":
        return <StudentManager />;
      case "connections":
        return <Connections userType={userType} />;
      case "messenger":
        return <Messenger userType={userType} />;
      case "finance":
        return <Finance userType={user?.role} />;
      case "materials":
        return <FileManager userType={userType} />;
      case "progress":
        return <Progress />;
      case "settings":
        return (
          <Settings
            user={user}
            onNameUpdate={handleNameUpdate}
            onAccountDelete={handleAccountDelete}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        );
      case "menu":
        return <Menu userType={userType} onNavigate={setActiveTab} />;
      default:
        return <Dashboard userType={userType} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Tutor+</h1>

          </div>
          <div className="flex items-center gap-2">
            {/* User Code Display */}
            <div className="relative">
              <button
                onClick={() => setShowCodeMenu(!showCodeMenu)}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm flex items-center gap-2 transition-colors"
              >
                <span className="text-[#1db954] font-mono">
                  {userCode || "..."}
                </span>
                <LogOut size={14} className="rotate-180" />
              </button>
              {showCodeMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCodeMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg p-4 min-w-[200px] shadow-lg z-20">
                    <div className="text-xs text-muted-foreground mb-2">
                      Ваш код подключения
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-mono font-bold text-[#1db954]">
                        {userCode || "..."}
                      </span>
                      <button
                        onClick={copyCode}
                        className="p-1.5 bg-muted hover:bg-muted/80 rounded transition-colors"
                      >
                        {codeCopied ? (
                          <Check size={14} className="text-[#1db954]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Поделитесь этим кодом, чтобы связаться со{" "}
                      {userType === "tutor" ? "студентами" : "репетиторами"}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pt-8">{renderContent()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50">
        <div className="flex items-center justify-center h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Highlight Menu tab if active tab is one of the nested menu items
            const isActive =
              tab.id === "menu"
                ? menuTabs.includes(activeTab)
                : activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 h-full group"
              >
                <Icon
                  size={24}
                  className={`mb-1 ${
                    isActive
                      ? "text-[#1db954]"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] whitespace-nowrap ${
                    isActive
                      ? "text-[#1db954]"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
