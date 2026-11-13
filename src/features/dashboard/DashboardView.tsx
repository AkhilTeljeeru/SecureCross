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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#2563EB]">
            <span>SECURECROSS V2.6 ENGINE</span>
            <span className="text-slate-300">·</span>
            <span>MULTI-BANK PARTICIPATING NETWORK</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="hidden sm:inline">STRICT SERVER-AUTHORITATIVE POLICY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172554] leading-tight">
            Cross-Branch Cash Withdrawal Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            Permits eligible customers visiting a non-home branch without physical debit cards to authorize cash withdrawals via combined live face matching, presentation attack detection (PAD), secondary biometric adapter, and real-time core switch checks.
          </p>
        </div>

        {/* Action Buttons - Full-width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={onViewBanks}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#172554] hover:text-[#2563EB] font-medium text-xs border border-[#E2E8F0] hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-[#2563EB]" />
            <span>Banks Directory</span>
          </button>
          <button
            type="button"
            onClick={onStartWithdrawal}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <span>Initiate Cardless Withdrawal</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip - 1 Col on Phone, 2 Col on Tablet, 4 Col on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Total Simulated Requests</span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Building className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#172554] font-mono tabular-nums block">
              {totalRequests}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-1">
              <span>{pendingTx.length} pending / in-progress</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Authorized & Dispensed</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#16A34A] font-mono tabular-nums block truncate">
              ₹{totalDispensed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-1">
              <span>{successfulTx.length} successful redemptions</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Security Denials / Rejections</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#DC2626] font-mono tabular-nums block">
              {rejectedTx.length}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-1">
              <span>Violations or mismatch blocked</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium">
            <span>Daily Limit Policy</span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#172554] font-mono tabular-nums block">
              ₹50,000.00
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-1">
              <span>Per customer / calendar day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Stacks Vertically on Mobile / Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Multi-Bank Participating Network Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#172554] tracking-tight flex items-center gap-2 truncate">
                  <Building2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>Participating Banks Network</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5 truncate">
                  Approved directory & branch registry
                </p>
              </div>
              <button
                type="button"
                onClick={onViewBanks}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 shrink-0 p-1 cursor-pointer"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] text-[11px] font-medium block">Approved Banks</span>
                <span className="text-xl font-bold text-[#172554] font-mono tabular-nums mt-1 block">
                  {banks.filter((b) => b.directory_status === 'APPROVED').length}
                </span>
                <span className="text-[11px] text-[#16A34A] font-medium mt-0.5 block">
                  Regulatory Verified
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] text-[11px] font-medium block">Active Branches</span>
                <span className="text-xl font-bold text-[#172554] font-mono tabular-nums mt-1 block">
                  {branches.length}
                </span>
                <span className="text-[11px] text-[#2563EB] font-medium mt-0.5 block">
                  Cross-Branch Enabled
                </span>
              </div>
            </div>

            {/* Bank Listing Cards - Adaptive for Small Viewports */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Network Participants ({banks.length})
              </span>
              {banks.length === 0 ? (
                <div className="p-5 rounded-lg bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center space-y-2">
                  <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs text-[#172554] font-semibold">No banks registered yet.</p>
                  <p className="text-[11px] text-[#64748B] max-w-xs mx-auto leading-relaxed">
                    Submit a bank application in the directory to register participating institutions and authorized branches.
                  </p>
                  <button
                    type="button"
                    onClick={onViewBanks}
                    className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-blue-700 font-semibold pt-1 cursor-pointer"
                  >
                    <span>Register a bank</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {banks.slice(0, 4).map((b) => (
                    <div key={b.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#172554] truncate max-w-[170px] sm:max-w-none">
                            {b.legal_name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-[#64748B]">
                            {b.bank_type}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] block mt-0.5 truncate">
                          {b.registration_licence_number} · {b.participating_branches_count ?? 0} Branches
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 border border-green-200 text-[#16A34A]">
                          {b.directory_status}
                        </span>
                        <span className="text-[10px] text-[#64748B] block mt-0.5">
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
                className="w-full min-h-[44px] py-2 px-3.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-semibold text-xs flex items-center justify-between transition-colors border border-blue-200 cursor-pointer"
              >
                <span>View Full Banks Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Security Architecture Invariants Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3 text-xs">
            <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Core Security Invariants</span>
            </span>
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="flex items-center justify-between gap-2">
                <span>Visiting != Home Branch:</span>
                <span className="text-[#16A34A] font-semibold shrink-0">Strictly Enforced</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Customer Privacy Guard:</span>
                <span className="text-[#16A34A] font-semibold shrink-0">Zero Reveal Pre-Match</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Token Expiration (TTL):</span>
                <span className="text-[#D97706] font-mono font-semibold shrink-0">180s Single-Use JTI</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Biometric Storage:</span>
                <span className="text-[#2563EB] font-semibold shrink-0">Ephemeral Memory Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Recent Transaction Activity Ledger */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4 gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#172554] tracking-tight">
                  Recent Transaction Activity
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
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
                    className={`min-h-[32px] px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172554] border border-[#E2E8F0]'
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
                  <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-10 sm:py-12 px-4">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-[#172554] font-semibold">No transactions found</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto leading-relaxed">
                  {statusFilter !== 'ALL'
                    ? `No transactions currently matching status "${statusFilter}".`
                    : 'Start a new cardless withdrawal request to exercise the biometric verification and authorization pipeline.'}
                </p>
                <button
                  type="button"
                  onClick={onStartWithdrawal}
                  className="mt-4 min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Start First Request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {filteredTransactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          tx.status === 'REDEEMED'
                            ? 'bg-[#16A34A] ring-2 ring-green-100'
                            : tx.status === 'AUTHORIZED'
                            ? 'bg-[#D97706] ring-2 ring-amber-100'
                            : tx.status === 'REJECTED'
                            ? 'bg-[#DC2626] ring-2 ring-red-100'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-[#172554] truncate max-w-[130px] sm:max-w-none">
                            {tx.transaction_reference}
                          </span>
                          <span className="text-[10px] font-mono text-[#64748B] hidden sm:inline">
                            {tx.verification_session_id ? `(${tx.verification_session_id.slice(-6)})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] mt-0.5 truncate">
                          <span className="font-mono">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>·</span>
                          <span className="truncate font-mono">
                            {tx.rejection_reason ? `${tx.rejection_reason}` : 'Biometrics Verified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-semibold text-[#172554] block tabular-nums text-xs sm:text-sm">
                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          tx.status === 'REDEEMED'
                            ? 'text-[#16A34A]'
                            : tx.status === 'AUTHORIZED'
                            ? 'text-[#D97706]'
                            : tx.status === 'REJECTED'
                            ? 'text-[#DC2626]'
                            : 'text-[#64748B]'
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

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#64748B]">
            <span className="text-[11px] truncate">
              Operator: <strong className="text-[#172554]">{operator?.full_name}</strong>{' '}
              <span className="font-mono">({branch?.branch_code || 'Counter'})</span>
            </span>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={onViewTransactions}
                className="text-[#64748B] hover:text-[#172554] font-medium py-1 cursor-pointer"
              >
                All Transactions ({transactions.length})
              </button>
              <button
                type="button"
                onClick={onViewAudit}
                className="text-[#2563EB] hover:text-blue-700 font-semibold py-1 cursor-pointer"
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
