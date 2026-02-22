import React, { useState } from "react";
import { User, Trash2, Save, AlertTriangle, Moon, Sun } from "lucide-react";
import { api } from "../services/api";
import { Switch } from "./ui/switch";

interface SettingsProps {
  user: {
    id: number;
    email: string;
    name: string;
    role: "tutor" | "student";
  };
  onNameUpdate: (newName: string) => void;
  onAccountDelete: () => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export function Settings({
  user,
  onNameUpdate,
  onAccountDelete,
  theme,
  onThemeToggle,
}: SettingsProps) {
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "$",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Add: local loading state for finance history deletion
  const [financeDeleteLoading, setFinanceDeleteLoading] = useState(false);

  // Add: local loading state for all data deletion
  const [allDataDeleteLoading, setAllDataDeleteLoading] = useState(false);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === "") {
      setError("Имя не может быть пустым");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (name !== user.name) {
        await api.updateName(name.trim());
        onNameUpdate(name.trim());
      }

      localStorage.setItem("currency", currency);
      // Dispatch storage event so other components can update
      window.dispatchEvent(new Event("storage"));

      setError("");
      alert("Настройки успешно сохранены!");
    } catch (err: any) {
      setError(err.message || "Не удалось обновить настройки");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "УДАЛИТЬ") {
      setError("Пожалуйста, введите УДАЛИТЬ для подтверждения");
      return;
    }

    setError("");
    setDeleteLoading(true);

    try {
      await api.deleteAccount();
      onAccountDelete();
    } catch (err: any) {
      setError(err.message || "Не удалось удалить аккаунт");
      setDeleteLoading(false);
    }
  };

  // Add: handler to delete finance history for tutors
  const handleDeleteFinanceHistory = async () => {
    if (user.role !== "tutor") return;
    if (!confirm("Это удалит ВСЮ вашу историю финансов. Продолжить?")) return;

    setError("");
    setFinanceDeleteLoading(true);
    try {
      await api.deleteFinanceHistory();
      alert("История финансов успешно удалена.");
    } catch (err: any) {
      setError(err.message || "Не удалось удалить историю финансов");
    } finally {
      setFinanceDeleteLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (
      !confirm(
        "Это удалит календарь, ДЗ, историю финансов и занятий во всем проекте. Продолжить?",
      )
    )
      return;

    setError("");
    setAllDataDeleteLoading(true);
    try {
      await api.clearAllData();
      alert("Все данные (календарь, ДЗ, финансы) успешно удалены.");
      // Dispatch storage event to refresh other components if needed
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      setError(err.message || "Не удалось очистить данные");
    } finally {
      setAllDataDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Theme Section */}
      <div className="bg-card rounded-lg p-6 border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <Moon className="text-primary" size={24} />
          ) : (
            <Sun className="text-primary" size={24} />
          )}
          <h2 className="text-xl font-semibold text-foreground">
            {theme === "dark" ? "Темная тема" : "Светлая тема"}
          </h2>
        </div>
        <Switch checked={theme === "dark"} onCheckedChange={onThemeToggle} />
      </div>

      {/* Update Name Section */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-primary" size={24} />
          <h2 className="text-xl font-semibold text-foreground">
            Обновить профиль
          </h2>
        </div>

        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Полное имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Символ валюты
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="₽">₽ (RUB)</option>
              <option value="₸">₸ (KZT)</option>
              <option value="₴">₴ (UAH)</option>
              <option value="Br">Br (BYN)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-muted rounded-lg px-4 py-3 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email нельзя изменить
            </p>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Роль
            </label>
            <input
              type="text"
              value={user.role === "tutor" ? "Преподаватель" : "Ученик"}
              disabled
              className="w-full bg-muted rounded-lg px-4 py-3 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {error && !showDeleteConfirm && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              name.trim() === "" ||
              (name === user.name &&
                currency === (localStorage.getItem("currency") || "$"))
            }
            className="w-full bg-primary rounded-lg py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </div>

      {/* Add: Delete Finance History (visible only for tutors) */}
      {user.role === "tutor" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle
                className="text-yellow-600 dark:text-yellow-500"
                size={24}
              />
              <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-500">
                Глобальная очистка данных
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-foreground/80">
                <p className="font-medium mb-2">
                  Это действие удалит во всем проекте:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Все события календаря</li>
                  <li>Все домашние задания</li>
                  <li>Всю историю финансов</li>
                  <li>Все задачи и сообщения</li>
                </ul>
              </div>

              <button
                onClick={handleClearAllData}
                disabled={allDataDeleteLoading}
                className="w-full bg-primary rounded-lg py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allDataDeleteLoading
                  ? "Очистка..."
                  : "Очистить все данные проекта"}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle
                className="text-yellow-600 dark:text-yellow-500"
                size={24}
              />
              <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-500">
                Удалить историю финансов
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-foreground/80">
                <p className="font-medium mb-2">
                  Предупреждение: Это действие удалит все ваши транзакции.
                </p>
                <p className="text-muted-foreground">
                  Все финансовые записи (завершенные и ожидающие) для вашего
                  аккаунта преподавателя будут удалены.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleDeleteFinanceHistory}
                disabled={financeDeleteLoading}
                className="w-full bg-yellow-500 rounded-lg py-3 text-white font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {financeDeleteLoading
                  ? "Удаление..."
                  : "Удалить историю финансов"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Section */}
      <div className="bg-card rounded-lg p-6 border border-destructive/30">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="text-destructive" size={24} />
          <h2 className="text-xl font-semibold text-destructive">
            Удалить аккаунт
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-destructive flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="text-sm text-foreground/80">
                <p className="font-medium mb-2">
                  Предупреждение: Это действие нельзя отменить
                </p>
                <p className="text-muted-foreground">
                  Удаление аккаунта навсегда удалит все ваши данные, включая:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Все ваши связи</li>
                  <li>Все запланированные занятия</li>
                  <li>Все задачи и прогресс</li>
                  <li>Все сообщения и файлы</li>
                </ul>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-destructive/10 border border-destructive rounded-lg py-3 text-destructive font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Удалить аккаунт
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Введите{" "}
                  <span className="font-mono font-bold text-destructive">
                    УДАЛИТЬ
                  </span>{" "}
                  для подтверждения
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-muted rounded-lg px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-destructive font-mono"
                  placeholder="УДАЛИТЬ"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                    setError("");
                  }}
                  className="flex-1 bg-muted rounded-lg py-3 text-foreground hover:bg-muted/80 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmText !== "УДАЛИТЬ"}
                  className="flex-1 bg-destructive rounded-lg py-3 text-destructive-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  {deleteLoading ? "Удаление..." : "Навсегда удалить аккаунт"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
