import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";

interface CalendarViewProps {
  userType?: "tutor" | "student";
}

type CalendarViewType = "month" | "week" | "day";

export function CalendarView({ userType }: CalendarViewProps) {
  const [currency, setCurrency] = useState(api.getCurrencySymbol());
  const [viewType, setViewType] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date()); // Current date
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    subject: "",
    subjectId: "",
    studentId: "",
    color: "#1db954",
    repeatType: "once" as "once" | "week" | "month",
    amount: localStorage.getItem("last_lesson_price") || "",
    duration: "60",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showHWDialog, setShowHWDialog] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [hwDetails, setHwDetails] = useState({
    title: "Домашнее задание",
    description: "",
  });
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkEditEvent = async () => {
      loadEvents();
      loadTransactions();
      loadHomework();
      if (userType === "tutor") {
        loadStudents();
        loadSubjects();
      }

      // Check for stored edit event ID
      const editEventId = localStorage.getItem("editEventId");
      if (editEventId) {
        const events = await api.getEvents();
        const event = events.find((e: any) => e.id === parseInt(editEventId));
        if (event) {
          handleEditEvent(event);
          localStorage.removeItem("editEventId");
        }
      }
    };
    
    checkEditEvent();

    const handleStorageChange = () => {
      setCurrency(api.getCurrencySymbol());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userType]);

  const checkAndCreatePendingItems = async (events: any[]) => {
    try {
      // Get server time
      let serverTime = new Date();
      try {
        const serverTimeResponse = await api.getServerTime();
        if (serverTimeResponse && serverTimeResponse.timestamp) {
          serverTime = new Date(serverTimeResponse.timestamp);
        }
      } catch (error) {
        // Use client time as fallback
      }

      // Check each event for pending items
      for (const event of events) {
        if (!event.time || !event.date) continue;

        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const timezoneOffset = eventDateTime.getTimezoneOffset();
        const eventTimeUTC = new Date(eventDateTime.getTime() + (timezoneOffset * 60000));
        
        const hasStarted = eventTimeUTC <= serverTime;
        
        if (hasStarted) {
          // Check if transaction already exists
          if (event.amount > 0) {
            try {
              // Get existing transactions to check for duplicates
              const transactionsData = await api.getTransactions();
              const existingTransaction = transactionsData.find((t: any) => t.eventId === event.id);
              
              if (!existingTransaction) {
                await api.createTransaction({
                  eventId: event.id,
                  studentId: event.studentId,
                  tutorId: parseInt(localStorage.getItem('userId') || '0'),
                  amount: parseFloat(event.amount) || 0,
                  subject: event.subject || event.subjectName,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              // Transaction might already exist, ignore error
            }
          }

          // Check if homework already exists
          try {
            const homeworkData = await api.getHomework();
            const existingHomework = homeworkData.find((h: any) => h.lessonId === event.id);
            
            if (!existingHomework) {
              await api.createHomework({
                title: `Домашнее задание по ${event.subject || event.subjectName}`,
                description: '',
                subject: event.subject || event.subjectName,
                studentId: event.studentId,
                lessonId: event.id,
                dueDate: 'next_lesson',
                status: 'draft',
              });
            }
          } catch (error) {
            // Homework might already exist, ignore error
          }
        }
      }
    } catch (error) {
      console.error('Failed to check pending items:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      const formattedEvents = data.map((e: any) => {
        const studentName = e.student?.studentAlias || e.student?.name;
        const subjectName = e.subjectEntity ? e.subjectEntity.name : e.subject;
        return {
          ...e,
          title: subjectName
            ? `${subjectName} - ${studentName || e.tutor?.name || "Пользователь"}`
            : e.title,
          subjectName: subjectName,
          subjectId: e.subjectId,
        };
      });
      setEvents(formattedEvents);

      // Check for past events and create pending transactions/homework
      await checkAndCreatePendingItems(formattedEvents);

      // Update date details if modal is open
      if (showDateDetails && selectedDate) {
        const dayEvents = formattedEvents.filter(
          (e: any) => e.date === selectedDate,
        );
        setSelectedDateEvents(dayEvents);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
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

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const loadHomework = async () => {
    try {
      const data = await api.getHomework();
      setHomework(data);
    } catch (error) {
      console.error("Failed to load homework:", error);
    }
  };

  const formatTime = (time24: string): string => {
    return time24;
  };

  const generateRepeatDates = (
    startDate: string,
    repeatType: "once" | "week" | "month",
  ): string[] => {
    if (repeatType === "once") {
      return [startDate];
    }

    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(start);

    if (repeatType === "week") {
      // Generate dates for 1 year (52 weeks)
      end.setFullYear(end.getFullYear() + 1);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        dates.push(d.toISOString().split("T")[0]);
      }
    } else if (repeatType === "month") {
      // Generate dates for 1 year (12 months)
      end.setFullYear(end.getFullYear() + 1);
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        dates.push(d.toISOString().split("T")[0]);
      }
    }

    return dates;
  };

  const checkTimeConflict = (
    date: string,
    time: string,
    duration: number,
    excludeEventId?: number,
  ): { hasConflict: boolean; conflictInfo?: { studentName: string; time: string; duration: number } } => {
    // Parse start time
    const [startHour, startMin] = time.split(":").map(Number);
    const startTime = new Date(`${date}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Check all events for the same date
    const dayEvents = events.filter((e) => e.date === date && e.id !== excludeEventId);

    for (const event of dayEvents) {
      const [eventHour, eventMin] = event.time.split(":").map(Number);
      const eventStartTime = new Date(`${date}T${String(eventHour).padStart(2, "0")}:${String(eventMin).padStart(2, "0")}:00`);
      const eventEndTime = new Date(eventStartTime);
      eventEndTime.setMinutes(eventEndTime.getMinutes() + (event.duration || 60));

      // Check if time ranges overlap
      if (
        (startTime >= eventStartTime && startTime < eventEndTime) ||
        (endTime > eventStartTime && endTime <= eventEndTime) ||
        (startTime <= eventStartTime && endTime >= eventEndTime)
      ) {
        const studentName = event.student?.studentAlias || event.student?.name || "Ученик";
        return {
          hasConflict: true,
          conflictInfo: {
            studentName,
            time: event.time,
            duration: event.duration || 60,
          },
        };
      }
    }

    return { hasConflict: false };
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const timeStr = formatTime(newEvent.time);
      const amount = parseFloat(newEvent.amount) || 0;
      const duration = parseInt(newEvent.duration) || 60;

      // Check for time conflicts
      if (editingEvent) {
        const conflict = checkTimeConflict(newEvent.date, timeStr, duration, editingEvent.id);
        if (conflict.hasConflict) {
          setError(
            `Это время уже занято учеником ${conflict.conflictInfo?.studentName} (${conflict.conflictInfo?.time}, ${conflict.conflictInfo?.duration} мин)`
          );
          setSubmitting(false);
          return;
        }
      } else {
        const dates = generateRepeatDates(newEvent.date, newEvent.repeatType);
        for (const date of dates) {
          const conflict = checkTimeConflict(date, timeStr, duration);
          if (conflict.hasConflict) {
            setError(
              `Время уже занято на дату ${date} учеником ${conflict.conflictInfo?.studentName} (${conflict.conflictInfo?.time}, ${conflict.conflictInfo?.duration} мин)`
            );
            setSubmitting(false);
            return;
          }
        }
      }

      // Save last used price
      localStorage.setItem("last_lesson_price", newEvent.amount);

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, {
          title: newEvent.title || newEvent.subject,
          date: newEvent.date,
          time: timeStr,
          subject: newEvent.subject,
          subjectId: newEvent.subjectId ? parseInt(newEvent.subjectId) : null,
          studentId: parseInt(newEvent.studentId),
          color: newEvent.color,
          amount: amount,
          duration: duration,
        });
        setEditingEvent(null);
      } else {
        // Generate dates based on repeat type
        const dates = generateRepeatDates(newEvent.date, newEvent.repeatType);

        // Create events for all dates
        const eventPromises = dates.map((date) =>
          api.createEvent({
            title: newEvent.title || newEvent.subject,
            date: date,
            time: timeStr,
            subject: newEvent.subject,
            subjectId: newEvent.subjectId ? parseInt(newEvent.subjectId) : null,
            studentId: parseInt(newEvent.studentId),
            color: newEvent.color,
            amount: amount,
            duration: duration,
          }),
        );

        await Promise.all(eventPromises);
      }
      setShowAddDialog(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        subject: "",
        subjectId: "",
        studentId: "",
        color: "#1db954",
        repeatType: "once",
        amount: localStorage.getItem("last_lesson_price") || "0",
        duration: "60",
      });
      loadEvents();
      if (showDateDetails) {
        const dayEvents = events.filter((e) => e.date === selectedDate);
        setSelectedDateEvents(dayEvents);
      }
    } catch (err: any) {
      setError(
        err.message ||
          (editingEvent
            ? "Не удалось обновить занятие"
            : "Не удалось создать занятие"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (
    eventId: number,
    recurring: boolean = false,
  ) => {
    try {
      await api.deleteEvent(eventId, recurring);
      setShowDeleteConfirm(null);
      setShowDateDetails(false); // Close the day details popup
      await loadEvents();
      await loadTransactions();
      await loadHomework();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Не удалось удалить занятие. Пожалуйста, попробуйте еще раз.");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust to make Monday the first day (0)
    // Sunday is 0, Monday is 1... -> Monday is 0, Sunday is 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthName = currentDate.toLocaleString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getWeekDates = (date: Date): Date[] => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    // Adjust to make Monday the start of the week
    const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const getEventsForWeekDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = getEventsForDate(day);
    setSelectedDate(dateStr);
    setSelectedDateEvents(dayEvents);
    setShowDateDetails(true);
  };

  const handleDateClickFromStr = (dateStr: string) => {
    const dayEvents = events.filter((e) => e.date === dateStr);
    setSelectedDate(dateStr);
    setSelectedDateEvents(dayEvents);
    setShowDateDetails(true);
  };

  const handleEditEvent = (event: any) => {
    const time24 = event.time;

    // Find if subject name matches any existing subject
    const matchedSubject = subjects.find((s) => s.name === event.subject);
    const effectiveSubjectId =
      event.subjectId?.toString() ||
      (matchedSubject ? matchedSubject.id.toString() : "");

    setEditingEvent({
      ...event,
      time: time24,
      amount: event.amount?.toString() || "0",
      duration: event.duration?.toString() || "60",
      subjectId: effectiveSubjectId,
    });

    const isExistingSubject =
      !!effectiveSubjectId || subjects.some((s) => s.name === event.subject);
    setIsCustomSubject(!isExistingSubject && !!event.subject);

    setNewEvent({
      title: event.title || "",
      date: event.date,
      time: time24,
      subject: event.subject || "",
      subjectId: effectiveSubjectId,
      studentId: event.studentId.toString(),
      color: event.color || "#1db954",
      repeatType: "once",
      amount: event.amount?.toString() || "0",
      duration: event.duration?.toString() || "60",
    });
    setShowAddDialog(true);
    setShowDateDetails(false);
  };

  const processUpdate = async (recurring: boolean) => {
    if (!editingEvent) return;
    setError("");
    setSubmitting(true);

    try {
      const timeStr = formatTime(newEvent.time);
      const amount = parseFloat(newEvent.amount) || 0;
      const duration = parseInt(newEvent.duration) || 60;
      localStorage.setItem("last_lesson_price", newEvent.amount);

      // Check for time conflicts
      const conflict = checkTimeConflict(newEvent.date, timeStr, duration, editingEvent.id);
      if (conflict.hasConflict) {
        setError(
          `Это время уже занято учеником ${conflict.conflictInfo?.studentName} (${conflict.conflictInfo?.time}, ${conflict.conflictInfo?.duration} мин)`
        );
        setSubmitting(false);
        return;
      }

      // Check if lesson has started and needs payment transaction
      // Use server time to avoid timezone issues
      const eventDateTime = new Date(`${newEvent.date}T${timeStr}`);
      
      // Get server time for accurate comparison
      let serverTime = new Date();
      let hasStarted = false;
      
      try {
        const serverTimeResponse = await api.getServerTime();
        
        if (serverTimeResponse && serverTimeResponse.timestamp) {
          // Server returns UTC time, use it directly
          serverTime = new Date(serverTimeResponse.timestamp);
          
          // Convert event time to UTC properly
          const timezoneOffset = eventDateTime.getTimezoneOffset();
          const eventTimeUTC = new Date(eventDateTime.getTime() + (timezoneOffset * 60000));
          
          // Compare UTC times
          hasStarted = eventTimeUTC <= serverTime;
        } else {
          hasStarted = eventDateTime <= serverTime;
        }
      } catch (error) {
        hasStarted = eventDateTime <= serverTime;
      }

      await api.updateEvent(
        editingEvent.id,
        {
          title: newEvent.title || newEvent.subject,
          date: newEvent.date,
          time: timeStr,
          subject: newEvent.subject,
          subjectId: newEvent.subjectId ? parseInt(newEvent.subjectId) : null,
          studentId: parseInt(newEvent.studentId),
          color: newEvent.color,
          amount: amount,
          duration: duration,
          // Mark as payment pending if lesson has started
          paymentPending: hasStarted && amount > 0,
        },
        recurring,
      );

      // If lesson has started and has amount, create payment transaction
      if (hasStarted && amount > 0) {
        try {
          await api.createTransaction({
            eventId: editingEvent.id,
            studentId: parseInt(newEvent.studentId),
            tutorId: parseInt(localStorage.getItem('userId') || '0'),
            amount: amount,
            subject: newEvent.subject,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        } catch (txError) {
          console.error('Failed to create transaction:', txError);
        }
      }

// If lesson has started, create homework assignment as draft
      if (hasStarted) {
        try {
          await api.createHomework({
            title: `Домашнее задание по ${newEvent.subject}`,
            description: '',
            subject: newEvent.subject,
            studentId: parseInt(newEvent.studentId),
            lessonId: editingEvent.id,
            dueDate: 'next_lesson',
            status: 'draft',
          });
        } catch (hwError) {
          console.error('Failed to create homework:', hwError);
        }
      }

      setShowAddDialog(false);
      setShowUpdateConfirm(false);
      setEditingEvent(null);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        subject: "",
        subjectId: "",
        studentId: "",
        color: "#1db954",
        repeatType: "once",
        amount: localStorage.getItem("last_lesson_price") || "0",
        duration: "60",
      });
      await loadEvents();
      await loadTransactions();
      await loadHomework();
      setShowDateDetails(false);
    } catch (err: any) {
      setError(err.message || "Не удалось обновить занятие");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    // Check if recurring
    const currentDay = new Date(editingEvent.date).getDay();
    const isRecurring = events.some((e) => {
      // Skip same event
      if (e.id === editingEvent.id) return false;

      // Loose equality for IDs to handle string/number mismatch
      const sameStudent = e.studentId == editingEvent.studentId;
      const sameTime = e.time === editingEvent.time;

      // Check day of week
      const day = new Date(e.date).getDay();
      const sameDay = day === currentDay;

      if (sameStudent && sameTime && sameDay) {
        return true;
      }
      return false;
    });

    if (isRecurring) {
      setShowUpdateConfirm(true);
      return;
    }

    await processUpdate(false);
  };

  const isEventPast = (eventDate: string, eventTime: string) => {
    const now = new Date();
    // Normalize event date to YYYY-MM-DD
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

  const weekDates = getWeekDates(currentDate);
  const weekStartDate = weekDates[0];
  const weekEndDate = weekDates[6];
  const weekRange = `${weekStartDate.toLocaleDateString("ru-RU", {
    month: "short",
    day: "numeric",
  })} - ${weekEndDate.toLocaleDateString("ru-RU", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const getCurrentWeekEvents = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const weekEvents = events.filter((event) => {
      const eventDate = new Date(event.date + "T00:00:00");
      return eventDate >= currentWeekStart && eventDate <= currentWeekEnd;
    });

    // Sort by date and time
    return weekEvents.sort((a, b) => {
      // Compare dates first
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      // If dates are the same, compare times
      // Convert 12-hour format to 24-hour for comparison
      const parseTime = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":");
        return parseInt(hours) * 60 + parseInt(minutes);
      };

      return parseTime(a.time) - parseTime(b.time);
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* View Type Selector */}
      <div className={`${screenSize.width >= 768 ? 'flex items-center justify-between' : 'space-y-4'}`}>
        <div className={`${screenSize.width >= 768 ? 'flex gap-2' : 'flex flex-col gap-2'} bg-card border border-border rounded-lg p-1`}>
          <button
            onClick={() => setViewType("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === "month"
                ? "bg-[#1db954] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Месяц
          </button>
          <button
            onClick={() => setViewType("week")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === "week"
                ? "bg-[#1db954] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setViewType("day")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === "day"
                ? "bg-[#1db954] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            День
          </button>
        </div>
        <div className={`${screenSize.width >= 768 ? 'flex items-center gap-2' : 'flex items-center justify-between gap-2'}`}>
          <h2 className={`text-xl font-semibold ${screenSize.width < 768 ? 'text-lg' : ''}`}>
            {viewType === "month"
              ? monthName
              : viewType === "week"
                ? weekRange
                : currentDate.toLocaleDateString("ru-RU", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={
                viewType === "month"
                  ? prevMonth
                  : viewType === "week"
                    ? prevWeek
                    : prevDay
              }
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
            <button
              onClick={
                viewType === "month"
                  ? nextMonth
                  : viewType === "week"
                    ? nextWeek
                    : nextDay
              }
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronRight size={20} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewType === "month" && (
        <div className="bg-card border border-border rounded-lg p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div
                key={day}
                className="text-center text-xs text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getEventsForDate(day);
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (userType === "tutor") {
                      handleDateClick(day);
                    } else {
                      const dayEvents = getEventsForDate(day);
                      if (dayEvents.length > 0) {
                        handleDateClick(day);
                      }
                    }
                  }}
                  className={`aspect-square rounded-lg p-1 text-center relative overflow-hidden ${
                    isToday ? "bg-[#1db954]" : "bg-muted hover:bg-muted/80"
                  } transition-colors cursor-pointer`}
                >
                  <div
                    className={`text-sm ${
                      isToday ? "text-white" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="flex justify-center mt-1">
                      {screenSize.width >= 768 ? (
                        // Desktop and Tablet: show avatars
                        <div className="flex gap-1 justify-center flex-wrap h-6 items-center">
                          {dayEvents.slice(0, screenSize.width >= 1024 ? dayEvents.length : 2).map((event, eventIdx) => {
                            const displayName = userType === "tutor" 
                              ? (event.student?.studentAlias || event.student?.name || "У")
                              : (event.tutor?.name || "Преподаватель");
                            const avatarUrl = userType === "tutor" 
                              ? event.student?.avatarUrl
                              : event.tutor?.avatarUrl;
                            
                            return (
                              <div
                                key={eventIdx}
                                className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white border border-background flex-shrink-0 overflow-hidden"
                                style={{ 
                                  backgroundColor: event.color || "#1db954",
                                }}
                                title={displayName}
                              >
                                {avatarUrl ? (
                                  <img 
                                    src={`${api.getBaseUrl()}${avatarUrl}`}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span style={{ fontSize: "9px", lineHeight: "14px" }}>
                                    {displayName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {/* Show counter for tablet */}
                          {screenSize.width < 1024 && screenSize.width >= 768 && dayEvents.length > 2 && (
                            <div
                              className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center bg-muted text-muted-foreground border border-background flex-shrink-0"
                              style={{ fontSize: "9px", lineHeight: "14px" }}
                              title={`Еще ${dayEvents.length - 2} занятий`}
                            >
                              +{dayEvents.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Mobile: show just the number
                        <div
                          className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white border border-background flex-shrink-0"
                          style={{ 
                            backgroundColor: "#1db954",
                            fontSize: "10px",
                            lineHeight: "14px"
                          }}
                          title={`${dayEvents.length} занятий`}
                        >
                          {dayEvents.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewType === "week" && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => {
              const dayEvents = getEventsForWeekDate(date);
              const today = new Date();
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              const dateStr = `${date.getFullYear()}-${String(
                date.getMonth() + 1,
              ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

              return (
                <div
                  key={idx}
                  className="border-r border-border last:border-r-0"
                >
                  <div
                    className={`text-center py-2 mb-2 mr-2 ${
                      isToday ? "bg-[#1db954] rounded-lg" : ""
                    }`}
                  >
                    <div
                      className={`text-xs text-muted-foreground ${
                        isToday ? "text-white" : ""
                      }`}
                    >
                      {date.toLocaleDateString("ru-RU", { weekday: "short" })}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        isToday ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                  <div
                    className="space-y-1 h-60 cursor-pointer overflow-y-auto scrollbar-custom  mr-2"
                    onClick={() => {
                      if (userType === "tutor" || dayEvents.length > 0) {
                        handleDateClickFromStr(dateStr);
                      }
                    }}
                  >
                    
                    
                    {dayEvents.map((event, eventIdx) => {
                      const past = isEventPast(event.date, event.time);
                      return (
                        <div
                          key={eventIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(dateStr);
                            setSelectedDateEvents([event]);
                            setShowDateDetails(true);
                          }}
                          className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                            past ? "opacity-50" : ""
                          }`}
                          style={{
                            backgroundColor: event.color || "#1db954",
                            color: "white",
                          }}
                        >
                          <div
                            className={`font-medium truncate ${
                              past ? "line-through" : ""
                            }`}
                          >
                            {event.subject || event.title}
                          </div>
                          <div className="text-xs opacity-90 flex items-center gap-1">
                            {event.time}
                            {event.duration && (
                              <span className="opacity-70">
                                ({event.duration} мин)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="w-auto h-[48px] text-xl rounded bg-accent text-center content-center p-2 opacity-50 cursor-pointer hover:opacity-70">+</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewType === "day" && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="space-y-2">
            {Array.from({ length: 24 }).map((_, hour) => {
              const dateStr = `${currentDate.getFullYear()}-${String(
                currentDate.getMonth() + 1,
              ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(
                2,
                "0",
              )}`;
              const dayEvents = events.filter((e) => e.date === dateStr);

              // Filter events for this hour (check if time starts with hour)
              const hourEvents = dayEvents.filter((e) => {
                const timeStr = e.time;
                // Handle both 12-hour and 24-hour formats
                if (
                  timeStr.includes("AM") ||
                  timeStr.includes("PM") ||
                  timeStr.includes("ДП") ||
                  timeStr.includes("ПП")
                ) {
                  const [timePart, period] = timeStr.split(" ");
                  const [hours] = timePart.split(":");
                  let hour24 = parseInt(hours);
                  if ((period === "PM" || period === "ПП") && hour24 !== 12) {
                    hour24 += 12;
                  } else if (
                    (period === "AM" || period === "ДП") &&
                    hour24 === 12
                  ) {
                    hour24 = 0;
                  }
                  return hour24 === hour;
                } else {
                  return parseInt(timeStr.split(":")[0]) === hour;
                }
              });

              return (
                <div
                  key={hour}
                  className="flex border-b border-border pb-2 min-h-15"
                  onClick={() => {
                    if (userType === "tutor") {
                      const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                      setNewEvent({
                        ...newEvent,
                        date: dateStr,
                        time: timeStr,
                      });
                      setEditingEvent(null);
                      setShowAddDialog(true);
                    }
                  }}
                >
                  <div className="w-20 text-sm text-muted-foreground">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 space-y-1">
                    {hourEvents.length === 0 && userType === "tutor" && (
                      <div className="text-xs text-muted-foreground py-2">
                        Нажмите, чтобы добавить занятие
                      </div>
                    )}
                    {hourEvents.map((event, eventIdx) => {
                      const past = isEventPast(event.date, event.time);
                      return (
                        <div
                          key={eventIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(dateStr);
                            setSelectedDateEvents([event]);
                            setShowDateDetails(true);
                          }}
                          className={`text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                            past ? "opacity-50" : ""
                          }`}
                          style={{
                            backgroundColor: event.color || "#1db954",
                            color: "white",
                          }}
                        >
                          <div
                            className={`font-medium ${
                              past ? "line-through" : ""
                            }`}
                          >
                            {event.subject || event.title}
                          </div>
                          <div className="text-xs opacity-90 flex items-center gap-1">
                            {event.time}
                            {event.duration && (
                              <span className="opacity-70">
                                ({event.duration} мин)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {showDateDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Занятия на{" "}
                  {selectedDate &&
                    new Date(selectedDate).toLocaleDateString("ru-RU", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </h2>
              </div>
              <div className="flex gap-2">
                {userType === "tutor" && (
                  <button
                    onClick={() => {
                      setNewEvent({ ...newEvent, date: selectedDate || "" });
                      setEditingEvent(null);
                      setShowAddDialog(true);
                      setShowDateDetails(false);
                    }}
                    className="p-2 bg-[#1db954] rounded-lg hover:bg-[#1ed760] transition-colors"
                    title="Добавить занятие"
                  >
                    <Plus size={18} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDateDetails(false);
                    setSelectedDate(null);
                    setSelectedDateEvents([]);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  На эту дату занятий не запланировано
                  {userType === "tutor" && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setNewEvent({
                            ...newEvent,
                            date: selectedDate || "",
                          });
                          setEditingEvent(null);
                          setShowAddDialog(true);
                          setShowDateDetails(false);
                        }}
                        className="text-[#1db954] hover:underline text-sm"
                      >
                        Добавьте первое занятие
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                selectedDateEvents.map((event) => {
                  const past = isEventPast(event.date, event.time);
                  return (
                    <div
                      key={event.id}
                      className={`bg-muted/50 rounded-lg p-4 border-l-4 relative group ${
                        past ? "opacity-60" : ""
                      }`}
                      style={{ borderLeftColor: event.color || "#1db954" }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`font-semibold text-lg ${
                                past ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {event.subject || event.title}
                            </div>
                            {past ? (
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold">
                                Завершено
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[#1db954]/20 text-[#1db954] px-1.5 py-0.5 rounded uppercase font-bold">
                                Предстоит
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock size={14} />
                            <span className="font-medium">
                              {event.time}
                              {event.duration && (
                                <span className="ml-1 text-muted-foreground/80 font-normal">
                                  ({event.duration} мин)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <User size={14} />
                            <span>
                              {userType === "tutor"
                                ? event.student?.studentAlias ||
                                  event.student?.name
                                : event.tutor?.name}
                            </span>
                          </div>
                          {event.amount > 0 && (
                            <div className="text-sm text-[#1db954] font-medium mt-1">
                              {currency}
                              {Number(event.amount).toFixed(2)}
                            </div>
                          )}
                          {event.paymentPending && (
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                                Ожидает оплаты
                              </span>
                              {userType === "tutor" && event.transactionId && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.confirmPayment(
                                        event.transactionId,
                                      );
                                      loadEvents();
                                      loadTransactions();
                                      loadHomework();
                                      const dayEvents = events.filter(
                                        (e) => e.date === selectedDate,
                                      );
                                      setSelectedDateEvents(dayEvents);
                                    } catch (error: any) {
                                      alert(
                                        error.message ||
                                          "Не удалось подтвердить оплату",
                                      );
                                    }
                                  }}
                                  className="text-xs bg-[#1db954] text-white px-3 py-1 rounded hover:bg-[#1ed760] transition-colors"
                                >
                                  Подтвердить оплату
                                </button>
                              )}
                            </div>
                          )}
                          {past && userType === "tutor" && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <button
                                onClick={() => {
                                  setShowHWDialog(event);
                                  setShowDateDetails(false);
                                }}
                                className="flex items-center gap-1.5 text-xs text-[#1db954] hover:text-[#1ed760] transition-colors font-medium"
                              >
                                <BookOpen size={14} />
                                Задать домашнее задание
                              </button>
                            </div>
                          )}
                        </div>
                        {userType === "tutor" && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                handleEditEvent(event);
                                setShowDateDetails(false);
                              }}
                              className="text-muted-foreground hover:text-[#1db954] transition-colors"
                              title="Редактировать"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(event.id);
                                setShowDateDetails(false);
                              }}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Button - Only for tutors */}
      {userType === "tutor" && (
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowAddDialog(true);
          }}
          className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Add Lesson Dialog */}
      {showAddDialog && userType === "tutor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingEvent
                  ? "Редактировать занятие"
                  : "Запланировать новое занятие"}
              </h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError("");
                  setNewEvent({
                    title: "",
                    date: "",
                    time: "",
                    subject: "",
                    subjectId: "",
                    studentId: "",
                    color: "#1db954",
                    repeatType: "once",
                    amount: localStorage.getItem("last_lesson_price") || "",
                    duration: "60",
                  });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Ученик
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <select
                    value={newEvent.studentId}
                    onChange={(e) => {
                      const studentId = e.target.value;
                      const student = students.find(
                        (s) => s.id.toString() === studentId,
                      );
                      if (student) {
                        const defaultSubjectName =
                          student.defaultSubject || newEvent.subject;
                        const matchedSubject = subjects.find(
                          (s) => s.name === defaultSubjectName,
                        );

                        if (matchedSubject) {
                          setIsCustomSubject(false);
                        } else if (defaultSubjectName && subjects.length > 0) {
                          // Only switch to custom if we have subjects but no match found
                          // If no subjects exist, we stay in text input mode anyway
                          setIsCustomSubject(true);
                        }

                        setNewEvent({
                          ...newEvent,
                          studentId: studentId,
                          subject: defaultSubjectName,
                          subjectId: matchedSubject
                            ? matchedSubject.id.toString()
                            : "",
                          title: defaultSubjectName || newEvent.title,
                          amount:
                            student.defaultPrice?.toString() || newEvent.amount,
                          duration:
                            student.defaultDuration?.toString() ||
                            newEvent.duration,
                          color: matchedSubject?.color || newEvent.color,
                        });
                      } else {
                        setNewEvent({ ...newEvent, studentId: studentId });
                      }
                    }}
                    required
                    className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954] appearance-none"
                  >
                    <option value="">Выберите ученика</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.studentAlias || student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Предмет
                </label>
                <div className="relative">
                  <BookOpen
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  {!isCustomSubject && subjects.length > 0 ? (
                    <select
                      value={
                        newEvent.subjectId || (isCustomSubject ? "custom" : "")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setIsCustomSubject(true);
                          setNewEvent({
                            ...newEvent,
                            subjectId: "",
                            subject: "",
                            title: "",
                          });
                        } else {
                          const selectedSubject = subjects.find(
                            (s) => s.id.toString() === val,
                          );
                          setNewEvent({
                            ...newEvent,
                            subjectId: val,
                            subject: selectedSubject?.name || "",
                            title: selectedSubject?.name || "",
                            color: selectedSubject?.color || newEvent.color,
                          });
                        }
                      }}
                      required
                      className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954] appearance-none"
                    >
                      <option value="">Выберите предмет</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="custom">Другое...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newEvent.subject}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            subject: e.target.value,
                            title: e.target.value,
                            subjectId: "",
                          })
                        }
                        required
                        className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                        placeholder="Математика"
                        autoFocus={isCustomSubject}
                      />
                      {subjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomSubject(false);
                            setNewEvent({
                              ...newEvent,
                              subject: "",
                              subjectId: "",
                            });
                          }}
                          className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Время
                  </label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                      required
                      className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Стоимость занятия
                  </label>
                  <input
                    type="number"
                    value={newEvent.amount}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, amount: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder={`${currency} 0`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Длительность (мин)
                  </label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <input
                      type="number"
                      value={newEvent.duration}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, duration: e.target.value })
                      }
                      required
                      min="1"
                      className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              {!editingEvent && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Повторение
                  </label>
                  <div className="relative">
                    <select
                      value={newEvent.repeatType}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          repeatType: e.target.value as
                            | "once"
                            | "week"
                            | "month",
                        })
                      }
                      className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-[#1db954] appearance-none"
                    >
                      <option value="once">Один раз</option>
                      <option value="week">Еженедельно</option>
                      <option value="month">Ежемесячно</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Цвет
                </label>
                <div className="flex gap-2">
                  {["#1db954", "#2e77d0", "#af2896", "#e8115b", "#f59e0b"].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, color })}
                        className={`w-10 h-10 rounded-lg border-2 ${
                          newEvent.color === color
                            ? "border-foreground"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ),
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false);
                    setError("");
                    setEditingEvent(null);
                    setNewEvent({
                      title: "",
                      date: "",
                      time: "",
                      subject: "",
                      subjectId: "",
                      studentId: "",
                      color: "#1db954",
                      repeatType: "once",
                      amount: localStorage.getItem("last_lesson_price") || "",
                      duration: "60",
                    });
                  }}
                  className="flex-1 bg-muted rounded-lg py-3 text-foreground hover:bg-muted/80 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? editingEvent
                      ? "Обновление..."
                      : "Планирование..."
                    : editingEvent
                      ? "Обновить занятие"
                      : "Запланировать занятие"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Homework Dialog */}
      {showHWDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Задать домашнее задание</h2>
              <button
                onClick={() => setShowHWDialog(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
              <div className="text-muted-foreground">Занятие:</div>
              <div className="font-medium text-[#1db954]">
                {showHWDialog.subject} (
                {new Date(showHWDialog.date).toLocaleDateString("ru-RU")})
              </div>
              <div className="text-muted-foreground mt-1">Ученик:</div>
              <div className="font-medium">
                {showHWDialog.student?.studentAlias ||
                  showHWDialog.student?.name}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Заголовок задания
                </label>
                <input
                  type="text"
                  value={hwDetails.title}
                  onChange={(e) =>
                    setHwDetails({ ...hwDetails, title: e.target.value })
                  }
                  className="w-full bg-muted rounded-lg px-4 py-2 text-foreground outline-none focus:ring-1 focus:ring-[#1db954] text-sm"
                  placeholder="Домашнее задание"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Что нужно сделать
                </label>
                <textarea
                  value={hwDetails.description}
                  onChange={(e) =>
                    setHwDetails({ ...hwDetails, description: e.target.value })
                  }
                  className="w-full bg-muted rounded-lg px-4 py-2 text-foreground outline-none focus:ring-1 focus:ring-[#1db954] text-sm min-h-25 resize-none"
                  placeholder="Опишите детали задания..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api.createHomework({
                        title: hwDetails.title,
                        description: hwDetails.description,
                        subject: showHWDialog.subject,
                        studentId: showHWDialog.studentId,
                        lessonId: showHWDialog.id,
                        dueDate: 'next_lesson',
                        status: 'pending',
                      });
                      loadEvents();
                      loadTransactions();
                      loadHomework();
                    } catch (error: any) {
                      alert("Не удалось создать задание");
                    }
                  }}
                  className="flex-1 py-3 bg-[#1db954] rounded-lg text-white font-medium hover:bg-[#1ed760] transition-colors"
                >
                  Задать ДЗ
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.createHomework({
                        title: "Без домашнего задания",
                        description:
                          "Для этого занятия домашнее задание не требуется",
                        subject: showHWDialog.subject,
                        studentId: showHWDialog.studentId,
                        lessonId: showHWDialog.id,
                        dueDate: 'next_lesson',
                        status: "no_homework",
                      });
                      setShowHWDialog(null);
                      loadEvents();
                      loadTransactions();
                      loadHomework();
                    } catch (error) {
                      alert("Не удалось сохранить статус");
                    }
                  }}
                  className="flex-1 py-3 bg-muted rounded-lg text-foreground font-medium hover:bg-muted/80 transition-colors"
                >
                  Нет ДЗ
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Срок сдачи будет автоматически установлен на дату следующего
                занятия.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Удалить занятие</h3>
            <p className="text-muted-foreground mb-6">
              Как вы хотите удалить это занятие?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm, false)}
                className="w-full bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Удалить только это занятие
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm, true)}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Удалить все будущие повторения
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full text-muted-foreground py-2 hover:text-foreground transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Update Recurring Confirm Dialog */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Обновить занятие</h3>
            <p className="text-muted-foreground mb-6">
              Это повторяющееся занятие. Как вы хотите применить изменения?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => processUpdate(false)}
                className="w-full bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Только это занятие
              </button>
              <button
                onClick={() => processUpdate(true)}
                className="w-full bg-[#1db954] text-white py-3 rounded-lg font-medium hover:bg-[#1ed760] transition-colors"
              >
                Все будущие повторения
              </button>
              <button
                onClick={() => setShowUpdateConfirm(false)}
                className="w-full text-muted-foreground py-2 hover:text-foreground transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
