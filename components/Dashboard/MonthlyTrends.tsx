'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
} from 'recharts';

interface MonthlyTrendsProps {
    data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass p-4 border-none shadow-2xl rounded-2xl">
                <p className="text-sm font-black text-gray-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-bold uppercase tracking-wider" style={{ color: entry.color }}>{entry.name}:</span>
                        <span className="font-black text-gray-900 dark:text-white">₹{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function MonthlyTrends({ data }: MonthlyTrendsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Income vs Expenses Bar Chart */}
            <div className="glass-card p-8 group">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cash Flow Trend</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comparison of monthly income and expenses</p>
                </div>
                <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                                width={45}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                content={(props) => {
                                    const { payload } = props;
                                    return (
                                        <div className="flex gap-4 justify-end mb-4">
                                            {payload?.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{entry.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                            <Bar
                                dataKey="income"
                                name="Income"
                                fill="#2563eb"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            />
                            <Bar
                                dataKey="expense"
                                name="Expenses"
                                fill="#f43f5e"
                                radius={[6, 6, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Savings & Investments Area Chart */}
            <div className="glass-card p-8">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Financial Growth</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Growth of your savings and investments over time</p>
                </div>
                <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
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
                                width={45}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" align="right" iconType="circle" />
                            <Area
                                type="monotone"
                                dataKey="savings"
                                name="Net Savings"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#colorSavings)"
                                strokeWidth={4}
                            />
                            <Area
                                type="monotone"
                                dataKey="investment"
                                name="Investments"
                                stroke="#0ea5e9"
                                fillOpacity={1}
                                fill="url(#colorInvestment)"
                                strokeWidth={4}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
