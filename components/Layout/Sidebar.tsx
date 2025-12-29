'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, TrendingUp, Settings, LogOut, X, PieChart, Wallet, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const menuItems = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Transactions',
        href: '/transactions',
        icon: ArrowLeftRight,
    },
    {
        name: 'Investments',
        href: '/investments',
        icon: TrendingUp,
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: PieChart,
    },
    {
        name: 'Settings',
        href: '/profile',
        icon: Settings,
    },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            setIsLoggingOut(true);
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
            } catch (error) {
                console.error('Logout failed:', error);
                setIsLoggingOut(false);
            }
        }
    };

    return (
        <>
            <aside className={cn(
                "fixed inset-y-0 left-0 z-30 w-72 glass border-r border-white/20 dark:border-white/10 transform transition-transform duration-500 ease-in-out md:translate-x-0 md:static md:h-screen shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10 px-2">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                                <TrendingUp className="text-white" size={28} />
                            </div>
                            <div>
                                <a href="/dashboard">
                                    <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">My Finance</h1>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Dashboard</p></a>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item, idx) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => onClose?.()}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative',
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:translate-x-1'
                                    )}
                                >
                                    <Icon size={20} className={cn('transition-transform duration-300 group-hover:scale-110', isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600')} />
                                    <span className="font-bold text-sm">{item.name}</span>
                                    {isActive && (
                                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer with Logout */}
                    <div className="pt-6 mt-6 border-t border-white/20 dark:border-white/10 space-y-4">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl font-bold py-6 group"
                            onClick={handleLogout}
                            loading={isLoggingOut}
                        >
                            <LogOut size={20} className="mr-3 group-hover:-translate-x-1 transition-transform" />
                            Logout
                        </Button>


                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            © 2025 My Finance Dashboard
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
