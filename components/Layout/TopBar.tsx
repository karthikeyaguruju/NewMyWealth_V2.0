'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationBell } from '@/components/NotificationBell';

interface TopBarProps {
    onMenuClick: () => void;
}

// Get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
        return 'Good Evening';
    } else {
        return 'Welcome';
    }
}

// Get first name from full name
function getFirstName(fullName: string): string {
    if (!fullName) return 'There';
    const firstName = fullName.split(' ')[0];
    return firstName || 'There';
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');
    const [userName, setUserName] = useState<string>('');
    const [greeting, setGreeting] = useState<string>('Welcome');

    useEffect(() => {
        // Fetch user profile
        fetchUserProfile();

        // Set greeting based on time
        setGreeting(getGreeting());

        // Update greeting every minute
        const interval = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUserName(data.user?.fullName || '');
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const displayName = getFirstName(userName);

    return (
        <header className="glass sticky top-4 z-20 mx-6 mt-4 md:mx-8 md:mt-6 rounded-2xl border border-white/20 dark:border-white/10 p-4 flex items-center justify-between transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                    <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="hidden md:flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Overview</p>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{currentDate}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? (
                        <Moon size={20} className="text-gray-700 dark:text-gray-300" />
                    ) : (
                        <Sun size={20} className="text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            </div>
        </header>
    );
}
