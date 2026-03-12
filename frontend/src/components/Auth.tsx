import React, { useState } from "react";
import { Mail, Lock, User, GraduationCap, BookOpen } from "lucide-react";
import { api } from "../services/api";

interface AuthProps {
  onAuthSuccess: (
    user: {
      id: number;
      email: string;
      name: string;
      role: "tutor" | "student";
    },
    token: string,
  ) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"tutor" | "student" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", { email, role, isLogin });
      let data;
      if (!role) {
        throw new Error("Пожалуйста, выберите роль (Репетитор или Ученик)");
      }
      if (isLogin) {
        data = await api.login(email, password, role);
      } else {
        data = await api.register(email, password, name, role);
      }

      console.log("Login response:", data);
      
      if (!data.access_token || !data.user) {
        throw new Error("Неверный ответ сервера: отсутствуют токен или данные пользователя");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("Token saved to localStorage");
      console.log("User saved to localStorage:", data.user);
      
      onAuthSuccess(data.user, data.access_token);
    } catch (err: any) {
      if (
        err.message.includes("fetch") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        setError(
          "Не удается подключиться к серверу. Убедитесь, что бэкенд запущен на http://localhost:3000",
        );
      } else {
        setError(err.message || "Что-то пошло не так");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">TutorHub</h1>
          <p className="text-muted-foreground">
            {isLogin ? "С возвращением!" : "Создайте аккаунт"}
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Выберите роль
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={`px-4 py-3 rounded-md border text-sm font-medium transition-colors flex flex-col items-center justify-center gap-2 ${
                    role === "tutor"
                      ? "bg-[#1db954]/10 border-[#1db954] text-[#1db954]"
                      : "bg-muted border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <GraduationCap size={24} />
                  Репетитор
                </button>
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`px-4 py-3 rounded-md border text-sm font-medium transition-colors flex flex-col items-center justify-center gap-2 ${
                    role === "student"
                      ? "bg-[#1db954]/10 border-[#1db954] text-[#1db954]"
                      : "bg-muted border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <BookOpen size={24} />
                  Ученик
                </button>
              </div>
              {!role && (
                <p className="text-xs text-red-500 mt-2">
                  Пожалуйста, выберите роль
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Имя
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 bg-muted border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition-colors"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-muted border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition-colors"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-muted border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full bg-[#1db954] text-white font-bold py-2 px-4 rounded-md hover:bg-[#1ed760] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1db954] focus:ring-offset-2 focus:ring-offset-background mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Загрузка..."
                : isLogin
                  ? "Войти"
                  : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setRole(null);
              }}
              className="text-sm text-muted-foreground hover:text-[#1db954] transition-colors"
            >
              {isLogin
                ? "Нет аккаунта? Зарегистрируйтесь"
                : "Уже есть аккаунт? Войдите"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
