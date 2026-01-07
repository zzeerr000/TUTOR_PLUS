import React, { useEffect, useState } from 'react';
import { Calendar, CheckSquare, DollarSign, Users, TrendingUp, Clock, FolderOpen, FileText } from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  userType: 'tutor' | 'student';
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

  useEffect(() => {
    loadData();
  }, [userType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasks, events, students, financeStats, progress] = await Promise.all([
        api.getTasks().catch(() => []),
        api.getEvents().catch(() => []),
        userType === 'tutor' ? api.getStudents().catch(() => []) : Promise.resolve([]),
        userType === 'tutor' ? api.getFinanceStats().catch(() => ({ thisMonth: 0, pendingCount: 0 })) : Promise.resolve({}),
        api.getProgress().catch(() => []),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter((e: any) => e.date === today);
      const thisWeekEvents = events.filter((e: any) => {
        const eventDate = new Date(e.date);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return eventDate >= weekStart;
      });

      const pendingTasksCount = tasks.filter((t: any) => t.status !== 'completed').length;
      const activeTasksCount = tasks.filter((t: any) => t.status !== 'completed').length;

      if (userType === 'tutor') {
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
        setTodaySchedule(todayEvents.slice(0, 4).map((e: any) => ({
          time: e.time,
          student: e.student?.name || 'Student',
          subject: e.subject || 'Lesson',
          color: e.color || '#1db954',
        })));
      } else {
        const progressStats = await api.getProgressStats().catch(() => ({ overallProgress: 0, totalHours: 0 }));
        setStats({
          students: 0,
          lessonsToday: 0,
          thisMonth: 0,
          pendingTasks: 0,
          activeTasks: activeTasksCount,
          lessonsThisWeek: thisWeekEvents.length,
          avgProgress: progressStats.overallProgress || 0,
          studyTime: progressStats.totalHours || 0,
        });
        setUpcomingLessons(events.slice(0, 3).map((e: any) => ({
          day: new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' }),
          time: e.time,
          subject: e.subject || 'Lesson',
          tutor: e.tutor?.name || 'Tutor',
          color: e.color || '#1db954',
        })));
        setRecentProgress(progress.slice(0, 3).map((p: any) => ({
          subject: p.subject,
          progress: Math.round(Number(p.progress)),
          color: '#1db954',
        })));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (userType === 'tutor') {
    return (
      <div className="space-y-6 pb-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
            <Users size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.students}</div>
            <div className="text-sm opacity-90">Active Students</div>
          </div>
          <div className="bg-gradient-to-br from-[#1ed760] to-[#1db954] rounded-lg p-4">
            <Calendar size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.lessonsToday}</div>
            <div className="text-sm opacity-90">Lessons Today</div>
          </div>
          <div className="bg-gradient-to-br from-[#2e77d0] to-[#1f5296] rounded-lg p-4">
            <DollarSign size={24} className="mb-2" />
            <div className="text-2xl mb-1">${stats.thisMonth.toLocaleString()}</div>
            <div className="text-sm opacity-90">This Month</div>
          </div>
          <div className="bg-gradient-to-br from-[#af2896] to-[#7c1f66] rounded-lg p-4">
            <CheckSquare size={24} className="mb-2" />
            <div className="text-2xl mb-1">{stats.pendingTasks}</div>
            <div className="text-sm opacity-90">Pending Tasks</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('materials')}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
            >
              <FolderOpen size={24} className="mb-2 text-[#1db954]" />
              <div className="mb-1">Materials</div>
              <div className="text-sm text-gray-400">Upload & manage files</div>
            </button>
            <button
              onClick={() => onNavigate('finance')}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
            >
              <DollarSign size={24} className="mb-2 text-[#2e77d0]" />
              <div className="mb-1">Finance</div>
              <div className="text-sm text-gray-400">Track payments</div>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
            >
              <CheckSquare size={24} className="mb-2 text-[#af2896]" />
              <div className="mb-1">Tasks</div>
              <div className="text-sm text-gray-400">Manage assignments</div>
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
            >
              <Calendar size={24} className="mb-2 text-[#e8115b]" />
              <div className="mb-1">Schedule</div>
              <div className="text-sm text-gray-400">View all lessons</div>
            </button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <h2 className="text-xl mb-3">Today's Schedule</h2>
          <div className="space-y-2">
            {todaySchedule.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No lessons scheduled for today</div>
            ) : (
              todaySchedule.map((lesson, idx) => (
              <div
                key={idx}
                className="bg-[#181818] rounded-lg p-4 flex items-center gap-3 hover:bg-[#282828] transition-colors"
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: lesson.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-400">{lesson.time}</span>
                  </div>
                  <div>{lesson.student}</div>
                  <div className="text-sm text-gray-400">{lesson.subject}</div>
                </div>
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
        <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
          <CheckSquare size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.activeTasks}</div>
          <div className="text-sm opacity-90">Active Tasks</div>
        </div>
        <div className="bg-gradient-to-br from-[#2e77d0] to-[#1f5296] rounded-lg p-4">
          <Calendar size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.lessonsThisWeek}</div>
          <div className="text-sm opacity-90">Lessons This Week</div>
        </div>
        <div className="bg-gradient-to-br from-[#af2896] to-[#7c1f66] rounded-lg p-4">
          <TrendingUp size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.avgProgress}%</div>
          <div className="text-sm opacity-90">Avg. Progress</div>
        </div>
        <div className="bg-gradient-to-br from-[#e8115b] to-[#b0084a] rounded-lg p-4">
          <Clock size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.studyTime}h</div>
          <div className="text-sm opacity-90">Study Time</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('materials')}
            className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
          >
            <FolderOpen size={24} className="mb-2 text-[#1db954]" />
            <div className="mb-1">Materials</div>
            <div className="text-sm text-gray-400">View study materials</div>
          </button>
          <button
            onClick={() => onNavigate('tasks')}
            className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors text-left"
          >
            <CheckSquare size={24} className="mb-2 text-[#2e77d0]" />
            <div className="mb-1">Tasks</div>
            <div className="text-sm text-gray-400">View assignments</div>
          </button>
        </div>
      </div>

      {/* Upcoming Lessons */}
      <div>
        <h2 className="text-xl mb-3">Upcoming Lessons</h2>
        <div className="space-y-2">
          {upcomingLessons.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No upcoming lessons</div>
          ) : (
            upcomingLessons.map((lesson, idx) => (
            <div
              key={idx}
              className="bg-[#181818] rounded-lg p-4 flex items-center gap-3 hover:bg-[#282828] transition-colors"
            >
              <div
                className="w-1 h-12 rounded-full"
                style={{ backgroundColor: lesson.color }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400">{lesson.day}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-400">{lesson.time}</span>
                </div>
                <div>{lesson.subject}</div>
                <div className="text-sm text-gray-400">{lesson.tutor}</div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Progress */}
      <div>
        <h2 className="text-xl mb-3">Recent Progress</h2>
        <div className="space-y-3">
          {recentProgress.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No progress data available</div>
          ) : (
            recentProgress.map((item, idx) => (
            <div key={idx} className="bg-[#181818] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span>{item.subject}</span>
                <span className="text-sm text-gray-400">{item.progress}%</span>
              </div>
              <div className="w-full bg-[#282828] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${item.progress}%`, backgroundColor: item.color }}
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