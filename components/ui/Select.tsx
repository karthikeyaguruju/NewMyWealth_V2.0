'use client';

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    error,
    disabled = false,
}: SelectProps) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        className={cn(
                            'relative w-full px-4 py-3 rounded-xl border text-left transition-all duration-300',
                            'bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white',
                            'border-gray-200 dark:border-white/10 text-base',
                            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed',
                            error && 'border-red-500 focus:ring-red-500'
                        )}
                    >
                        <span className={cn(!selectedOption && 'text-gray-400 dark:text-gray-500')}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-900 py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 dark:border-gray-700">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    className={({ active }) =>
                                        cn(
                                            'relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors',
                                            active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                                                {option.label}
                                            </span>
                                            {selected && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
