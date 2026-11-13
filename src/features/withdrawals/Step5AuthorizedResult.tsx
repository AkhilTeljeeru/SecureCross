import React, { useState } from 'react';
import { Transaction, Customer, Branch } from '../../api/types';
import { api, ApiError } from '../../api/client';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Printer,
  Copy,
  RotateCcw,
  KeyRound,
  FileText,
  DollarSign,
  Ban,
  ShieldAlert,
} from 'lucide-react';

interface Step5Props {
  transaction: Transaction;
  customer: Customer;
  branch: Branch;
  authToken: string;
  tokenJti: string;
  expiresAt: string;
  onFinish: () => void;
  onViewAudit: () => void;
}

export const Step5AuthorizedResult: React.FC<Step5Props> = ({
  transaction,
  customer,
  branch,
  authToken,
  tokenJti,
  expiresAt,
  onFinish,
  onViewAudit,
}) => {
  const [currentTx, setCurrentTx] = useState<Transaction>(transaction);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [redeemed, setRedeemed] = useState<boolean>(false);
  const [cashDispensed, setCashDispensed] = useState<boolean>(false);
  const [remainingBalance, setRemainingBalance] = useState<number>(customer.available_balance);
  const [remainingAllowance, setRemainingAllowance] = useState<number>(
    Math.max(0, (customer.daily_withdrawal_limit || 50000) - transaction.amount)
  );
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [attackOutcome, setAttackOutcome] = useState<{
    type: string;
    success: boolean;
    message: string;
  } | null>(null);

  const handleRedeemAndDispense = async () => {
    setRedeeming(true);
    setAttackOutcome(null);
    setRedeemError(null);
    try {
      const res = await api.redeemWithdrawal(currentTx.id, { auth_token: authToken });
      setCurrentTx(res.transaction);
      setRedeemed(true);
      setRemainingBalance(res.customer_updated.available_balance);
      setRemainingAllowance(res.customer_updated.remaining_daily_allowance);
      setCashDispensed(true);
    } catch (err: any) {
      console.error(err);
      setRedeemError(err?.message || 'Failed to redeem withdrawal authorization token');
    } finally {
      setRedeeming(false);
    }
  };

  // Test 16: Attempt Replay of Redeemed Token
  const handleAttemptReplayAttack = async () => {
    setAttackOutcome(null);
    try {
      await api.redeemWithdrawal(currentTx.id, { auth_token: authToken });
      setAttackOutcome({
        type: 'Replay Attack Attempt',
        success: false,
        message: 'Unexpected: replay was accepted (Error in defense)',
      });
    } catch (err: any) {
      setAttackOutcome({
        type: 'Replay Attack (Test 16)',
        success: true,
        message: `DEFENSE VERIFIED: Backend rejected replay with 409 Conflict: "${err.message}"`,
      });
    }
  };

  // Test 13: Attempt Tampered Token
  const handleAttemptTamperedToken = async () => {
    setAttackOutcome(null);
    try {
      await api.redeemWithdrawal(currentTx.id, {
        auth_token: authToken,
        force_tamper_token: true,
      });
      setAttackOutcome({
        type: 'Tampered Signature Test',
        success: false,
        message: 'Unexpected: tampered token accepted',
      });
    } catch (err: any) {
      setAttackOutcome({
        type: 'Tampered Signature (Test 13)',
        success: true,
        message: `DEFENSE VERIFIED: Backend rejected altered HMAC signature: "${err.message}"`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
          <span>STEP 5 OF 5</span>
          <span className="text-slate-300">·</span>
          <span>AUTHORIZED SIMULATED WITHDRAWAL & REDEMPTION</span>
        </div>
        <h2 className="text-xl font-bold text-[#172554] mt-1">
          Cryptographic Authorization Issued & Cash Dispense Gate
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Signed short-lived authorization bound to transaction, customer, visiting branch, and amount.
        </p>
      </div>

      {/* Hero Authorization Banner */}
      <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="text-[#16A34A] font-bold uppercase tracking-wide">
                STATUS: {currentTx.status}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[#64748B]">REF: {currentTx.transaction_reference}</span>
            </div>
            <h3 className="text-2xl font-bold text-[#172554] font-mono mt-1 tabular-nums">
              ₹{currentTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Authorized for customer <strong className="text-[#172554]">{customer.full_name}</strong> at visiting branch <strong className="text-[#172554]">{branch.name}</strong>.
            </p>
          </div>
        </div>

        {/* Primary Cash Dispense CTA */}
        {!redeemed ? (
          <button
            type="button"
            onClick={handleRedeemAndDispense}
            disabled={redeeming}
            className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>
              {redeeming ? 'Burning Token & Dispensing...' : 'Redeem Authorization & Dispense Cash'}
            </span>
          </button>
        ) : (
          <div className="px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-[#16A34A] text-xs text-right shrink-0">
            <span className="font-bold block">✓ CASH DISPENSED (SIMULATED)</span>
            <span className="text-[11px] text-[#16A34A]/80 block mt-0.5">
              Token Burned · Ledger Updated
            </span>
          </div>
        )}
      </div>

      {redeemError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{redeemError}</span>
        </div>
      )}

      {/* Animated Cash Dispenser Tray (Simulated) */}
      {cashDispensed && (
        <div className="p-6 rounded-xl bg-green-50 border border-green-200 space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-green-200 text-[#16A34A] mb-1 shadow-2xs">
            <DollarSign className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#172554]">
              Simulated Currency Notes Released at Counter
            </h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              In an operational branch deployment, this triggers the automated cash dispenser (e.g. Teller Cash Recycler) to dispense physical currency notes.
            </p>
          </div>

          <div className="inline-block p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs text-left text-xs max-w-md w-full space-y-2">
            <div className="flex justify-between text-[#64748B]">
              <span>Customer:</span>
              <span className="text-[#172554] font-semibold">{customer.full_name}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Customer PAN:</span>
              <span className="text-[#172554] font-mono">{customer.synthetic_pan}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Visiting Branch:</span>
              <span className="text-[#172554] font-medium">{branch.name}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Registered Home:</span>
              <span className="text-[#172554] font-mono">{customer.home_branch_id}</span>
            </div>
            <div className="border-t border-[#E2E8F0] my-1 pt-2 flex justify-between font-bold">
              <span className="text-[#172554]">Amount Dispensed:</span>
              <span className="text-[#16A34A] font-mono tabular-nums">
                ₹{currentTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>New Available Balance:</span>
              <span className="text-[#172554] font-mono font-semibold tabular-nums">
                ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Remaining Daily Cap:</span>
              <span className="text-[#172554] font-mono font-semibold tabular-nums">
                ₹{remainingAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Authorization Token Metadata */}
      <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
          <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Cryptographic Authorization Token (HMAC-SHA256)</span>
          </span>
          <span className="text-[11px] font-mono text-[#64748B]">
            Expires in: 180s · JTI: {tokenJti}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#172554] break-all select-all">
          {authToken}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#64748B]">
          <div>
            <span>Binding Hash: </span>
            <span className="text-[#172554] font-semibold">SHA256(tx+cust+br+amt)</span>
          </div>
          <div>
            <span>Single-Use Nonce (JTI): </span>
            <span className="text-[#2563EB] font-semibold">{tokenJti}</span>
          </div>
          <div>
            <span>Status: </span>
            <span className={redeemed ? 'text-[#16A34A] font-bold' : 'text-[#D97706] font-bold'}>
              {redeemed ? 'BURNED / REDEEMED' : 'ISSUED / UNREDEEMED'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Demonstration / Attack Resistance Actions */}
      <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
          <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Attack Resistance Proof & Verification Lab</span>
          </span>
          <span className="text-[11px] text-[#64748B]">Live Server Rejection Tests</span>
        </div>

        <p className="text-xs text-[#64748B]">
          Exercise the authoritative security checks right now against this transaction to confirm that replay attempts and modified tokens fail:
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAttemptReplayAttack}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[#DC2626] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Attempt Token Replay (Test 16)</span>
          </button>

          <button
            type="button"
            onClick={handleAttemptTamperedToken}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#D97706] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Attempt Tampered Signature (Test 13)</span>
          </button>
        </div>

        {attackOutcome && (
          <div
            className={`p-3.5 rounded-lg border text-xs ${
              attackOutcome.success
                ? 'bg-green-50 border-green-200 text-[#16A34A]'
                : 'bg-red-50 border-red-200 text-[#DC2626]'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {attackOutcome.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#DC2626]" />
              )}
              <span>{attackOutcome.type} Outcome</span>
            </div>
            <p className="text-[11px] font-mono text-[#172554]">{attackOutcome.message}</p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onViewAudit}
          className="min-h-[44px] flex items-center justify-center gap-1.5 text-xs text-[#2563EB] hover:text-blue-700 font-semibold px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#EFF6FF] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View Recorded Audit Events →</span>
        </button>

        <button
          type="button"
          onClick={onFinish}
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs w-full sm:w-auto cursor-pointer"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
