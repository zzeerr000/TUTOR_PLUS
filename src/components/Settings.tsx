import React, { useState } from 'react';
import { User, Trash2, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface SettingsProps {
  user: {
    id: number;
    email: string;
    name: string;
    role: 'tutor' | 'student';
  };
  onNameUpdate: (newName: string) => void;
  onAccountDelete: () => void;
}

export function Settings({ user, onNameUpdate, onAccountDelete }: SettingsProps) {
  const [name, setName] = useState(user.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      setError('Name cannot be empty');
      return;
    }
    if (name === user.name) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.updateName(name.trim());
      onNameUpdate(name.trim());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setError('');
    setDeleteLoading(true);

    try {
      await api.deleteAccount();
      onAccountDelete();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Update Name Section */}
      <div className="bg-[#181818] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-[#1db954]" size={24} />
          <h2 className="text-xl font-semibold">Update Profile</h2>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954]"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-[#282828] rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Role</label>
            <input
              type="text"
              value={user.role === 'tutor' ? 'Tutor' : 'Student'}
              disabled
              className="w-full bg-[#282828] rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />
          </div>

          {error && !showDeleteConfirm && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || name.trim() === '' || name === user.name}
            className="w-full bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Delete Account Section */}
      <div className="bg-[#181818] rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold text-red-500">Delete Account</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-2">Warning: This action cannot be undone</p>
                <p className="text-gray-400">
                  Deleting your account will permanently remove all your data, including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  <li>All your connections</li>
                  <li>All scheduled lessons</li>
                  <li>All tasks and progress</li>
                  <li>All messages and files</li>
                </ul>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500/20 border border-red-500 rounded-lg py-3 text-red-500 font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-[#282828] rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  placeholder="DELETE"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setError('');
                  }}
                  className="flex-1 bg-[#282828] rounded-lg py-3 text-white hover:bg-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-500 rounded-lg py-3 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

