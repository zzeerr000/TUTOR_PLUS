import React, { useState, useEffect } from "react";
import {
  FileText,
  Video,
  Image,
  Download,
  Eye,
  Upload,
  X,
  File,
} from "lucide-react";
import { api } from "../services/api";

interface FileManagerProps {
  userType: "tutor" | "student";
}

export function FileManager({ userType }: FileManagerProps) {
  const [filter, setFilter] = useState<
    "all" | "documents" | "videos" | "images"
  >("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    subject: "Mathematics",
    assignedToId: "",
  });
  const [storageStats, setStorageStats] = useState({
    used: 0,
    total: 5 * 1024 * 1024 * 1024,
    usedFormatted: "0 B",
    totalFormatted: "5 GB",
  });

  useEffect(() => {
    loadFiles();
    loadStorageStats();
    if (userType === "tutor") {
      loadStudents();
    }
  }, [userType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await api.getFiles();
      setFiles(
        data.map((f: any) => ({
          ...f,
          icon:
            f.type === "document"
              ? FileText
              : f.type === "video"
              ? Video
              : Image,
          date: new Date(f.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }))
      );
      loadStorageStats();
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadData((prev) => ({ ...prev, name: file.name }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", uploadData.name);
      formData.append("subject", uploadData.subject);
      if (uploadData.assignedToId) {
        formData.append("assignedToId", uploadData.assignedToId);
      }

      await api.uploadFile(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ name: "", subject: "Mathematics", assignedToId: "" });
      await loadFiles();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await api.downloadFile(file.id, file.name);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await api.deleteFile(id);
        await loadFiles();
      } catch (error) {
        console.error("Delete failed:", error);
      }
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

  const loadStorageStats = async () => {
    try {
      const stats = await api.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    }
  };

  const filteredFiles = files.filter((file) => {
    if (filter === "documents") return file.type === "document";
    if (filter === "videos") return file.type === "video";
    if (filter === "images") return file.type === "image";
    return true;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Mathematics":
        return "#1db954";
      case "Physics":
        return "#2e77d0";
      case "Chemistry":
        return "#af2896";
      default:
        return "#b3b3b3";
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
          { id: "all", label: "All Files" },
          { id: "documents", label: "Documents" },
          { id: "videos", label: "Videos" },
          { id: "images", label: "Images" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-[#1db954] text-white"
                : "bg-[#181818] text-gray-400 hover:text-white"
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
          <span>
            {storageStats.usedFormatted} / {storageStats.totalFormatted}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(
                (storageStats.used / storageStats.total) * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No files available
          </div>
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
                    <button
                      onClick={() => handleDownload(file)}
                      className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-[#333333]"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    {userType === "tutor" && (
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {file.assignedTo && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <span>Assigned to:</span>
                    <span className="text-[#1db954]">
                      {file.assignedTo.name}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Button (for tutors) */}
      {userType === "tutor" && (
        <>
          <button
            onClick={() => {
              setShowUploadModal(true);
              setSelectedFile(null);
              setUploadData({
                name: "",
                subject: "Mathematics",
                assignedToId: "",
              });
            }}
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
                  <div
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      selectedFile
                        ? "border-[#1db954] bg-[#1db954]/5"
                        : "border-gray-700 hover:border-[#1db954]"
                    }`}
                  >
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <File
                      size={48}
                      className={`mx-auto mb-4 ${
                        selectedFile ? "text-[#1db954]" : "text-gray-400"
                      }`}
                    />
                    {selectedFile ? (
                      <div>
                        <p className="text-[#1db954] font-medium mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-400">
                          PDF, DOC, MP4, PNG, JPG (max. 100MB)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      File Display Name
                    </label>
                    <input
                      type="text"
                      value={uploadData.name}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, name: e.target.value })
                      }
                      placeholder="Enter file name"
                      className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Subject
                    </label>
                    <select
                      value={uploadData.subject}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          subject: e.target.value,
                        })
                      }
                      className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
                    >
                      <option>Mathematics</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Assign to Students
                    </label>
                    <select
                      value={uploadData.assignedToId}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          assignedToId: e.target.value,
                        })
                      }
                      className="w-full bg-[#282828] rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
                    >
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
                      disabled={uploading}
                      className="flex-1 bg-[#282828] rounded-lg py-3 hover:bg-[#333333] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="flex-1 bg-[#1db954] rounded-lg py-3 hover:bg-[#1ed760] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
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
