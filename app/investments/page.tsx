'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
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
    LineChart,
    Line,
    Area,
    AreaChart,
} from 'recharts';
import { Target, TrendingUp, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface InvestmentData {
    totalInvested: number;
    categoryCount: number;
    monthlyGrowth: number;
    categoryBreakdown: { category: string; amount: number }[];
    allocation: { name: string; value: number }[];
    monthlyData: { month: string; amount: number; count: number }[];
}

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC']; // Black/Grey scale for donut as per image
const PURPLE_GRADIENT = ['#8B5CF6', '#A78BFA'];
const BLUE_GRADIENT = ['#3B82F6', '#60A5FA'];

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export default function InvestmentsPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('6M');
    const [data, setData] = useState<InvestmentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvestments();
    }, [timeRange]);

    const fetchInvestments = async () => {
        try {
            setLoading(true);

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
                // For ALL, we might want to show a longer trend, e.g., 12 months or more
                // But for now let's default to 12 months trend if ALL is selected, or handle it in API
                // Let's pass a large historyMonths for ALL
                queryParams = `?historyMonths=12`;
            }

            const response = await fetch(`/api/investments${queryParams}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch investments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    // Calculate cumulative trend for the line chart
    let cumulativeAmount = 0;
    const trendData = data.monthlyData.map(item => {
        cumulativeAmount += item.amount;
        return { ...item, cumulative: cumulativeAmount };
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Investment Analysis
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Track and analyze your investment portfolio performance
                        </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
                        {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Invested */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total Invested
                                </p>
                                <h2 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    ₹{data.totalInvested.toLocaleString()}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {timeRange === 'ALL' ? 'All time' : `Last ${timeRange}`}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                                <Target className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Growth */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monthly Growth
                                </p>
                                <h2 className={`text-4xl font-bold mt-2 ${data.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {data.monthlyGrowth > 0 ? '+' : ''}{data.monthlyGrowth.toFixed(1)}%
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">vs previous month</p>
                            </div>
                            <div className={`p-2 rounded-full ${data.monthlyGrowth >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                {data.monthlyGrowth >= 0 ? (
                                    <ArrowUpRight className="text-green-500" size={24} />
                                ) : (
                                    <ArrowDownRight className="text-red-500" size={24} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Categories
                                </p>
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                                    {data.categoryCount}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Investment categories</p>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                <Layers className="text-blue-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Investment by Category */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Investment by Category
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Distribution across different investment categories
                        </p>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.allocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.allocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#000000' : index === 1 ? '#333333' : '#666666'} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            {data.allocation.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: index === 0 ? '#000000' : index === 1 ? '#333333' : '#666666' }}
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {entry.name}: ₹{entry.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Investment Amount */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Monthly Investment Amount
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Investment amounts over the selected period
                        </p>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlyData}>
                                    <defs>
                                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#A78BFA" />
                                            <stop offset="100%" stopColor="#8B5CF6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill="url(#purpleGradient)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Investment Trend */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Investment Trend
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Trend analysis over the selected period
                        </p>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Cumulative']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="cumulative"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Investment Frequency */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Investment Frequency
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Number of investments per month
                        </p>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlyData}>
                                    <defs>
                                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#60A5FA" />
                                            <stop offset="100%" stopColor="#3B82F6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [value, 'Investments']}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#blueGradient)"
                                        radius={[4, 4, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
