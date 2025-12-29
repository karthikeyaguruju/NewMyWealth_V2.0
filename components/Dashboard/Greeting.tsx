'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Sun, Moon, Cloud, SunDim, Plus, X, ArrowUpRight, ArrowDownLeft, Target, Wallet } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface GreetingProps {
    userName?: string;
}

export function Greeting({ userName = 'User' }: GreetingProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hour = new Date().getHours();

    const getGreetingDetails = () => {
        if (hour >= 5 && hour < 12) {
            return { text: 'Good Morning', icon: SunDim };
        } else if (hour >= 12 && hour < 17) {
            return { text: 'Good Afternoon', icon: Sun };
        } else if (hour >= 17 && hour < 21) {
            return { text: 'Good Evening', icon: Cloud };
        } else {
            return { text: 'Good Night', icon: Moon };
        }
    };

    const { text: greeting, icon: Icon } = getGreetingDetails();

    const actions = [
        {
            label: 'Add Income',
            icon: ArrowUpRight,
            href: '/transactions?type=income',
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Add Expense',
            icon: ArrowDownLeft,
            href: '/transactions?type=expense',
            color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        },
        {
            label: 'Add Investment',
            icon: Target,
            href: '/transactions?type=investment',
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Set Budget',
            icon: Wallet,
            href: '/profile?tab=budget',
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        },
    ];

    return (
        <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Icon className="text-yellow-600 dark:text-yellow-500 animate-pulse" size={24} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {greeting}, <span className="text-gradient">{userName}</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium md:ml-[52px]">
                        Here's what's happening with your finances today, {format(new Date(), 'MMMM do, yyyy')}.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 shadow-lg group relative overflow-hidden",
                            isOpen
                                ? "bg-rose-500 text-white scale-95"
                                : "bg-primary-600 text-white hover:scale-105"
                        )}
                    >
                        <div className={cn("transition-transform duration-500", isOpen && "rotate-90")}>
                            {isOpen ? <X size={20} /> : <Plus size={20} />}
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">
                            {isOpen ? "Close Menu" : "Quick Actions"}
                        </span>

                        {!isOpen && (
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-500 ease-in-out origin-top",
                isOpen ? "max-h-[500px] opacity-100 scale-100 visible" : "max-h-0 opacity-0 scale-95 invisible"
            )}>
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="glass-card p-4 flex flex-col items-center justify-center gap-3 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Hover Background */}
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300", action.color.split(' ')[0])} />

                        <div className={cn("p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110", action.color)}>
                            <action.icon size={24} />
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-gray-200 tracking-tight">
                            {action.label}
                        </span>

                        {/* Subtle corner indicator */}
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 group-hover:bg-primary-500 transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
