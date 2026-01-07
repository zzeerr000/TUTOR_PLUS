import React, { useState, useEffect } from 'react';
import { Plus, X, Check, User, Clock, Search } from 'lucide-react';
import { api } from '../services/api';

interface ConnectionsProps {
  userType: 'tutor' | 'student';
}

export function Connections({ userType }: ConnectionsProps) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, connected] = await Promise.all([
        api.getPendingRequests().catch(() => []),
        api.getConnections().catch(() => []),
      ]);
      setPendingRequests(pending);
      setConnections(connected);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.requestConnection(connectionCode.toUpperCase());
      setShowAddDialog(false);
      setConnectionCode('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to send connection request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await api.approveConnection(requestId);
      loadData();
    } catch (error: any) {
      console.error('Failed to approve connection:', error);
      alert(error.message || 'Failed to approve connection. You can only approve requests sent to you.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.rejectConnection(requestId);
      loadData();
    } catch (error: any) {
      console.error('Failed to reject connection:', error);
      alert(error.message || 'Failed to reject connection. You can only reject requests sent to you.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl mb-3">Pending Requests</h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => {
              const otherUser = userType === 'tutor' ? request.student : request.tutor;
              return (
                <div
                  key={request.id}
                  className="bg-[#181818] rounded-lg p-4 flex items-center justify-between hover:bg-[#282828] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium">
                        {otherUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{otherUser?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-400">
                        {userType === 'tutor' ? 'Student' : 'Tutor'} • {otherUser?.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock size={12} className="inline mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-4 py-2 bg-[#1db954] rounded-lg text-sm font-medium hover:bg-[#1ed760] transition-colors flex items-center gap-2"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-[#282828] rounded-lg text-sm font-medium hover:bg-[#333333] transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected Users */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl">
            {userType === 'tutor' ? 'Connected Students' : 'Connected Tutors'}
          </h2>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-[#1db954] rounded-lg text-sm font-medium hover:bg-[#1ed760] transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Connect
          </button>
        </div>
        <div className="space-y-2">
          {connections.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No {userType === 'tutor' ? 'students' : 'tutors'} connected yet
            </div>
          ) : (
            connections.map((connection) => {
              const otherUser = userType === 'tutor' ? connection.student : connection.tutor;
              return (
                <div
                  key={connection.id}
                  className="bg-[#181818] rounded-lg p-4 flex items-center gap-3 hover:bg-[#282828] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium">
                      {otherUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{otherUser?.name || 'Unknown User'}</div>
                    <div className="text-sm text-gray-400">{otherUser?.email}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Connected {new Date(connection.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Connection Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Connect with {userType === 'tutor' ? 'Student' : 'Tutor'}</h2>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setError('');
                  setConnectionCode('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestConnection} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Enter {userType === 'tutor' ? 'Student' : 'Tutor'} Code
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={connectionCode}
                    onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                    required
                    maxLength={6}
                    className="w-full bg-[#282828] rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#1db954] font-mono text-center text-lg tracking-wider"
                    placeholder="ABC123"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Ask the {userType === 'tutor' ? 'student' : 'tutor'} for their connection code
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
                    setConnectionCode('');
                  }}
                  className="flex-1 bg-[#282828] rounded-lg py-3 text-white hover:bg-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || connectionCode.length !== 6}
                  className="flex-1 bg-[#1db954] rounded-lg py-3 text-white font-medium hover:bg-[#1ed760] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

