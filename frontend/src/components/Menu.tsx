import React from "react";
import {
  Users,
  FolderOpen,
  Settings,
  ChevronRight,
  DollarSign,
  GraduationCap,
} from "lucide-react";

interface MenuProps {
  userType: "tutor" | "student";
  onNavigate: (tab: string) => void;
}

export function Menu({ userType, onNavigate }: MenuProps) {
  const commonItems = [
    {
      id: "connections",
      label: "Связи",
      icon: Users,
      description: "Управление контактами и связями",
      color: "text-blue-500",
    },
    {
      id: "materials",
      label: "Материалы",
      icon: FolderOpen,
      description: "Учебные материалы и файлы",
      color: "text-[#1db954]",
    },
  ];

  const tutorItems = [
    {
      id: "students",
      label: "Студенты",
      icon: GraduationCap,
      description: "Список ваших учеников",
      color: "text-[#e8115b]",
    },
    {
      id: "finance",
      label: "Финансы",
      icon: DollarSign,
      description: "Доходы и статистика",
      color: "text-[#ff9500]",
    },
  ];

  const settingsItem = {
    id: "settings",
    label: "Настройки",
    icon: Settings,
    description: "Профиль и настройки приложения",
    color: "text-gray-400",
  };

  const menuItems = [
    ...(userType === "tutor" ? tutorItems : []),
    ...commonItems,
    settingsItem,
  ];

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-xl mb-4 px-4">Меню</h2>

      <div className="space-y-2 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full bg-card border border-border hover:bg-muted/50 transition-colors rounded-lg p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full bg-muted group-hover:bg-muted/80 transition-colors ${item.color}`}
                >
                  <Icon size={24} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-lg text-foreground">
                    {item.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
