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
  Folder,
  ChevronRight,
  Plus,
  ArrowLeft,
  MoreVertical,
  Move,
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
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<{
    fileId: number;
    name: string;
  } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: number | null; name: string }[]
  >([{ id: null, name: "Материалы" }]);
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
  }, [userType, currentFolderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await api.getFiles(currentFolderId);
      setFiles(
        data.files.map((f: any) => ({
          ...f,
          icon:
            f.type === "document"
              ? FileText
              : f.type === "video"
                ? Video
                : Image,
          date: new Date(f.createdAt).toLocaleDateString("ru-RU", {
            month: "short",
            day: "numeric",
          }),
        })),
      );
      setFolders(data.folders);
      loadStorageStats();
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName, currentFolderId);
      setNewFolderName("");
      setShowFolderModal(false);
      loadFiles();
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (
      window.confirm(
        "Вы уверены, что хотите удалить эту папку и все её содержимое?",
      )
    ) {
      try {
        await api.deleteFolder(id);
        loadFiles();
      } catch (error) {
        console.error("Failed to delete folder:", error);
      }
    }
  };

  const handleNavigate = (folder: { id: number | null; name: string }) => {
    setCurrentFolderId(folder.id);
    const index = breadcrumbs.findIndex((b) => b.id === folder.id);
    if (index !== -1) {
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    } else {
      setBreadcrumbs([...breadcrumbs, folder]);
    }
  };

  const handleMoveFile = async (folderId: number | null) => {
    if (!showMoveModal) return;
    try {
      await api.moveFile(showMoveModal.fileId, folderId);
      setShowMoveModal(null);
      loadFiles();
    } catch (error) {
      console.error("Failed to move file:", error);
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
      if (currentFolderId) {
        formData.append("folderId", currentFolderId.toString());
      }

      await api.uploadFile(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ name: "", subject: "Математика", assignedToId: "" });
      await loadFiles();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      await api.downloadFile(file.id, file.name);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Не удалось скачать файл");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот файл?")) {
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
      case "Математика":
        return "#1db954";
      case "Physics":
      case "Физика":
        return "#2e77d0";
      case "Chemistry":
      case "Химия":
        return "#af2896";
      default:
        return "#b3b3b3";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка файлов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 overflow-x-auto text-sm no-scrollbar py-1">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}
            <button
              onClick={() => handleNavigate(crumb)}
              className={`whitespace-nowrap transition-colors ${
                index === breadcrumbs.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Action Buttons (for tutors) */}
      {userType === "tutor" && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex-1 bg-card border border-border rounded-lg py-2.5 flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors text-sm text-foreground"
          >
            <Plus size={18} className="text-[#1db954]" />
            Новая папка
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "Все файлы" },
          { id: "documents", label: "Документы" },
          { id: "videos", label: "Видео" },
          { id: "images", label: "Изображения" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-[#1db954] text-white"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Storage Info */}
      <div className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <span>Использовано памяти</span>
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
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Folder & File List */}
      <div className="space-y-2">
        {/* Folders */}
        {filter === "all" && folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div 
                className="flex-1 flex items-center gap-3 cursor-pointer"
                onClick={() => handleNavigate({id: folder.id, name: folder.name})}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Folder size={20} className="text-[#1db954] fill-[#1db954]/20" />
                </div>
                <div className="flex-1 min-w-0 font-medium text-foreground">{folder.name}</div>
              </div>
              {userType === "tutor" && (
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить папку"
                >
                  <X size={16} />
                </button>
              )}
              <ChevronRight size={18} className="text-muted-foreground" />
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && folders.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет доступных файлов
          </div>
        ) : (
          filteredFiles.map((file) => {
            const Icon = file.icon;
            return (
              <div
                key={file.id}
                className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[#1db954]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 truncate text-foreground">{file.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        {file.subject === "Mathematics"
                          ? "Математика"
                          : file.subject === "Physics"
                            ? "Физика"
                            : file.subject === "Chemistry"
                              ? "Химия"
                              : file.subject === "Other"
                                ? "Другое"
                                : file.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file)}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent text-foreground"
                      title="Скачать"
                    >
                      <Download size={16} />
                    </button>
                    {userType === "tutor" && (
                      <>
                        <button
                          onClick={() => setShowMoveModal({fileId: file.id, name: file.name})}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent text-foreground"
                          title="Переместить"
                        >
                          <Move size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 text-destructive transition-colors"
                          title="Удалить"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {file.assignedTo && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <span>Назначено:</span>
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

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-lg">
            <h3 className="text-xl mb-4 text-foreground">Создать папку</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Имя папки"
              className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#1db954] mb-6 placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 bg-muted rounded-lg py-3 text-foreground hover:bg-accent transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 bg-[#1db954] text-white rounded-lg py-3 hover:bg-[#1ed760] transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move File Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 flex flex-col max-h-[80vh] shadow-lg">
            <h3 className="text-xl mb-2 text-foreground">Переместить файл</h3>
            <p className="text-sm text-muted-foreground mb-4 truncate">{showMoveModal.name}</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              <button
                onClick={() => handleMoveFile(null)}
                className="w-full text-left bg-muted p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3 text-foreground"
              >
                <Folder size={18} className="text-muted-foreground" />
                <span>Корень (Материалы)</span>
              </button>
              {/* Note: This only shows top-level folders for simplicity in this mobile-first view, 
                  but we could make it recursive if needed */}
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleMoveFile(f.id)}
                  className="w-full text-left bg-muted p-3 rounded-lg hover:bg-accent transition-colors flex items-center gap-3 text-foreground"
                >
                  <Folder size={18} className="text-[#1db954]" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMoveModal(null)}
              className="w-full bg-muted rounded-lg py-3 text-foreground hover:bg-accent transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Upload Button (for tutors) */}
      {userType === "tutor" && (
        <>
          <button
            onClick={() => {
              setShowUploadModal(true);
              setSelectedFile(null);
              setUploadData({
                name: "",
                subject: "Математика",
                assignedToId: "",
              });
            }}
            className="fixed right-4 bottom-20 w-14 h-14 bg-[#1db954] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-colors"
          >
            <Upload size={24} />
          </button>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-foreground">Загрузить материал</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent text-foreground transition-colors"
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
                        : "border-border hover:border-[#1db954]"
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
                        selectedFile ? "text-[#1db954]" : "text-muted-foreground"
                      }`}
                    />
                    {selectedFile ? (
                      <div>
                        <p className="text-[#1db954] font-medium mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2 text-foreground">
                          Нажмите для загрузки или перетащите файл
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOC, MP4, PNG, JPG (макс. 100МБ)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Отображаемое имя файла
                    </label>
                    <input
                      type="text"
                      value={uploadData.name}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, name: e.target.value })
                      }
                      placeholder="Введите имя файла"
                      className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#1db954] placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Предмет
                    </label>
                    <select
                      value={uploadData.subject}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          subject: e.target.value,
                        })
                      }
                      className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                    >
                      <option>Математика</option>
                      <option>Физика</option>
                      <option>Химия</option>
                      <option>Другое</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Назначить ученикам
                    </label>
                    <select
                      value={uploadData.assignedToId}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          assignedToId: e.target.value,
                        })
                      }
                      className="w-full bg-muted border border-input rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
                    >
                      <option value="">Всем ученикам</option>
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
                      className="flex-1 bg-muted rounded-lg py-3 text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="flex-1 bg-[#1db954] text-white rounded-lg py-3 hover:bg-[#1ed760] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        "Загрузить"
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
