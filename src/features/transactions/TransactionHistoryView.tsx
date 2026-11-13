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

  // RBAC Filter: Operators only see transactions at their branch when assigned; Managers & Auditors see all branches
  const accessibleTransactions = transactions.filter((tx) => {
    if (operator?.role === 'OPERATOR' && operator.branch_id) {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
            <span>Transaction Ledger</span>
            <span>·</span>
            <span>
              RBAC Scope:{' '}
              {operator?.role === 'OPERATOR' ? 'Local Branch Only' : 'All Branches (Elevated)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172554] mt-1">
            Cross-Branch Withdrawal Transaction History
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search reference, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
            />
          </div>

          {/* Status Filter Tabs (Segmented control) */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E2E8F0] shadow-2xs text-xs overflow-x-auto no-scrollbar">
            {['ALL', 'REDEEMED', 'AUTHORIZED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`min-h-[34px] px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#64748B] hover:text-[#172554] hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Transactions View */}
      <div className="rounded-xl bg-white border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            Loading transaction ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-[#172554] font-semibold">No transactions match your criteria</p>
            <p className="text-xs text-[#64748B]">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-[#E2E8F0]">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#172554] text-xs">
                      {tx.transaction_reference}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                        tx.status === 'REDEEMED'
                          ? 'bg-green-50 border-green-200 text-[#16A34A]'
                          : tx.status === 'AUTHORIZED'
                          ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                          : tx.status === 'REJECTED'
                          ? 'bg-red-50 border-red-200 text-[#DC2626]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">Amount:</span>
                    <span className="text-base font-bold font-mono text-[#16A34A] tabular-nums">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] space-y-1 pt-1.5 border-t border-[#E2E8F0]">
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="text-[#172554] font-mono truncate max-w-[180px]">{tx.customer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visiting Branch:</span>
                      <span className="text-[#172554] truncate max-w-[180px]">{getBranchName(tx.branch_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span className="font-mono">{new Date(tx.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTx(tx);
                    }}
                    className="w-full min-h-[44px] mt-1 py-2 px-3 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs flex items-center justify-center font-semibold transition-colors"
                  >
                    View Details &amp; Audit Trace →
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Reference</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Visiting Branch</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (INR)</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#172554] whitespace-nowrap">
                        {tx.transaction_reference}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#172554] whitespace-nowrap">
                        {tx.customer_id}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                        {getBranchName(tx.branch_id)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#172554] tabular-nums whitespace-nowrap">
                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            tx.status === 'REDEEMED'
                              ? 'bg-green-50 border-green-200 text-[#16A34A]'
                              : tx.status === 'AUTHORIZED'
                              ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                              : tx.status === 'REJECTED'
                              ? 'bg-red-50 border-red-200 text-[#DC2626]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] font-mono whitespace-nowrap text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="text-xs text-[#2563EB] hover:text-blue-700 font-semibold hover:underline cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                  Transaction Metadata
                </span>
                <h3 className="text-base font-bold text-[#172554] font-mono">
                  {selectedTx.transaction_reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#64748B] hover:text-[#172554] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Transaction ID:</span>
                <span className="text-[#172554] font-mono font-medium">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Customer ID:</span>
                <span className="text-[#172554] font-mono font-medium">{selectedTx.customer_id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Visiting Branch:</span>
                <span className="text-[#172554] font-medium">{getBranchName(selectedTx.branch_id)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Amount:</span>
                <span className="text-[#16A34A] font-mono font-bold tabular-nums">
                  ₹{selectedTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Status:</span>
                <span className="text-[#172554] font-bold">{selectedTx.status}</span>
              </div>
              {selectedTx.rejection_reason && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626]">
                  <span className="block font-bold">Rejection Reason:</span>
                  <span>{selectedTx.rejection_reason}</span>
                </div>
              )}
              {selectedTx.token_jti && (
                <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-blue-200 text-[11px]">
                  <span className="text-[#64748B] font-semibold block mb-0.5">Single-Use Token JTI:</span>
                  <span className="text-[#2563EB] font-mono break-all">{selectedTx.token_jti}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const txId = selectedTx.id;
                  setSelectedTx(null);
                  onViewAudit(txId);
                }}
                className="min-h-[44px] text-xs text-[#2563EB] hover:text-blue-700 bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1.5 font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Security Audit Events</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#172554] text-xs font-semibold transition-colors cursor-pointer"
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
