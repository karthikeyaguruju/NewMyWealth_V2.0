import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, TrendingUp, TrendingDown, Layers, RefreshCw, X, Calendar, User, Tag, IndianRupee, Activity, Briefcase, LayoutList, Combine } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';

interface Stock {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    buyPrice: number;
    sellPrice?: number | null;
    currentPrice?: number | null;
    type: string;
    date?: string | Date | null;
    broker?: string | null;
    totalValue?: number | null;
    totalInvested?: number;
    currentValue?: number;
}

interface StockTableProps {
    stocks: Stock[];
    onEdit: (stock: Stock) => void;
    onDelete: (id: string, symbol: string) => void;
    onRefresh?: () => void;
    loading?: boolean;
    refreshing?: boolean;
}

export function StockTable({ stocks, onEdit, onDelete, onRefresh, loading, refreshing }: StockTableProps) {
    const [detailStock, setDetailStock] = useState<Stock | null>(null);
    const [isConsolidated, setIsConsolidated] = useState(false);

    // Merge stocks by symbol for consolidated view
    const consolidatedStocks = useMemo(() => {
        if (!isConsolidated) return stocks;

        const grouped: Record<string, Stock> = {};
        stocks.forEach(stock => {
            const key = stock.symbol;
            if (!grouped[key]) {
                grouped[key] = {
                    ...stock,
                    id: `consolidated-${key}`,
                    broker: stock.broker || '',
                };
            } else {
                const existing = grouped[key];
                const newQty = existing.quantity + stock.quantity;
                const newTotalInvested = (existing.quantity * existing.buyPrice) + (stock.quantity * stock.buyPrice);
                const avgPrice = newTotalInvested / newQty;

                // Merge brokers
                let brokers = existing.broker || '';
                if (stock.broker) {
                    const existingBrokers = brokers.split(',').map(b => b.trim()).filter(Boolean);
                    if (!existingBrokers.includes(stock.broker.trim())) {
                        brokers = brokers ? `${brokers}, ${stock.broker.trim()}` : stock.broker.trim();
                    }
                }

                grouped[key] = {
                    ...existing,
                    quantity: newQty,
                    buyPrice: avgPrice,
                    broker: brokers,
                    currentPrice: stock.currentPrice || existing.currentPrice,
                };
            }
        });
        return Object.values(grouped);
    }, [stocks, isConsolidated]);

    const displayStocks = isConsolidated ? consolidatedStocks : stocks;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (stocks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-gray-50 dark:bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No stocks added yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Add your stock investments to start tracking your portfolio.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">View:</span>
                    <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1">
                        <button
                            onClick={() => setIsConsolidated(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isConsolidated
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <LayoutList size={14} />
                            All Transactions
                        </button>
                        <button
                            onClick={() => setIsConsolidated(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isConsolidated
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <Combine size={14} />
                            Consolidated
                        </button>
                    </div>
                </div>
                <span className="text-xs text-gray-400">
                    {displayStocks.length} {isConsolidated ? 'holdings' : 'transactions'}
                </span>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 font-bold">
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider w-16">#</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Stock Name</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Symbol</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Broker</th>
                        <th className="text-center py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Qty</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Avg. Buy Price</th>
                        <th className="text-center py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                                Live Price
                                {onRefresh && (
                                    <button
                                        onClick={onRefresh}
                                        disabled={refreshing}
                                        className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50"
                                        title="Refresh Live Prices"
                                    >
                                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                    </button>
                                )}
                            </div>
                        </th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]">P/L</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Current Value</th>
                        <th className="text-right py-4 px-6 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {displayStocks.map((stock, idx) => {
                        const investedValue = stock.totalInvested ?? (stock.quantity * stock.buyPrice);
                        const currentValue = stock.currentValue ?? (stock.currentPrice ? stock.quantity * stock.currentPrice : investedValue);
                        const profitLoss = currentValue - investedValue;
                        const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;
                        const isProfit = profitLoss >= 0;

                        return (
                            <tr
                                key={stock.id}
                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td className="py-4 px-6">
                                    <button
                                        onClick={() => setDetailStock(stock)}
                                        className="text-[10px] font-black w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-medium text-gray-900 dark:text-white">{stock.name}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-bold text-gray-700 dark:text-gray-300 uppercase text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{stock.symbol}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-wrap gap-1">
                                        {stock.broker ? stock.broker.split(',').map((b, i) => (
                                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                                {b.trim()}
                                            </span>
                                        )) : (
                                            <span className="text-sm font-bold text-gray-400 italic">--</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                                    {stock.quantity}
                                </td>
                                <td className="py-4 px-6 text-right text-sm font-semibold text-gray-900 dark:text-white" title={stock.buyPrice.toString()}>
                                    {formatCurrency(stock.buyPrice)}
                                </td>
                                <td className="py-4 px-6 text-center text-sm font-semibold whitespace-nowrap">
                                    {stock.currentPrice ? (
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {formatCurrency(stock.currentPrice)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Not fetched</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right whitespace-nowrap min-w-[120px]">
                                    {stock.currentPrice ? (
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {isProfit ? '+' : '-'}{formatCurrency(Math.abs(profitLoss))}
                                            </span>
                                            <span className={`text-xs ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                ({isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right text-sm font-black text-blue-600 dark:text-blue-400">
                                    {formatCurrency(currentValue)}
                                </td>
                                <td className="py-4 px-6">
                                    {!isConsolidated ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(stock)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-primary-600 opacity-0 group-hover:opacity-100"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(stock.id, stock.symbol)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Merged</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Stock Detail Modal */}
            {detailStock && (
                <Modal
                    isOpen={!!detailStock}
                    onClose={() => setDetailStock(null)}
                    title="Stock Intelligence"
                    size="md"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">{detailStock.name}</h3>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{detailStock.symbol}</p>
                            </div>
                            <div className="text-right">
                                <Badge variant={detailStock.type === 'BUY' ? 'income' : 'expense'}>
                                    {detailStock.type}
                                </Badge>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">Transaction Type</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass p-5 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Buy Date</span>
                                </div>
                                <p className="text-sm font-black text-gray-900 dark:text-white">
                                    {detailStock.date ? format(new Date(detailStock.date), 'dd MMM, yyyy') : '--'}
                                </p>
                            </div>

                            <div className="glass p-5 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Briefcase size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Broker(s)</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {detailStock.broker ? detailStock.broker.split(',').map((b, i) => (
                                        <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 italic">
                                            {b.trim()}
                                        </span>
                                    )) : (
                                        <p className="text-sm font-black text-gray-400 italic">Not specified</p>
                                    )}
                                </div>
                            </div>

                            <div className="glass p-5 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <IndianRupee size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Avg. Buy Price</span>
                                </div>
                                <p className="text-sm font-black text-emerald-600">
                                    {formatCurrency(detailStock.buyPrice)}
                                </p>
                            </div>

                            <div className="glass p-5 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Activity size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Live Price</span>
                                </div>
                                <p className="text-sm font-black text-blue-600">
                                    {detailStock.currentPrice ? formatCurrency(detailStock.currentPrice) : 'Refreshing...'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-primary-600 rounded-3xl text-white shadow-xl shadow-primary-600/20">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Current Valuation</p>
                                    <p className="text-3xl font-black">
                                        {formatCurrency(detailStock.currentValue ?? (detailStock.currentPrice ? detailStock.quantity * detailStock.currentPrice : (detailStock.quantity * detailStock.buyPrice)))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Invested</p>
                                    <p className="text-lg font-bold opacity-90">
                                        {formatCurrency(detailStock.totalInvested ?? (detailStock.quantity * detailStock.buyPrice))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setDetailStock(null)}
                                className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Close Intelligence
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
