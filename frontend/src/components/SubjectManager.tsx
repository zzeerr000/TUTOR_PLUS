import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Check, Book } from "lucide-react";
import { api } from "../services/api";

interface Subject {
  id: number;
  name: string;
  color: string;
}

interface SubjectManagerProps {
  onClose?: () => void;
  isModal?: boolean;
}

export function SubjectManager({
  onClose,
  isModal = false,
}: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newColor, setNewColor] = useState("#1db954");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const COLORS = [
    "#1db954", // Green
    "#ef4444", // Red
    "#3b82f6", // Blue
    "#eab308", // Yellow
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#f97316", // Orange
    "#6b7280", // Gray
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err) {
      setError("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const subject = await api.createSubject({
        name: newSubject,
        color: newColor,
      });
      setSubjects([...subjects, subject]);
      setNewSubject("");
      setNewColor("#1db954");
    } catch (err) {
      setError("Failed to create subject");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены? Это удалит папку предмета и все файлы внутри."))
      return;
    try {
      await api.deleteSubject(id);
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (err) {
      setError("Failed to delete subject");
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditColor(subject.color || "#1db954");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await api.updateSubject(editingId, { name: editName, color: editColor });
      setSubjects(
        subjects.map((s) =>
          s.id === editingId ? { ...s, name: editName, color: editColor } : s,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError("Failed to update subject");
    }
  };

  const content = (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Book className="text-[#1db954]" />
        Предметы
      </h2>

      {error && <div className="text-destructive mb-4">{error}</div>}

      <div className="space-y-4 mb-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex items-center justify-between p-3 bg-muted rounded-md group"
          >
            {editingId === subject.id ? (
              <div className="flex items-center gap-2 flex-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-background border border-input rounded px-2 py-1 text-foreground"
                  autoFocus
                />
                <div className="flex gap-1 items-center bg-background rounded px-2 border border-input">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-4 h-4 rounded-full transition-all ${
                        editColor === color
                          ? "ring-2 ring-offset-1 ring-offset-background ring-[#1db954]"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={saveEdit}
                  className="text-[#1db954] hover:bg-[#1db954]/10 p-1 rounded"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-muted-foreground hover:bg-muted-foreground/10 p-1 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color || "#1db954" }}
                  />
                  <span className="font-medium text-foreground">
                    {subject.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(subject)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {subjects.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-4">
            Нет добавленных предметов
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Название предмета..."
          className="flex-1 bg-muted rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-[#1db954]"
        />
        <div className="flex gap-1 items-center bg-muted rounded-lg px-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className={`w-5 h-5 rounded-full transition-all ${
                newColor === color
                  ? "ring-2 ring-offset-2 ring-offset-muted ring-[#1db954] scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={!newSubject.trim()}
          className="bg-[#1db954] text-white p-2 rounded-lg hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
        </button>
      </form>

      {isModal && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1db954] text-white rounded-md hover:bg-[#1ed760]"
          >
            Готово
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}
