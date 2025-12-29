import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Target, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function QuickActions() {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        {
            label: 'Add Income',
            icon: ArrowUpRight,
            href: '/transactions?type=income',
            color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        {
            label: 'Add Expense',
            icon: ArrowDownLeft,
            href: '/transactions?type=expense',
            color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        },
        {
            label: 'Add Investment',
            icon: Target,
            href: '/investments',
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            label: 'Set Budget',
            icon: Wallet,
            href: '/budgets',
            color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        },
    ];

    return (
        <div className="mb-8 overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group",
                        isOpen
                            ? "bg-rose-500 text-white rotate-90 scale-90"
                            : "bg-primary-600 text-white hover:scale-110"
                    )}
                >
                    {isOpen ? <X size={24} /> : <Plus size={24} />}
                </button>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                        {isOpen ? "Close Actions" : "Quick Actions"}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400">
                        {isOpen ? "Hide the action menu" : "Click the + to manage your money"}
                    </p>
                </div>
            </div>

            <div className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-500 ease-in-out origin-top",
                isOpen ? "max-h-[500px] opacity-100 scale-100 visible mt-2" : "max-h-0 opacity-0 scale-95 invisible"
            )}>
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="glass-card p-4 flex flex-col items-center justify-center gap-3 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${action.color.split(' ')[0]}`} />

                        <div className={`p-3 rounded-2xl ${action.color} group-hover:scale-110 transition-transform duration-500`}>
                            <action.icon size={24} />
                        </div>
                        <span className="text-xs font-black text-gray-700 dark:text-gray-200 tracking-tight">
                            {action.label}
                        </span>
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-primary-500 transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
