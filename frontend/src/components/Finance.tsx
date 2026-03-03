import { useEffect, useState, useMemo } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { api } from "../services/api";

const COLORS = [
  "#1db954", // Spotify Green
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#f43f5e", // Rose
];

interface FinanceProps {
  userType?: "tutor" | "student";
}

export function Finance({ userType }: FinanceProps) {
  const [currency, setCurrency] = useState(api.getCurrencySymbol());
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const currentMonthName = useMemo(() => {
    return selectedDate.toLocaleString("ru", { month: "long" });
  }, [selectedDate]);

  const monthlyTransactions = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    return allTransactions.filter((t) => {
      const d = t.fullDate;
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [allTransactions, selectedDate]);

  const chartData = useMemo(() => {
    const studentTotals: { [key: string]: number } = {};
    monthlyTransactions
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const name = t.student || "Other";
        studentTotals[name] = (studentTotals[name] || 0) + t.amount;
      });

    return Object.entries(studentTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyTransactions]);

  const totalMonthlyIncome = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      setCurrency(api.getCurrencySymbol());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth =
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    if (isCurrentMonth) return;

    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1),
    );
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear()
    );
  }, [selectedDate]);

  const handleConfirmPayment = async (transactionId: number) => {
    if (!confirm("Подтвердить оплату этой транзакции?")) return;
    try {
      await api.confirmPayment(transactionId);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Не удалось подтвердить оплату");
    }
  };

  const handleCancelPayment = async (transactionId: number) => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить это занятие из финансов? Оно пропадёт из списка ожидания и не попадёт в историю.",
      )
    )
      return;
    try {
      await api.cancelPayment(transactionId);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Не удалось удалить занятие");
    }
  };

  const hasStarted = (eventDateStr: string, timeStr: string) => {
    const now = new Date();
    const datePart = eventDateStr.split("T")[0];
    let hour24 = 0;
    let minutes = 0;
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const [timePart, period] = timeStr.split(" ");
      const [hours, mins] = timePart.split(":");
      hour24 = parseInt(hours);
      if (period === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      minutes = parseInt(mins);
    } else {
      const [hours, mins] = timeStr.split(":");
      hour24 = parseInt(hours);
      minutes = parseInt(mins);
    }
    const eventDateTime = new Date(
      `${datePart}T${String(hour24).padStart(2, "0")}:${String(
        minutes,
      ).padStart(2, "0")}:00`,
    );
    return eventDateTime <= now;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactions, financeStats, events] = await Promise.all([
        api.getTransactions().catch(() => []),
        api.getFinanceStats().catch(() => ({
          thisMonth: 0,
          lastMonth: 0,
          pending: 0,
          pendingCount: 0,
        })),
        api.getEvents().catch(() => []),
      ]);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const formattedTransactions = transactions.map((t: any) => ({
        id: t.id,
        student: t.student?.name || t.tutor?.name || "Пользователь",
        amount: Number(t.amount),
        date: new Date(t.createdAt).toLocaleDateString("ru-RU", {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(t.createdAt),
        status: t.status,
        subject: t.subject || "",
        tutorId: t.tutorId,
      }));

      setAllTransactions(formattedTransactions);

      const change =
        financeStats.lastMonth > 0
          ? (
              ((financeStats.thisMonth - financeStats.lastMonth) /
                financeStats.lastMonth) *
              100
            ).toFixed(0)
          : "0";

      // Stats header removed earlier; keep financeStats usage internal only

      const pendingTx = formattedTransactions.filter(
        (t: any) => t.status === "pending",
      );

      if (pendingTx.length > 0) {
        setRecentTransactions(pendingTx);
      } else {
        // Fallback: use events with paymentPending=true (in case transactions not yet created)
        const pendingEvents = events
          .filter(
            (e: any) =>
              e.paymentPending && e.transactionId && hasStarted(e.date, e.time),
          )
          .map((e: any) => ({
            id: e.transactionId,
            student: e.student?.name || "Ученик",
            amount: Number(e.amount) || 0,
            date: new Date(e.date).toLocaleDateString("ru-RU", {
              month: "short",
              day: "numeric",
            }),
            fullDate: new Date(e.date),
            status: "pending",
            subject: e.subject || e.title || "",
            tutorId: e.tutorId,
          }));
        setRecentTransactions(pendingEvents);
      }

      // Upcoming payments widget removed earlier
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">
          Загрузка финансовых данных...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Circle Stats Block */}
      <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg border border-border">
        {/* Month Navigation Header */}
        <div className="flex items-center gap-6 mb-8 bg-muted px-6 py-3 rounded-full border border-border shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-background rounded-full text-muted-foreground hover:text-[#1db954] transition-all hover:scale-110 active:scale-95 shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex flex-col items-center min-w-35">
            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mb-0.5">
              Период
            </span>
            <div className="text-foreground text-lg font-bold uppercase tracking-wider flex items-center gap-2">
              {currentMonthName}
              <span className="text-muted-foreground font-medium">
                {selectedDate.getFullYear()}
              </span>
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 rounded-full transition-all shadow-sm ${
              isCurrentMonth
                ? "text-muted-foreground/30"
                : "text-muted-foreground hover:bg-background hover:text-[#1db954] hover:scale-110 active:scale-95"
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="relative w-48 h-48">
          <PieChart width={192} height={192}>
            {/* Background Track Circle */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={90}
              stroke="none"
              dataKey="value"
              className="fill-muted"
              isAnimationActive={false}
            />
            {/* Data Pie */}
            <Pie
              data={
                chartData.length > 0 ? chartData : [{ name: "Empty", value: 1 }]
              }
              innerRadius={80}
              outerRadius={90}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={450}
              cx="50%"
              cy="50%"
              isAnimationActive={false}
            >
              {chartData.length > 0 ? (
                chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))
              ) : (
                <Cell fill="transparent" />
              )}
            </Pie>
          </PieChart>

          {/* Center Text: Total Income */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1">
              Доход
            </div>
            <div className="text-3xl font-black text-foreground flex items-baseline gap-0.5">
              <span className="text-lg font-bold text-[#1db954]">
                {currency}
              </span>
              {totalMonthlyIncome.toLocaleString()}
            </div>
            <div className="w-8 h-0.5 bg-[#1db954] mt-2 rounded-full opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg mb-3 text-foreground">Ожидание оплаты</h3>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет неоплаченных занятий
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-card rounded-lg p-4 hover:bg-muted transition-colors border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-1 text-foreground">
                      {transaction.student}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span>{transaction.subject}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`mb-1 ${
                          transaction.status === "canceled"
                            ? "text-destructive"
                            : "text-[#1db954]"
                        }`}
                      >
                        {currency}
                        {transaction.amount}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === "completed"
                            ? "bg-[#1db954]/20 text-[#1db954]"
                            : transaction.status === "canceled"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {transaction.status === "completed"
                          ? "Выполнено"
                          : transaction.status === "canceled"
                            ? "Отменено"
                            : "Ожидает"}
                      </span>
                    </div>
                    {userType === "tutor" &&
                      transaction.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelPayment(transaction.id)}
                            className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all"
                            title="Отменить занятие"
                          >
                            <X size={18} />
                          </button>
                          <button
                            onClick={() => handleConfirmPayment(transaction.id)}
                            className="p-2 bg-[#1db954] text-white rounded-lg hover:bg-[#1ed760] transition-colors shadow-sm"
                            title="Подтвердить оплату"
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly Transactions History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
          История за месяц
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
            {currentMonthName}
          </span>
        </h3>
        <div className="space-y-2">
          {monthlyTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-dashed border-border">
              В этом месяце еще не было транзакций
            </div>
          ) : (
            monthlyTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-card rounded-xl p-4 hover:bg-muted transition-all border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.status === "completed"
                          ? "bg-[#1db954]/10 text-[#1db954]"
                          : transaction.status === "canceled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {transaction.status === "completed" ? (
                        <Check size={20} />
                      ) : transaction.status === "canceled" ? (
                        <X size={20} />
                      ) : (
                        <Calendar size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {transaction.student}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.date} • {transaction.subject}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        transaction.status === "completed"
                          ? "text-[#1db954]"
                          : transaction.status === "canceled"
                            ? "text-destructive"
                            : "text-yellow-500"
                      }`}
                    >
                      {currency}
                      {transaction.amount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {transaction.status === "completed"
                        ? "Зачислено"
                        : transaction.status === "canceled"
                          ? "Отменено"
                          : "Ожидается"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
