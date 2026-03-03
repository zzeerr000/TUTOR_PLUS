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
  BookOpen,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Save,
  MessageSquare,
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
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<{
    type: "lesson" | "homework";
    id: number;
  } | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

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
      const [connections, events, homeworkData] = await Promise.all([
        api.getConnections().catch(() => []),
        api.getEvents().catch(() => []),
        api.getHomework().catch(() => []),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const todayEvents = events.filter((e: any) => e.date === today);

      const now = new Date();
      const studentsWithStats = connections.map((conn: any) => {
        const student = conn.student;
        const studentEvents = events.filter(
          (e: any) => e.studentId === student.id,
        );
        const studentHomework = homeworkData.filter(
          (h: any) => h.studentId === student.id,
        );

        const nextEvent = studentEvents
          .filter((e: any) => {
            const eventDate = e.date.split("T")[0];
            const timeParts = e.time.split(":");
            const h = timeParts[0].padStart(2, "0");
            const m = timeParts[1]
              ? timeParts[1].split(" ")[0].padStart(2, "0")
              : "00";
            const eventDateTime = new Date(`${eventDate}T${h}:${m}:00`);
            return eventDateTime >= now;
          })
          .sort((a: any, b: any) => {
            const dateA = a.date.split("T")[0];
            const timeA = a.time.split(":");
            const hA = timeA[0].padStart(2, "0");
            const mA = timeA[1]
              ? timeA[1].split(" ")[0].padStart(2, "0")
              : "00";

            const dateB = b.date.split("T")[0];
            const timeB = b.time.split(":");
            const hB = timeB[0].padStart(2, "0");
            const mB = timeB[1]
              ? timeB[1].split(" ")[0].padStart(2, "0")
              : "00";

            return (
              new Date(`${dateA}T${hA}:${mA}:00`).getTime() -
              new Date(`${dateB}T${hB}:${mB}:00`).getTime()
            );
          })[0];

        const completedCount = studentEvents.filter((e: any) => {
          const eventDate = e.date.split("T")[0];
          const timeParts = e.time.split(":");
          const h = timeParts[0].padStart(2, "0");
          const m = timeParts[1]
            ? timeParts[1].split(" ")[0].padStart(2, "0")
            : "00";
          const eventDateTime = new Date(`${eventDate}T${h}:${m}:00`);
          return eventDateTime < now;
        }).length;

        const activeHW = studentHomework.filter(
          (h: any) => h.status === "pending",
        ).length;
        const missedHW = studentHomework.filter(
          (h: any) => h.status === "missed",
        ).length;

        const colors = ["#1db954", "#2e77d0", "#af2896", "#e8115b"];
        const color = colors[student.id % colors.length];

        return {
          id: student.id,
          name: conn.studentAlias || student.name,
          originalName: student.name,
          isVirtual: student.isVirtual,
          subject: conn.defaultSubject || "Общий",
          defaultSubject: conn.defaultSubject,
          defaultPrice: conn.defaultPrice,
          defaultDuration: conn.defaultDuration,
          lessonsCount: completedCount,
          activeHW,
          missedHW,
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

      setStudents(studentsWithStats);
      setStats({
        total: connections.length,
        lessonsToday: todayEvents.length,
        avgProgress: 0, // Not used anymore but kept for state compatibility
      });
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (student: any) => {
    try {
      setLoadingStats(true);
      setSelectedStudent(student);
      setExpandedItemId(null);
      const stats = await api.getStudentStats(student.id);
      setStudentStats(stats);
    } catch (error) {
      console.error("Failed to load student stats:", error);
      alert("Не удалось загрузить данные ученика");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdateNote = async (lessonId: number) => {
    try {
      await api.updateEvent(lessonId, { notes: noteText });
      setEditingNoteId(null);
      // Refresh stats
      const stats = await api.getStudentStats(selectedStudent.id);
      setStudentStats(stats);
    } catch (error) {
      alert("Не удалось сохранить заметку");
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
              onClick={() => loadStudentDetails(student)}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group relative cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
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
                        onClick={(e) => {
                          e.stopPropagation();
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
                          onClick={(e) => {
                            e.stopPropagation();
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student.id, student.name);
                        }}
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

              {/* Homework Status */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 bg-[#282828] rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-0.5 uppercase font-bold tracking-wider">
                    Активные ДЗ
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      student.activeHW > 0 ? "text-[#ff9500]" : "text-gray-400"
                    }`}
                  >
                    {student.activeHW}
                  </div>
                </div>
                <div className="flex-1 bg-[#282828] rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-0.5 uppercase font-bold tracking-wider">
                    Просрочено
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      student.missedHW > 0 ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {student.missedHW}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <BookOpen size={14} />
                  <span>{student.lessonsCount} занятий проведено</span>
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

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-white/10">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#181818] rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: selectedStudent.color }}
                >
                  {selectedStudent.avatar}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-gray-400 text-sm">
                    {selectedStudent.subject} • {selectedStudent.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setExpandedItemId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingStats ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400">Загрузка данных...</p>
                </div>
              ) : studentStats ? (
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#181818] p-4 rounded-xl border border-white/5">
                      <div className="text-gray-400 text-xs uppercase font-bold mb-1">
                        Всего занятий
                      </div>
                      <div className="text-2xl font-bold">
                        {studentStats.lessonsCount}
                      </div>
                    </div>
                    <div className="bg-[#181818] p-4 rounded-xl border border-white/5">
                      <div className="text-gray-400 text-xs uppercase font-bold mb-1">
                        Активные ДЗ
                      </div>
                      <div className="text-2xl font-bold text-[#ff9500]">
                        {studentStats.activeHomework}
                      </div>
                    </div>
                    <div className="bg-[#181818] p-4 rounded-xl border border-white/5">
                      <div className="text-gray-400 text-xs uppercase font-bold mb-1">
                        Просрочено ДЗ
                      </div>
                      <div className="text-2xl font-bold text-red-500">
                        {studentStats.missedHomework}
                      </div>
                    </div>
                    <div className="bg-[#181818] p-4 rounded-xl border border-white/5">
                      <div className="text-gray-400 text-xs uppercase font-bold mb-1">
                        Выполнено ДЗ
                      </div>
                      <div className="text-2xl font-bold text-[#1db954]">
                        {studentStats.completedHomework || 0}
                      </div>
                    </div>
                  </div>

                  {/* Unified History Feed */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Clock size={20} className="text-[#1db954]" />
                      История событий
                    </h3>
                    <div className="space-y-4">
                      {(() => {
                        const now = new Date();
                        const historyItems: any[] = [];

                        // Process homework and link to lessons
                        const homeworkByLessonId = new Map<number, any[]>();
                        const orphanHomework: any[] = [];

                        if (studentStats.homeworkHistory) {
                          studentStats.homeworkHistory.forEach((hw: any) => {
                            if (hw.lessonId) {
                              if (!homeworkByLessonId.has(hw.lessonId)) {
                                homeworkByLessonId.set(hw.lessonId, []);
                              }
                              homeworkByLessonId.get(hw.lessonId)!.push(hw);
                            } else {
                              orphanHomework.push(hw);
                            }
                          });
                        }

                        // Process lessons
                        if (studentStats.lessonsHistory) {
                          const lessons = [...studentStats.lessonsHistory];
                          // Filter for closest future lesson + all past lessons
                          const pastLessons = [];
                          const futureLessons = [];

                          for (const lesson of lessons) {
                            const eventDate = lesson.date.split("T")[0];
                            const timeParts = lesson.time.split(":");
                            const h = timeParts[0].padStart(2, "0");
                            const m = timeParts[1]
                              ? timeParts[1].split(" ")[0].padStart(2, "0")
                              : "00";
                            const lessonDateTime = new Date(
                              `${eventDate}T${h}:${m}:00`,
                            );

                            if (lessonDateTime < now) {
                              pastLessons.push(lesson);
                            } else {
                              futureLessons.push(lesson);
                            }
                          }

                          futureLessons.sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime(),
                          );
                          const closestFutureLesson = futureLessons[0];

                          if (closestFutureLesson) {
                            historyItems.push({
                              ...closestFutureLesson,
                              type: "lesson",
                              homework:
                                homeworkByLessonId.get(
                                  closestFutureLesson.id,
                                ) || [],
                              timestamp: new Date(
                                closestFutureLesson.date,
                              ).getTime(),
                            });
                          }

                          pastLessons.forEach((lesson) => {
                            historyItems.push({
                              ...lesson,
                              type: "lesson",
                              homework: homeworkByLessonId.get(lesson.id) || [],
                              timestamp: new Date(lesson.date).getTime(),
                            });
                          });
                        }

                        // Add orphan homework as separate items (or try to link by date)
                        orphanHomework.forEach((hw) => {
                          // Try to find a lesson on the same day or just before
                          const hwDate = new Date(
                            hw.createdAt || hw.dueDate,
                          ).getTime();
                          historyItems.push({
                            ...hw,
                            type: "homework",
                            timestamp: hwDate,
                          });
                        });

                        // Sort all items by date (descending)
                        historyItems.sort((a, b) => b.timestamp - a.timestamp);

                        if (historyItems.length === 0) {
                          return (
                            <div className="text-center py-10 text-gray-500">
                              История пуста
                            </div>
                          );
                        }

                        return historyItems.map((item) => {
                          const isExpanded =
                            expandedItemId?.type === item.type &&
                            expandedItemId?.id === item.id;

                          if (item.type === "lesson") {
                            const eventDate = item.date.split("T")[0];
                            const timeParts = item.time.split(":");
                            const h = timeParts[0].padStart(2, "0");
                            const m = timeParts[1]
                              ? timeParts[1].split(" ")[0].padStart(2, "0")
                              : "00";
                            const lessonDateTime = new Date(
                              `${eventDate}T${h}:${m}:00`,
                            );
                            const isPast = lessonDateTime < now;

                            return (
                              <div
                                key={`lesson-${item.id}`}
                                className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10"
                              >
                                <div
                                  onClick={() =>
                                    setExpandedItemId(
                                      isExpanded
                                        ? null
                                        : { type: "lesson", id: item.id },
                                    )
                                  }
                                  className="p-4 flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                      <Calendar size={18} />
                                    </div>
                                    <div>
                                      <div className="font-bold">
                                        {item.title || "Занятие"}
                                      </div>
                                      <div className="text-sm text-gray-400 flex items-center gap-2">
                                        <span>
                                          {new Date(
                                            item.date,
                                          ).toLocaleDateString("ru-RU")}
                                          , {item.time}
                                        </span>
                                        {item.homework &&
                                          item.homework.length > 0 && (
                                            <>
                                              <span className="text-gray-600">
                                                •
                                              </span>
                                              <span className="flex items-center gap-1 text-[#ff9500] text-xs font-medium">
                                                <BookOpen size={12} />
                                                ДЗ
                                              </span>
                                            </>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        isPast
                                          ? "bg-gray-800 text-gray-400"
                                          : "bg-[#1db954]/20 text-[#1db954]"
                                      }`}
                                    >
                                      {isPast ? "Прошедшее" : "Предстоящее"}
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp
                                        size={20}
                                        className="text-gray-500"
                                      />
                                    ) : (
                                      <ChevronDown
                                        size={20}
                                        className="text-gray-500"
                                      />
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="bg-[#282828] p-3 rounded-lg">
                                        <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">
                                          Длительность
                                        </div>
                                        <div>{item.duration} мин</div>
                                      </div>
                                      <div className="bg-[#282828] p-3 rounded-lg">
                                        <div className="text-gray-500 text-[10px] uppercase font-bold mb-1">
                                          Статус
                                        </div>
                                        <div>
                                          {isPast ? "Завершено" : "Ожидается"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Lesson Note */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Заметки к занятию
                                      </h4>
                                      {editingNoteId === item.id ? (
                                        <div className="space-y-3">
                                          <textarea
                                            autoFocus
                                            value={noteText}
                                            onChange={(e) =>
                                              setNoteText(e.target.value)
                                            }
                                            placeholder="Добавьте заметку к занятию..."
                                            className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm focus:border-[#1db954] outline-none min-h-25"
                                          />
                                          <div className="flex justify-end gap-2">
                                            <button
                                              onClick={() =>
                                                setEditingNoteId(null)
                                              }
                                              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                                            >
                                              Отмена
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleUpdateNote(item.id)
                                              }
                                              className="px-3 py-1.5 text-sm bg-[#1db954] text-white rounded-lg hover:bg-[#1ed760] flex items-center gap-1"
                                            >
                                              <Save size={14} />
                                              <span>Сохранить</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between group/note bg-[#282828] p-3 rounded-lg">
                                          <div className="flex-1">
                                            {item.notes ? (
                                              <p className="text-sm text-gray-300 leading-relaxed italic">
                                                "{item.notes}"
                                              </p>
                                            ) : (
                                              <p className="text-sm text-gray-500 italic">
                                                Нет заметок
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => {
                                              setEditingNoteId(item.id);
                                              setNoteText(item.notes || "");
                                            }}
                                            className="ml-4 p-1.5 text-gray-500 hover:text-white transition-colors"
                                            title="Редактировать заметку"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Homework Section */}
                                    {item.homework &&
                                      item.homework.length > 0 && (
                                        <div className="space-y-3 pt-2 border-t border-white/5">
                                          <h4 className="text-xs font-bold text-[#ff9500] uppercase tracking-wider flex items-center gap-2">
                                            <BookOpen size={14} />
                                            Домашнее задание
                                          </h4>
                                          {item.homework.map((hw: any) => (
                                            <div
                                              key={hw.id}
                                              className="bg-[#282828] p-3 rounded-lg space-y-3"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="font-bold text-sm">
                                                  {hw.title}
                                                </div>
                                                <div
                                                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                                    hw.status === "completed"
                                                      ? "bg-[#1db954]/20 text-[#1db954]"
                                                      : hw.status === "missed"
                                                        ? "bg-red-500/20 text-red-500"
                                                        : "bg-[#ff9500]/20 text-[#ff9500]"
                                                  }`}
                                                >
                                                  {hw.status === "completed"
                                                    ? "Выполнено"
                                                    : hw.status === "missed"
                                                      ? "Просрочено"
                                                      : "В работе"}
                                                </div>
                                              </div>

                                              {hw.description && (
                                                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                                  {hw.description}
                                                </div>
                                              )}

                                              {/* Files in Homework */}
                                              {hw.files &&
                                                hw.files.length > 0 && (
                                                  <div className="grid grid-cols-1 gap-2 pt-2">
                                                    {hw.files.map(
                                                      (file: any) => (
                                                        <div
                                                          key={file.id}
                                                          className="flex items-center justify-between p-2 bg-[#181818] rounded-md group"
                                                        >
                                                          <div className="flex items-center gap-2 min-w-0">
                                                            <FileText
                                                              size={14}
                                                              className="text-[#1db954] shrink-0"
                                                            />
                                                            <span className="text-xs truncate">
                                                              {file.name}
                                                            </span>
                                                          </div>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              api.downloadFile(
                                                                file.id,
                                                                file.name,
                                                              );
                                                            }}
                                                            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                                                          >
                                                            <Download
                                                              size={12}
                                                            />
                                                            <span>Скачать</span>
                                                          </button>
                                                        </div>
                                                      ),
                                                    )}
                                                  </div>
                                                )}

                                              {/* Comments and Questions in Homework */}
                                              {(hw.studentComment ||
                                                hw.question ||
                                                hw.questionAnswer) && (
                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                  {hw.studentComment && (
                                                    <div className="space-y-1">
                                                      <h4 className="text-[10px] font-bold text-gray-500 uppercase">
                                                        Комментарий ученика
                                                      </h4>
                                                      <div className="text-xs p-2 bg-[#181818] rounded-md italic text-gray-400">
                                                        {hw.studentComment}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {hw.question && (
                                                    <div className="bg-[#181818] p-2 rounded-lg border-l-2 border-[#1db954]">
                                                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                                        Вопрос ученика
                                                      </div>
                                                      <p className="text-xs">
                                                        {hw.question}
                                                      </p>
                                                    </div>
                                                  )}
                                                  {hw.questionAnswer && (
                                                    <div className="bg-[#181818] p-2 rounded-lg border-l-2 border-[#2e77d0] ml-2">
                                                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                                        Ваш ответ
                                                      </div>
                                                      <p className="text-xs">
                                                        {hw.questionAnswer}
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Tutor Actions */}
                                              {(hw.status === "pending" ||
                                                hw.status === "missed") && (
                                                <button
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                      await api.updateHomework(
                                                        hw.id,
                                                        { status: "completed" },
                                                      );
                                                      const stats =
                                                        await api.getStudentStats(
                                                          selectedStudent.id,
                                                        );
                                                      setStudentStats(stats);
                                                      loadData();
                                                    } catch (error) {
                                                      alert(
                                                        "Не удалось подтвердить выполнение",
                                                      );
                                                    }
                                                  }}
                                                  className="w-full mt-2 py-1.5 bg-[#1db954]/10 hover:bg-[#1db954]/20 text-[#1db954] text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-2"
                                                >
                                                  <CheckCircle size={14} />
                                                  Подтвердить выполнение
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Homework item
                            return (
                              <div
                                key={`homework-${item.id}`}
                                className="bg-[#181818] rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10"
                              >
                                <div
                                  onClick={() =>
                                    setExpandedItemId(
                                      isExpanded
                                        ? null
                                        : { type: "homework", id: item.id },
                                    )
                                  }
                                  className="p-4 flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#ff9500]/10 rounded-lg text-[#ff9500]">
                                      <BookOpen size={18} />
                                    </div>
                                    <div>
                                      <div className="font-bold">
                                        {item.title}
                                      </div>
                                      <div className="text-sm text-gray-400">
                                        Срок:{" "}
                                        {new Date(
                                          item.dueDate,
                                        ).toLocaleDateString("ru-RU")}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        item.status === "completed"
                                          ? "bg-[#1db954]/20 text-[#1db954]"
                                          : item.status === "missed"
                                            ? "bg-red-500/20 text-red-500"
                                            : "bg-[#ff9500]/20 text-[#ff9500]"
                                      }`}
                                    >
                                      {item.status === "completed"
                                        ? "Выполнено"
                                        : item.status === "missed"
                                          ? "Просрочено"
                                          : "В работе"}
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp
                                        size={20}
                                        className="text-gray-500"
                                      />
                                    ) : (
                                      <ChevronDown
                                        size={20}
                                        className="text-gray-500"
                                      />
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
                                    {item.description && (
                                      <div className="text-sm text-gray-300 whitespace-pre-wrap bg-[#282828] p-3 rounded-lg">
                                        {item.description}
                                      </div>
                                    )}

                                    {/* Files Section */}
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Файлы
                                      </h4>
                                      {item.files && item.files.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                          {item.files.map((file: any) => (
                                            <div
                                              key={file.id}
                                              className="flex items-center justify-between p-2 bg-[#282828] rounded-md group"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <FileText
                                                  size={16}
                                                  className="text-[#1db954] shrink-0"
                                                />
                                                <span className="text-sm truncate">
                                                  {file.name}
                                                </span>
                                              </div>
                                              <button
                                                onClick={() =>
                                                  api.downloadFile(
                                                    file.id,
                                                    file.name,
                                                  )
                                                }
                                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                              >
                                                <Download size={14} />
                                                <span>Скачать</span>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-600 italic">
                                          Файлов нет
                                        </div>
                                      )}
                                    </div>

                                    {/* Comments and Questions */}
                                    {(item.studentComment ||
                                      item.question ||
                                      item.questionAnswer) && (
                                      <div className="space-y-3 pt-2 border-t border-white/5">
                                        {item.studentComment && (
                                          <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase">
                                              Комментарий ученика
                                            </h4>
                                            <div className="text-sm p-3 bg-[#282828] rounded-md italic text-gray-300">
                                              {item.studentComment}
                                            </div>
                                          </div>
                                        )}
                                        {item.question && (
                                          <div className="bg-[#282828] p-3 rounded-lg border-l-2 border-[#1db954]">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                              Вопрос ученика
                                            </div>
                                            <p className="text-sm">
                                              {item.question}
                                            </p>
                                          </div>
                                        )}
                                        {item.questionAnswer && (
                                          <div className="bg-[#282828] p-3 rounded-lg border-l-2 border-[#2e77d0] ml-4">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                                              Ваш ответ
                                            </div>
                                            <p className="text-sm">
                                              {item.questionAnswer}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Tutor Actions for orphan homework */}
                                    {(item.status === "pending" ||
                                      item.status === "missed") && (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await api.updateHomework(item.id, {
                                              status: "completed",
                                            });
                                            const stats =
                                              await api.getStudentStats(
                                                selectedStudent.id,
                                              );
                                            setStudentStats(stats);
                                            loadData();
                                          } catch (error) {
                                            alert(
                                              "Не удалось подтвердить выполнение",
                                            );
                                          }
                                        }}
                                        className="w-full py-2 bg-[#1db954]/10 hover:bg-[#1db954]/20 text-[#1db954] text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle size={18} />
                                        Подтвердить выполнение
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        });
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  Не удалось загрузить данные
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Dialog */}
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
