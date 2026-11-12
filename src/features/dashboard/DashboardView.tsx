import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Transaction, AuditEvent, Bank, Branch } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  Building2,
  Clock,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface DashboardViewProps {
  onStartWithdrawal: () => void;
  onViewTransactions: () => void;
  onViewAudit: () => void;
  onViewBanks: () => void;
  onViewTests?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartWithdrawal,
  onViewTransactions,
  onViewAudit,
  onViewBanks,
}) => {
  const { operator, branch } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [txRes, audRes, banksRes, branchesRes] = await Promise.all([
        api.getWithdrawals(),
        api.getAuditEvents({ limit: '10' } as any),
        api.getBanks(),
        api.getBranches(),
      ]);
      setTransactions(txRes.transactions);
      setAuditEvents(audRes.events);
      setBanks(banksRes.banks);
      setBranches(branchesRes.branches);
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = transactions.length;
  const successfulTx = transactions.filter((t) => t.status === 'REDEEMED');
  const rejectedTx = transactions.filter((t) => t.status === 'REJECTED');
  const pendingTx = transactions.filter((t) => t.status === 'CREATED' || t.status === 'AUTHORIZED');

  const totalDispensed = successfulTx.reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Welcome & Context Banner - Responsive Stacking */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-mono text-indigo-400">
            <span>SECURECROSS V2.6 ENGINE</span>
            <span>·</span>
            <span>MULTI-BANK PARTICIPATING NETWORK</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">STRICT SERVER-AUTHORITATIVE POLICY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Cross-Branch Cash Withdrawal Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Permits eligible customers visiting a non-home branch without physical debit cards to authorize cash withdrawals via combined live face matching, presentation attack detection (PAD), secondary biometric adapter, and real-time core switch checks.
          </p>
        </div>

        {/* Action Buttons - Full-width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={onViewBanks}
            className="min-h-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Banks Directory</span>
          </button>
          <button
            type="button"
            onClick={onStartWithdrawal}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <span>Initiate Cardless Withdrawal</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip - 1 Col on Phone, 2 Col on Tablet, 4 Col on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Simulated Requests</span>
            <Building className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums block">
              {totalRequests}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-mono">
              <span>{pendingTx.length} pending / in-progress</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Authorized & Dispensed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums block truncate">
              ₹{totalDispensed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-mono">
              <span>{successfulTx.length} successful redemptions</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Security Denials / Rejections</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono tabular-nums block">
              {rejectedTx.length}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-mono">
              <span>Violations or mismatch blocked</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Daily Limit Policy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums block">
              ₹50,000.00
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-mono">
              <span>Per customer / calendar day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Stacks Vertically on Mobile / Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Multi-Bank Participating Network Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Participating Banks Network</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Approved directory & branch registry
                </p>
              </div>
              <button
                type="button"
                onClick={onViewBanks}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 p-1"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Approved Banks</span>
                <span className="text-xl font-bold text-white font-mono mt-1 block">
                  {banks.filter((b) => b.directory_status === 'APPROVED').length}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                  Regulatory Verified
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Active Branches</span>
                <span className="text-xl font-bold text-white font-mono mt-1 block">
                  {branches.length}
                </span>
                <span className="text-[10px] text-indigo-300 font-mono mt-0.5 block">
                  Cross-Branch Enabled
                </span>
              </div>
            </div>

            {/* Bank Listing Cards - Adaptive for Small Viewports */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Network Participants ({banks.length}):
              </span>
              {banks.length === 0 ? (
                <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Building2 className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">No banks registered yet.</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Submit a bank application in the directory to register participating institutions and authorized branches.
                  </p>
                  <button
                    type="button"
                    onClick={onViewBanks}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1"
                  >
                    <span>Register a bank</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {banks.slice(0, 4).map((b) => (
                    <div key={b.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-200 truncate max-w-[170px] sm:max-w-none">
                            {b.legal_name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {b.bank_type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5 truncate">
                          {b.registration_licence_number} · {b.participating_branches_count || 1} Branches
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                          {b.directory_status}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                          {b.live_transaction_authorized ? 'Live Active' : 'Sandbox Ready'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onViewBanks}
                className="w-full min-h-[44px] py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-xs flex items-center justify-between transition-colors border border-slate-700/60"
              >
                <span>View Full Banks Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Security Architecture Invariants Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Core Security Invariants</span>
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span>Visiting != Home Branch:</span>
                <span className="text-emerald-400 font-semibold shrink-0">Strictly Enforced</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Customer Privacy Guard:</span>
                <span className="text-emerald-400 font-semibold shrink-0">Zero Reveal Pre-Match</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Token Expiration (TTL):</span>
                <span className="text-amber-400 font-semibold shrink-0">180s Single-Use JTI</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Biometric Storage:</span>
                <span className="text-indigo-300 font-semibold shrink-0">Ephemeral Memory Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Recent Transaction Activity Ledger */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Recent Transaction Activity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live ledger of cross-branch authorization requests
                </p>
              </div>

              {/* Status Filter buttons - Mobile Friendly Wrap */}
              <div className="flex flex-wrap items-center gap-1">
                {['ALL', 'REDEEMED', 'AUTHORIZED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`min-h-[32px] px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-10 sm:py-12 px-4">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">No transactions found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {statusFilter !== 'ALL'
                    ? `No transactions currently matching status "${statusFilter}".`
                    : 'Start a new cardless withdrawal request to exercise the biometric verification and authorization pipeline.'}
                </p>
                <button
                  type="button"
                  onClick={onStartWithdrawal}
                  className="mt-4 min-h-[40px] px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                >
                  Start First Request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredTransactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          tx.status === 'REDEEMED'
                            ? 'bg-emerald-400 ring-2 ring-emerald-500/20'
                            : tx.status === 'AUTHORIZED'
                            ? 'bg-amber-400 ring-2 ring-amber-500/20'
                            : tx.status === 'REJECTED'
                            ? 'bg-rose-400 ring-2 ring-rose-500/20'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-white truncate max-w-[130px] sm:max-w-none">
                            {tx.transaction_reference}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                            {tx.session_id ? `(${tx.session_id.slice(-6)})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono mt-0.5 truncate">
                          <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>·</span>
                          <span className="truncate">
                            {tx.failure_reason_code ? `${tx.failure_reason_code}` : 'Biometrics Verified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-semibold text-white block tabular-nums text-xs sm:text-sm">
                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          tx.status === 'REDEEMED'
                            ? 'text-emerald-400'
                            : tx.status === 'AUTHORIZED'
                            ? 'text-amber-400'
                            : tx.status === 'REJECTED'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-mono text-[11px] truncate">
              Operator: {operator?.full_name} ({branch?.branch_code || 'Counter'})
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={onViewTransactions}
                className="text-slate-400 hover:text-slate-200 font-medium py-1"
              >
                All Transactions ({transactions.length})
              </button>
              <button
                type="button"
                onClick={onViewAudit}
                className="text-indigo-400 hover:text-indigo-300 font-medium py-1"
              >
                Security Audit Log →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
