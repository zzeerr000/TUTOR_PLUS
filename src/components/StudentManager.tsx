import React, { useEffect, useState } from 'react';
import { Search, Plus, TrendingUp, Clock, CheckCircle, Mail, User, Lock, X } from 'lucide-react';
import { api } from '../services/api';

export function StudentManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, lessonsToday: 0, avgProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, events, progressData] = await Promise.all([
        api.getStudents().catch(() => []),
        api.getEvents().catch(() => []),
        api.getProgress().catch(() => []),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter((e: any) => e.date === today);

      const studentsWithProgress = studentsData.map((student: any) => {
        const studentProgress = progressData.find((p: any) => p.studentId === student.id);
        const nextEvent = events.find((e: any) => e.studentId === student.id && new Date(e.date) >= new Date());
        const colors = ['#1db954', '#2e77d0', '#af2896', '#e8115b'];
        const color = colors[student.id % colors.length];
        
        return {
          id: student.id,
          name: student.name,
          subject: studentProgress?.subject || 'General',
          progress: Math.round(Number(studentProgress?.progress || 0)),
          hoursCompleted: Math.round(Number(studentProgress?.hoursStudied || 0)),
          nextLesson: nextEvent ? `${new Date(nextEvent.date).toLocaleDateString('en-US', { weekday: 'short' })}, ${nextEvent.time}` : 'No upcoming lesson',
          avatar: student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          color,
          status: 'active',
        };
      });

      setStudents(studentsWithProgress);
      const avgProgress = progressData.length > 0
        ? Math.round(progressData.reduce((sum: number, p: any) => sum + Number(p.progress), 0) / progressData.length)
        : 0;
      setStats({
        total: studentsData.length,
        lessonsToday: todayEvents.length,
        avgProgress,
      });
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.createStudent({
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
      });
      setShowAddDialog(false);
      setNewStudent({ name: '', email: '', password: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search students..."
          className="w-full bg-[#181818] rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#1db954] mb-1">{stats.total}</div>
          <div className="text-xs text-gray-400">Total Students</div>
        </div>
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#2e77d0] mb-1">{stats.lessonsToday}</div>
          <div className="text-xs text-gray-400">Lessons Today</div>
        </div>
        <div className="bg-[#181818] rounded-lg p-3 text-center">
          <div className="text-2xl text-[#af2896] mb-1">{stats.avgProgress}%</div>
          <div className="text-xs text-gray-400">Avg. Progress</div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No students found</div>
        ) : (
          students.map((student) => (
          <div
            key={student.id}
            className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
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
                  <span>{student.name}</span>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${student.color}20`,
                      color: student.color,
                    }}
                  >
                    {student.subject}
                  </span>
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
                <span className="text-gray-400">Progress</span>
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
                <span>{student.hoursCompleted}h completed</span>
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
              <h2 className="text-xl font-semibold">Add New Student</h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError('');
                  setNewStudent({ name: '', email: '', password: '' });
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    required
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    required
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
                    placeholder="••••••••"
                  />
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
                    setNewStudent({ name: '', email: '', password: '' });
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
                  {submitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
