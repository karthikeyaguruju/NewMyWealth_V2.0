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
import { Greeting } from '@/components/Dashboard/Greeting';
import { MonthlyTrends } from '@/components/Dashboard/MonthlyTrends';
import { FinancialInsights } from '@/components/Dashboard/FinancialInsights';

interface AnalyticsData {
    metrics: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        totalInvestments: number;
        thisMonthIncome: number;
        thisMonthExpenses: number;
        savingsRate: number;
        incomeGrowth: number;
        expenseGrowth: number;
        investmentGrowth: number;
    };
    monthlyData: any[];
    incomeBreakdown: any[];
    expenseBreakdown: any[];
    investmentAllocation: any[];
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
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchUserProfile();
    }, [dateRange]);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            if (data.user) setUser(data.user);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

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
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading your dashboard...</p>
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
        incomeGrowth: 0,
        expenseGrowth: 0,
        investmentGrowth: 0,
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <Greeting userName={user?.fullName} />

                {/* Metrics Grid */}
                <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 md:pb-0 scrollbar-hide snap-x snap-mandatory">
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Income"
                            value={metrics.totalIncome}
                            icon={DollarSign}
                            colorScheme="income"
                            trend={metrics.incomeGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Expenses"
                            value={metrics.totalExpenses}
                            icon={CreditCard}
                            colorScheme="expense"
                            trend={metrics.expenseGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Investments"
                            value={metrics.totalInvestments}
                            icon={TrendingUp}
                            colorScheme="investment"
                            trend={metrics.investmentGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Net Balance"
                            value={metrics.netSavings}
                            icon={PiggyBank}
                            colorScheme="primary"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1.5 bg-primary-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Financial Performance</h2>
                    </div>
                    <MonthlyTrends data={analytics.monthlyData} />
                    <FinancialInsights
                        expenseData={analytics.expenseBreakdown}
                        investmentData={analytics.investmentAllocation}
                        savingsRate={metrics.savingsRate}
                    />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1.5 bg-primary-600 rounded-full"></div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Activity & Planning</h2>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 glass-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Recent Transactions
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your latest financial activities</p>
                            </div>
                            <Link
                                href="/transactions"
                                className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors flex items-center gap-2 group"
                            >
                                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentTransactions.map((transaction, idx) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-white/20 dark:hover:border-white/10 group animate-fade-in"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${transaction.type === 'income'
                                            ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : transaction.type === 'expense'
                                                ? 'bg-rose-100/50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                                : 'bg-violet-100/50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                                            }`}>
                                            {transaction.type === 'income' ? <TrendingUp size={22} /> :
                                                transaction.type === 'expense' ? <TrendingDown size={22} /> :
                                                    <Target size={22} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {transaction.description || transaction.category}
                                            </p>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                {format(new Date(transaction.date), 'MMM d, yyyy')} • {transaction.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${transaction.type === 'income'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : transaction.type === 'expense'
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : 'text-violet-600 dark:text-violet-400'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            ₹{transaction.amount.toLocaleString()}
                                        </p>
                                        <Badge variant={transaction.type} className="mt-1">{transaction.type}</Badge>
                                    </div>
                                </div>
                            ))}

                            {recentTransactions.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="text-gray-400" size={24} />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No recent transactions found</p>
                                    <Link href="/transactions" className="text-primary-600 text-sm font-bold mt-2 inline-block">Add your first transaction</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Income Distribution */}
                    <div className="glass-card p-8 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Income Sources
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Where your money comes from</p>
                        </div>

                        <div className="flex-1 min-h-[300px] relative">
                            {analytics.incomeBreakdown && analytics.incomeBreakdown.length > 0 ? (
                                <div className="h-full flex flex-col">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <defs>
                                                    {analytics.incomeBreakdown.map((_, index) => (
                                                        <linearGradient key={`income-gradient-${index}`} id={`incomeColorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={COLORS[(index + 2) % COLORS.length]} stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor={COLORS[(index + 2) % COLORS.length]} stopOpacity={0.5} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <Pie
                                                    data={analytics.incomeBreakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {analytics.incomeBreakdown.map((entry, index) => (
                                                        <Cell key={`income-cell-${index}`} fill={`url(#incomeColorGradient-${index})`} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="glass p-3 border-none shadow-2xl rounded-2xl">
                                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{payload[0].name}</p>
                                                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{Number(payload[0].value).toLocaleString()}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-[32%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Income</p>
                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{metrics.totalIncome.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar text-xs">
                                        {analytics.incomeBreakdown.sort((a, b) => b.value - a.value).map((category, index) => (
                                            <div key={index} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                                                    <span className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{category.name}</span>
                                                </div>
                                                <span className="font-black text-gray-900 dark:text-white">₹{category.value.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <DollarSign className="text-gray-400" size={24} />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-xs">No income data yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Budget Tracker */}
                <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <BudgetTracker />
                </div>
            </div>
        </DashboardLayout>
    );
}
