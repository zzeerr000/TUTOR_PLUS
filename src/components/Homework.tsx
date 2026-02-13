import React, { useState, useEffect } from "react";
import {
  Plus,
  Check,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  HelpCircle,
} from "lucide-react";
import { api } from "../services/api";

interface HomeworkProps {
  userType: "tutor" | "student";
}

interface HomeworkItem {
  id: number;
  title: string;
  description?: string;
  subject: string;
  dueDate?: string;
  status: "pending" | "completed" | "no_homework" | "missed" | "draft";
  studentComment?: string;
  question?: string;
  questionAnswer?: string;
  hasNewQuestion?: boolean;
  hasNewAnswer?: boolean;
  studentId: number;
  lessonId?: number;
  student?: { id: number; name: string };
  tutor?: { id: number; name: string };
  files?: any[];
  lesson?: any;
  createdAt: string;
}

export function Homework({ userType }: HomeworkProps) {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [newHW, setNewHW] = useState<{
    title: string;
    description: string;
    subject: string;
    studentId: string;
    dueDate: string;
    status: string;
    lessonId?: number;
  }>({
    title: "",
    description: "",
    subject: "",
    studentId: "",
    dueDate: "next_lesson",
    status: "pending",
  });
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    loadData();
    if (userType === "tutor") {
      loadStudents();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getHomework();
      // Filter out completed homework from the main list
      const activeHomework = data.filter(
        (h: HomeworkItem) => h.status !== "completed",
      );
      setHomework(activeHomework);
    } catch (error) {
      console.error("Failed to load homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const handleCreateHW = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalDueDate = newHW.dueDate;
      let finalLessonId = newHW.lessonId;

      if (newHW.dueDate === "next_lesson" && newHW.studentId) {
        // Fetch all events to find the next one
        const events = await api.getEvents();
        const studentEvents = events
          .filter((e: any) => e.studentId === parseInt(newHW.studentId))
          .sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        const now = new Date();
        const nextLesson = studentEvents.find(
          (e: any) => new Date(e.date) > now,
        );

        if (nextLesson) {
          finalDueDate = nextLesson.date;
        }

        // Search for the absolute last past lesson and link if it's "free"
        if (!finalLessonId) {
          const pastLessons = studentEvents
            .filter((e: any) => new Date(e.date) <= now)
            .sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            );

          const absoluteLastLesson = pastLessons[0];

          if (absoluteLastLesson) {
            const homeworkData = await api.getHomework();
            const studentHw = homeworkData.filter(
              (h: any) => h.studentId === parseInt(newHW.studentId),
            );
            const isLessonOccupied = studentHw.some(
              (h: any) => h.lessonId === absoluteLastLesson.id,
            );

            if (!isLessonOccupied) {
              finalLessonId = absoluteLastLesson.id;
            }
          }
        }
      }

      await api.createHomework({
        ...newHW,
        studentId: parseInt(newHW.studentId),
        dueDate:
          finalDueDate === "next_lesson" || finalDueDate === "custom"
            ? undefined
            : finalDueDate,
        lessonId: finalLessonId,
      });
      setShowAddModal(false);
      setNewHW({
        title: "",
        description: "",
        subject: "",
        studentId: "",
        dueDate: "next_lesson",
        status: "pending",
      });
      loadData();
    } catch (error) {
      alert("Не удалось создать домашнее задание");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateHomework(id, { status });
      loadData();
    } catch (error) {
      alert("Не удалось обновить статус");
    }
  };

  const handleAddQuestion = async (id: number) => {
    if (!questionText.trim()) return;
    try {
      await api.updateHomework(id, { question: questionText });
      setQuestionText("");
      loadData();
    } catch (error) {
      alert("Не удалось отправить вопрос");
    }
  };

  const handleAddAnswer = async (id: number) => {
    if (!answerText.trim()) return;
    try {
      await api.updateHomework(id, { questionAnswer: answerText });
      setAnswerText("");
      loadData();
    } catch (error) {
      alert("Не удалось отправить ответ");
    }
  };

  const handleAddComment = async (id: number) => {
    if (!commentText.trim()) return;
    try {
      await api.updateHomework(id, { studentComment: commentText });
      setCommentText("");
      loadData();
    } catch (error) {
      alert("Не удалось добавить комментарий");
    }
  };

  const handleDeleteHW = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить это задание?")) return;
    try {
      await api.deleteHomework(id);
      loadData();
    } catch (error) {
      alert("Не удалось удалить задание");
    }
  };

  const handleFileUpload = async (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.uploadHomeworkFile(id, file);
      loadData();
    } catch (error) {
      alert("Не удалось загрузить файл");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          label: "Выполнено",
          color: "text-[#1db954]",
          bg: "bg-[#1db954]/10",
        };
      case "pending":
        return {
          label: "Ожидает",
          color: "text-[#ff9500]",
          bg: "bg-[#ff9500]/10",
        };
      case "no_homework":
        return {
          label: "Без ДЗ",
          color: "text-gray-400",
          bg: "bg-gray-400/10",
        };
      case "missed":
        return {
          label: "Пропущено",
          color: "text-[#e8115b]",
          bg: "bg-[#e8115b]/10",
        };
      case "draft":
        return {
          label: "Нужно задать",
          color: "text-[#2e77d0]",
          bg: "bg-[#2e77d0]/10",
        };
      default:
        return { label: status, color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Загрузка домашнего задания...</div>
      </div>
    );
  }

  const handleExpand = async (id: number) => {
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);

    if (isExpanding) {
      const item = homework.find((h) => h.id === id);
      const hasNotification =
        userType === "tutor" ? item?.hasNewQuestion : item?.hasNewAnswer;

      if (hasNotification) {
        try {
          // This will clear flags on the server via findOne or a specific update
          await api.getHomeworkById(id);
          // Update local state to remove pulse immediately
          setHomework(
            homework.map((h) =>
              h.id === id
                ? {
                    ...h,
                    hasNewQuestion:
                      userType === "tutor" ? false : h.hasNewQuestion,
                    hasNewAnswer:
                      userType === "student" ? false : h.hasNewAnswer,
                  }
                : h,
            ),
          );
        } catch (error) {
          console.error("Failed to clear notification:", error);
        }
      }
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Домашнее задание</h2>
      </div>

      <div className="space-y-3">
        {homework.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Заданий пока нет</div>
        ) : (
          homework.map((item) => {
            const status = getStatusInfo(item.status);
            const isExpanded = expandedId === item.id;
            const hasNotification =
              userType === "tutor" ? item.hasNewQuestion : item.hasNewAnswer;

            return (
              <div
                key={item.id}
                className={`bg-[#181818] rounded-lg overflow-hidden border ${
                  hasNotification ? "border-[#1db954]" : "border-transparent"
                } hover:border-gray-700 transition-colors`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleExpand(item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${status.bg} ${status.color}`}
                        >
                          {status.label}
                        </span>
                        {hasNotification && (
                          <span className="w-2 h-2 bg-[#1db954] rounded-full animate-pulse" />
                        )}
                        <span className="text-sm text-gray-400">
                          {item.subject}
                        </span>
                      </div>
                      <h3 className="font-medium truncate">
                        {item.status === "draft"
                          ? `Занятие от ${
                              item.lesson
                                ? new Date(item.lesson.date).toLocaleDateString(
                                    "ru-RU",
                                  )
                                : new Date(item.createdAt).toLocaleDateString(
                                    "ru-RU",
                                  )
                            }`
                          : item.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>
                            {item.dueDate
                              ? `До ${new Date(item.dueDate).toLocaleDateString("ru-RU")}`
                              : "Без срока"}
                          </span>
                        </div>
                        {userType === "tutor" ? (
                          <div className="truncate">
                            Ученик: {item.student?.name}
                          </div>
                        ) : (
                          <div className="truncate">
                            Преподаватель: {item.tutor?.name}
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-800 space-y-4">
                    {item.status === "draft" && userType === "tutor" ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">
                          Укажите домашнее задание для этого занятия:
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNewHW({
                                title: "Домашнее задание",
                                description: "",
                                subject: item.subject,
                                studentId: item.studentId.toString(),
                                dueDate: "next_lesson",
                                status: "pending",
                                lessonId: item.lessonId,
                              });
                              setShowAddModal(true);
                            }}
                            className="flex-1 py-2 bg-[#1db954] rounded-md text-sm font-medium"
                          >
                            Написать ДЗ
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(item.id, "no_homework")
                            }
                            className="flex-1 py-2 bg-[#282828] rounded-md text-sm font-medium hover:bg-[#3e3e3e]"
                          >
                            Нет ДЗ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.description && (
                          <div className="text-sm text-gray-300 whitespace-pre-wrap">
                            {item.description}
                          </div>
                        )}

                        {/* Files Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Файлы
                            </h4>
                            {userType === "student" &&
                              item.status !== "completed" && (
                                <label className="cursor-pointer text-[#1db954] hover:text-[#1ed760] transition-colors">
                                  <Paperclip size={16} />
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleFileUpload(item.id, e)
                                    }
                                  />
                                </label>
                              )}
                          </div>
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
                                      className="text-[#1db954] flex-shrink-0"
                                    />
                                    <span className="text-sm truncate">
                                      {file.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      api.downloadFile(file.id, file.name)
                                    }
                                    className="text-xs text-gray-400 hover:text-white"
                                  >
                                    Скачать
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

                        {/* Comments & Questions */}
                        <div className="space-y-4">
                          {/* Student Comment */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Комментарий ученика
                            </h4>
                            {item.studentComment ? (
                              <div className="text-sm p-3 bg-[#282828] rounded-md italic text-gray-300">
                                {item.studentComment}
                              </div>
                            ) : (
                              userType === "student" &&
                              item.status !== "completed" && (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) =>
                                      setCommentText(e.target.value)
                                    }
                                    placeholder="Добавить комментарий..."
                                    className="flex-1 bg-[#282828] border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#1db954]"
                                  />
                                  <button
                                    onClick={() => handleAddComment(item.id)}
                                    className="p-1.5 bg-[#1db954] rounded-md"
                                  >
                                    <Send size={16} />
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          {/* Question Section */}
                          <div className="space-y-2 p-3 bg-[#1db954]/5 rounded-lg border border-[#1db954]/20">
                            <div className="flex items-center gap-2 text-[#1db954]">
                              <HelpCircle size={16} />
                              <h4 className="text-xs font-bold uppercase tracking-wider">
                                Вопрос преподавателю
                              </h4>
                            </div>

                            {item.question ? (
                              <div className="space-y-3">
                                <div className="text-sm text-gray-300">
                                  <span className="text-gray-500 mr-2">
                                    Вопрос:
                                  </span>
                                  {item.question}
                                </div>
                                {item.questionAnswer ? (
                                  <div className="text-sm text-gray-300 pl-4 border-l-2 border-[#1db954]">
                                    <span className="text-[#1db954] font-medium mr-2">
                                      Ответ:
                                    </span>
                                    {item.questionAnswer}
                                  </div>
                                ) : (
                                  userType === "tutor" && (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={answerText}
                                        onChange={(e) =>
                                          setAnswerText(e.target.value)
                                        }
                                        placeholder="Ответить на вопрос..."
                                        className="flex-1 bg-[#282828] border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#1db954]"
                                      />
                                      <button
                                        onClick={() => handleAddAnswer(item.id)}
                                        className="p-1.5 bg-[#1db954] rounded-md"
                                      >
                                        <Send size={16} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              userType === "student" &&
                              item.status !== "completed" && (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={questionText}
                                    onChange={(e) =>
                                      setQuestionText(e.target.value)
                                    }
                                    placeholder="Задать вопрос..."
                                    className="flex-1 bg-[#282828] border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#1db954]"
                                  />
                                  <button
                                    onClick={() => handleAddQuestion(item.id)}
                                    className="p-1.5 bg-[#1db954] rounded-md"
                                  >
                                    <Send size={16} />
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          {/* Action Buttons */}
                          {userType === "student" &&
                            (item.status === "pending" ||
                              item.status === "missed") && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(item.id, "completed")
                                }
                                className="w-full py-2 bg-[#1db954] hover:bg-[#1ed760] rounded-md text-sm font-bold transition-colors"
                              >
                                {item.status === "missed"
                                  ? "Выполнить просроченное ДЗ"
                                  : "Отметить как выполненное"}
                              </button>
                            )}

                          {userType === "tutor" && (
                            <div className="flex flex-col gap-2">
                              {item.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(item.id, "completed")
                                  }
                                  className="w-full py-2 bg-[#1db954] hover:bg-[#1ed760] rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                  <Check size={16} />
                                  Отметить как выполненное
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteHW(item.id)}
                                className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-md text-sm font-medium transition-colors"
                              >
                                Удалить задание
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {userType === "tutor" && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Add Homework Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#181818] rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4">Новое задание</h3>
            <form onSubmit={handleCreateHW} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Предмет
                </label>
                <input
                  type="text"
                  required
                  value={newHW.subject}
                  onChange={(e) =>
                    setNewHW({ ...newHW, subject: e.target.value })
                  }
                  className="w-full bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954]"
                  placeholder="Напр. Математика"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Заголовок
                </label>
                <input
                  type="text"
                  required
                  value={newHW.title}
                  onChange={(e) =>
                    setNewHW({ ...newHW, title: e.target.value })
                  }
                  className="w-full bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954]"
                  placeholder="Что нужно сделать?"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Описание
                </label>
                <textarea
                  value={newHW.description}
                  onChange={(e) =>
                    setNewHW({ ...newHW, description: e.target.value })
                  }
                  className="w-full bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954] min-h-[100px]"
                  placeholder="Подробности задания..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Ученик
                  </label>
                  <select
                    required
                    value={newHW.studentId}
                    onChange={(e) =>
                      setNewHW({ ...newHW, studentId: e.target.value })
                    }
                    className="w-full bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954]"
                  >
                    <option value="">Выбрать...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Срок сдачи
                  </label>
                  <select
                    value={newHW.dueDate}
                    onChange={(e) =>
                      setNewHW({ ...newHW, dueDate: e.target.value })
                    }
                    className="w-full bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954]"
                  >
                    <option value="">Без срока</option>
                    <option value="next_lesson">Следующее занятие</option>
                    <option value="custom">Конкретная дата...</option>
                  </select>
                  {newHW.dueDate === "custom" && (
                    <input
                      type="date"
                      onChange={(e) =>
                        setNewHW({ ...newHW, dueDate: e.target.value })
                      }
                      className="w-full mt-2 bg-[#282828] border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1db954]"
                    />
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#1db954] hover:bg-[#1ed760] rounded-md font-bold transition-colors"
              >
                Создать задание
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
