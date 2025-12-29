'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, BarChart3, Layers, Zap, Shield, Sparkles, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.email || !formData.password) {
            showToast('error', 'Please enter your email and password');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || 'Login failed';
                setError(errorMessage);
                showToast('error', errorMessage);
                setLoading(false);
                return;
            }

            showToast('success', 'Successfully logged in!');
            router.push('/dashboard');
        } catch (err) {
            const errorMessage = 'An error occurred. Please try again.';
            setError(errorMessage);
            showToast('error', errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden font-inter relative">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-600/10 dark:bg-primary-500/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
            </div>

            {/* Left Side: Premium Visual Content */}
            <div className="hidden lg:flex flex-[0.85] relative overflow-hidden items-center justify-center p-8 lg:p-12">
                {/* Mesh Gradient Overlay */}
                <div className="absolute inset-0 mesh-gradient-1 opacity-40 dark:opacity-20" />

                <div className="relative z-10 max-w-sm w-full">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 glass shadow-xl rounded-xl flex items-center justify-center">
                                <Sparkles className="text-primary-600 dark:text-primary-400" size={28} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mt-1">
                                    My Wealth
                                </h1>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-600 dark:text-primary-400">Finance</p>
                            </div>
                        </div>

                        <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6 tracking-tight">
                            Elevate your <br />
                            <span className="text-gradient">Financial Future.</span>
                        </h2>

                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                    className="group flex gap-4 p-4 rounded-[20px] bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/5 backdrop-blur-md hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 shadow-sm"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-md group-hover:scale-105 transition-transform duration-500">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 dark:text-white text-base mb-0.5">{feature.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 relative z-10 bg-slate-50/30 dark:bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-[420px]"
                >
                    <div className="mb-8 text-center lg:hidden">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 glass shadow-lg rounded-xl flex items-center justify-center">
                                <Sparkles className="text-primary-600 dark:text-primary-400" size={24} />
                            </div>
                            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">ANTIGRAVITY</span>
                        </div>
                    </div>

                    <div className="glass-card p-6 sm:p-10 relative overflow-hidden">
                        {/* Decorative background shape */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                    Login
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight text-sm">
                                    Access your financial command center.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <AnimatePresence mode='wait'>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-3.5">
                                    <Input
                                        type="email"
                                        label="Email"
                                        placeholder="commander@antigravity.io"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        leftIcon={<Mail size={18} className="text-gray-400" />}
                                        required
                                        className="rounded-[16px] border-gray-100 dark:border-white/5 focus:ring-primary-600"
                                    />

                                    <Input
                                        type="password"
                                        label="Access Key"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        leftIcon={<Lock size={18} className="text-gray-400" />}
                                        required
                                        className="rounded-[16px] border-gray-100 dark:border-white/5"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded bg-gray-100 dark:bg-slate-800 border-none text-primary-600" />
                                        <span>Remember Me</span>
                                    </label>
                                    {/* <button type="button" className="hover:text-primary-600 transition-colors">Lost Key?</button> */}
                                </div>

                                <div className="pt-4">
                                    <SwipeButton
                                        text="Swipe to Sign In"
                                        loadingText="Signing In..."
                                        isLoading={loading}
                                        onComplete={() => handleSubmit()}
                                        disabled={!formData.email || !formData.password}
                                        className="h-14 rounded-[18px]"
                                    />
                                </div>
                            </form>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 text-center">
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                    Don't have an account? {' '}
                                    <Link
                                        href="/signup"
                                        className="text-primary-600 dark:text-primary-400 font-black hover:underline underline-offset-4 decoration-2"
                                    >
                                        Create One
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <Shield size={12} className="text-emerald-500" />
                            <span>Secure Sync</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-slate-800" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Terminal v2.4
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Right Theme Toggle */}
            <div className="absolute bottom-6 right-6 z-50">
                <button
                    onClick={toggleTheme}
                    className="w-12 h-12 rounded-full glass shadow-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 dark:border-white/10 group"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'dark' ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun size={20} className="group-hover:text-amber-500 transition-colors" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon size={20} className="group-hover:text-indigo-600 transition-colors" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
}

const features = [
    {
        title: "Defy Gravity",
        description: "Scale your net worth with real-time portfolio tracking.",
        icon: <Zap size={20} />
    },
    {
        title: "Deep Analytics",
        description: "Uncover hidden patterns in your spending habits.",
        icon: <BarChart3 size={20} />
    },
    {
        title: "Asset Management",
        description: "Manage stocks, bonds, and digital assets unified.",
        icon: <Layers size={20} />
    }
];
