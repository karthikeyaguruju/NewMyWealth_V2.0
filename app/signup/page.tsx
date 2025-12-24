'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrors({});
        setLoading(true);

        // Client-side validation
        const newErrors: Record<string, string> = {};

        if (!formData.fullName) newErrors.fullName = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || 'Signup failed';
                setErrors({ general: errorMessage });
                showToast('error', errorMessage);
                setLoading(false);
                return;
            }

            showToast('success', 'Account created successfully! Please log in.');
            // Redirect to login page on success
            router.push('/login');
        } catch (err) {
            const errorMessage = 'An error occurred. Please try again.';
            setErrors({ general: errorMessage });
            showToast('error', errorMessage);
            setLoading(false);
        }
    };

    const isFormValid = formData.fullName && formData.email && formData.password && formData.confirmPassword && (formData.password === formData.confirmPassword) && formData.password.length >= 6;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg">
                        <UserPlus className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Start managing your finances today
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {errors.general}
                        </div>
                    )}

                    <Input
                        type="text"
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        leftIcon={<User size={18} />}
                        error={errors.fullName}
                        required
                    />

                    <Input
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        leftIcon={<Mail size={18} />}
                        error={errors.email}
                        required
                    />

                    <Input
                        type="password"
                        label="Password"
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        leftIcon={<Lock size={18} />}
                        error={errors.password}
                        required
                    />

                    <Input
                        type="password"
                        label="Confirm Password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        leftIcon={<Lock size={18} />}
                        error={errors.confirmPassword}
                        required
                    />

                    <div className="pt-2">
                        <SwipeButton
                            text="Swipe to Create Account"
                            loadingText="Creating Account..."
                            isLoading={loading}
                            onComplete={() => handleSubmit()}
                            disabled={!isFormValid}
                        />
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
