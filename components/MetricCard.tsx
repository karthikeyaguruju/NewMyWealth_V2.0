import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    trend?: number;
    format?: 'currency' | 'percentage' | 'number';
    colorScheme?: 'primary' | 'income' | 'expense' | 'investment';
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    format = 'currency',
    colorScheme = 'primary',
}: MetricCardProps) {
    const formatValue = () => {
        if (format === 'currency') {
            return formatCurrency(value);
        } else if (format === 'percentage') {
            return `${value.toFixed(2)}%`;
        } else {
            return value.toLocaleString();
        }
    };

    const colorSchemes = {
        primary: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
        income: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
        expense: 'from-rose-500 to-orange-600 shadow-rose-500/20',
        investment: 'from-violet-500 to-purple-600 shadow-violet-500/20',
    };

    const iconBgColors = {
        primary: 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        income: 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        expense: 'bg-rose-100/50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        investment: 'bg-violet-100/50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    };

    return (
        <div className="glass-card p-6 overflow-hidden relative group">
            {/* Background Decorative Gradient */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${colorSchemes[colorScheme]} blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {formatValue()}
                        </h2>
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${iconBgColors[colorScheme]}`}>
                    <Icon size={24} />
                </div>
            </div>

            {trend !== undefined && (
                <div className="mt-4 flex items-center gap-2 relative z-10">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${trend >= 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">vs last month</span>
                </div>
            )}

            {/* Hover Sparkle Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </div>
    );
}

