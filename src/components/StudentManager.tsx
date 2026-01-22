import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Mail,
  User,
  Lock,
  X,
  Edit2,
  Link,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";

export function StudentManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    lessonsToday: 0,
    avgProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    isManual: true,
    defaultSubject: "",
    defaultPrice: "",
    defaultDuration: "60",
  });
  const [linkData, setLinkData] = useState({
    virtualStudentId: 0,
    studentCode: "",
  });
  const [editData, setEditData] = useState({
    studentId: 0,
    alias: "",
    originalName: "",
    defaultSubject: "",
    defaultPrice: "",
    defaultDuration: "60",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState(api.getCurrencySymbol());

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      setCurrency(api.getCurrencySymbol());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connections, events, progressData] = await Promise.all([
        api.getConnections().catch(() => []),
        api.getEvents().catch(() => []),
        api.getProgress().catch(() => []),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const todayEvents = events.filter((e: any) => e.date === today);

      const studentsWithProgress = connections.map((conn: any) => {
        const student = conn.student;
        const studentProgress = progressData.find(
          (p: any) => p.studentId === student.id,
        );
        const nextEvent = events.find(
          (e: any) =>
            e.studentId === student.id && new Date(e.date) >= new Date(),
        );
        const colors = ["#1db954", "#2e77d0", "#af2896", "#e8115b"];
        const color = colors[student.id % colors.length];

        return {
          id: student.id,
          name: conn.studentAlias || student.name,
          originalName: student.name,
          isVirtual: student.isVirtual,
          subject: studentProgress?.subject || conn.defaultSubject || "Общий",
          defaultSubject: conn.defaultSubject,
          defaultPrice: conn.defaultPrice,
          defaultDuration: conn.defaultDuration,
          progress: Math.round(Number(studentProgress?.progress || 0)),
          hoursCompleted: Math.round(
            Number(studentProgress?.hoursStudied || 0),
          ),
          nextLesson: nextEvent
            ? `${new Date(nextEvent.date).toLocaleDateString("ru-RU", {
                weekday: "short",
              })}, ${nextEvent.time}`
            : "Нет предстоящих занятий",
          avatar: (conn.studentAlias || student.name)
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          color,
          status: student.isVirtual ? "виртуальный" : "активный",
        };
      });

      setStudents(studentsWithProgress);
      const avgProgress =
        progressData.length > 0
          ? Math.round(
              progressData.reduce(
                (sum: number, p: any) => sum + Number(p.progress),
                0,
              ) / progressData.length,
            )
          : 0;
      setStats({
        total: connections.length,
        lessonsToday: todayEvents.length,
        avgProgress,
      });
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.createManualStudent(
        newStudent.name,
        newStudent.defaultSubject,
        newStudent.defaultPrice ? Number(newStudent.defaultPrice) : undefined,
        newStudent.defaultDuration ? Number(newStudent.defaultDuration) : 60,
      );
      setShowAddDialog(false);
      setNewStudent({
        name: "",
        isManual: true,
        defaultSubject: "",
        defaultPrice: "",
        defaultDuration: "60",
      });
      loadData();
    } catch (err: any) {
      setError(err.message || "Не удалось создать профиль ученика");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.updateStudentAlias(editData.studentId, {
        alias: editData.alias,
        defaultSubject: editData.defaultSubject,
        defaultPrice: editData.defaultPrice
          ? Number(editData.defaultPrice)
          : undefined,
        defaultDuration: editData.defaultDuration
          ? Number(editData.defaultDuration)
          : undefined,
      });
      setShowEditDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Не удалось обновить данные ученика");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.linkVirtualStudent(
        linkData.virtualStudentId,
        linkData.studentCode,
      );
      setShowLinkDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Не удалось привязать аккаунт");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: number, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${name}?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await api.deleteStudent(studentId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Не удалось удалить ученика");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Загрузка учеников...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Поиск учеников..."
          className="w-full bg-[#181818] rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#1db954] mb-1">{stats.total}</div>
          <div className="text-xs text-gray-400">Всего учеников</div>
        </div>
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#2e77d0] mb-1">
            {stats.lessonsToday}
          </div>
          <div className="text-xs text-gray-400">Занятий сегодня</div>
        </div>
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#af2896] mb-1">
            {stats.avgProgress}%
          </div>
          <div className="text-xs text-gray-400">Средний прогресс</div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Ученики не найдены
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group relative"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: student.color }}
                >
                  <span>{student.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-col">
                      <span className="font-medium">{student.name}</span>
                      {student.name !== student.originalName && (
                        <span className="text-xs text-gray-500">
                          {student.originalName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${student.color}20`,
                          color: student.color,
                        }}
                      >
                        {student.subject}
                      </span>
                      <button
                        onClick={() => {
                          setEditData({
                            studentId: student.id,
                            alias: student.name,
                            originalName: student.originalName,
                            defaultSubject: student.defaultSubject || "",
                            defaultPrice:
                              student.defaultPrice?.toString() || "",
                            defaultDuration:
                              student.defaultDuration?.toString() || "60",
                          });
                          setShowEditDialog(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Переименовать"
                      >
                        <Edit2 size={14} />
                      </button>
                      {student.isVirtual && (
                        <button
                          onClick={() => {
                            setLinkData({
                              virtualStudentId: student.id,
                              studentCode: "",
                            });
                            setShowLinkDialog(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#1db954] transition-colors"
                          title="Привязать по коду"
                        >
                          <Link size={14} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteStudent(student.id, student.name)
                        }
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Удалить ученика"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock size={14} />
                    <span>{student.nextLesson}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-400">Прогресс</span>
                  <span className="text-gray-400">{student.progress}%</span>
                </div>
                <div className="w-full bg-[#282828] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${student.progress}%`,
                      backgroundColor: student.color,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} />
                  <span>{student.hoursCompleted}ч пройдено</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <CheckCircle size={14} />
                  <span>{student.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Student Button */}
      <button
        onClick={() => setShowAddDialog(true)}
        className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors"
      >
        <Plus size={24} />
      </button>

      {/* Add Student Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Добавить нового ученика</h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError("");
                  setNewStudent({
                    name: "",
                    isManual: true,
                    defaultSubject: "",
                    defaultPrice: "",
                    defaultDuration: "60",
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Полное имя
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    required
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="Иван Иванов"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Предмет по умолчанию
                  </label>
                  <input
                    type="text"
                    value={newStudent.defaultSubject}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        defaultSubject: e.target.value,
                      })
                    }
                    className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="Математика, Английский..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Цена за занятие
                  </label>
                  <input
                    type="number"
                    value={newStudent.defaultPrice}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        defaultPrice: e.target.value,
                      })
                    }
                    className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder={`${currency} 0`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Длительность по умолчанию (мин)
                </label>
                <select
                  value={newStudent.defaultDuration}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      defaultDuration: e.target.value,
                    })
                  }
                  className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                >
                  <option value="30">30 минут</option>
                  <option value="45">45 минут</option>
                  <option value="60">60 минут</option>
                  <option value="90">90 минут</option>
                  <option value="120">120 минут</option>
                </select>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1db954] text-white py-3 rounded-lg font-semibold hover:bg-[#1ed760] transition-colors disabled:opacity-50"
              >
                {submitting ? "Создание..." : "Создать профиль"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Alias Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Переименовать ученика</h2>
              <button
                onClick={() => setShowEditDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateAlias} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={editData.alias}
                  onChange={(e) =>
                    setEditData({ ...editData, alias: e.target.value })
                  }
                  required
                  className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                  placeholder={editData.originalName}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Исходное имя: {editData.originalName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Предмет по умолчанию
                  </label>
                  <input
                    type="text"
                    value={editData.defaultSubject}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        defaultSubject: e.target.value,
                      })
                    }
                    className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="Математика, Английский..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Цена за занятие
                  </label>
                  <input
                    type="number"
                    value={editData.defaultPrice}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        defaultPrice: e.target.value,
                      })
                    }
                    className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder={`${currency} 0`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Длительность по умолчанию (мин)
                </label>
                <select
                  value={editData.defaultDuration}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      defaultDuration: e.target.value,
                    })
                  }
                  className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                >
                  <option value="30">30 минут</option>
                  <option value="45">45 минут</option>
                  <option value="60">60 минут</option>
                  <option value="90">90 минут</option>
                  <option value="120">120 минут</option>
                </select>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1db954] text-white py-3 rounded-lg font-semibold hover:bg-[#1ed760] transition-colors disabled:opacity-50"
              >
                {submitting ? "Обновление..." : "Сохранить изменения"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Привязать по коду ученика
              </h2>
              <button
                onClick={() => setShowLinkDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Код ученика
                </label>
                <input
                  type="text"
                  value={linkData.studentCode}
                  onChange={(e) =>
                    setLinkData({
                      ...linkData,
                      studentCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                  placeholder="Введите 6-значный код"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Свяжите этот профиль с реальным аккаунтом ученика. Вся история
                  будет сохранена.
                </p>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1db954] text-white py-3 rounded-lg font-semibold hover:bg-[#1ed760] transition-colors disabled:opacity-50"
              >
                {submitting ? "Привязка..." : "Привязать аккаунт"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
