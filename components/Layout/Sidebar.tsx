'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    ArrowLeftRight,
    TrendingUp,
    Settings,
    LogOut,
    X,
    PieChart,
    ChevronDown,
    User,
    Bell,
    FolderOpen,
    Clock,
    Plus,
    CreditCard,
    LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

interface UserData {
    fullName: string;
    email: string;
}

const mainItems = [
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
        name: 'Stocks',
        href: '/stocks',
        icon: LineChart,
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
];

const settingsSubItems = [
    {
        name: 'Profile',
        href: '/profile?tab=profile',
        tab: 'profile',
        icon: User,
    },
    {
        name: 'Budget Tracker',
        href: '/profile?tab=budget',
        tab: 'budget',
        icon: Bell,
    },
    {
        name: 'Categories',
        href: '/profile?tab=categories',
        tab: 'categories',
        icon: FolderOpen,
    },
    {
        name: 'Activity Log',
        href: '/profile?tab=activity',
        tab: 'activity',
        icon: Clock,
    },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <Suspense fallback={<div className="w-72 hidden md:block bg-white dark:bg-[#0a0f1d]" />}>
            <SidebarContent isOpen={isOpen} onClose={onClose} />
        </Suspense>
    );
}

function SidebarContent({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'profile';
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(pathname.startsWith('/profile'));

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
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-all duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0a0f1d] border-r border-gray-100 dark:border-white/5 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen",
                isOpen ? "translate-x-0" : "-translate-x-full shadow-2xl md:shadow-none"
            )}>
                <div className="flex flex-col h-full">
                    {/* Brand/Logo Section */}
                    <div className="px-7 py-8">
                        <div className="flex items-center justify-between">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Finance</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Dashboard</span>
                                </div>
                            </Link>
                            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-hidden hover:overflow-y-auto custom-scrollbar">
                        {mainItems.map((item) => {
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
                                            ? 'bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    )}
                                >
                                    {/* Active border indicator like in reference */}
                                    {isActive && (
                                        <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-600 rounded-r-full" />
                                    )}
                                    <Icon size={19} className={cn('transition-colors', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white')} />
                                    <span className="text-[14px] font-semibold tracking-wide">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Area: Account Section */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-black/20">
                        <div className="mb-2 px-3">
                            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Account</h3>
                        </div>

                        <div className="space-y-1">
                            {/* Settings Dropdown */}
                            <button
                                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                                className={cn(
                                    'w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all group',
                                    pathname.startsWith('/profile')
                                        ? 'bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    <Settings size={19} className={cn('transition-transform duration-300', isSettingsExpanded ? 'rotate-45 text-blue-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white')} />
                                    <span className="text-[14px] font-semibold tracking-wide">Settings</span>
                                </div>
                                <ChevronDown size={14} className={cn('transition-transform duration-300 opacity-50', isSettingsExpanded ? 'rotate-180' : '')} />
                            </button>

                            {/* Dropdown Items */}
                            <div className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out pl-6",
                                isSettingsExpanded ? "max-h-60 pb-2 mt-1" : "max-h-0"
                            )}>
                                <div className="border-l border-gray-200 dark:border-white/10 space-y-0.5">
                                    {settingsSubItems.map((subItem) => {
                                        const isSubActive = pathname === '/profile' && currentTab === subItem.tab;
                                        return (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                onClick={() => onClose?.()}
                                                className={cn(
                                                    'flex items-center gap-3 px-4 py-2.5 transition-all relative',
                                                    isSubActive
                                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                                )}
                                            >
                                                <span className="text-[13px]">{subItem.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Logout Session */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                            >
                                <LogOut size={19} className="opacity-80 group-hover:-translate-x-0.5 transition-transform" />
                                <span className="text-[14px] font-semibold tracking-wide">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                            </button>
                        </div>

                        {/* Version Info */}
                        <div className="mt-4 px-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                            <span>v2.1.0</span>
                            <span>© 2025</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
