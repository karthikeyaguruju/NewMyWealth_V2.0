'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { BudgetTracker } from '@/components/BudgetTracker';
import { Badge } from '@/components/ui/Badge';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    CreditCard,
    Target,
    ArrowRight
} from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import Link from 'next/link';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
    metrics: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        totalInvestments: number;
        thisMonthIncome: number;
        thisMonthExpenses: number;
        savingsRate: number;
    };
    expenseBreakdown: any[];
}

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'investment';
    amount: number;
    category: string;
    description: string;
    date: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, transactionsRes] = await Promise.all([
                fetch(`/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
                fetch('/api/transactions?limit=5')
            ]);

            const analyticsData = await analyticsRes.json();
            const transactionsData = await transactionsRes.json();

            setAnalytics(analyticsData);
            setRecentTransactions(transactionsData.transactions || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    const metrics = analytics?.metrics ?? {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        totalInvestments: 0,
        thisMonthIncome: 0,
        thisMonthExpenses: 0,
        savingsRate: 0,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Income"
                        value={metrics.totalIncome}
                        icon={DollarSign}
                        colorScheme="income"
                    />
                    <MetricCard
                        title="Total Expenses"
                        value={metrics.totalExpenses}
                        icon={CreditCard}
                        colorScheme="expense"
                    />
                    <MetricCard
                        title="Total Investments"
                        value={metrics.totalInvestments}
                        icon={TrendingUp}
                        colorScheme="investment"
                    />
                    <MetricCard
                        title="Net Balance"
                        value={metrics.netSavings}
                        icon={PiggyBank}
                        colorScheme="primary"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Recent Transactions
                            </h3>
                            <Link
                                href="/transactions"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                            >
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${transaction.type === 'income'
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                            : transaction.type === 'expense'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            }`}>
                                            {transaction.type === 'income' ? <TrendingUp size={20} /> :
                                                transaction.type === 'expense' ? <TrendingDown size={20} /> :
                                                    <Target size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {transaction.description || transaction.category}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {format(new Date(transaction.date), 'MMM d, yyyy')} • {transaction.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${transaction.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : transaction.type === 'expense'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-blue-600 dark:text-blue-400'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            ₹{transaction.amount.toLocaleString()}
                                        </p>
                                        <Badge variant={transaction.type}>{transaction.type}</Badge>
                                    </div>
                                </div>
                            ))}

                            {recentTransactions.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No recent transactions found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Spending by Category */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            Spending by Category
                        </h3>
                        <div className="h-80">
                            {analytics.expenseBreakdown && analytics.expenseBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.expenseBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {analytics.expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                    <p>No expense data yet.</p>
                                    <p className="text-sm mt-1">Start adding transactions to see insights.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Budget Tracker */}
                <div className="grid grid-cols-1 gap-6">
                    <BudgetTracker />
                </div>
            </div>
        </DashboardLayout>
    );
}
