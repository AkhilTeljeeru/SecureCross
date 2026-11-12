import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Transaction, Branch, Customer } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Building,
  KeyRound,
  FileText,
  X,
} from 'lucide-react';

interface TransactionHistoryViewProps {
  onViewAudit: (txId?: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onViewAudit }) => {
  const { operator } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, brRes] = await Promise.all([api.getWithdrawals(), api.getBranches()]);
      setTransactions(txRes.transactions);
      setBranches(brRes.branches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // RBAC Filter: Operators only see transactions at their branch; Managers & Auditors see all branches
  const accessibleTransactions = transactions.filter((tx) => {
    if (operator?.role === 'OPERATOR') {
      return tx.branch_id === operator.branch_id;
    }
    return true; // MANAGER and AUDITOR see all
  });

  const filtered = accessibleTransactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.id === branchId)?.name || branchId;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>TRANSACTION LEDGER</span>
            <span>·</span>
            <span>
              RBAC SCOPE:{' '}
              {operator?.role === 'OPERATOR' ? 'LOCAL BRANCH ONLY' : 'ALL BRANCHES (ELEVATED)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Cross-Branch Withdrawal Transaction History
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search reference, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Status Filter Tabs (Segmented control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs overflow-x-auto no-scrollbar">
            {['ALL', 'REDEEMED', 'AUTHORIZED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[34px] px-2.5 py-1 rounded font-mono text-[11px] transition-colors cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Transactions View */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading transaction ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">No transactions match your criteria</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-800">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 space-y-2.5 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">
                      {tx.transaction_reference}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                        tx.status === 'REDEEMED'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : tx.status === 'AUTHORIZED'
                          ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                          : tx.status === 'REJECTED'
                          ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-base font-bold text-emerald-400 tabular-nums">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{tx.customer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Visiting Branch:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">{getBranchName(tx.branch_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timestamp:</span>
                      <span>{new Date(tx.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTx(tx);
                    }}
                    className="w-full min-h-[44px] mt-1 py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 font-mono text-xs flex items-center justify-center font-medium"
                  >
                    View Details & Audit Trace →
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">REFERENCE</th>
                    <th className="py-3 px-4 font-semibold">CUSTOMER</th>
                    <th className="py-3 px-4 font-semibold">VISITING BRANCH</th>
                    <th className="py-3 px-4 font-semibold text-right">AMOUNT (INR)</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {tx.transaction_reference}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {tx.customer_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {getBranchName(tx.branch_id)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white tabular-nums whitespace-nowrap">
                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            tx.status === 'REDEEMED'
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : tx.status === 'AUTHORIZED'
                              ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                              : tx.status === 'REJECTED'
                              ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Transaction Detail Drawer / Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">
                  Transaction Metadata
                </span>
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedTx.transaction_reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-slate-200">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Customer ID:</span>
                <span className="text-slate-200">{selectedTx.customer_id}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Visiting Branch:</span>
                <span className="text-slate-200">{getBranchName(selectedTx.branch_id)}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  ₹{selectedTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Status:</span>
                <span className="text-white font-bold">{selectedTx.status}</span>
              </div>
              {selectedTx.rejection_reason && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300">
                  <span className="block font-bold">Rejection Reason:</span>
                  <span>{selectedTx.rejection_reason}</span>
                </div>
              )}
              {selectedTx.token_jti && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <span className="text-slate-400 block">Single-Use Token JTI:</span>
                  <span className="text-indigo-400 break-all">{selectedTx.token_jti}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const txId = selectedTx.id;
                  setSelectedTx(null);
                  onViewAudit(txId);
                }}
                className="min-h-[44px] text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 font-medium px-3 py-2 rounded-lg border border-slate-800 sm:border-transparent cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Security Audit Events</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
