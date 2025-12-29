'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { TransactionForm } from '@/components/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Pencil, Trash2, Search, Filter, X, Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, BanknoteIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useRouter, useSearchParams } from 'next/navigation';

interface Transaction {
    id: string;
    type: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    status?: string;
}

// Categories that can be terminated (Fixed Deposits and Bonds)
const TERMINABLE_CATEGORIES = ['Fixed Deposits', 'Bonds'];

export default function TransactionsPage() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialType = searchParams.get('type');

    const { logTransactionDeleted, logInvestmentTerminated } = useActivityLog();
    // Core state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
    const [showFilters, setShowFilters] = useState(false);
    const [terminateModalOpen, setTerminateModalOpen] = useState(false);
    const [terminatingTransaction, setTerminatingTransaction] = useState<Transaction | null>(null);
    const [maturityAmount, setMaturityAmount] = useState('');
    const [terminateLoading, setTerminateLoading] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        type: initialType && ['income', 'expense', 'investment'].includes(initialType) ? initialType : '',
        category: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        description: '',
        sortBy: 'date',
        order: 'desc',
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Handle auto-opening form if type is provided in URL
    useEffect(() => {
        if (initialType && ['income', 'expense', 'investment'].includes(initialType)) {
            setIsFormOpen(true);
            // Clear search param to prevent re-opening on refresh/navigation back
            const newUrl = window.location.pathname;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
    }, [initialType]);

    // Load transactions on mount and when filters/page change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500); // Debounce for search inputs
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());

            if (filters.type && filters.type !== 'all') params.append('type', filters.type);
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.minAmount) params.append('minAmount', filters.minAmount);
            if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
            if (filters.description) params.append('description', filters.description);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.order) params.append('order', filters.order);

            const response = await fetch('/api/transactions?' + params.toString());
            const data = await response.json();

            setTransactions(data.transactions || []);
            if (data.pagination) {
                setTotalPages(data.pagination.pages);
                setTotalItems(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            showToast('error', 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Find the transaction before deleting (for logging purposes)
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');

            showToast('success', 'Transaction deleted successfully');

            // Log activity
            if (transactionToDelete) {
                logTransactionDeleted(transactionToDelete.amount, transactionToDelete.category);
            }

            fetchTransactions();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            showToast('error', 'Failed to delete transaction');
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingTransaction(undefined);
    };

    const handleFormSuccess = () => {
        fetchTransactions();
    };

    // Open terminate modal for FD/Bond investments
    const openTerminateModal = (transaction: Transaction) => {
        setTerminatingTransaction(transaction);
        setMaturityAmount(transaction.amount.toString());
        setTerminateModalOpen(true);
    };

    // Handle investment termination
    const handleTerminate = async () => {
        if (!terminatingTransaction) return;

        setTerminateLoading(true);
        try {
            const finalMaturityAmount = parseFloat(maturityAmount) || terminatingTransaction.amount;
            const response = await fetch(`/api/transactions/${terminatingTransaction.id}/terminate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maturityAmount: finalMaturityAmount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to terminate investment');
            }

            showToast('success', 'Investment terminated successfully! Amount added to income.');

            // Log activity
            logInvestmentTerminated(
                terminatingTransaction.amount,
                terminatingTransaction.category,
                finalMaturityAmount
            );

            setTerminateModalOpen(false);
            setTerminatingTransaction(null);
            setMaturityAmount('');
            fetchTransactions();
        } catch (error: any) {
            console.error('Failed to terminate investment:', error);
            showToast('error', error.message || 'Failed to terminate investment');
        } finally {
            setTerminateLoading(false);
        }
    };

    // Check if a transaction can be terminated
    const canTerminate = (transaction: Transaction) => {
        return (
            transaction.type === 'investment' &&
            TERMINABLE_CATEGORIES.includes(transaction.category) &&
            transaction.status !== 'terminated'
        );
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            category: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            description: '',
            sortBy: 'date',
            order: 'desc',
        });
        setCurrentPage(1);
    };

    const sortOptions = [
        { value: 'date-desc', label: 'Date (Newest)' },
        { value: 'date-asc', label: 'Date (Oldest)' },
        { value: 'amount-desc', label: 'Amount (High to Low)' },
        { value: 'amount-asc', label: 'Amount (Low to High)' },
    ];

    const handleSortChange = (value: string) => {
        const [sortBy, order] = value.split('-');
        setFilters(prev => ({ ...prev, sortBy, order }));
    };

    const currentSortValue = `${filters.sortBy}-${filters.order}`;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Transactions
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage your financial transactions
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingTransaction(undefined); // Clear any previous edit data
                            setIsFormOpen(true);
                        }}
                        className="w-full sm:w-auto"
                        icon={<Plus size={20} />}
                    >
                        <span className="hidden sm:inline">Add Transaction</span>
                        <span className="sm:hidden">Add New</span>
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="w-full md:flex-1">
                        <Input
                            placeholder="Search by description or category..."
                            leftIcon={<Search size={18} />}
                            value={filters.description}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, description: e.target.value }));
                                setCurrentPage(1);
                            }}
                            className="w-full"
                        />
                    </div>
                    <div className="flex w-full md:w-auto gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            icon={<Filter size={18} />}
                            className={showFilters ? 'bg-gray-100 dark:bg-gray-700' : ''}
                        >
                            Filters
                        </Button>
                        <div className="w-48">
                            <Select
                                value={currentSortValue}
                                onChange={handleSortChange}
                                options={sortOptions}
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <Card className="animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Filter Options</h3>
                                <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X size={16} />}>
                                    Clear Filters
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Select
                                    label="Type"
                                    value={filters.type}
                                    onChange={(val) => {
                                        setFilters(prev => ({ ...prev, type: val }));
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        { value: 'income', label: 'Income' },
                                        { value: 'expense', label: 'Expense' },
                                        { value: 'investment', label: 'Investment' },
                                    ]}
                                    placeholder="All Types"
                                />
                                <Input
                                    label="Category"
                                    placeholder="All Categories"
                                    value={filters.category}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, category: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        label="Min Amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={filters.minAmount}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, minAmount: e.target.value }));
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <Input
                                        label="Max Amount"
                                        type="number"
                                        placeholder="∞"
                                        value={filters.maxAmount}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, maxAmount: e.target.value }));
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                                <Input
                                    label="Date From"
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, startDate: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                                <Input
                                    label="Date To"
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, endDate: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Transactions List */}
                <Card className="overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-gray-50 dark:bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400" size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No transactions found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Try adjusting your filters or add a new transaction.
                            </p>
                            <Button icon={<Plus size={20} />} onClick={() => setIsFormOpen(true)}>
                                Add Transaction
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
                                            <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Type</th>
                                            <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Category</th>
                                            <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Description</th>
                                            <th className="text-center py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                            <th className="text-right py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Amount</th>
                                            <th className="text-right py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {transactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {formatDate(transaction.date)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant={transaction.type as any}>
                                                        {transaction.type}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                                                    {transaction.category}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {transaction.notes || '-'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {/* Show status badge based on transaction type */}
                                                    {transaction.type === 'investment' ? (
                                                        transaction.status === 'terminated' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                                <CheckCircle size={12} />
                                                                Terminated
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                <CheckCircle size={12} />
                                                                Active
                                                            </span>
                                                        )
                                                    ) : transaction.type === 'income' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            <CheckCircle size={12} />
                                                            Credit
                                                        </span>
                                                    ) : transaction.type === 'expense' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                            <XCircle size={12} />
                                                            Debit
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Terminate button for Active FD/Bonds */}
                                                        {canTerminate(transaction) && (
                                                            <button
                                                                onClick={() => openTerminateModal(transaction)}
                                                                className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors text-orange-500 hover:text-orange-600"
                                                                title="Terminate Investment"
                                                            >
                                                                <BanknoteIcon size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(transaction)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing <span className="font-medium">{transactions.length}</span> of <span className="font-medium">{totalItems}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        icon={<ChevronLeft size={16} />}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white px-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        icon={<ChevronRight size={16} />}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>

                <TransactionForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                    transaction={editingTransaction}
                    initialType={initialType && ['income', 'expense', 'investment'].includes(initialType) ? initialType : undefined}
                />

                {/* Terminate Investment Modal */}
                {terminateModalOpen && terminatingTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Terminate Investment
                                </h3>
                                <button
                                    onClick={() => {
                                        setTerminateModalOpen(false);
                                        setTerminatingTransaction(null);
                                        setMaturityAmount('');
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You are about to terminate your <strong className="text-gray-900 dark:text-white">{terminatingTransaction.category}</strong> investment.
                                </p>

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Original Amount:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(terminatingTransaction.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-gray-600 dark:text-gray-400">Investment Date:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {formatDate(terminatingTransaction.date)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Maturity Amount (including interest)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                        <input
                                            type="number"
                                            value={maturityAmount}
                                            onChange={(e) => setMaturityAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Enter maturity amount"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        This amount will be added to your income as "Investment Returns"
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setTerminateModalOpen(false);
                                            setTerminatingTransaction(null);
                                            setMaturityAmount('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                                        onClick={handleTerminate}
                                        loading={terminateLoading}
                                    >
                                        Terminate & Add to Income
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
