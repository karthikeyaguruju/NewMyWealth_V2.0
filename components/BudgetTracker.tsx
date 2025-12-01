'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Budget {
    id: string;
    category: string;
    amount: number;
    spent: number;
    month: string;
}

export function BudgetTracker() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            // Fetch for current month
            const res = await fetch('/api/budgets');
            if (!res.ok) throw new Error('Failed to fetch budgets');
            const data = await res.json();
            if (Array.isArray(data)) {
                setBudgets(data);
            } else {
                setBudgets([]);
            }
        } catch (error) {
            console.error('Failed to fetch budgets', error);
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = (spent: number, total: number) => {
        const percentage = (spent / total) * 100;
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (loading) {
        return (
            <div className="glass-card p-6 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Budget Tracker
                </h3>
                <Link
                    href="/profile"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                >
                    Manage Budgets <ArrowRight size={16} />
                </Link>
            </div>

            {budgets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No budgets set for this month.</p>
                    <Link href="/profile" className="text-primary-600 hover:underline mt-2 inline-block text-sm">
                        Set a budget
                    </Link>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {budgets.map((budget) => {
                        const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                        const isExceeded = budget.spent > budget.amount;

                        return (
                            <div key={budget.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {budget.category}
                                    </span>
                                    <span className={isExceeded ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                                    </span>
                                </div>

                                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budget.spent, budget.amount)}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-xs">
                                    <span className={`${isExceeded ? 'text-red-600' : 'text-gray-500'} flex items-center gap-1`}>
                                        {isExceeded && <AlertTriangle size={12} />}
                                        {isExceeded
                                            ? `Over by ${formatCurrency(budget.spent - budget.amount)}`
                                            : `${formatCurrency(budget.amount - budget.spent)} left`
                                        }
                                    </span>
                                    <span className="text-gray-400">{percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
