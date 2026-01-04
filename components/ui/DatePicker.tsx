'use client';

import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, setMonth, setYear } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, Transition, Listbox } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
    label?: string;
    value: string | Date;
    onChange: (date: string) => void;
    error?: string;
    className?: string;
}

export function DatePicker({ label, value, onChange, error, className }: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
    const dateValue = useMemo(() => value ? new Date(value) : null, [value]);

    const daysInMonth = useMemo(() => eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    }), [currentMonth]);

    const startDay = getDay(startOfMonth(currentMonth));
    const emptyDays = Array(startDay).fill(null);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleDateClick = (date: Date, close: () => void) => {
        onChange(format(date, 'yyyy-MM-dd'));
        close();
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
    }, []);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {label}
                </label>
            )}
            <Popover className="relative">
                {({ open, close }) => (
                    <>
                        <Popover.Button
                            className={cn(
                                'flex items-center w-full px-4 py-3 rounded-2xl border-2 transition-all duration-300 group',
                                'bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl',
                                open
                                    ? 'border-primary-500 ring-4 ring-primary-500/10'
                                    : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600',
                                'text-gray-900 dark:text-white font-bold text-sm',
                                error && 'border-red-500 focus:ring-red-500'
                            )}
                        >
                            <CalendarIcon className={cn(
                                "h-5 w-5 mr-3 transition-colors",
                                open ? "text-primary-500" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                            )} />
                            <span className="flex-1 text-left">
                                {dateValue ? format(dateValue, 'PPP') : 'Select target date'}
                            </span>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-gray-400 transition-transform duration-300",
                                open && "rotate-180"
                            )} />
                        </Popover.Button>

                        <AnimatePresence>
                            {open && (
                                <Popover.Panel
                                    static
                                    as={motion.div}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute z-[100] mt-3 left-0 sm:w-[300px] glass overflow-hidden rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50"
                                >
                                    {/* Calendar Header */}
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={handlePrevMonth}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 dark:text-gray-300"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>

                                                <div className="flex items-center px-1">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1 uppercase tracking-tight">
                                                        {format(currentMonth, 'MMMM')}
                                                        <span className="text-primary-500 ml-0.5">{format(currentMonth, 'yyyy')}</span>
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleNextMonth}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm active:scale-95 text-gray-600 dark:text-gray-300"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDateClick(new Date(), close)}
                                                className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-100 transition-colors"
                                            >
                                                Today
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="grid grid-cols-7 gap-1 text-center mb-3">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                                <div key={day} className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {emptyDays.map((_, i) => (
                                                <div key={`empty-${i}`} className="h-8 w-8" />
                                            ))}
                                            {daysInMonth.map((date) => {
                                                const isSelected = dateValue && isSameDay(date, dateValue);
                                                const isCurrentMonth = isSameMonth(date, currentMonth);
                                                const isTodayDate = isToday(date);

                                                return (
                                                    <button
                                                        key={date.toString()}
                                                        type="button"
                                                        onClick={() => handleDateClick(date, close)}
                                                        className={cn(
                                                            'h-8 w-8 rounded-xl text-xs flex items-center justify-center transition-all relative group',
                                                            isSelected
                                                                ? 'bg-primary-600 text-white font-black shadow-lg shadow-primary-500/30 scale-110 z-10'
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
                                                            isTodayDate && !isSelected && 'text-primary-600 font-bold',
                                                            !isCurrentMonth && 'opacity-20 pointer-events-none'
                                                        )}
                                                    >
                                                        {isTodayDate && !isSelected && (
                                                            <span className="absolute bottom-1 w-1 h-1 bg-primary-500 rounded-full" />
                                                        )}
                                                        {format(date, 'd')}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange('');
                                                close();
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                </Popover.Panel>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </Popover>
            {error && (
                <p className="mt-2 text-xs font-bold text-red-500 px-1 italic flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" />
                    {error}
                </p>
            )}
        </div>
    );
}
