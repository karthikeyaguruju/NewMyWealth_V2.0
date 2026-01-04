'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    RadialBarChart,
    RadialBar,
} from 'recharts';

interface FinancialInsightsProps {
    expenseData: any[];
    investmentData: any[];
    savingsRate: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#fb7185'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass p-3 border-none shadow-2xl rounded-2xl">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{payload[0].name}</p>
                <p className="text-lg font-black text-primary-600 dark:text-primary-400">₹{Number(payload[0].value).toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export function FinancialInsights({ expenseData, investmentData, savingsRate }: FinancialInsightsProps) {
    const sortedExpenses = [...expenseData].sort((a, b) => b.value - a.value).slice(0, 5);

    const gaugeData = [
        {
            name: 'Savings Rate',
            value: savingsRate,
            fill: savingsRate > 50 ? '#10b981' : savingsRate > 20 ? '#3b82f6' : '#f43f5e',
        },
    ];

    const EXPENSE_COLORS = ['#f43f5e', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Investment Allocation */}
            <div className="glass-card p-8 group">
                <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Investment Portfolio</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allocation across categories</p>
                </div>
                <div className="h-64 relative">
                    {investmentData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={investmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {investmentData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invested</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white">₹{investmentData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">No investment data</div>
                    )}
                </div>
                <div className="mt-6 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                    {investmentData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-bold text-gray-600 dark:text-gray-400">{item.name}</span>
                            </div>
                            <span className="font-black text-gray-900 dark:text-white">₹{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Expenses */}
            <div className="glass-card p-8 group">
                <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Burn Categories</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Where your money goes most</p>
                </div>
                <div className="h-64 relative">
                    {sortedExpenses.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sortedExpenses}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {sortedExpenses.map((_, index) => (
                                            <Cell key={`expense-cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Spent</p>
                                <p className="text-xl font-black text-rose-600 dark:text-rose-400">₹{sortedExpenses.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}</p>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">No expense data</div>
                    )}
                </div>
                <div className="mt-6 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                    {sortedExpenses.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }} />
                                <span className="font-bold text-gray-600 dark:text-gray-400">{item.name}</span>
                            </div>
                            <span className="font-black text-gray-900 dark:text-white">₹{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Savings Rate Gauge */}
            <div className="glass-card p-8 flex flex-col items-center justify-center">
                <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Savings Efficiency</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Percentage of income saved</p>
                </div>
                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="60%"
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={18}
                            data={gaugeData}
                            startAngle={180}
                            endAngle={0}
                        >
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={20}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <p className="text-4xl font-black text-gray-900 dark:text-white">{savingsRate.toFixed(1)}%</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Savings Rate</p>
                    </div>
                </div>
                {/* Insights Text */}
                <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">
                        {savingsRate > 30
                            ? "Excellent! You're building wealth rapidly. 🚀"
                            : savingsRate > 15
                                ? "Good job! You're on the right track. 👍"
                                : "Consider reducing expenses to boost savings. 💡"}
                    </p>
                </div>
            </div>
        </div>
    );
}
