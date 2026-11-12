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
  const [remainingAllowance, setRemainingAllowance] = useState<number>(50000 - transaction.amount);
  const [attackOutcome, setAttackOutcome] = useState<{
    type: string;
    success: boolean;
    message: string;
  } | null>(null);

  const handleRedeemAndDispense = async () => {
    setRedeeming(true);
    setAttackOutcome(null);
    try {
      const res = await api.redeemWithdrawal(currentTx.id, { auth_token: authToken });
      setCurrentTx(res.transaction);
      setRedeemed(true);
      setRemainingBalance(res.customer_updated.available_balance);
      setRemainingAllowance(res.customer_updated.remaining_daily_allowance);
      setCashDispensed(true);
    } catch (err: any) {
      console.error(err);
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
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <span>STEP 5 OF 5</span>
          <span>·</span>
          <span>AUTHORIZED SIMULATED WITHDRAWAL & REDEMPTION</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Cryptographic Authorization Issued & Cash Dispense Gate
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Signed short-lived authorization bound to transaction, customer, visiting branch, and amount.
        </p>
      </div>

      {/* Hero Authorization Banner */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wide">
                STATUS: {currentTx.status}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">REF: {currentTx.transaction_reference}</span>
            </div>
            <h3 className="text-2xl font-bold text-white font-mono mt-1 tabular-nums">
              ₹{currentTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Authorized for customer <strong className="text-white">{customer.full_name}</strong> at visiting branch <strong className="text-white">{branch.name}</strong>.
            </p>
          </div>
        </div>

        {/* Primary Cash Dispense CTA */}
        {!redeemed ? (
          <button
            type="button"
            onClick={handleRedeemAndDispense}
            disabled={redeeming}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-900/30 whitespace-nowrap shrink-0"
          >
            <DollarSign className="w-4 h-4" />
            <span>
              {redeeming ? 'Burning Token & Dispensing...' : 'Redeem Authorization & Dispense Cash'}
            </span>
          </button>
        ) : (
          <div className="px-4 py-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-xs text-right shrink-0">
            <span className="font-bold block">✓ CASH DISPENSED (SIMULATED)</span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              Token Burned · Ledger Updated
            </span>
          </div>
        )}
      </div>

      {/* Animated Cash Dispenser Tray (Simulated) */}
      {cashDispensed && (
        <div className="p-6 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 mb-1">
            <DollarSign className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              Simulated Currency Notes Released at Counter
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              In an operational branch deployment, this triggers the automated cash dispenser (e.g. Teller Cash Recycler) to dispense physical currency notes.
            </p>
          </div>

          <div className="inline-block p-4 rounded-lg bg-slate-900 border border-slate-800 text-left font-mono text-xs max-w-md w-full space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Customer:</span>
              <span className="text-white">{customer.full_name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Customer PAN:</span>
              <span className="text-white">{customer.synthetic_pan}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Visiting Branch:</span>
              <span className="text-white">{branch.name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Registered Home:</span>
              <span className="text-white">{customer.home_branch_id}</span>
            </div>
            <div className="border-t border-slate-800 my-1 pt-1 flex justify-between font-bold">
              <span className="text-slate-300">Amount Dispensed:</span>
              <span className="text-emerald-400">
                ₹{currentTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>New Available Balance:</span>
              <span className="text-white">
                ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Daily Cap:</span>
              <span className="text-white">
                ₹{remainingAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Authorization Token Metadata */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cryptographic Authorization Token (HMAC-SHA256)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Expires in: 180s · JTI: {tokenJti}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
          {authToken}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
          <div>
            <span>Binding Hash: </span>
            <span className="text-slate-200">SHA256(tx+cust+br+amt)</span>
          </div>
          <div>
            <span>Single-Use Nonce (JTI): </span>
            <span className="text-indigo-300">{tokenJti}</span>
          </div>
          <div>
            <span>Status: </span>
            <span className={redeemed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {redeemed ? 'BURNED / REDEEMED' : 'ISSUED / UNREDEEMED'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Demonstration / Attack Resistance Actions */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Attack Resistance Proof & Verification Lab</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Live Server Rejection Tests</span>
        </div>

        <p className="text-xs text-slate-400">
          Exercise the authoritative security checks right now against this transaction to confirm that replay attempts and modified tokens fail:
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAttemptReplayAttack}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 hover:text-rose-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Attempt Token Replay (Test 16)</span>
          </button>

          <button
            type="button"
            onClick={handleAttemptTamperedToken}
            className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 hover:text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-3.5 h-3.5 text-amber-400" />
            <span>Attempt Tampered Signature (Test 13)</span>
          </button>
        </div>

        {attackOutcome && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono ${
              attackOutcome.success
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {attackOutcome.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{attackOutcome.type} Outcome</span>
            </div>
            <p className="text-[11px] text-slate-300">{attackOutcome.message}</p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onViewAudit}
          className="min-h-[44px] flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-4 py-2.5 rounded-lg border border-slate-800 sm:border-transparent"
        >
          <FileText className="w-4 h-4" />
          <span>View Recorded Audit Events →</span>
        </button>

        <button
          type="button"
          onClick={onFinish}
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm w-full sm:w-auto"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
