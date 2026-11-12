import React, { useState, useEffect } from 'react';
import { Branch } from '../../api/types';
import { api } from '../../api/client';
import { BankRegistrationModal } from '../banks/BankRegistrationModal';
import {
  Search,
  Building2,
  AlertCircle,
  ArrowRight,
  Wallet,
  Check,
  Plus,
  Shield,
  Lock,
  RefreshCw,
  Home,
  UserX,
  X,
} from 'lucide-react';

interface Step1Props {
  currentBranch: Branch | null;
  onProceed: (branch: Branch, amount: number, claimReference?: string) => void;
  onCancel: () => void;
}

export const Step1BranchCustomer: React.FC<Step1Props> = ({
  onProceed,
  onCancel,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  // V2.3: Strictly empty initial state - no preselected branch, no prefilled customer reference
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branchSearchQuery, setBranchSearchQuery] = useState<string>('');
  const [amount, setAmount] = useState<number>(15000);
  const [claimReference, setClaimReference] = useState<string>(''); // Completely empty by default
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterBankOpen, setIsRegisterBankOpen] = useState<boolean>(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBranches();
      setBranches(res.branches || []);
    } catch (e: any) {
      console.error('Failed to load branches', e);
      setError('Failed to load eligible active branches from PostgreSQL/backend. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter((b) => {
    const q = branchSearchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.branch_code.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      (b.bank_name && b.bank_name.toLowerCase().includes(q))
    );
  });

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || null;
  const quickAmounts = [2000, 5000, 10000, 15000, 25000, 50000];

  const handleContinue = () => {
    if (!selectedBranch) {
      setError('Please explicitly select the Current Visiting Branch where the customer is standing.');
      return;
    }
    if (amount <= 0) {
      setError('Withdrawal amount must be greater than zero.');
      return;
    }
    if (amount > 50000) {
      setError('Requested amount exceeds prototype maximum daily policy (₹50,000.00).');
      return;
    }

    setError(null);
    onProceed(selectedBranch, amount, claimReference.trim() || undefined);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <span>STEP 1 OF 5</span>
          <span>·</span>
          <span>VISITING BRANCH & TRANSACTION SPECIFICATION</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Cardless Non-Home Branch Cash Withdrawal Request
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customer arrives at a participating network branch without physical card. Specify the visiting location and requested amount to initiate biometric authentication.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Visiting Branch Selection & Amount Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Dynamic Searchable Visiting Branch Selection with Empty State */}
        <div className="space-y-4 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>1. Current Visiting Branch (Non-Home)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterBankOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register a Bank</span>
              </button>
            </div>

            {/* Empty State Banner if no branch is currently selected */}
            {!selectedBranch ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No visiting branch selected.</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Register or approve a bank and its branches before selecting the customer's visiting branch.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/80 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{selectedBranch.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {selectedBranch.branch_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono mt-1">
                    <span className="text-indigo-400 font-medium">{selectedBranch.bank_name}</span>
                    <span>·</span>
                    <span>{selectedBranch.location}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBranchId('')}
                  className="px-2.5 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Select an approved active branch from PostgreSQL:
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search branch name, code, city, or bank..."
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Branch List / Empty / Loading */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span>Loading eligible branches from PostgreSQL...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg space-y-2.5">
                  <p className="font-semibold text-slate-300">No active visiting branches found in database.</p>
                  <p className="text-[11px] text-slate-500">
                    Register a bank and approve branches in the Banks Directory, or load the PostgreSQL test fixtures to immediately simulate a terminal counter.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await api.seedTestFixtures();
                          await loadBranches();
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-mono shadow-sm"
                    >
                      ⚡ Seed Active Branches Fixture
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegisterBankOpen(true)}
                      className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-mono"
                    >
                      + Register Bank
                    </button>
                  </div>
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  No matching active branches found for "{branchSearchQuery}".
                </div>
              ) : (
                filteredBranches.map((b) => {
                  const isSelected = b.id === selectedBranchId;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-xs ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{b.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {b.branch_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                          <span className="text-indigo-300 font-medium">
                            {b.bank_name || 'Participating Bank'}
                          </span>
                          <span>·</span>
                          <span>{b.location}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/80">
            <span>Only approved banks' active branches displayed</span>
            <span className="text-slate-400">{branches.length} branches available</span>
          </div>
        </div>

        {/* Section 2: Requested Cash Amount */}
        <div className="space-y-4 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>2. Requested Cash Amount</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-400">Policy Cap ₹50,000/day</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Specify the exact cash amount requested at the terminal:
            </p>

            <div className="mt-4">
              <label className="text-xs text-slate-400 block mb-1.5 font-mono">
                Enter Amount (INR):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  min="500"
                  max="50000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-lg font-bold focus:outline-none focus:border-indigo-500 tabular-nums"
                />
              </div>
            </div>

              {/* Quick Amount Buttons */}
              <div className="mt-3">
                <span className="text-[11px] text-slate-400 block mb-1.5 font-mono">
                  Standard Denominations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickAmounts.map((qAmt) => (
                    <button
                      key={qAmt}
                      type="button"
                      onClick={() => setAmount(qAmt)}
                      className={`min-h-[40px] py-1.5 px-2 text-xs font-mono rounded border transition-colors flex items-center justify-center ${
                        amount === qAmt
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      ₹{qAmt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Prototype Daily Cap:</span>
              <span className="text-white font-semibold">₹50,000.00 / Calendar Day</span>
            </div>
            <div className="flex justify-between">
              <span>Single-Use Token Window:</span>
              <span className="text-amber-400 font-semibold">180 Seconds (3 Minutes)</span>
            </div>
            <div className="flex justify-between">
              <span>Disbursement Condition:</span>
              <span className="text-emerald-400 font-semibold">Strict Visiting != Home Branch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Customer Identity & Home Branch — Empty Initial States (V2.3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Identity Empty Initial State */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Synthetic Customer Identification & Privacy Guard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero Pre-Verification Disclosure
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
              Privacy Guard Active
            </span>
          </div>

          {/* Required V2.3 Empty State */}
          <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
              <UserX className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Customer identity has not been verified.</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Customer details will appear only after the required identity verification and home-branch checks succeed.
            </p>
          </div>

          {/* Placeholder Area for Future Verification Result (Empty by default) */}
          <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Customer Profile:</span>
              <span className="text-slate-400">Pending Verification</span>
            </div>
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="text-slate-400">Locked / Hidden</span>
            </div>
            <div className="flex justify-between">
              <span>Available Balance:</span>
              <span className="text-slate-400">Locked / Hidden</span>
            </div>
          </div>

          {/* Optional Un-Prefilled Claim Reference Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-slate-400 font-mono block">
              Optional: Customer Cardless Identifier / Claim Token:
            </label>
            <input
              type="text"
              placeholder="e.g. Cardless Reference or leave empty for direct biometric search"
              value={claimReference}
              onChange={(e) => setClaimReference(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500 font-mono block">
              Leave blank to perform direct biometric identification at the terminal.
            </span>
          </div>
        </div>

        {/* Home Branch Empty Initial State */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-400" />
                <span>Home Branch Verification Status</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Core Banking Switch Interconnect
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Unverified
            </span>
          </div>

          {/* Required V2.3 Home Branch Empty State */}
          <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
              <Shield className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Home branch not yet verified.</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The registered home branch will be displayed only after successful customer identity verification and confirmation by the authorized home-branch service.
            </p>
          </div>

          {/* Placeholder Area for Future Home Branch Result */}
          <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Home Financial Institution:</span>
              <span className="text-slate-400">Pending Resolution</span>
            </div>
            <div className="flex justify-between">
              <span>Home Branch Code:</span>
              <span className="text-slate-400">Pending Resolution</span>
            </div>
            <div className="flex justify-between">
              <span>Inter-Branch Switch Link:</span>
              <span className="text-slate-400">Standby (mTLS Armed)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            <span>Security Invariant: Visiting branch must strictly differ from confirmed home branch.</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg border border-slate-800 sm:border-transparent flex items-center justify-center"
        >
          Cancel
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!selectedBranch && (
            <span className="text-[11px] text-amber-400/90 font-mono text-center sm:text-left">
              Please select a visiting branch above to advance
            </span>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedBranch || amount <= 0 || amount > 50000}
            className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs transition-colors shadow-sm w-full sm:w-auto"
          >
            <span>Proceed to Biometric Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bank Registration Modal */}
      <BankRegistrationModal
        isOpen={isRegisterBankOpen}
        onClose={() => setIsRegisterBankOpen(false)}
        onApplicationCreated={() => {
          setIsRegisterBankOpen(false);
          loadBranches();
        }}
      />
    </div>
  );
};
