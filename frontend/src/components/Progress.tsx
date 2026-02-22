import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Award,
  Target,
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  Download,
  Link,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { api } from "../services/api";

interface StudentStats {
  weeklyAttendance: number;
  weeklyHours: number;
  totalHours: number;
  weeklyActivity: { day: string; hours: number }[];
  subjects: {
    id: number;
    name: string;
    tutorName: string;
    progress: number;
    grade: string;
    hoursStudied: number;
    lessonsCompleted: number;
    color: string;
  }[];
}

interface HistoryData {
  lessonsCount: number;
  activeHomework: number;
  missedHomework: number;
  completedHomework: number;
  upcomingLesson: any | null;
  history: any[];
  tutorId: number;
}

export function Progress() {
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<{
    type: "lesson" | "homework";
    id: number;
  } | null>(null);

  // Fallback for tutor view (if needed, though request is specific to student)
  const [tutorStats, setTutorStats] = useState({
    overallProgress: 0,
    totalHours: 0,
  });
  const [tutorSubjects, setTutorSubjects] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both endpoints to determine role/data structure
      // Ideally we should know the role, but let's infer from response
      const [progressData, progressStats] = await Promise.all([
        api.getProgress().catch(() => []),
        api
          .getProgressStats()
          .catch(() => ({ overallProgress: 0, totalHours: 0 })),
      ]);

      if (progressStats && typeof progressStats.weeklyAttendance === "number") {
        // It's the new student dashboard structure
        setStudentStats(progressStats);
      } else {
        // It's the old structure (Tutor or old student view)
        setTutorStats(progressStats);

        const colors = ["#1db954", "#2e77d0", "#af2896"];
        setTutorSubjects(
          progressData.map((p: any, idx: number) => ({
            name: p.subject,
            progress: Math.round(Number(p.progress)),
            grade: p.grade || "N/A",
            hoursStudied: Math.round(Number(p.hoursStudied)),
            lessonsCompleted: p.lessonsCompleted || 0,
            color: colors[idx % colors.length],
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = async (tutorId: number) => {
    setSelectedSubject(tutorId);
    setLoadingHistory(true);
    try {
      const history = await api.getSubjectHistory(tutorId);
      setHistoryData(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBack = () => {
    setSelectedSubject(null);
    setHistoryData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Загрузка прогресса...</div>
      </div>
    );
  }

  // Render Student Dashboard
  if (studentStats) {
    if (selectedSubject && historyData) {
      // Subject Detail View (History)
      return (
        <div className="space-y-6 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-[#282828] rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">
              {studentStats.subjects.find((s) => s.id === selectedSubject)
                ?.name || "Предмет"}
            </h1>
          </div>

          {/* Stats Summary for Subject */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold mb-1 text-foreground">
                {historyData.lessonsCount}
              </div>
              <div className="text-xs text-muted-foreground">Уроков</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold mb-1 text-[#2e77d0]">
                {historyData.activeHomework}
              </div>
              <div className="text-xs text-muted-foreground">Активных ДЗ</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold mb-1 text-[#e8115b]">
                {historyData.missedHomework}
              </div>
              <div className="text-xs text-muted-foreground">Пропущено ДЗ</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold mb-1 text-[#1db954]">
                {historyData.completedHomework}
              </div>
              <div className="text-xs text-muted-foreground">Сдано ДЗ</div>
            </div>
          </div>

          {/* History Feed */}
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка истории...
              </div>
            ) : (
              renderHistoryList(historyData, expandedItemId, setExpandedItemId)
            )}
          </div>
        </div>
      );
    }

    // Main Dashboard View
    const maxHours =
      Math.max(...studentStats.weeklyActivity.map((d) => d.hours)) || 1;

    return (
      <div className="space-y-6 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Weekly Attendance */}
          <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4 text-white">
            <TrendingUp size={24} className="mb-2" />
            <div className="text-2xl mb-1">
              {studentStats.weeklyAttendance}%
            </div>
            <div className="text-sm opacity-90">Посещаемость за неделю</div>
          </div>

          {/* Hours Stats */}
          <div className="space-y-3">
            <div className="bg-card rounded-lg p-3 flex items-center justify-between border border-border">
              <div>
                <div className="text-xl font-bold text-foreground">
                  {studentStats.weeklyHours}ч
                </div>
                <div className="text-xs text-muted-foreground">За неделю</div>
              </div>
              <Clock size={20} className="text-[#2e77d0]" />
            </div>
            <div className="bg-card rounded-lg p-3 flex items-center justify-between border border-border">
              <div>
                <div className="text-xl font-bold text-foreground">
                  {studentStats.totalHours}ч
                </div>
                <div className="text-xs text-muted-foreground">Всего</div>
              </div>
              <Clock size={20} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div>
          <h2 className="text-xl mb-3 text-foreground">Активность за неделю</h2>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-end justify-between gap-2 h-32 mb-2">
              {studentStats.weeklyActivity.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-muted rounded-t-lg relative"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-[#1db954] to-[#1ed760] rounded-t-lg transition-all"
                      style={{ height: `${(day.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              {studentStats.weeklyActivity.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  {day.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subjects List */}
        <div>
          <h2 className="text-xl mb-3 text-foreground">Мои предметы</h2>
          <div className="space-y-3">
            {studentStats.subjects.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет предметов
              </div>
            ) : (
              studentStats.subjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject.id)}
                  className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-lg mb-1 text-foreground">
                        {subject.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Преподаватель: {subject.tutorName}
                      </div>
                    </div>
                    <div
                      className="text-xl px-3 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${subject.color}20`,
                        color: subject.color,
                      }}
                    >
                      {subject.progress}%
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{subject.hoursStudied}ч пройдено</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target size={14} />
                      <span>{subject.lessonsCompleted} уроков</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback Tutor View (Original Implementation)
  const weeklyActivity = [
    { day: "Пн", hours: 3 },
    { day: "Вт", hours: 2.5 },
    { day: "Ср", hours: 4 },
    { day: "Чт", hours: 2 },
    { day: "Пт", hours: 3.5 },
    { day: "Сб", hours: 1 },
    { day: "Вс", hours: 0.5 },
  ];
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours));

  return (
    <div className="space-y-6 pb-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
          <TrendingUp size={24} className="mb-2" />
          <div className="text-2xl mb-1">{tutorStats.overallProgress}%</div>
          <div className="text-sm opacity-90">Общий прогресс</div>
        </div>
        <div className="bg-gradient-to-br from-[#2e77d0] to-[#1f5296] rounded-lg p-4">
          <Clock size={24} className="mb-2" />
          <div className="text-2xl mb-1">{tutorStats.totalHours}ч</div>
          <div className="text-sm opacity-90">Общее время</div>
        </div>
      </div>

      {/* Subject Progress */}
      <div>
        <h2 className="text-xl mb-3 text-foreground">Прогресс по предметам</h2>
        <div className="space-y-3">
          {tutorSubjects.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных о прогрессе
            </div>
          ) : (
            tutorSubjects.map((subject) => (
              <div
                key={subject.name}
                className="bg-card rounded-lg p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="mb-1 text-foreground">{subject.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Оценка:{" "}
                      <span style={{ color: subject.color }}>
                        {subject.grade}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-2xl px-3 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${subject.color}20`,
                      color: subject.color,
                    }}
                  >
                    {subject.progress}%
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${subject.progress}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{subject.hoursStudied}ч пройдено</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target size={14} />
                    <span>{subject.lessonsCompleted} уроков</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div>
        <h2 className="text-xl mb-3 text-foreground">Активность за неделю</h2>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {weeklyActivity.map((day) => (
              <div
                key={day.day}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-muted rounded-t-lg relative"
                  style={{ height: "100%" }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-[#1db954] to-[#1ed760] rounded-t-lg transition-all"
                    style={{ height: `${(day.hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {weeklyActivity.map((day) => (
              <div
                key={day.day}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {day.day}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to render history list (simplified version of StudentManager's renderer)
function renderHistoryList(
  data: HistoryData,
  expandedItemId: { type: "lesson" | "homework"; id: number } | null,
  setExpandedItemId: (
    id: { type: "lesson" | "homework"; id: number } | null,
  ) => void,
) {
  const historyItems = data.history || [];
  const upcomingLesson = data.upcomingLesson || null;

  if (historyItems.length === 0 && !upcomingLesson) {
    return <div className="text-center py-8 text-muted-foreground">История пуста</div>;
  }

  const renderItem = (item: any, isUpcoming: boolean = false) => {
    const isExpanded =
      expandedItemId?.type === item.type && expandedItemId?.id === item.id;
    const toggleExpand = () =>
      setExpandedItemId(isExpanded ? null : { type: item.type, id: item.id });

    if (item.type === "lesson") {
      const date = new Date(item.date);
      const dateStr = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });

      return (
        <div
          key={`lesson-${item.id}`}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={toggleExpand}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isUpcoming ? "bg-[#1db954]/10 text-[#1db954]" : "bg-blue-500/10 text-blue-500"}`}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div className="font-bold text-foreground">{item.title || "Занятие"}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>
                    {dateStr}, {item.time.slice(0, 5)}
                  </span>
                  {item.homework && item.homework.length > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          item.homework[0].status === "completed"
                            ? "text-[#1db954]"
                            : item.homework[0].status === "submitted"
                              ? "text-blue-400"
                              : item.homework[0].status === "missed"
                                ? "text-destructive"
                                : item.homework[0].status === "no_homework"
                                  ? "text-muted-foreground"
                                  : "text-[#ff9500]"
                        }`}
                      >
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
                  isUpcoming
                    ? "bg-[#1db954]/20 text-[#1db954]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isUpcoming ? "Предстоящее" : "Прошедшее"}
              </div>
              {isExpanded ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={20} className="text-muted-foreground" />
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold mb-1">
                    Длительность
                  </div>
                  <div className="text-foreground">{item.duration || 60} мин</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-muted-foreground text-[10px] uppercase font-bold mb-1">
                    Статус
                  </div>
                  <div className="text-foreground">{isUpcoming ? "Ожидается" : "Завершено"}</div>
                </div>
              </div>

              {/* Lesson Note */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Заметки к занятию
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  {item.notes ? (
                    <p className="text-sm text-foreground leading-relaxed italic">
                      "{item.notes}"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Нет заметок</p>
                  )}
                </div>
              </div>

              {/* Homework Section */}
              {item.homework && item.homework.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                    <BookOpen size={14} />
                    Домашнее задание
                  </h4>
                  {item.homework.map((hw: any) => (
                    <div
                      key={hw.id}
                      className="bg-muted p-3 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-foreground">{hw.title}</div>
                        <div
                          className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            hw.status === "completed"
                              ? "bg-[#1db954]/20 text-[#1db954]"
                              : hw.status === "submitted"
                                ? "bg-blue-400/20 text-blue-400"
                                : hw.status === "missed"
                                  ? "bg-destructive/20 text-destructive"
                                  : hw.status === "no_homework"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-[#ff9500]/20 text-[#ff9500]"
                          }`}
                        >
                          {hw.status === "completed"
                            ? "Выполнено"
                            : hw.status === "submitted"
                              ? "На проверке"
                              : hw.status === "missed"
                                ? "Просрочено"
                                : hw.status === "no_homework"
                                  ? "Без ДЗ"
                                  : "В работе"}
                        </div>
                      </div>

                      {hw.description && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {hw.description}
                        </div>
                      )}

                      {/* Files in Homework */}
                      {hw.files && hw.files.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {hw.files.map((file: any) => (
                            <button
                              key={file.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                api.downloadFile(file.id, file.name);
                              }}
                              className="flex items-center justify-between p-2 bg-card border border-border rounded-md group hover:bg-muted/50 transition-colors w-full text-left"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText
                                  size={14}
                                  className="text-[#1db954] shrink-0"
                                />
                                <span className="text-xs truncate text-muted-foreground group-hover:text-foreground transition-colors">
                                  {file.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <Download size={12} />
                                <span>Скачать</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Comments */}
                      {(hw.studentComment ||
                        hw.question ||
                        hw.questionAnswer) && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          {hw.studentComment && (
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-bold text-muted-foreground uppercase">
                                Ваш комментарий
                              </h4>
                              <div className="text-xs p-2 bg-card border border-border rounded-md italic text-muted-foreground">
                                {hw.studentComment}
                              </div>
                            </div>
                          )}
                          {hw.question && (
                            <div className="bg-card border border-border p-2 rounded-lg border-l-2 border-l-[#1db954]">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                Ваш вопрос
                              </div>
                              <p className="text-xs text-foreground">{hw.question}</p>
                            </div>
                          )}
                          {hw.questionAnswer && (
                            <div className="bg-card border border-border p-2 rounded-lg border-l-2 border-l-[#2e77d0] ml-2">
                              <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                                Ответ преподавателя
                              </div>
                              <p className="text-xs text-foreground">{hw.questionAnswer}</p>
                            </div>
                          )}
                        </div>
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
      // Orphan Homework (not linked to lesson)
      const isCompleted = item.status === "completed";
      return (
        <div key={`hw-${item.id}`} className="bg-card border border-border rounded-lg p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={toggleExpand}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? "bg-[#1db954]20 text-[#1db954]" : "bg-[#e8115b]20 text-[#e8115b]"}`}
              >
                <FileText size={20} />
              </div>
              <div>
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="text-sm text-muted-foreground">
                  {isCompleted ? "Сдано" : "Не сдано"} • Срок:{" "}
                  {new Date(item.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp size={20} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={20} className="text-muted-foreground" />
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground space-y-2">
              <div className="text-foreground">{item.description}</div>
              {item.files && item.files.length > 0 && (
                <div className="space-y-1">
                  {item.files.map((file: any) => (
                    <button
                      key={file.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        api.downloadFile(file.id, file.name);
                      }}
                      className="flex items-center gap-2 text-[#1db954] hover:underline w-full text-left"
                    >
                      <Download size={14} /> {file.name || "Скачать файл"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {upcomingLesson && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Ближайшее занятие
          </h3>
          {renderItem({ ...upcomingLesson, type: "lesson" }, true)}
        </div>
      )}

      {historyItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            История
          </h3>
          <div className="space-y-4">
            {historyItems.map((item) => renderItem(item, false))}
          </div>
        </div>
      )}
    </div>
  );
}
