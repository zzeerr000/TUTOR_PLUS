import React, { useEffect, useState } from 'react';
import { TrendingUp, Award, Target, Clock } from 'lucide-react';
import { api } from '../services/api';

export function Progress() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ overallProgress: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressData, progressStats] = await Promise.all([
        api.getProgress().catch(() => []),
        api.getProgressStats().catch(() => ({ overallProgress: 0, totalHours: 0 })),
      ]);

      const colors = ['#1db954', '#2e77d0', '#af2896'];
      setSubjects(progressData.map((p: any, idx: number) => ({
        name: p.subject,
        progress: Math.round(Number(p.progress)),
        grade: p.grade || 'N/A',
        hoursStudied: Math.round(Number(p.hoursStudied)),
        lessonsCompleted: p.lessonsCompleted || 0,
        color: colors[idx % colors.length],
      })));

      setStats(progressStats);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    { title: 'Perfect Attendance', description: '30 days streak', icon: Award, color: '#FFD700' },
    { title: 'Quick Learner', description: 'Completed 20 lessons', icon: TrendingUp, color: '#1db954' },
    { title: 'Homework Hero', description: '50 assignments done', icon: Target, color: '#2e77d0' },
  ];

  const weeklyActivity = [
    { day: 'Mon', hours: 3 },
    { day: 'Tue', hours: 2.5 },
    { day: 'Wed', hours: 4 },
    { day: 'Thu', hours: 2 },
    { day: 'Fri', hours: 3.5 },
    { day: 'Sat', hours: 1 },
    { day: 'Sun', hours: 0.5 },
  ];

  const maxHours = Math.max(...weeklyActivity.map(d => d.hours));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
          <TrendingUp size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.overallProgress}%</div>
          <div className="text-sm opacity-90">Overall Progress</div>
        </div>
        <div className="bg-gradient-to-br from-[#2e77d0] to-[#1f5296] rounded-lg p-4">
          <Clock size={24} className="mb-2" />
          <div className="text-2xl mb-1">{stats.totalHours}h</div>
          <div className="text-sm opacity-90">Total Study Time</div>
        </div>
      </div>

      {/* Subject Progress */}
      <div>
        <h2 className="text-xl mb-3">Subject Progress</h2>
        <div className="space-y-3">
          {subjects.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No progress data available</div>
          ) : (
            subjects.map((subject) => (
            <div key={subject.name} className="bg-[#181818] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="mb-1">{subject.name}</div>
                  <div className="text-sm text-gray-400">
                    Grade: <span style={{ color: subject.color }}>{subject.grade}</span>
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

              <div className="w-full bg-[#282828] rounded-full h-2 mb-3">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${subject.progress}%`,
                    backgroundColor: subject.color,
                  }}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{subject.hoursStudied}h studied</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={14} />
                  <span>{subject.lessonsCompleted} lessons</span>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Activity */}
      <div>
        <h2 className="text-xl mb-3">Weekly Activity</h2>
        <div className="bg-[#181818] rounded-lg p-4">
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {weeklyActivity.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#282828] rounded-t-lg relative" style={{ height: '100%' }}>
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
              <div key={day.day} className="flex-1 text-center text-xs text-gray-400">
                {day.day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl mb-3">Achievements</h2>
        <div className="grid grid-cols-1 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.title}
                className="bg-[#181818] rounded-lg p-4 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  <Icon size={24} style={{ color: achievement.color }} />
                </div>
                <div>
                  <div className="mb-1">{achievement.title}</div>
                  <div className="text-sm text-gray-400">{achievement.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Feedback */}
      <div>
        <h2 className="text-xl mb-3">Recent Feedback</h2>
        <div className="space-y-2">
          {[
            { tutor: 'Dr. Smith', subject: 'Mathematics', feedback: 'Excellent work on quadratic equations!', date: 'Dec 28' },
            { tutor: 'Prof. Johnson', subject: 'Physics', feedback: 'Good progress, keep practicing', date: 'Dec 26' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#181818] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span>{item.tutor}</span>
                <span className="text-xs text-gray-400">{item.date}</span>
              </div>
              <div className="text-sm text-gray-400 mb-1">{item.subject}</div>
              <div className="text-sm">{item.feedback}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
