import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TasksProps {
  userType: 'tutor' | 'student';
}

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  completed?: boolean;
  student?: string;
  subject?: string;
}

export function Tasks({ userType }: TasksProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.request('/tasks');
      setTasks(data.map((task: any) => ({
        ...task,
        completed: task.status === 'completed',
        dueDate: task.dueDate || '',
      })));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e8115b';
      case 'medium': return '#ff9500';
      case 'low': return '#1db954';
      default: return '#b3b3b3';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#1db954] text-white'
                : 'bg-[#181818] text-gray-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors"
          >
            <div className="flex items-start gap-3">
              <button
                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  task.completed
                    ? 'bg-[#1db954] border-[#1db954]'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                {task.completed && <Check size={16} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`mb-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                  {task.title}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {task.dueDate && (
                    <>
                      <Clock size={14} />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: getPriorityColor(task.priority) }}
                title={`${task.priority} priority`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Button */}
      <button className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors">
        <Plus size={24} />
      </button>
    </div>
  );
}
