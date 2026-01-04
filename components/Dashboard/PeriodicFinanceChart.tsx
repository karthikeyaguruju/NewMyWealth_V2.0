'use client';

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function PeriodicFinanceChart() {
    const [periodValue, setPeriodValue] = useState('6M');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const periods = [
        { label: 'Last 7 Days', value: '7D', months: 1, granularity: 'day', days: 7 },
        { label: 'Last Month', value: '1M', months: 1, granularity: 'day', days: 30 },
        { label: 'Last 3 Months', value: '3M', months: 3, granularity: 'month' },
        { label: 'Last 6 Months', value: '6M', months: 6, granularity: 'month' },
        { label: 'Last Year', value: '1Y', months: 12, granularity: 'month' },
        { label: 'All Time', value: 'Full', months: 120, granularity: 'month' },
    ];

    const selectedPeriod = periods.find(p => p.value === periodValue) || periods[3];

    useEffect(() => {
        fetchData();
    }, [periodValue]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const months = selectedPeriod.months || 6;
            const granularity = selectedPeriod.granularity || 'month';
            const days = selectedPeriod.days || 30;

            const response = await fetch(`/api/analytics?historyMonths=${months}&granularity=${granularity}&days=${days}`);
            const result = await response.json();

            if (result.monthlyData) {
                setData(result.monthlyData);
            }
        } catch (error) {
            console.error('Failed to fetch periodic data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals for the selected period
    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            income: acc.income + curr.income,
            expense: acc.expense + curr.expense,
            investment: acc.investment + (curr.investment || 0),
            net: acc.net + (curr.income - curr.expense)
        }), { income: 0, expense: 0, investment: 0, net: 0 });
    }, [data]);

    return (
        <div className="glass-card p-6 group mb-8">
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Transaction Overview</h3>

                <div className="w-48">
                    <Listbox value={periodValue} onChange={setPeriodValue}>
                        <div className="relative mt-1">
                            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 py-2.5 pl-4 pr-10 text-left font-bold text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 hover:bg-white dark:hover:bg-gray-800 transition-all">
                                <span className="block truncate">{selectedPeriod.label}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                            </Listbox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                    {periods.map((p) => (
                                        <Listbox.Option
                                            key={p.value}
                                            className={({ active }) =>
                                                cn(
                                                    'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                                                    active ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                                                )
                                            }
                                            value={p.value}
                                        >
                                            {({ selected }) => (
                                                <>
                                                    <span className={cn('block truncate', selected ? 'font-black' : 'font-medium')}>
                                                        {p.label}
                                                    </span>
                                                    {selected ? (
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                                            <Check className="h-4 w-4" aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Transition>
                        </div>
                    </Listbox>
                </div>
            </div>

            {/* Summary Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 my-6 pb-4 border-b border-gray-100 dark:border-gray-800/50">
                <div className="text-center group/stat">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Income</p>
                    <p className="text-xl font-black text-emerald-500 transition-transform group-hover/stat:scale-110">₹{totals.income.toLocaleString()}</p>
                </div>
                <div className="text-center group/stat">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Expenses</p>
                    <p className="text-xl font-black text-rose-500 transition-transform group-hover/stat:scale-110">₹{totals.expense.toLocaleString()}</p>
                </div>
                <div className="text-center group/stat">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Investments</p>
                    <p className="text-xl font-black text-blue-500 transition-transform group-hover/stat:scale-110">₹{totals.investment.toLocaleString()}</p>
                </div>
                <div className="text-center group/stat">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Net</p>
                    <p className={`text-xl font-black transition-transform group-hover/stat:scale-110 ${totals.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ₹{totals.net.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="h-72 w-full mt-6 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10 rounded-2xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : null}

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={periodValue === '7D' ? 12 : 4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                            interval={periodValue === '1M' ? 2 : 0} // Skip labels for 1M to avoid overlap
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                            tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="rect"
                            wrapperStyle={{ paddingTop: '24px' }}
                            content={(props) => {
                                const { payload } = props;
                                return (
                                    <div className="flex gap-8 justify-center">
                                        {payload?.map((entry: any, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                                                <span className="text-xs font-bold text-gray-500 tracking-wide capitalize">{entry.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }}
                        />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={periodValue.includes('D') || periodValue === '1M' ? 12 : 30}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={periodValue.includes('D') || periodValue === '1M' ? 12 : 30}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="investment"
                            name="Investment"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={periodValue.includes('D') || periodValue === '1M' ? 12 : 30}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
