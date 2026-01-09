import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Check } from 'lucide-react';
import { api } from '../services/api';

interface FinanceProps {
  userType?: 'tutor' | 'student';
}

export function Finance({ userType }: FinanceProps) {
  const [stats, setStats] = useState([
    { label: 'This Month', value: '$0', change: '0%', up: true },
    { label: 'Last Month', value: '$0', change: '0%', up: true },
    { label: 'Pending', value: '$0', change: '0 invoices', up: false },
  ]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmPayment = async (transactionId: number) => {
    if (!confirm('Confirm payment for this transaction?')) return;
    try {
      await api.confirmPayment(transactionId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to confirm payment');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactions, financeStats] = await Promise.all([
        api.getTransactions().catch(() => []),
        api.getFinanceStats().catch(() => ({ thisMonth: 0, lastMonth: 0, pending: 0, pendingCount: 0 })),
      ]);

      const change = financeStats.lastMonth > 0 
        ? ((financeStats.thisMonth - financeStats.lastMonth) / financeStats.lastMonth * 100).toFixed(0)
        : '0';

      setStats([
        { 
          label: 'This Month', 
          value: `$${financeStats.thisMonth.toLocaleString()}`, 
          change: `${change.startsWith('-') ? '' : '+'}${change}%`, 
          up: Number(change) >= 0 
        },
        { 
          label: 'Last Month', 
          value: `$${financeStats.lastMonth.toLocaleString()}`, 
          change: '+0%', 
          up: true 
        },
        { 
          label: 'Pending', 
          value: `$${financeStats.pending.toLocaleString()}`, 
          change: `${financeStats.pendingCount} invoices`, 
          up: false 
        },
      ]);

      setRecentTransactions(transactions.slice(0, 5).map((t: any) => ({
        id: t.id,
        student: t.student?.name || t.tutor?.name || 'User',
        amount: Number(t.amount),
        date: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: t.status,
        subject: t.subject || '',
        tutorId: t.tutorId,
      })));

      setUpcomingPayments(transactions
        .filter((t: any) => t.status === 'pending' && t.dueDate)
        .slice(0, 3)
        .map((t: any) => ({
          student: t.student?.name || 'Student',
          amount: Number(t.amount),
          dueDate: new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          subject: t.subject || '',
        })));
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading finance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-[#1db954] to-[#15883d] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">{stat.label}</div>
                <div className="text-2xl mb-1">{stat.value}</div>
                <div className="flex items-center gap-1 text-sm">
                  {stat.up ? <TrendingUp size={16} /> : <DollarSign size={16} />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Overview Chart */}
      <div className="bg-[#181818] rounded-lg p-4">
        <h3 className="text-lg mb-4">Monthly Overview</h3>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No transaction data available</div>
          ) : (
            recentTransactions.slice(0, 4).map((item, idx) => {
              const maxAmount = Math.max(...recentTransactions.map((t: any) => t.amount));
              const percentage = (item.amount / maxAmount) * 100;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.date}</span>
                    <span>${item.amount}</span>
                  </div>
                  <div className="w-full bg-[#282828] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#1db954] to-[#1ed760] h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No transactions yet</div>
          ) : (
            recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1">{transaction.student}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{transaction.date}</span>
                    <span>•</span>
                    <span>{transaction.subject}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[#1db954] mb-1">${transaction.amount}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-[#1db954]/20 text-[#1db954]'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}
                  >
                    {transaction.status}
                  </span>
                  </div>
                  {userType === 'tutor' && transaction.status === 'pending' && (
                    <button
                      onClick={() => handleConfirmPayment(transaction.id)}
                      className="p-2 bg-[#1db954] rounded-lg hover:bg-[#1ed760] transition-colors"
                      title="Confirm payment"
                    >
                      <Check size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Payments */}
      <div>
        <h3 className="text-lg mb-3">Upcoming Payments</h3>
        <div className="space-y-2">
          {upcomingPayments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No upcoming payments</div>
          ) : (
            upcomingPayments.map((payment, idx) => (
            <div
              key={idx}
              className="bg-[#181818] rounded-lg p-4 border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1">{payment.student}</div>
                  <div className="text-sm text-gray-400">
                    Due: {payment.dueDate} • {payment.subject}
                  </div>
                </div>
                <div className="text-yellow-500">${payment.amount}</div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
