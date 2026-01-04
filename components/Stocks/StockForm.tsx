'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { SwipeButton } from '@/components/ui/SwipeButton';

interface StockFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    stock?: any;
}

export function StockForm({ isOpen, onClose, onSuccess, stock }: StockFormProps) {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        quantity: '',
        buyPrice: '',
        sellPrice: '',
        broker: '',
        type: 'BUY',
        date: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (stock) {
            setFormData({
                symbol: stock.symbol,
                name: stock.name,
                quantity: stock.quantity.toString(),
                buyPrice: stock.buyPrice.toString(),
                sellPrice: stock.sellPrice?.toString() || '',
                broker: stock.broker || '',
                type: stock.type,
                date: stock.date ? new Date(stock.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
        }
    }, [stock]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.symbol || !formData.name || !formData.quantity || !formData.buyPrice) {
            showToast('error', 'Please fill in all required fields');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                quantity: parseFloat(formData.quantity),
                buyPrice: parseFloat(formData.buyPrice),
                sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : null,
            };

            const url = stock ? `/api/stocks/${stock.id}` : '/api/stocks';
            const method = stock ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save stock');
            }

            // Show appropriate message based on whether stock was averaged
            if (data.averaged) {
                showToast('success', data.message || 'Stock averaged successfully');
            } else {
                showToast('success', stock ? 'Stock updated successfully' : 'Stock added successfully');
            }

            setLoading(false);
            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            setError(err.message);
            showToast('error', err.message);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            symbol: '',
            name: '',
            quantity: '',
            buyPrice: '',
            sellPrice: '',
            broker: '',
            type: 'BUY',
            date: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={stock ? 'Edit Stock' : 'Add Stock'}
            size="md"
        >
            <div className="mb-6 -mt-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {stock ? 'Update your stock details' : 'Add a new stock to your portfolio'}
                </p>
                {!stock && (
                    <div className="mt-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Portfolio Tips</h4>
                        </div>
                        <ul className="space-y-1.5">
                            <li className="text-[11px] font-medium text-blue-700/80 dark:text-blue-300/80 flex gap-2">
                                <span className="opacity-50 mt-1">•</span>
                                <span>For BSE stocks with names (like <b>PRADHIN</b>), enter <b>PRADHIN.BO</b> to force live data.</span>
                            </li>
                            <li className="text-[11px] font-medium text-blue-700/80 dark:text-blue-300/80 flex gap-2">
                                <span className="opacity-50 mt-1">•</span>
                                <span>Enter alphabetic symbols for NSE (e.g. RELIANCE) and numeric IDs for BSE (e.g. 530095).</span>
                            </li>
                            <li className="text-[11px] font-medium text-blue-700/80 dark:text-blue-300/80 flex gap-2">
                                <span className="opacity-50 mt-1">•</span>
                                <span>Each transaction is saved separately. Use the <b>Consolidated</b> view toggle to see merged totals with average price and all brokers.</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">

                    <Input
                        label="Stock Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Company Name"
                        required
                    />
                    <Input
                        label="Stock Symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        placeholder="Stock Symbol"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        required
                        min="0.01"
                        step="0.01"
                    />
                    <DatePicker
                        label="Date"
                        value={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">

                    <Input
                        label="Buy Price"
                        type="number"
                        value={formData.buyPrice}
                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                        placeholder="0.00"
                        required
                        leftIcon={<span className="text-gray-500">₹</span>}
                    />
                    <Input
                        label="Sell Price (Optional)"
                        type="number"
                        value={formData.sellPrice}
                        onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                        placeholder="0.00"
                        leftIcon={<span className="text-gray-500">₹</span>}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Broker"
                        value={formData.broker}
                        onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                        placeholder="e.g. Zerodha, Groww"
                        leftIcon={<div className="h-4 w-1 bg-blue-500 rounded-full" />}
                    />
                    <Select
                        label="Transaction Type"
                        value={formData.type}
                        onChange={(value) => setFormData({ ...formData, type: value })}
                        options={[
                            { value: 'BUY', label: 'Buy' },
                            { value: 'SELL', label: 'Sell' },
                        ]}
                    />
                </div>

                <div className="pt-2">
                    <SwipeButton
                        text={stock ? "Swipe to Update" : "Swipe to Add Stock"}
                        loadingText={stock ? "Updating..." : "Adding..."}
                        isLoading={loading}
                        onComplete={() => handleSubmit()}
                        disabled={!formData.symbol || !formData.name || !formData.quantity || !formData.buyPrice}
                    />
                </div>
            </form>
        </Modal>
    );
}
