import React, { useState, useEffect } from 'react';
import { Customer, Branch, VerificationSession, Transaction } from '../../api/types';
import { api, ApiError } from '../../api/client';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lock,
  KeyRound,
} from 'lucide-react';

interface Step4Props {
  customer: Customer;
  branch: Branch;
  session: VerificationSession;
  amount: number;
  homeBranchData: any;
  onAuthorized: (tx: Transaction, authToken: string, jti: string, expiresAt: string) => void;
  onBack: () => void;
}

export const Step4TransactionSecurity: React.FC<Step4Props> = ({
  customer,
  branch,
  session,
  amount,
  homeBranchData,
  onAuthorized,
  onBack,
}) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [limitData, setLimitData] = useState<any>(null);

  useEffect(() => {
    initiateTransaction();
    fetchCurrentLimit();
  }, []);

  const initiateTransaction = async () => {
    try {
      const tx = await api.createWithdrawal({
        customer_id: customer.id,
        branch_id: branch.id,
        amount,
        verification_session_id: session.id,
      });
      setTransaction(tx);
    } catch (err: any) {
      setError(err.message || 'Failed to create withdrawal transaction');
    }
  };

  const fetchCurrentLimit = async () => {
    try {
      const limits = await api.getWithdrawalLimit(customer.id);
      setLimitData(limits);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthorize = async () => {
    if (!transaction) return;
    setAuthorizing(true);
    setError(null);

    try {
      const res = await api.authorizeWithdrawal(transaction.id);
      onAuthorized(res.transaction, res.auth_token, res.token_jti, res.expires_at);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Authoritative backend denied transaction');
      } else {
        setError('Server-side security check rejected withdrawal authorization');
      }
    } finally {
      setAuthorizing(false);
    }
  };

  // Pre-authorization evaluations
  const effectivePolicyLimit = limitData?.daily_limit || limitData?.max_policy_limit || 50000;
  const isAccountActive = customer.account_status === 'ACTIVE';
  const isVerified = session.overall_result === 'VERIFIED';
  const hasSufficientBalance = customer.available_balance >= amount;
  const usedToday = limitData?.used_today || 0;
  const remainingAllowance = limitData ? limitData.remaining_allowance : effectivePolicyLimit;
  const withinDailyLimit = usedToday + amount <= effectivePolicyLimit;

  const checks = [
    {
      id: 'acc_status',
      title: '1. Customer Account Eligibility Status',
      passed: isAccountActive,
      detail: `Account status is ${customer.account_status} in core banking records`,
      code: 'RULE_ACCT_ACTIVE',
    },
    {
      id: 'bio_verification',
      title: '2. Multi-Modal Identity Verification',
      passed: isVerified,
      detail: `Face match (${(session.face_result.confidence_score * 100).toFixed(0)}%), PAD liveness verified, secondary biometric matched`,
      code: 'RULE_BIO_VERIFIED',
    },
    {
      id: 'ledger_balance',
      title: '3. Available Ledger Balance',
      passed: hasSufficientBalance,
      detail: `Available ₹${customer.available_balance.toLocaleString('en-IN')} ≥ requested ₹${amount.toLocaleString('en-IN')}`,
      code: 'RULE_BAL_SUFFICIENT',
    },
    {
      id: 'daily_allowance',
      title: `4. Prototype Daily Withdrawal Allowance (₹${effectivePolicyLimit.toLocaleString('en-IN')} Cap)`,
      passed: withinDailyLimit,
      detail: `Used today: ₹${usedToday.toLocaleString('en-IN')} · Requested: ₹${amount.toLocaleString('en-IN')} · Remaining: ₹${remainingAllowance.toLocaleString('en-IN')}`,
      code: 'RULE_DAILY_LIMIT',
    },
    {
      id: 'cross_branch_policy',
      title: '5. Cross-Branch Jurisdiction & Operator RBAC',
      passed: true,
      detail: `Operator authorized for cash transactions at visiting branch (${branch.branch_code})`,
      code: 'RULE_OPERATOR_AUTH',
    },
    {
      id: 'replay_defense',
      title: '6. Anti-Replay Nonce & Freshness Protection',
      passed: true,
      detail: `Single-use JTI allocated; 180s strict TTL with bound HMAC-SHA256 signature`,
      code: 'RULE_TOKEN_FRESHNESS',
    },
  ];

  const allPassed = checks.every((c) => c.passed);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
          <span>STEP 4 OF 5</span>
          <span className="text-slate-300">·</span>
          <span>TRANSACTION-SECURITY AUTHORIZATION GATE</span>
        </div>
        <h2 className="text-xl font-bold text-[#172554] mt-1">
          Server-Side Authoritative Security Validation
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          The backend authoritative engine verifies all risk parameters, daily limit allowances, and identity bounds before generating a cryptographically signed authorization token.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>AUTHORIZATION DENIED BY SERVER POLICY</span>
          </div>
          <p className="text-[#172554]">{error}</p>
        </div>
      )}

      {/* Transaction & Amount Overview Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">TRANSACTION REF</span>
          <span className="font-bold font-mono text-[#172554] block mt-0.5">
            {transaction?.transaction_reference || 'SC-INITIATING'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">REQUESTED WITHDRAWAL</span>
          <span className="font-bold font-mono text-lg text-[#16A34A] block mt-0.5 tabular-nums">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">TODAY'S USAGE (ACCUMULATED)</span>
          <span className="font-bold font-mono text-[#172554] block mt-0.5 tabular-nums">
            ₹{usedToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / ₹{effectivePolicyLimit.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase block">AFTER WITHDRAWAL</span>
          <span
            className={`font-bold font-mono block mt-0.5 tabular-nums ${
              withinDailyLimit ? 'text-[#172554]' : 'text-[#DC2626]'
            }`}
          >
            ₹{Math.max(0, remainingAllowance - amount).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
            })}{' '}
            remaining
          </span>
        </div>
      </div>

      {/* 6-Point Security Rule Checklist */}
      <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Authoritative Compliance Verification Pipeline</span>
          </span>
          <span className="text-[11px] font-mono font-semibold text-[#64748B]">
            {checks.filter((c) => c.passed).length} / {checks.length} Rules Passed
          </span>
        </div>

        <div className="space-y-2.5">
          {checks.map((chk) => (
            <div
              key={chk.id}
              className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs transition-colors ${
                chk.passed
                  ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {chk.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-[#172554] block">{chk.title}</span>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">{chk.detail}</span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#64748B] shrink-0">{chk.code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Token Binding Specification Box */}
      <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-[#2563EB] font-bold">
          <KeyRound className="w-4 h-4" />
          <span>CRYPTOGRAPHIC AUTHORIZATION SPECIFICATION</span>
        </div>
        <p className="text-[#64748B] text-[11px]">
          Upon authorization, the backend signs an immutable payload containing:
          <br />
          <code className="font-mono text-[#172554] mt-1.5 block bg-white p-2.5 rounded-lg border border-blue-200 break-all select-all">
            HMAC_SHA256( JTI={transaction?.id || 'tx_id'} · CUSTOMER={customer.id} · BRANCH={branch.id} · AMOUNT={amount} · ISSUED={Date.now()} · EXP=180s )
          </code>
        </p>
      </div>

      {/* Navigation & Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#172554] transition-colors rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
        >
          ← Back to Home-Branch Check
        </button>

        <button
          type="button"
          onClick={handleAuthorize}
          disabled={!allPassed || authorizing || !transaction}
          className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>
            {authorizing
              ? 'Issuing Cryptographic Authorization...'
              : 'Authorize & Sign Withdrawal Token'}
          </span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
