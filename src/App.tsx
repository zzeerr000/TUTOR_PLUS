import React, { useState, useEffect } from 'react';
import { Home, Calendar, FolderOpen, MessageCircle, DollarSign, Users, CheckSquare, TrendingUp, LogOut, Copy, Check, Settings as SettingsIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Tasks } from './components/Tasks';
import { CalendarView } from './components/CalendarView';
import { FileManager } from './components/FileManager';
import { Messenger } from './components/Messenger';
import { Finance } from './components/Finance';
import { StudentManager } from './components/StudentManager';
import { Progress } from './components/Progress';
import { Auth } from './components/Auth';
import { Connections } from './components/Connections';
import { Settings } from './components/Settings';
import { api } from './services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'tutor' | 'student';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userCode, setUserCode] = useState<string>('');
  const [showCodeMenu, setShowCodeMenu] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserCode();
    }
  }, [user]);

  const loadUserCode = async () => {
    try {
      const data = await api.getCode();
      setUserCode(data.code);
    } catch (error) {
      console.error('Failed to load user code:', error);
    }
  };

  const copyCode = async () => {
    if (userCode) {
      await navigator.clipboard.writeText(userCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleNameUpdate = (newName: string) => {
    if (user) {
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const handleAccountDelete = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const userType = user.role;

  const tutorTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'connections', label: 'Connect', icon: Users },
    { id: 'messenger', label: 'Chat', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const studentTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'connections', label: 'Connect', icon: Users },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'messenger', label: 'Chat', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const tabs = userType === 'tutor' ? tutorTabs : studentTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userType={userType} onNavigate={setActiveTab} />;
      case 'tasks':
        return <Tasks userType={userType} />;
      case 'calendar':
        return <CalendarView userType={userType} />;
      case 'students':
        return <StudentManager />;
      case 'connections':
        return <Connections userType={userType} />;
      case 'messenger':
        return <Messenger userType={userType} />;
      case 'finance':
        return <Finance userType={user?.role} />;
      case 'materials':
        return <FileManager userType={userType} />;
      case 'progress':
        return <Progress />;
      case 'settings':
        return <Settings user={user} onNameUpdate={handleNameUpdate} onAccountDelete={handleAccountDelete} />;
      default:
        return <Dashboard userType={userType} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-[#121212] z-10 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl">TutorHub</h1>
            <p className="text-xs text-gray-400 mt-1">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* User Code Display */}
            <div className="relative">
              <button
                onClick={() => setShowCodeMenu(!showCodeMenu)}
                className="px-3 py-1.5 bg-[#282828] hover:bg-[#333333] rounded-full text-sm flex items-center gap-2 transition-colors"
              >
                <span className="text-[#1db954] font-mono">{userCode || '...'}</span>
                <Copy size={14} />
              </button>
              {showCodeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowCodeMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-[#181818] border border-gray-800 rounded-lg p-4 min-w-[200px] shadow-lg z-20">
                    <div className="text-xs text-gray-400 mb-2">Your Connection Code</div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-mono font-bold text-[#1db954]">{userCode || '...'}</span>
                      <button
                        onClick={copyCode}
                        className="p-1.5 bg-[#282828] hover:bg-[#333333] rounded transition-colors"
                      >
                        {codeCopied ? <Check size={14} className="text-[#1db954]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Share this code to connect with {userType === 'tutor' ? 'students' : 'tutors'}
                    </div>
                  </div>
                </>
              )}
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-[#282828] hover:bg-[#333333] rounded-full text-sm flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          {userType === 'tutor' ? 'Manage your students & lessons' : 'Track your learning journey'}
        </p>
      </div>

      {/* Content */}
      <div className="px-4">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-gray-800">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 h-full group"
              >
                <Icon
                  size={24}
                  className={`mb-1 ${
                    isActive ? 'text-[#1db954]' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? 'text-[#1db954]' : 'text-gray-400 group-hover:text-white'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}