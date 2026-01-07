import React, { useState, useEffect } from 'react';
import { FileText, Video, Image, Download, Eye, Upload, X, File } from 'lucide-react';
import { api } from '../services/api';

interface FileManagerProps {
  userType: 'tutor' | 'student';
}

export function FileManager({ userType }: FileManagerProps) {
  const [filter, setFilter] = useState<'all' | 'documents' | 'videos' | 'images'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({ used: 0, total: 5 * 1024 * 1024 * 1024, usedFormatted: '0 B', totalFormatted: '5 GB' });

  useEffect(() => {
    loadFiles();
    loadStorageStats();
    if (userType === 'tutor') {
      loadStudents();
    }
  }, [userType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await api.getFiles();
      setFiles(data.map((f: any) => ({
        ...f,
        icon: f.type === 'document' ? FileText : f.type === 'video' ? Video : Image,
        date: new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })));
      loadStorageStats(); // Reload storage stats after loading files
    } catch (error) {
      console.error('Failed to load files:', error);
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

  const loadStorageStats = async () => {
    try {
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'documents') return file.type === 'document';
    if (filter === 'videos') return file.type === 'video';
    if (filter === 'images') return file.type === 'image';
    return true;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Mathematics': return '#1db954';
      case 'Physics': return '#2e77d0';
      case 'Chemistry': return '#af2896';
      default: return '#b3b3b3';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Files' },
          { id: 'documents', label: 'Documents' },
          { id: 'videos', label: 'Videos' },
          { id: 'images', label: 'Images' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-[#1db954] text-white'
                : 'bg-[#181818] text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Storage Info */}
      <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span>Storage Used</span>
          <span>{storageStats.usedFormatted} / {storageStats.totalFormatted}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all" 
            style={{ width: `${Math.min((storageStats.used / storageStats.total) * 100, 100)}%` }} 
          />
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No files available</div>
        ) : (
          filteredFiles.map((file) => {
            const Icon = file.icon;
            return (
            <div
              key={file.id}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-[#1db954]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 truncate">{file.name}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                    <span>•</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: `${getSubjectColor(file.subject)}20`,
                        color: getSubjectColor(file.subject),
                      }}
                    >
                      {file.subject}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#333333]">
                    <Eye size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#333333]">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Upload Button (for tutors) */}
      {userType === 'tutor' && (
        <>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors"
          >
            <Upload size={24} />
          </button>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-[#181818] rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl">Upload Material</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#333333]"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-[#1db954] transition-colors cursor-pointer">
                    <File size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-400">PDF, DOC, MP4, PNG, JPG (max. 100MB)</p>
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">File Name</label>
                    <input
                      type="text"
                      placeholder="Enter file name"
                      className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Subject</label>
                    <select className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]">
                      <option>Mathematics</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Assign to Students</label>
                    <select className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]">
                      <option value="">All Students</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 bg-[#282828] rounded-lg py-3 hover:bg-[#333333] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 bg-[#1db954] rounded-lg py-3 hover:bg-[#1ed760] transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}