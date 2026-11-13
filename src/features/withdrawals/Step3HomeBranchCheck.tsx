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
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
          <span>STEP 3 OF 5</span>
          <span className="text-slate-300">·</span>
          <span>REAL-TIME HOME-BRANCH IDENTITY CHECK</span>
        </div>
        <h2 className="text-xl font-bold text-[#172554] mt-1">
          Registered Home-Branch Authentication & Core Switch Check
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Authoritative query to customer's registered home branch banking switch to verify KYC status, ledger account status, and cross-branch permissions.
        </p>
      </div>

      {/* Network & Service Path Diagram */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#172554] font-semibold flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>INTER-BRANCH CORE SWITCH ROUTING</span>
          </span>
          <span className="text-[#16A34A] font-semibold font-mono text-[11px]">
            STATUS: MUTUAL TLS (mTLS) ENCRYPTED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase block">REQUESTING TERMINAL</span>
            <span className="font-bold text-[#172554] block mt-0.5">{branch.name}</span>
            <span className="text-[11px] font-mono text-[#64748B]">Code: {branch.branch_code}</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-blue-200 flex flex-col justify-center items-center text-center">
            <Zap className="w-4 h-4 text-[#D97706] mb-1" />
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">SECURECROSS SWITCHWAY</span>
            <span className="text-[11px] font-mono font-semibold text-[#2563EB]">
              {loading ? 'Transmitting RPC packet...' : `Latency: ${response?.simulated_switch_latency_ms || 120}ms`}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase block">REGISTERED HOME BRANCH</span>
            <span className="font-bold text-[#172554] block mt-0.5">
              {response?.home_branch?.name || 'Registered Home Branch'}
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              Code: {response?.home_branch?.branch_code || customer.home_branch_id}
            </span>
          </div>
        </div>
      </div>

      {/* Fault Injection for Home Branch */}
      <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <span className="text-xs font-bold text-[#172554] uppercase tracking-wider">
            Fault Injection & Resilience Testing
          </span>
          <button
            type="button"
            onClick={executeHomeBranchQuery}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-blue-700 font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-query Switch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              checked={simulateTimeout}
              onChange={(e) => {
                setSimulateTimeout(e.target.checked);
                if (e.target.checked) setSimulateDown(false);
              }}
              className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <div>
              <span className="font-semibold text-[#172554] block">
                Simulate Gateway Timeout (Test 18)
              </span>
              <span className="text-[11px] text-[#64748B]">
                Remote switch fails to respond within timeout window (HTTP 504)
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              checked={simulateDown}
              onChange={(e) => {
                setSimulateDown(e.target.checked);
                if (e.target.checked) setSimulateTimeout(false);
              }}
              className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <div>
              <span className="font-semibold text-[#172554] block">
                Simulate Switch Offline (Fail-Closed)
              </span>
              <span className="text-[11px] text-[#64748B]">
                Core banking system offline triggers immediate fail-closed denial (HTTP 503)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Query Outcome / Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <XCircle className="w-4 h-4 text-[#DC2626]" />
            <span>HOME-BRANCH VERIFICATION FAILED (FAIL-CLOSED DEFENSE)</span>
          </div>
          <p className="text-[#172554] font-medium">{error}</p>
          <p className="text-[11px] text-[#64748B]">
            Security policy: Zero cash may be disbursed when home branch authentication or status checks cannot be verified authoritatively.
          </p>
        </div>
      )}

      {response && !error && (
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <span className="text-xs font-bold text-[#172554] uppercase tracking-wider">
              Home-Branch Verification Payload
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded border uppercase ${
                isEligible
                  ? 'bg-green-50 border-green-200 text-[#16A34A]'
                  : 'bg-red-50 border-red-200 text-[#DC2626]'
              }`}
            >
              Account Status: {response.account_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase block">AVAILABLE BALANCE</span>
              <span className="text-lg font-bold font-mono text-[#16A34A] block mt-1 tabular-nums">
                ₹{response.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase block">REMAINING DAILY ALLOWANCE</span>
              <span className="text-lg font-bold font-mono text-[#172554] block mt-1 tabular-nums">
                ₹{response.remaining_daily_allowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-0.5">Policy Max ₹50,000/day</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase block">CROSS-BRANCH WITHDRAWAL</span>
              <span
                className={`text-sm font-bold block mt-1.5 uppercase ${
                  isEligible ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {isEligible ? 'PERMITTED' : 'DENIED / BLOCKED'}
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border flex items-center gap-3 text-xs ${
              isEligible
                ? 'bg-green-50 border-green-200 text-[#16A34A]'
                : 'bg-red-50 border-red-200 text-[#DC2626]'
            }`}
          >
            {isEligible ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {isEligible
                  ? 'Home branch verified identity and approved cross-branch authorization.'
                  : 'Customer account is inactive, frozen or ineligible for withdrawal.'}
              </p>
              <p className="text-[11px] text-[#172554]/80 mt-0.5">
                {isEligible
                  ? `Customer standing verified with ${response.home_branch?.name}. Proceed to final transaction security controls.`
                  : 'Account cannot be debited in this state under anti-fraud banking rules.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#172554] transition-colors rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
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
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Proceed to Transaction Security Checks</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
