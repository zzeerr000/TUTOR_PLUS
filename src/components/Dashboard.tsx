import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckSquare,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  FolderOpen,
  FileText,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";

interface DashboardProps {
  userType: "tutor" | "student";
  onNavigate: (tab: string) => void;
}

export function Dashboard({ userType, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    students: 0,
    lessonsToday: 0,
    thisMonth: 0,
    pendingTasks: 0,
    activeTasks: 0,
    lessonsThisWeek: 0,
    avgProgress: 0,
    studyTime: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(api.getCurrencySymbol());

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      setCurrency(api.getCurrencySymbol());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userType]);

  const isEventPast = (eventDate: string, eventTime: string) => {
    const now = new Date();
    const datePart = eventDate.split("T")[0];

    const [h, m] = eventTime.split(":");
    const hour24 = parseInt(h);
    const minutes = parseInt(m);

    const eventDateTime = new Date(
      `${datePart}T${String(hour24).padStart(2, "0")}:${String(
        minutes,
      ).padStart(2, "0")}:00`,
    );
    return eventDateTime < now;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [homework, events, students, financeStats, progress] =
        await Promise.all([
          api.getHomework().catch(() => []),
          api.getEvents().catch(() => []),
          userType === "tutor"
            ? api.getStudents().catch(() => [])
            : Promise.resolve([]),
          userType === "tutor"
            ? api
                .getFinanceStats()
                .catch(() => ({ thisMonth: 0, pendingCount: 0 }))
            : Promise.resolve({}),
          api.getProgress().catch(() => []),
        ]);

      const today = new Date().toISOString().split("T")[0];
      const todayEvents = events.filter((e: any) => e.date === today);
      const thisWeekEvents = events.filter((e: any) => {
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const [year, month, day] = e.date.split("-").map(Number);
        const eventDate = new Date(year, month - 1, day);

        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      const pendingTasksCount = homework.filter(
        (t: any) =>
          t.status === "pending" ||
          t.status === "draft" ||
          t.status === "submitted",
      ).length;
      const activeTasksCount = homework.filter(
        (t: any) => t.status === "pending" || t.status === "submitted",
      ).length;

      if (userType === "tutor") {
        setStats({
          students: students.length,
          lessonsToday: todayEvents.length,
          thisMonth: financeStats.thisMonth || 0,
          pendingTasks: pendingTasksCount,
          activeTasks: 0,
          lessonsThisWeek: 0,
          avgProgress: 0,
          studyTime: 0,
        });
        setTodaySchedule(
          todayEvents.slice(0, 4).map((e: any) => ({
            id: e.id,
            time: e.time,
            student: e.student?.name || "Ученик",
            subject: e.subject || "Занятие",
            color: e.color || "#1db954",
            past: isEventPast(e.date, e.time),
          })),
        );
      } else {
        const progressStats = await api
          .getProgressStats()
          .catch(() => ({ overallProgress: 0, totalHours: 0 }));

        const now = new Date();
        const futureEvents = events
          .filter((e: any) => {
            const eventDate = e.date.split("T")[0];
            const [h, m] = e.time.split(":");
            const eventDateTime = new Date(
              `${eventDate}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`,
            );
            return eventDateTime >= now;
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date.split("T")[0]}T${a.time}`);
            const dateB = new Date(`${b.date.split("T")[0]}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });

        setStats({
          students: 0,
          lessonsToday: todayEvents.length,
          thisMonth: 0,
          pendingTasks: 0,
          activeTasks: activeTasksCount,
          lessonsThisWeek: thisWeekEvents.length,
          avgProgress: progressStats.overallProgress || 0,
          studyTime: progressStats.totalHours || 0,
        });
        setUpcomingLessons(
          futureEvents.slice(0, 3).map((e: any) => ({
            id: e.id,
            day: new Date(e.date).toLocaleDateString("ru-RU", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }),
            time: e.time,
            subject: e.subject || "Занятие",
            tutor: e.tutor?.name || "Репетитор",
            color: e.color || "#1db954",
            past: false,
          })),
        );
        setRecentProgress(
          progress.slice(0, 3).map((p: any) => ({
            subject: p.subject,
            progress: Math.round(Number(p.progress)),
            color: "#1db954",
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить это занятие?")) {
      try {
        await api.deleteEvent(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete lesson:", error);
      }
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">
          Загрузка панели управления...
        </div>
      </div>
    );
  }

  if (userType === "tutor") {
    return (
      <div className="space-y-6 pb-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate("students")}
            className="bg-gradient-to-br from-[#369128] to-[#15883d] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
          >
            <Users size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.students}</div>
            <div className="text-sm opacity-90">Активные студенты</div>
          </div>
          <div
            onClick={() => onNavigate("calendar")}
            className="bg-gradient-to-br from-[#a02b54] to-[#c60f4f] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
          >
            <Calendar size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.lessonsToday}</div>
            <div className="text-sm opacity-90">Занятий сегодня</div>
          </div>
          <div
            onClick={() => onNavigate("finance")}
            className="bg-gradient-to-br from-[#45238f] to-[#1f5296] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
          >
            <DollarSign size={24} className="mb-2" />
            <div className="text-2xl mb-1">
              {currency}
              {stats.thisMonth.toLocaleString()}
            </div>
            <div className="text-sm opacity-90">В этом месяце</div>
          </div>
          <div
            onClick={() => onNavigate("homework")}
            className="bg-gradient-to-br from-[#9e2a89] to-[#7c1f66] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
          >
            <CheckSquare size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.pendingTasks}</div>
            <div className="text-sm opacity-90">Ожидающие задачи</div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <h2 className="text-xl mb-3 font-semibold">Расписание на сегодня</h2>
          <div className="space-y-2">
            {todaySchedule.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                На сегодня занятий нет
              </div>
            ) : (
              todaySchedule.map((lesson, idx) => (
                <div
                  key={idx}
                  className={`bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    lesson.past ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: lesson.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {lesson.time}
                        </span>
                      </div>
                      {lesson.past ? (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold">
                          Завершено
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-1.5 py-0.5 rounded uppercase font-bold">
                          Предстоит
                        </span>
                      )}
                    </div>
                    <div
                      className={`font-medium ${
                        lesson.past ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {lesson.student}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lesson.subject}
                    </div>
                  </div>
                  {userType === "tutor" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      title="Удалить занятие"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="space-y-6 pb-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => onNavigate("tasks")}
          className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
        >
          <CheckSquare size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.activeTasks}</div>
          <div className="text-sm opacity-90">Активные задачи</div>
        </div>
        <div
          onClick={() => onNavigate("calendar")}
          className="bg-gradient-to-br from-[#2e77d0] to-[#1f5296] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
        >
          <Calendar size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.lessonsThisWeek}</div>
          <div className="text-sm opacity-90">Занятий на неделе</div>
        </div>
        <div
          onClick={() => onNavigate("progress")}
          className="bg-gradient-to-br from-[#af2896] to-[#7c1f66] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
        >
          <TrendingUp size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.avgProgress}%</div>
          <div className="text-sm opacity-90">Средний прогресс</div>
        </div>
        <div
          onClick={() => onNavigate("progress")}
          className="bg-gradient-to-br from-[#e8115b] to-[#b0084a] rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity text-white"
        >
          <Clock size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.studyTime}ч</div>
          <div className="text-sm opacity-90">Время обучения</div>
        </div>
      </div>

      {/* Upcoming Lessons */}
      <div>
        <h2 className="text-xl mb-3 font-semibold">Ближайшие занятия</h2>
        <div className="space-y-2">
          {upcomingLessons.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет ближайших занятий
            </div>
          ) : (
            upcomingLessons.map((lesson, idx) => (
              <div
                key={idx}
                className={`bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                  lesson.past ? "opacity-60" : ""
                }`}
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: lesson.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-muted-foreground">
                      {lesson.day} • {lesson.time}
                    </div>
                    {lesson.past ? (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold">
                        Завершено
                      </span>
                    ) : (
                      <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-1.5 py-0.5 rounded uppercase font-bold">
                        Предстоит
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-medium ${
                      lesson.past ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {lesson.subject}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lesson.tutor}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Progress */}
      <div>
        <h2 className="text-xl mb-3 font-semibold">Последний прогресс</h2>
        <div className="space-y-3">
          {recentProgress.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных о прогрессе
            </div>
          ) : (
            recentProgress.map((item, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.progress}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
