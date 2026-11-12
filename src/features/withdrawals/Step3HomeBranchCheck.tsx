import React, { useState, useEffect } from 'react';
import { Customer, Branch, VerificationSession } from '../../api/types';
import { api, ApiError } from '../../api/client';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

interface Step3Props {
  customer: Customer;
  branch: Branch;
  session: VerificationSession;
  amount: number;
  onHomeBranchVerified: (data: any) => void;
  onBack: () => void;
}

export const Step3HomeBranchCheck: React.FC<Step3Props> = ({
  customer,
  branch,
  session,
  amount,
  onHomeBranchVerified,
  onBack,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fault injection controls
  const [simulateTimeout, setSimulateTimeout] = useState<boolean>(false);
  const [simulateDown, setSimulateDown] = useState<boolean>(false);

  useEffect(() => {
    executeHomeBranchQuery();
  }, []);

  const executeHomeBranchQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyHomeBranch({
        customer_id: customer.id,
        simulate_timeout: simulateTimeout,
        simulate_down: simulateDown,
      });
      setResponse(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Home branch verification failed');
      } else {
        setError('Network connectivity or gateway timeout communicating with home branch switch');
      }
    } finally {
      setLoading(false);
    }
  };

  const isEligible = response?.is_eligible === true;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <span>STEP 3 OF 5</span>
          <span>·</span>
          <span>REAL-TIME HOME-BRANCH IDENTITY CHECK</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Registered Home-Branch Authentication & Core Switch Check
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Authoritative query to customer's registered home branch banking switch to verify KYC status, ledger account status, and cross-branch permissions.
        </p>
      </div>

      {/* Network & Service Path Diagram */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>INTER-BRANCH CORE SWITCH ROUTING</span>
          </span>
          <span className="text-emerald-400">STATUS: MUTUAL TLS (mTLS) ENCRYPTED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">REQUESTING TERMINAL</span>
            <span className="font-bold text-white block mt-0.5">{branch.name}</span>
            <span className="text-[11px] font-mono text-slate-400">Code: {branch.branch_code}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-center items-center text-center">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-500 font-mono">SECURECROSS SWITCHWAY</span>
            <span className="text-[11px] font-mono text-indigo-300">
              {loading ? 'Transmitting RPC packet...' : `Latency: ${response?.simulated_switch_latency_ms || 120}ms`}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block">REGISTERED HOME BRANCH</span>
            <span className="font-bold text-white block mt-0.5">
              {response?.home_branch?.name || 'Registered Home Branch'}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Code: {response?.home_branch?.branch_code || customer.home_branch_id}
            </span>
          </div>
        </div>
      </div>

      {/* Fault Injection for Home Branch */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Fault Injection & Resilience Testing
          </span>
          <button
            type="button"
            onClick={executeHomeBranchQuery}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-query Switch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={simulateTimeout}
              onChange={(e) => {
                setSimulateTimeout(e.target.checked);
                if (e.target.checked) setSimulateDown(false);
              }}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">
                Simulate Gateway Timeout (Test 18)
              </span>
              <span className="text-[10px] text-slate-500">
                Remote switch fails to respond within timeout window (HTTP 504)
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={simulateDown}
              onChange={(e) => {
                setSimulateDown(e.target.checked);
                if (e.target.checked) setSimulateTimeout(false);
              }}
              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold text-slate-200 block">
                Simulate Switch Offline (Fail-Closed)
              </span>
              <span className="text-[10px] text-slate-500">
                Core banking system offline triggers immediate fail-closed denial (HTTP 503)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Query Outcome / Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold font-mono">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>HOME-BRANCH VERIFICATION FAILED (FAIL-CLOSED DEFENSE)</span>
          </div>
          <p className="text-slate-300">{error}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            Security policy: Zero cash may be disbursed when home branch authentication or status checks cannot be verified authoritatively.
          </p>
        </div>
      )}

      {response && !error && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Home-Branch Verification Payload
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                isEligible
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-rose-950/60 border-rose-800 text-rose-400'
              }`}
            >
              Account Status: {response.account_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">AVAILABLE BALANCE</span>
              <span className="text-lg font-bold text-emerald-400 block mt-1 tabular-nums">
                ₹{response.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">REMAINING DAILY ALLOWANCE</span>
              <span className="text-lg font-bold text-white block mt-1 tabular-nums">
                ₹{response.remaining_daily_allowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Policy Max ₹50,000/day</span>
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CROSS-BRANCH WITHDRAWAL</span>
              <span
                className={`text-sm font-bold block mt-1.5 uppercase ${
                  isEligible ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isEligible ? 'PERMITTED' : 'DENIED / BLOCKED'}
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border flex items-center gap-3 text-xs ${
              isEligible
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800 text-rose-300'
            }`}
          >
            {isEligible ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {isEligible
                  ? 'Home branch verified identity and approved cross-branch authorization.'
                  : 'Customer account is inactive, frozen or ineligible for withdrawal.'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isEligible
                  ? `Customer standing verified with ${response.home_branch?.name}. Proceed to final transaction security controls.`
                  : 'Account cannot be debited in this state under anti-fraud banking rules.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg border border-slate-800 sm:border-transparent flex items-center justify-center"
        >
          ← Back to Biometric Verification
        </button>

        <button
          type="button"
          onClick={() => {
            if (response && isEligible) {
              onHomeBranchVerified(response);
            }
          }}
          disabled={!response || !isEligible || loading}
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs transition-colors shadow-sm w-full sm:w-auto"
        >
          <span>Proceed to Transaction Security Checks</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
