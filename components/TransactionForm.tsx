'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { useActivityLog } from '@/hooks/useActivityLog';

import { SwipeButton } from '@/components/ui/SwipeButton';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transaction?: any;
}

export function TransactionForm({ isOpen, onClose, onSuccess, transaction }: TransactionFormProps) {
    const { showToast } = useToast();
    const { logTransactionAdded, logTransactionUpdated } = useActivityLog();
    const [formData, setFormData] = useState({
        type: 'expense',
        categoryGroup: 'Expense',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],

        notes: '',
        categoryId: '',
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (transaction) {
            // Extract date in YYYY-MM-DD format from ISO string or use as-is if already formatted
            let dateStr = transaction.date;
            if (dateStr && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }
            setFormData({
                type: transaction.type,
                categoryGroup: transaction.categoryGroup,
                category: transaction.category,
                amount: transaction.amount.toString(),
                date: dateStr,
                notes: transaction.notes || '',
                categoryId: transaction.categoryId || '',
            });
        }
    }, [transaction]);

    useEffect(() => {
        // Fetch categories whenever categoryGroup changes
        fetchCategories(formData.categoryGroup);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.categoryGroup]);

    const fetchCategories = async (group: string) => {
        try {
            const response = await fetch(`/api/categories?categoryGroup=${group}`);
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleTypeChange = (type: string) => {
        const groupMap: Record<string, string> = {
            income: 'Income',
            expense: 'Expense',
            investment: 'Investment',
        };
        const newGroup = groupMap[type];
        setFormData(prev => ({
            ...prev,
            type,
            categoryGroup: newGroup,
            category: '', // Reset category when type changes
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation check
        if (!formData.amount || !formData.category) {
            showToast('error', 'Please fill in all required fields');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
            };

            const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions';
            const method = transaction ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = data.error || 'Failed to save transaction';
                setError(errorMessage);
                showToast('error', errorMessage);
                setLoading(false);
                return;
            }

            showToast('success', transaction ? 'Transaction updated successfully' : 'Transaction added successfully');

            // Log activity
            if (transaction) {
                logTransactionUpdated(parseFloat(formData.amount), formData.category);
            } else {
                logTransactionAdded(parseFloat(formData.amount), formData.category, formData.type);
            }

            setLoading(false);
            onSuccess();
            onClose();
            resetForm();
        } catch (err) {
            const errorMessage = 'An error occurred. Please try again.';
            setError(errorMessage);
            showToast('error', errorMessage);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'expense',
            categoryGroup: 'Expense',
            category: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],

            notes: '',
            categoryId: '',
        });
    };

    const categoryOptions = categories.map((cat) => ({
        value: cat.name,
        label: cat.name,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={transaction ? 'Edit Transaction' : 'Add Transaction'}
            size="md"
        >
            <div className="mb-6 -mt-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {transaction ? 'Update your transaction details' : 'Add a new financial transaction'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Segmented Control for Type */}
                <div className="bg-blue-50 dark:bg-gray-800 p-1 rounded-xl flex">
                    {['income', 'expense', 'investment'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleTypeChange(type)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all duration-200 ${formData.type === type
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Amount Input */}
                <Input
                    label="Amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                    leftIcon={<span className="text-gray-500 font-semibold">₹</span>}
                    className="text-lg"
                />

                {/* Category Select */}
                <Select
                    label="Category"
                    value={formData.category}
                    onChange={(value) => {
                        const selectedCat = categories.find(c => c.name === value);
                        setFormData({
                            ...formData,
                            category: value,
                            categoryId: selectedCat?.id
                        });
                    }}
                    options={categoryOptions}
                    placeholder="Select Category"
                />

                {/* Date Picker */}
                <DatePicker
                    label="Date"
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                />

                {/* Description / Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Description (Optional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="What was this for?"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none transition-all duration-200"
                    />
                </div>

                {/* Swipe to Submit Button */}
                <div className="pt-2">
                    <SwipeButton
                        text={transaction ? "Swipe to Update" : "Swipe to Add Transaction"}
                        loadingText={transaction ? "Updating..." : "Adding..."}
                        isLoading={loading}
                        onComplete={() => handleSubmit()}
                        disabled={!formData.amount || !formData.category}
                    />
                </div>
            </form>
        </Modal>
    );
}
