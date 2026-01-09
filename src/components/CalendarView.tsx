import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, BookOpen, Edit, Trash2, Calendar } from 'lucide-react';
import { api } from '../services/api';

interface CalendarViewProps {
  userType?: 'tutor' | 'student';
}

type CalendarViewType = 'month' | 'week' | 'day';

export function CalendarView({ userType }: CalendarViewProps) {
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date()); // Current date
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    subject: '',
    studentId: '',
    color: '#1db954',
    repeatType: 'once' as 'once' | 'week' | 'month',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  useEffect(() => {
    loadEvents();
    if (userType === 'tutor') {
      loadStudents();
    }
  }, [userType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getEvents();
      const formattedEvents = data.map((e: any) => ({
        ...e,
        title: e.subject ? `${e.subject} - ${e.student?.name || e.tutor?.name || 'User'}` : e.title,
      }));
      setEvents(formattedEvents);
      
      // Update date details if modal is open
      if (showDateDetails && selectedDate) {
        const dayEvents = formattedEvents.filter((e: any) => e.date === selectedDate);
        setSelectedDateEvents(dayEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateRepeatDates = (startDate: string, repeatType: 'once' | 'week' | 'month'): string[] => {
    if (repeatType === 'once') {
      return [startDate];
    }

    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(start);

    if (repeatType === 'week') {
      // Generate dates for 1 year (52 weeks)
      end.setFullYear(end.getFullYear() + 1);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    } else if (repeatType === 'month') {
      // Generate dates for 1 year (12 months)
      end.setFullYear(end.getFullYear() + 1);
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const time12Hour = convertTo12Hour(newEvent.time);
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, {
          title: newEvent.title || newEvent.subject,
          date: newEvent.date,
          time: time12Hour,
          subject: newEvent.subject,
          studentId: parseInt(newEvent.studentId),
          color: newEvent.color,
        });
        setEditingEvent(null);
      } else {
        // Generate dates based on repeat type
        const dates = generateRepeatDates(newEvent.date, newEvent.repeatType);
        
        // Create events for all dates
        const eventPromises = dates.map(date => 
          api.createEvent({
            title: newEvent.title || newEvent.subject,
            date: date,
            time: time12Hour,
            subject: newEvent.subject,
            studentId: parseInt(newEvent.studentId),
            color: newEvent.color,
          })
        );

        await Promise.all(eventPromises);
      }
      setShowAddDialog(false);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        subject: '',
        studentId: '',
        color: '#1db954',
        repeatType: 'once',
      });
      loadEvents();
      if (showDateDetails) {
        const dayEvents = events.filter(e => e.date === selectedDate);
        setSelectedDateEvents(dayEvents);
      }
    } catch (err: any) {
      setError(err.message || (editingEvent ? 'Failed to update lesson' : 'Failed to create lesson'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await api.deleteEvent(eventId);
      // loadEvents() will automatically update the date details modal if it's open
      await loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete lesson. Please try again.');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  const getWeekDates = (date: Date): Date[] => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const getEventsForWeekDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = getEventsForDate(day);
    setSelectedDate(dateStr);
    setSelectedDateEvents(dayEvents);
    setShowDateDetails(true);
  };

  const handleDateClickFromStr = (dateStr: string) => {
    const dayEvents = events.filter(e => e.date === dateStr);
    setSelectedDate(dateStr);
    setSelectedDateEvents(dayEvents);
    setShowDateDetails(true);
  };

  const handleEditEvent = (event: any) => {
    // Convert 12-hour format to 24-hour format
    let time24 = event.time;
    if (event.time.includes('AM') || event.time.includes('PM')) {
      const [timePart, period] = event.time.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      time24 = `${String(hour24).padStart(2, '0')}:${minutes}`;
    }
    
    setEditingEvent({
      ...event,
      time: time24,
    });
    setShowAddDialog(true);
    setShowDateDetails(false);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    setError('');
    setSubmitting(true);

    try {
      const time12Hour = convertTo12Hour(newEvent.time);
      await api.updateEvent(editingEvent.id, {
        title: newEvent.title || newEvent.subject,
        date: newEvent.date,
        time: time12Hour,
        subject: newEvent.subject,
        studentId: parseInt(newEvent.studentId),
        color: newEvent.color,
      });
      setShowAddDialog(false);
      setEditingEvent(null);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        subject: '',
        studentId: '',
        color: '#1db954',
      });
      loadEvents();
      setShowDateDetails(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const weekDates = getWeekDates(currentDate);
  const weekStartDate = weekDates[0];
  const weekEndDate = weekDates[6];
  const weekRange = `${weekStartDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;

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

    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00');
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
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [timePart, period] = timeStr.split(' ');
          const [hours, minutes] = timePart.split(':');
          let hour24 = parseInt(hours);
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          return hour24 * 60 + parseInt(minutes);
        } else {
          const [hours, minutes] = timeStr.split(':');
          return parseInt(hours) * 60 + parseInt(minutes);
        }
      };
      
      return parseTime(a.time) - parseTime(b.time);
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* View Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-[#181818] rounded-lg p-1">
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'month' 
                ? 'bg-[#1db954] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'week' 
                ? 'bg-[#1db954] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewType('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'day' 
                ? 'bg-[#1db954] text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Day
          </button>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl">
            {viewType === 'month' ? monthName : viewType === 'week' ? weekRange : currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={viewType === 'month' ? prevMonth : prevWeek}
              className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center hover:bg-[#282828]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={viewType === 'month' ? nextMonth : nextWeek}
              className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center hover:bg-[#282828]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewType === 'month' && (
      <div className="bg-[#181818] rounded-lg p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs text-gray-400 py-2">
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
                    if (userType === 'tutor') {
                      handleDateClick(day);
                    } else {
                      const dayEvents = getEventsForDate(day);
                      if (dayEvents.length > 0) {
                        handleDateClick(day);
                      }
                    }
                  }}
                className={`aspect-square rounded-lg p-1 text-center relative ${
                  isToday ? 'bg-[#1db954]' : 'bg-[#282828] hover:bg-[#333333]'
                } transition-colors cursor-pointer`}
              >
                <div className={`text-sm ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  {day}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 justify-center mt-1">
                    {dayEvents.slice(0, 3).map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Week View */}
      {viewType === 'week' && (
        <div className="bg-[#181818] rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => {
              const dayEvents = getEventsForWeekDate(date);
              const today = new Date();
              const isToday = 
                date.getDate() === today.getDate() && 
                date.getMonth() === today.getMonth() && 
                date.getFullYear() === today.getFullYear();
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

              return (
                <div key={idx} className="border-r border-gray-800 last:border-r-0">
                  <div className={`text-center py-2 mb-2 ${isToday ? 'bg-[#1db954] rounded-lg' : ''}`}>
                    <div className={`text-xs text-gray-400 ${isToday ? 'text-white' : ''}`}>
                      {date.toLocaleDateString('default', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div 
                    className="space-y-1 min-h-[200px] cursor-pointer"
                    onClick={() => {
                      if (userType === 'tutor' || dayEvents.length > 0) {
                        handleDateClickFromStr(dateStr);
                      }
                    }}
                  >
                    {dayEvents.length === 0 && userType === 'tutor' && (
                      <div className="text-xs text-gray-500 text-center py-2">Click to add</div>
                    )}
                    {dayEvents.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateStr);
                          setSelectedDateEvents([event]);
                          setShowDateDetails(true);
                        }}
                        className="text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color || '#1db954', color: 'white' }}
                      >
                        <div className="font-medium truncate">{event.subject || event.title}</div>
                        <div className="text-xs opacity-90">{event.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewType === 'day' && (
        <div className="bg-[#181818] rounded-lg p-4">
          <div className="space-y-2">
            {Array.from({ length: 24 }).map((_, hour) => {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              
              // Filter events for this hour (check if time starts with hour)
              const hourEvents = dayEvents.filter(e => {
                const timeStr = e.time;
                // Handle both 12-hour and 24-hour formats
                if (timeStr.includes('AM') || timeStr.includes('PM')) {
                  const [timePart, period] = timeStr.split(' ');
                  const [hours] = timePart.split(':');
                  let hour24 = parseInt(hours);
                  if (period === 'PM' && hour24 !== 12) {
                    hour24 += 12;
                  } else if (period === 'AM' && hour24 === 12) {
                    hour24 = 0;
                  }
                  return hour24 === hour;
                } else {
                  return parseInt(timeStr.split(':')[0]) === hour;
                }
              });

              return (
                <div 
                  key={hour} 
                  className="flex border-b border-gray-800 pb-2 min-h-[60px]"
                  onClick={() => {
                    if (userType === 'tutor') {
                      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
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
                  <div className="w-20 text-sm text-gray-400">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 space-y-1">
                    {hourEvents.length === 0 && userType === 'tutor' && (
                      <div className="text-xs text-gray-500 py-2">Click to add event</div>
                    )}
                    {hourEvents.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateStr);
                          setSelectedDateEvents([event]);
                          setShowDateDetails(true);
                        }}
                        className="text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color || '#1db954', color: 'white' }}
                      >
                        <div className="font-medium">{event.subject || event.title}</div>
                        <div className="text-xs opacity-90">{event.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h3 className="text-lg mb-3">Upcoming Events (This Week)</h3>
        <div className="space-y-2">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading events...</div>
          ) : (() => {
            const weekEvents = getCurrentWeekEvents();
            return weekEvents.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No events scheduled for this week</div>
          ) : (
              weekEvents.map((event) => (
            <div
                  key={event.id}
              className="bg-[#181818] rounded-lg p-4 flex items-center gap-3 hover:bg-[#282828] transition-colors"
            >
              <div
                className="w-1 h-12 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">
                  {new Date(event.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })} • {event.time}
                </div>
                <div>{event.title}</div>
                  </div>
                  {userType === 'tutor' && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))
            );
          })()}
        </div>
      </div>

      {/* Date Details Modal */}
      {showDateDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Lessons for {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              </div>
              <div className="flex gap-2">
                {userType === 'tutor' && (
                  <button
                    onClick={() => {
                      setNewEvent({ ...newEvent, date: selectedDate || '' });
                      setEditingEvent(null);
                      setShowAddDialog(true);
                      setShowDateDetails(false);
                    }}
                    className="p-2 bg-[#1db954] rounded-lg hover:bg-[#1ed760] transition-colors"
                    title="Add new lesson"
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
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No lessons scheduled for this date
                  {userType === 'tutor' && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setNewEvent({ ...newEvent, date: selectedDate || '' });
                          setEditingEvent(null);
                          setShowAddDialog(true);
                          setShowDateDetails(false);
                        }}
                        className="text-[#1db954] hover:underline"
                      >
                        Schedule a lesson
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-[#282828] rounded-lg p-4 border-l-4"
                    style={{ borderLeftColor: event.color || '#1db954' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium mb-1">{event.subject || event.title}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <Clock size={14} />
                          <span>{event.time}</span>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                          <User size={14} />
                          <span>{userType === 'tutor' ? event.student?.name : event.tutor?.name}</span>
                        </div>
                        {event.paymentPending && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                              Payment Pending
                            </span>
                            {userType === 'tutor' && event.transactionId && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.confirmPayment(event.transactionId);
                                    loadEvents();
                                    const dayEvents = events.filter(e => e.date === selectedDate);
                                    setSelectedDateEvents(dayEvents);
                                  } catch (error: any) {
                                    alert(error.message || 'Failed to confirm payment');
                                  }
                                }}
                                className="text-xs bg-[#1db954] text-white px-2 py-1 rounded hover:bg-[#1ed760] transition-colors"
                              >
                                Confirm Payment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {userType === 'tutor' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleEditEvent(event);
                              setShowDateDetails(false);
                            }}
                            className="p-2 bg-[#282828] rounded-lg hover:bg-[#333333] transition-colors"
                            title="Edit lesson"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 bg-[#282828] rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Delete lesson"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
        </div>
      )}

      {/* Add Event Button - Only for tutors */}
      {userType === 'tutor' && (
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
      {showAddDialog && userType === 'tutor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Schedule New Lesson</h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError('');
                  setNewEvent({
                    title: '',
                    date: '',
                    time: '',
                    subject: '',
                    studentId: '',
                    color: '#1db954',
                  });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Student</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={newEvent.studentId}
                    onChange={(e) => setNewEvent({ ...newEvent, studentId: e.target.value })}
                    required
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954] appearance-none"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={newEvent.subject}
                    onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value, title: e.target.value })}
                    required
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="Mathematics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      required
                      className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>
                </div>
              </div>

              {!editingEvent && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Repeat</label>
                  <div className="relative">
                    <select
                      value={newEvent.repeatType}
                      onChange={(e) => setNewEvent({ ...newEvent, repeatType: e.target.value as 'once' | 'week' | 'month' })}
                      className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954] appearance-none"
                    >
                      <option value="once">Once</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Color</label>
                <div className="flex gap-2">
                  {['#1db954', '#2e77d0', '#af2896', '#e8115b', '#f59e0b'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-10 h-10 rounded-lg border-2 ${
                        newEvent.color === color ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                    setError('');
                    setEditingEvent(null);
                    setNewEvent({
                      title: '',
                      date: '',
                      time: '',
                      subject: '',
                      studentId: '',
                      color: '#1db954',
                      repeatType: 'once',
                    });
                  }}
                  className="flex-1 bg-[#282828] rounded-lg py-3 text-white hover:bg-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingEvent ? 'Updating...' : 'Scheduling...') : (editingEvent ? 'Update Lesson' : 'Schedule Lesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
