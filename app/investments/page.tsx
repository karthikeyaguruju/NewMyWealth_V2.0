'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { startOfMonth, endOfMonth, subMonths, subYears, format } from 'date-fns';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Target, TrendingUp, Layers, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentData {
    totalInvested: number;
    categoryCount: number;
    monthlyGrowth: number;
    categoryBreakdown: { category: string; amount: number }[];
    allocation: { name: string; value: number }[];
    monthlyData: { month: string; amount: number; count: number }[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#fb7185'];

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass p-4 border-none shadow-2xl rounded-2xl">
                <p className="text-sm font-black text-gray-900 dark:text-white mb-2">{label}</p>
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

export default function InvestmentsPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('6M');
    const [data, setData] = useState<InvestmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvestments();
    }, [timeRange]);

    const fetchInvestments = async () => {
        try {
            setLoading(true);
            setError(null);

            let queryParams = '';
            const endDate = new Date();
            let startDate = new Date();
            let historyMonths = 6;

            if (timeRange !== 'ALL') {
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
                queryParams = `?startDate=${formattedStartDate}&endDate=${formattedEndDate}&historyMonths=${historyMonths}`;
            } else {
                queryParams = `?historyMonths=12`;
            }

            const response = await fetch(`/api/investments${queryParams}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch investments');
            }

            setData(result);
        } catch (error: any) {
            console.error('Failed to fetch investments:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Analyzing portfolio...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Calculate cumulative trend
    let cumulativeAmount = 0;
    const trendData = (data.monthlyData || []).map(item => {
        cumulativeAmount += item.amount;
        return { ...item, cumulative: cumulativeAmount };
    });

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Target className="text-primary-500 animate-pulse" size={28} />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Investment Portfolio
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Detailed performance analysis of your wealth builders
                            </p>
                        </div>
                    </div>
                    <div className="glass p-1 rounded-2xl flex items-center shadow-lg">
                        {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
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
                <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-4 md:pb-0 scrollbar-hide snap-x snap-mandatory">
                    <div className="min-w-[280px] snap-center flex-1">
                        <MetricCard
                            title="Total Invested"
                            value={data.totalInvested}
                            icon={Target}
                            colorScheme="investment"
                        />
                    </div>
                    <div className="min-w-[280px] snap-center flex-1">
                        <MetricCard
                            title="Monthly Growth"
                            value={data.monthlyGrowth}
                            icon={TrendingUp}
                            format="percentage"
                            colorScheme="primary"
                            trend={data.monthlyGrowth}
                        />
                    </div>
                    <div className="min-w-[280px] snap-center flex-1">
                        <MetricCard
                            title="Asset Classes"
                            value={data.categoryCount}
                            icon={Layers}
                            format="number"
                            colorScheme="income"
                        />
                    </div>
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Portfolio Allocation */}
                    <div className="glass-card p-8 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Portfolio Allocation</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Diversification across asset classes</p>
                        </div>
                        <div className="h-80 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.allocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.allocation.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <PieChartIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={24} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Value</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white">₹{data.totalInvested.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {data.allocation.map((entry, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 dark:bg-gray-800/20 border border-white/10 group">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-gray-500 truncate">{entry.name}</span>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">₹{entry.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Growth Trend */}
                    <div className="glass-card p-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Growth Projection</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cumulative growth over the selected period</p>
                        </div>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }}
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                        width={50}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative"
                                        name="Cumulative Invested"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorInvest)"
                                        strokeWidth={4}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Monthly Volume */}
                <div className="glass-card p-8">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Investment Velocity</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Capital deployed vs Transaction frequency</p>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthlyData} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                    width={50}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                <Bar
                                    dataKey="amount"
                                    name="Capital Invested"
                                    fill="#4f46e5"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Investments"
                                    fill="#9333ea"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

