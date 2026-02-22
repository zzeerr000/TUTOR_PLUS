import React, { useState, useEffect } from "react";
import { Plus, X, Check, User, Clock, Search } from "lucide-react";
import { api } from "../services/api";

interface ConnectionsProps {
  userType: "tutor" | "student";
}

export function Connections({ userType }: ConnectionsProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [connectionCode, setConnectionCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, connected] = await Promise.all([
        api.getPendingRequests().catch(() => []),
        api.getConnections().catch(() => []),
      ]);
      setPendingRequests(pending);
      setConnections(connected);
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.requestConnection(connectionCode.toUpperCase());
      setShowAddDialog(false);
      setConnectionCode("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to send connection request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (
    requestId: number,
    existingStudentId?: number,
  ) => {
    try {
      await api.approveConnection(requestId, existingStudentId);
      setShowLinkDialog(false);
      setSelectedRequest(null);
      loadData();
    } catch (error: any) {
      console.error("Failed to approve connection:", error);
      alert(
        error.message ||
          "Не удалось одобрить подключение. Вы можете одобрять только запросы, отправленные вам.",
      );
    }
  };

  const handleApproveClick = (request: any) => {
    const virtualStudents = connections.filter((c) => c.student?.isVirtual);
    if (userType === "tutor" && virtualStudents.length > 0) {
      setSelectedRequest(request);
      setShowLinkDialog(true);
    } else {
      handleApprove(request.id);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectConnection(requestId);
      loadData();
    } catch (error: any) {
      console.error("Failed to reject connection:", error);
      alert(
        error.message ||
          "Не удалось отклонить подключение. Вы можете отклонять только запросы, отправленные вам.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка соединений...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl mb-3 text-foreground">Ожидающие запросы</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => {
              const otherUser =
                userType === "tutor" ? request.student : request.tutor;
              return (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium">
                        {otherUser?.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {otherUser?.name || "Неизвестный пользователь"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userType === "tutor" ? "Ученик" : "Репетитор"} •{" "}
                        {otherUser?.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {new Date(request.createdAt).toLocaleDateString(
                          "ru-RU",
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveClick(request)}
                      className="px-4 py-2 bg-[#1db954] rounded-lg text-sm font-medium text-white hover:bg-[#1ed760] transition-colors flex items-center gap-2"
                    >
                      <Check size={16} />
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Отклонить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected Users */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl text-foreground">
            {userType === "tutor"
              ? "Связанные ученики"
              : "Связанные репетиторы"}
          </h2>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-[#1db954] rounded-lg text-sm font-medium text-white hover:bg-[#1ed760] transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Подключиться
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {connections.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {userType === "tutor"
                ? "Ученики еще не подключены"
                : "Репетиторы еще не подключены"}
            </div>
          ) : (
            connections.map((connection) => {
              const otherUser =
                userType === "tutor" ? connection.student : connection.tutor;
              const displayName =
                userType === "tutor"
                  ? connection.studentAlias || otherUser?.name
                  : otherUser?.name;
              return (
                <div
                  key={connection.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium">
                      {displayName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {displayName || "Неизвестный пользователь"}
                      {connection.studentAlias &&
                        connection.studentAlias !== otherUser?.name && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({otherUser?.name})
                          </span>
                        )}
                      {otherUser?.isVirtual && (
                        <span className="text-xs text-yellow-500 ml-2 px-1.5 py-0.5 bg-yellow-500/10 rounded">
                          Вручную
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {otherUser?.email || "Нет почты (Ручной профиль)"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Подключен{" "}
                    {new Date(connection.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Approve Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Подключить ученика</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Как бы вы хотели подключить{" "}
              <strong>{selectedRequest?.student?.name}</strong>?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleApprove(selectedRequest.id)}
                className="w-full bg-[#1db954] text-white py-3 rounded-lg font-semibold hover:bg-[#1ed760] transition-colors"
              >
                Создать новый профиль
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Или привязать к существующему ручному профилю
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {connections
                  .filter((c) => c.student?.isVirtual)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        handleApprove(selectedRequest.id, c.studentId)
                      }
                      className="w-full p-3 bg-muted rounded-lg text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center text-xs text-white">
                        {(c.studentAlias || c.student.name)[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {c.studentAlias || c.student.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ручной профиль
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setSelectedRequest(null);
                }}
                className="w-full bg-muted text-foreground py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Connection Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Подключиться к {userType === "tutor" ? "ученику" : "репетитору"}
              </h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError("");
                  setConnectionCode("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestConnection} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Введите код {userType === "tutor" ? "ученика" : "репетитора"}
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <input
                    type="text"
                    value={connectionCode}
                    onChange={(e) =>
                      setConnectionCode(e.target.value.toUpperCase())
                    }
                    required
                    maxLength={6}
                    className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground border border-input outline-none focus:ring-2 focus:ring-[#1db954] font-mono text-center text-lg tracking-wider placeholder:text-muted-foreground"
                    placeholder="ABC123"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Попросите у {userType === "tutor" ? "ученика" : "репетитора"}{" "}
                  его код подключения
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false);
                    setError("");
                    setConnectionCode("");
                  }}
                  className="flex-1 bg-muted rounded-lg py-3 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting || connectionCode.length !== 6}
                  className="flex-1 bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Отправка..." : "Отправить запрос"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
