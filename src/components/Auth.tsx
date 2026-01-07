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
    token: string
  ) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"tutor" | "student">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await api.login(email, password, role);
      } else {
        data = await api.register(email, password, name, role);
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuthSuccess(data.user, data.access_token);
    } catch (err: any) {
      if (
        err.message.includes("fetch") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to server. Make sure the backend is running on http://localhost:3000"
        );
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">TutorHub</h1>
          <p className="text-gray-400">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
        </div>

        <div className="bg-[#181818] rounded-lg p-6 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("tutor")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        role === "tutor"
                          ? "border-[#1db954] bg-[#1db954]/10"
                          : "border-gray-700 bg-[#282828] hover:border-gray-600"
                      }`}
                    >
                      <GraduationCap
                        size={24}
                        className={`mx-auto mb-2 ${
                          role === "tutor" ? "text-[#1db954]" : "text-gray-400"
                        }`}
                      />
                      <div
                        className={`text-sm font-medium ${
                          role === "tutor" ? "text-[#1db954]" : "text-gray-400"
                        }`}
                      >
                        Tutor
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        role === "student"
                          ? "border-[#1db954] bg-[#1db954]/10"
                          : "border-gray-700 bg-[#282828] hover:border-gray-600"
                      }`}
                    >
                      <BookOpen
                        size={24}
                        className={`mx-auto mb-2 ${
                          role === "student"
                            ? "text-[#1db954]"
                            : "text-gray-400"
                        }`}
                      />
                      <div
                        className={`text-sm font-medium ${
                          role === "student"
                            ? "text-[#1db954]"
                            : "text-gray-400"
                        }`}
                      >
                        Student
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Role Selection for Login */}
            {isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Login as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("tutor")}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      role === "tutor"
                        ? "border-[#1db954] bg-[#1db954]/10"
                        : "border-gray-700 bg-[#282828] hover:border-gray-600"
                    }`}
                  >
                    <GraduationCap
                      size={24}
                      className={`mx-auto mb-2 ${
                        role === "tutor" ? "text-[#1db954]" : "text-gray-400"
                      }`}
                    />
                    <div
                      className={`text-sm font-medium ${
                        role === "tutor" ? "text-[#1db954]" : "text-gray-400"
                      }`}
                    >
                      Tutor
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      role === "student"
                        ? "border-[#1db954] bg-[#1db954]/10"
                        : "border-gray-700 bg-[#282828] hover:border-gray-600"
                    }`}
                  >
                    <BookOpen
                      size={24}
                      className={`mx-auto mb-2 ${
                        role === "student"
                          ? "text-[#1db954]"
                          : "text-gray-400"
                      }`}
                    />
                    <div
                      className={`text-sm font-medium ${
                        role === "student" ? "text-[#1db954]" : "text-gray-400"
                      }`}
                    >
                      Student
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500 text-base font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-sm text-gray-400 hover:underline cursor-pointer transition-all duration-200"
              style={{
                color: "rgb(156 163 175)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#1db954";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgb(156 163 175)";
              }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
