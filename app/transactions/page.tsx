'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { TransactionForm } from '@/components/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import {
    Plus, Pencil, Trash2, Search, Filter, X, Calendar, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, BanknoteIcon, ArrowUpRight, ArrowDownRight,
    TrendingUp, Receipt, LayoutGrid, LineChart
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StockForm } from '@/components/Stocks/StockForm';
import {
    Info,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
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

function TransactionsContent() {
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
    const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<Transaction | null>(null);

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

    // Stock state
    const [stocks, setStocks] = useState<any[]>([]);
    const [stocksLoading, setStocksLoading] = useState(false);
    const [isStockFormOpen, setIsStockFormOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<any>(null);
    const [stockFilters, setStockFilters] = useState({
        search: '',
        type: 'all'
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 5;

    // Stock pagination state
    const [stockPage, setStockPage] = useState(1);
    const [totalStockPages, setTotalStockPages] = useState(1);
    const [totalStockItems, setTotalStockItems] = useState(0);

    // Handle auto-opening form if type is provided in URL
    useEffect(() => {
        if (initialType && ['income', 'expense', 'investment'].includes(initialType)) {
            setIsFormOpen(true);
            // Clear search param to prevent re-opening on refresh/navigation back
            const newUrl = window.location.pathname;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
    }, [initialType]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500); // Debounce for search inputs
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    useEffect(() => {
        setStockPage(1);
    }, [stockFilters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStocks();
        }, 500);
        return () => clearTimeout(timer);
    }, [stockPage, stockFilters]);

    const fetchStocks = async () => {
        try {
            setStocksLoading(true);
            const params = new URLSearchParams();
            params.append('page', stockPage.toString());
            params.append('limit', '5');
            if (stockFilters.search) params.append('search', stockFilters.search);
            if (stockFilters.type !== 'all') params.append('type', stockFilters.type);

            const response = await fetch(`/api/stocks?${params.toString()}`);
            const data = await response.json();
            setStocks(data.stocks || []);
            setTotalStockPages(data.pagination?.pages || 1);
            setTotalStockItems(data.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to fetch stocks:', error);
        } finally {
            setStocksLoading(false);
        }
    };

    const handleStockDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this stock?')) return;
        try {
            const response = await fetch(`/api/stocks/${id}`, { method: 'DELETE' });
            if (response.ok) {
                showToast('success', 'Stock deleted successfully');
                fetchStocks();
            } else {
                const data = await response.json();
                throw new Error(data.error);
            }
        } catch (error: any) {
            showToast('error', error.message);
        }
    };

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

    // Quick filter buttons
    const quickFilters = [
        { type: '', label: 'All', icon: LayoutGrid },
        { type: 'income', label: 'Income', icon: ArrowUpRight },
        { type: 'expense', label: 'Expense', icon: ArrowDownRight },
        { type: 'investment', label: 'Investment', icon: TrendingUp },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Receipt className="text-violet-500 animate-pulse" size={28} />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Transactions</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Track and manage all your financial activities</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingTransaction(undefined);
                            setIsFormOpen(true);
                        }}
                        size="lg"
                        className="rounded-2xl shadow-lg shadow-primary-600/20 md:px-6"
                        icon={<Plus size={20} />}
                    >
                        <span className="hidden sm:inline">Add Transaction</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>

                {/* Quick Filters & Search Toolbar */}
                <div className="glass-card p-6 overflow-visible relative z-30">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Quick Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {quickFilters.map((qf) => (
                                <button
                                    key={qf.type}
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, type: qf.type }));
                                        setCurrentPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${filters.type === qf.type
                                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <qf.icon size={16} />
                                    {qf.label}
                                </button>
                            ))}
                        </div>

                        {/* Search & Sort */}
                        <div className="flex flex-1 gap-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search transactions..."
                                    leftIcon={<Search size={18} />}
                                    value={filters.description}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, description: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                icon={<Filter size={18} />}
                                className={`${showFilters ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-600' : ''}`}
                            >
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                            <div className="w-48 hidden md:block">
                                <Select
                                    value={currentSortValue}
                                    onChange={handleSortChange}
                                    options={sortOptions}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filter Panel */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                                <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X size={16} />}>
                                    Clear All
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Input
                                    label="Category"
                                    placeholder="Filter by category"
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
                                        placeholder="₹0"
                                        value={filters.minAmount}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, minAmount: e.target.value }));
                                            setCurrentPage(1);
                                        }}
                                    />
                                    <Input
                                        label="Max Amount"
                                        type="number"
                                        placeholder="₹∞"
                                        value={filters.maxAmount}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, maxAmount: e.target.value }));
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                                <DatePicker
                                    label="From Date"
                                    value={filters.startDate}
                                    onChange={(date) => {
                                        setFilters(prev => ({ ...prev, startDate: date }));
                                        setCurrentPage(1);
                                    }}
                                />
                                <DatePicker
                                    label="To Date"
                                    value={filters.endDate}
                                    onChange={(date) => {
                                        setFilters(prev => ({ ...prev, endDate: date }));
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Transactions Table */}
                <div className="glass-card overflow-hidden relative z-10">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {totalItems} total transactions
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-violet-200 border-t-violet-600"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
                            </div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Receipt className="text-violet-500" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                                Try adjusting your filters or add your first transaction to get started.
                            </p>
                            <Button icon={<Plus size={20} />} onClick={() => setIsFormOpen(true)}>
                                Add Your First Transaction
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-12">#</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Date</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Category</th>
                                            <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Description</th>
                                            <th className="text-center py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Amount</th>
                                            <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {transactions.map((transaction, idx) => (
                                            <tr
                                                key={transaction.id}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-6 text-sm text-gray-400 font-medium">
                                                    <button
                                                        onClick={() => setSelectedDetailTransaction(transaction)}
                                                        className="hover:text-violet-600 transition-colors bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md font-bold text-xs border border-transparent hover:border-violet-300"
                                                    >
                                                        {((currentPage - 1) * ITEMS_PER_PAGE + idx + 1).toString().padStart(2, '0')}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {formatDate(transaction.date)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant={transaction.type as any}>
                                                        {transaction.type}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {transaction.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {transaction.notes || '-'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {transaction.type === 'investment' ? (
                                                        transaction.status === 'terminated' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                                <CheckCircle size={12} />
                                                                Terminated
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <CheckCircle size={12} />
                                                                Active
                                                            </span>
                                                        )
                                                    ) : transaction.type === 'income' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            <ArrowUpRight size={12} />
                                                            Credit
                                                        </span>
                                                    ) : transaction.type === 'expense' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                                            <ArrowDownRight size={12} />
                                                            Debit
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`text-sm font-bold ${transaction.type === 'income'
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : transaction.type === 'expense'
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-blue-600 dark:text-blue-400'
                                                        }`}>
                                                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                                        {formatCurrency(transaction.amount)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-1">
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
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-400 hover:text-violet-600 opacity-0 group-hover:opacity-100"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transaction.id)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
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

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                    <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of{' '}
                                    <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        icon={<ChevronLeft size={16} />}
                                    >
                                        <span className="hidden sm:inline">Previous</span>
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${currentPage === pageNum
                                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <TransactionForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                    transaction={editingTransaction}
                    initialType={initialType && ['income', 'expense', 'investment'].includes(initialType) ? initialType : undefined}
                />

                {/* Transaction Detail Modal */}
                <Modal
                    isOpen={!!selectedDetailTransaction}
                    onClose={() => setSelectedDetailTransaction(null)}
                    title="Transaction Details"
                    size="md"
                >
                    {selectedDetailTransaction && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                        selectedDetailTransaction.type === 'income' ? "bg-emerald-50 text-emerald-600" :
                                            selectedDetailTransaction.type === 'expense' ? "bg-rose-50 text-rose-600" :
                                                "bg-violet-50 text-violet-600"
                                    )}>
                                        {selectedDetailTransaction.type === 'income' ? <ArrowUpRight size={24} /> :
                                            selectedDetailTransaction.type === 'expense' ? <ArrowDownRight size={24} /> :
                                                <TrendingUp size={24} />}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                                            {formatCurrency(selectedDetailTransaction.amount)}
                                        </p>
                                        <Badge variant={selectedDetailTransaction.type as any}>{selectedDetailTransaction.type}</Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                                        {selectedDetailTransaction.status === 'terminated' ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                                <span className="text-sm font-black text-gray-500 uppercase tracking-tight">Terminated</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-sm font-black text-emerald-600 uppercase tracking-tight">
                                                    {selectedDetailTransaction.type === 'investment' ? 'Active' : 'Paid'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                        <Calendar size={14} className="text-gray-400" />
                                        {formatDate(selectedDetailTransaction.date)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{selectedDetailTransaction.category}</p>
                                </div>
                            </div>

                            <div className="space-y-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium capitalize">
                                    {selectedDetailTransaction.notes || "No description provided."}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        handleEdit(selectedDetailTransaction);
                                        setSelectedDetailTransaction(null);
                                    }}
                                    icon={<Pencil size={16} />}
                                >
                                    Edit Transaction
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() => setSelectedDetailTransaction(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Stock Form */}
                <StockForm
                    isOpen={isStockFormOpen}
                    onClose={() => {
                        setIsStockFormOpen(false);
                        setEditingStock(null);
                    }}
                    onSuccess={() => {
                        setStockPage(1);
                        fetchStocks();
                    }}
                    stock={editingStock}
                />

                {/* Stock History Section */}
                <div className="mt-12 glass-card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LineChart className="text-blue-500 animate-pulse" size={24} />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Stock Investments</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your equity purchases and sales</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingStock(null);
                                setIsStockFormOpen(true);
                            }}
                            icon={<Plus size={18} />}
                            className="rounded-2xl shadow-lg shadow-blue-500/20"
                        >
                            Add Stock
                        </Button>
                    </div>

                    {/* Stock Filters Toolbar */}
                    <div className="p-4 bg-gray-50/30 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                value={stockFilters.search}
                                onChange={(e) => setStockFilters(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Search symbol or name..."
                                className="pl-10 h-11 rounded-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status:</span>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                                {['all', 'buy', 'sell'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setStockFilters(prev => ({ ...prev, type }))}
                                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${stockFilters.type === type
                                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-12">#</th>
                                    <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Date</th>
                                    <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Stock Name</th>
                                    <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Qty</th>
                                    <th className="text-center py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Buy Price</th>
                                    <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Sell Price</th>
                                    <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Total Amount</th>
                                    <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {stocksLoading ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500">Loading stocks...</td>
                                    </tr>
                                ) : stocks.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500">No stock transactions found</td>
                                    </tr>
                                ) : (
                                    stocks.map((stock, idx) => (
                                        <tr key={stock.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {formatDate(stock.date || stock.createdAt)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{stock.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-900 dark:text-white font-semibold">{stock.quantity}</td>
                                            <td className="py-4 px-6 text-center">
                                                <Badge variant={stock.type === 'BUY' ? 'income' : 'expense'}>
                                                    {stock.type}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                {stock.type === 'BUY' ? formatCurrency(stock.buyPrice) : '-'}
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                {(stock.type === 'SELL' && stock.sellPrice) ? formatCurrency(stock.sellPrice) : '-'}
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(stock.type === 'BUY' ? (stock.quantity * stock.buyPrice) : (stock.quantity * (stock.sellPrice || 0)))}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingStock(stock);
                                                            setIsStockFormOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-violet-600 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStockDelete(stock.id)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Stock Pagination */}
                    {totalStockPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{(stockPage - 1) * 5 + 1}</span> to{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{Math.min(stockPage * 5, totalStockItems)}</span> of{' '}
                                <span className="font-semibold text-gray-900 dark:text-white">{totalStockItems}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStockPage(prev => Math.max(prev - 1, 1))}
                                    disabled={stockPage === 1}
                                    className="rounded-xl px-3"
                                >
                                    <ChevronLeft size={16} className="mr-1" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1 mx-2">
                                    {Array.from({ length: totalStockPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setStockPage(page)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${stockPage === page
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStockPage(prev => Math.min(prev + 1, totalStockPages))}
                                    disabled={stockPage === totalStockPages}
                                    className="rounded-xl px-3"
                                >
                                    Next
                                    <ChevronRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Terminate Investment Modal */}
                {terminateModalOpen && terminatingTransaction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                                        <BanknoteIcon size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Terminate Investment
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setTerminateModalOpen(false);
                                        setTerminatingTransaction(null);
                                        setMaturityAmount('');
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You are about to terminate your <strong className="text-gray-900 dark:text-white">{terminatingTransaction.category}</strong> investment.
                                </p>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Original Amount:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(terminatingTransaction.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Investment Date:</span>
                                        <span className="text-gray-900 dark:text-white">
                                            {formatDate(terminatingTransaction.date)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Maturity Amount (including interest)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                        <input
                                            type="number"
                                            value={maturityAmount}
                                            onChange={(e) => setMaturityAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                            placeholder="Enter maturity amount"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
                                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none"
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

export default function TransactionsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-violet-200 border-t-violet-600"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </DashboardLayout>
        }>
            <TransactionsContent />
        </Suspense>
    );
}
