'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { startOfMonth, endOfMonth, format, subMonths, subYears } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const COLORS = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#fb7185'];

type TimeRange = '1M' | '3M' | '6M' | '1Y';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass p-4 border-none shadow-2xl rounded-2xl">
                <p className="text-sm font-black text-gray-900 dark:text-white mb-2">{label || payload[0].name}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-bold uppercase tracking-wider" style={{ color: entry.color || entry.fill }}>{entry.name}:</span>
                        <span className="font-black text-gray-900 dark:text-white">₹{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('6M');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const endDate = new Date();
            let startDate = new Date();
            let historyMonths = 6;

            switch (timeRange) {
                case '1M':
                    startDate = startOfMonth(endDate);
                    historyMonths = 1;
                    break;
                case '3M':
                    startDate = subMonths(endDate, 2);
                    historyMonths = 3;
                    break;
                case '6M':
                    startDate = subMonths(endDate, 5);
                    historyMonths = 6;
                    break;
                case '1Y':
                    startDate = subYears(endDate, 1);
                    historyMonths = 12;
                    break;
            }

            const formattedStartDate = format(startOfMonth(startDate), 'yyyy-MM-dd');
            const formattedEndDate = format(endOfMonth(endDate), 'yyyy-MM-dd');

            const response = await fetch(
                `/api/analytics?startDate=${formattedStartDate}&endDate=${formattedEndDate}&historyMonths=${historyMonths}`
            );
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
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
                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Running financial simulations...</p>
                </div>
            </DashboardLayout>
        );
    }

    const { metrics } = analytics;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Activity className="text-primary-500 animate-pulse" size={28} />
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Financial <span className="text-gradient">Insights</span>
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Deep dive into your spending habits and wealth patterns.
                        </p>
                    </div>
                    <div className="glass p-1 rounded-2xl flex items-center shadow-lg">
                        {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                                    timeRange === range
                                        ? "bg-primary-600 text-white shadow-md"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metrics Horizontal Scroll on Mobile */}
                <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 md:pb-0 scrollbar-hide snap-x snap-mandatory">
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Income"
                            value={metrics.totalIncome}
                            icon={TrendingUp}
                            colorScheme="income"
                            trend={metrics.incomeGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Expenses"
                            value={metrics.totalExpenses}
                            icon={TrendingDown}
                            colorScheme="expense"
                            trend={metrics.expenseGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Investments"
                            value={metrics.totalInvestments}
                            icon={BarChart3}
                            colorScheme="investment"
                            trend={metrics.investmentGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center">
                        <MetricCard
                            title="Total Savings"
                            value={metrics.netSavings}
                            icon={Activity}
                            colorScheme="primary"
                        />
                    </div>
                </div>

                {/* Dashboard Level Charts - Reusing Components for consistency */}
                <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1.5 bg-primary-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Performance Overview</h2>
                    </div>
                    <MonthlyTrends data={analytics.monthlyData} />
                </div>

                <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1.5 bg-primary-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Distribution Metrics</h2>
                    </div>
                    <FinancialInsights
                        expenseData={analytics.expenseBreakdown}
                        investmentData={analytics.investmentAllocation}
                        savingsRate={metrics.savingsRate}
                    />
                </div>

                {/* Additional Detailed Breakdowns for Analytics Page */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Income Sources breakdown */}
                    <div className="glass-card p-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Income Sources</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed breakdown of revenue streams</p>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.incomeBreakdown} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 700, fill: '#6B7280' }}
                                        width={100}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                    <Bar
                                        dataKey="value"
                                        fill="#10b981"
                                        radius={[0, 10, 10, 0]}
                                        barSize={24}
                                        background={{ fill: 'rgba(0,0,0,0.03)', radius: 10 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                            <PieChartIcon className="text-primary-600 dark:text-primary-400" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Savings Strategy</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                                Your current savings rate is <span className="text-primary-600 font-bold">{metrics.savingsRate.toFixed(1)}%</span>.
                                {metrics.savingsRate > 20 ? " You're doing better than 75% of our users!" : " Increasing this by 5% could mean retiring 3 years earlier."}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100/20">
                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Monthly Surplus</p>
                                <p className="text-lg font-black text-gray-900 dark:text-white">₹{metrics.netSavings.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100/20">
                                <p className="text-[10px] font-black uppercase text-blue-600 mb-1">Inv. Capacity</p>
                                <p className="text-lg font-black text-gray-900 dark:text-white">₹{(metrics.netSavings * 0.7).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

