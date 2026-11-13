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
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
          <span>STEP 1 OF 5</span>
          <span className="text-slate-300">·</span>
          <span>VISITING BRANCH & TRANSACTION SPECIFICATION</span>
        </div>
        <h2 className="text-xl font-bold text-[#172554] mt-1">
          Cardless Non-Home Branch Cash Withdrawal Request
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Customer arrives at a participating network branch without physical card. Specify the visiting location and requested amount to initiate biometric authentication.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Visiting Branch Selection & Amount Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Dynamic Searchable Visiting Branch Selection with Empty State */}
        <div className="space-y-4 p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>1. Current Visiting Branch (Non-Home)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterBankOpen(true)}
                className="text-xs text-[#2563EB] hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register a Bank</span>
              </button>
            </div>

            {/* Empty State Banner if no branch is currently selected */}
            {!selectedBranch ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-dashed border-amber-200 text-[#64748B] space-y-1.5">
                <div className="flex items-center gap-2 text-[#D97706] font-semibold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No visiting branch selected.</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Register or approve a bank and its branches before selecting the customer's visiting branch.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB] text-[#172554] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172554]">{selectedBranch.name}</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white text-[#2563EB] border border-blue-200">
                      {selectedBranch.branch_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-1">
                    <span className="text-[#2563EB] font-semibold">{selectedBranch.bank_name}</span>
                    <span>·</span>
                    <span>{selectedBranch.location}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBranchId('')}
                  className="px-2.5 py-1 text-[11px] font-medium text-[#64748B] hover:text-[#172554] bg-white border border-[#E2E8F0] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}

            <p className="text-xs text-[#64748B]">
              Select an approved active branch from PostgreSQL:
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search branch name, code, city, or bank..."
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            {/* Branch List / Empty / Loading */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#64748B] flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin" />
                  <span>Loading eligible branches from PostgreSQL...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-lg space-y-2.5">
                  <p className="font-semibold text-[#172554]">No active visiting branches found in database.</p>
                  <p className="text-[11px] text-[#64748B]">
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
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      Seed Active Branches Fixture
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegisterBankOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-white text-[#172554] border border-[#E2E8F0] hover:bg-slate-50 text-xs font-medium cursor-pointer"
                    >
                      + Register Bank
                    </button>
                  </div>
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#64748B]">
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
                          ? 'bg-[#EFF6FF] border-[#2563EB] shadow-2xs ring-1 ring-blue-500/20'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#172554]">{b.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">
                            {b.branch_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-1">
                          <span className="text-[#2563EB] font-medium">
                            {b.bank_name || 'Participating Bank'}
                          </span>
                          <span>·</span>
                          <span>{b.location}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 bg-white shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#64748B] flex items-center justify-between border-t border-[#E2E8F0]">
            <span>Only approved banks' active branches displayed</span>
            <span className="font-mono font-medium text-[#172554]">{branches.length} branches available</span>
          </div>
        </div>

        {/* Section 2: Requested Cash Amount */}
        <div className="space-y-4 p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#16A34A]" />
                <span>2. Requested Cash Amount</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#2563EB]">Policy Cap ₹50,000/day</span>
            </div>

            <p className="text-xs text-[#64748B] mt-2">
              Specify the exact cash amount requested at the terminal:
            </p>

            <div className="mt-4">
              <label className="text-xs font-medium text-[#172554] block mb-1.5">
                Enter Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  min="500"
                  max="50000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] font-mono text-lg font-bold focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 tabular-nums"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-3">
              <span className="text-[11px] text-[#64748B] font-medium block mb-1.5">
                Standard Denominations
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickAmounts.map((qAmt) => (
                  <button
                    key={qAmt}
                    type="button"
                    onClick={() => setAmount(qAmt)}
                    className={`min-h-[40px] py-1.5 px-2 text-xs font-mono rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                      amount === qAmt
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#172554] hover:border-blue-300'
                    }`}
                  >
                    ₹{qAmt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
            <div className="flex justify-between">
              <span>Prototype Daily Cap:</span>
              <span className="text-[#172554] font-mono font-semibold">₹50,000.00 / Calendar Day</span>
            </div>
            <div className="flex justify-between">
              <span>Single-Use Token Window:</span>
              <span className="text-[#D97706] font-mono font-semibold">180 Seconds (3 Minutes)</span>
            </div>
            <div className="flex justify-between">
              <span>Disbursement Condition:</span>
              <span className="text-[#16A34A] font-semibold">Strict Visiting != Home Branch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Customer Identity & Home Branch — Empty Initial States (V2.3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Identity Empty Initial State */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#16A34A]" />
                <span>Synthetic Customer Identification & Privacy Guard</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Zero Pre-Verification Disclosure
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 border border-green-200 text-[#16A34A]">
              Privacy Guard Active
            </span>
          </div>

          {/* Required V2.3 Empty State */}
          <div className="p-4 rounded-xl bg-amber-50 border border-dashed border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-[#D97706] font-semibold text-xs">
              <UserX className="w-4 h-4 shrink-0 text-[#D97706]" />
              <span>Customer identity has not been verified.</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Customer details will appear only after the required identity verification and home-branch checks succeed.
            </p>
          </div>

          {/* Placeholder Area for Future Verification Result (Empty by default) */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
            <div className="flex justify-between">
              <span>Customer Profile:</span>
              <span className="font-medium text-[#172554]">Pending Verification</span>
            </div>
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="font-medium text-[#172554]">Locked / Hidden</span>
            </div>
            <div className="flex justify-between">
              <span>Available Balance:</span>
              <span className="font-medium text-[#172554]">Locked / Hidden</span>
            </div>
          </div>

          {/* Optional Un-Prefilled Claim Reference Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-[#172554] block">
              Optional: Customer Cardless Identifier / Claim Token
            </label>
            <input
              type="text"
              placeholder="e.g. Cardless Reference or leave empty for direct biometric search"
              value={claimReference}
              onChange={(e) => setClaimReference(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] font-mono placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
            />
            <span className="text-[11px] text-[#64748B] block">
              Leave blank to perform direct biometric identification at the terminal.
            </span>
          </div>
        </div>

        {/* Home Branch Empty Initial State */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2563EB]" />
                <span>Home Branch Verification Status</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Core Banking Switch Interconnect
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-[#E2E8F0] text-[#64748B]">
              Unverified
            </span>
          </div>

          {/* Required V2.3 Home Branch Empty State */}
          <div className="p-4 rounded-xl bg-amber-50 border border-dashed border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-[#D97706] font-semibold text-xs">
              <Shield className="w-4 h-4 shrink-0 text-[#D97706]" />
              <span>Home branch not yet verified.</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              The registered home branch will be displayed only after successful customer identity verification and confirmation by the authorized home-branch service.
            </p>
          </div>

          {/* Placeholder Area for Future Home Branch Result */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
            <div className="flex justify-between">
              <span>Home Financial Institution:</span>
              <span className="font-medium text-[#172554]">Pending Resolution</span>
            </div>
            <div className="flex justify-between">
              <span>Home Branch Code:</span>
              <span className="font-medium text-[#172554]">Pending Resolution</span>
            </div>
            <div className="flex justify-between">
              <span>Inter-Branch Switch Link:</span>
              <span className="font-medium text-[#2563EB]">Standby (mTLS Armed)</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#64748B]">
            <span>Security Invariant: Visiting branch must strictly differ from confirmed home branch.</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#172554] transition-colors rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!selectedBranch && (
            <span className="text-[11px] text-[#D97706] font-medium text-center sm:text-left">
              Please select a visiting branch above to advance
            </span>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedBranch || amount <= 0 || amount > 50000}
            className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
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
