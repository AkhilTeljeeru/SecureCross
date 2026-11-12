import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bank, BankApplication, BankBranch } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { BankRegistrationModal } from './BankRegistrationModal';
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  MapPin,
  Phone,
  Mail,
  X,
  FileText,
} from 'lucide-react';

export const BanksDirectoryView: React.FC = () => {
  const { operator } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [applications, setApplications] = useState<BankApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'directory' | 'reviews'>('directory');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedBankForBranches, setSelectedBankForBranches] = useState<Bank | null>(null);

  // Review portal state
  const [selectedApplication, setSelectedApplication] = useState<BankApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const isPlatformAdmin = operator?.role === 'MANAGER' || operator?.role === 'AUDITOR';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [banksRes, appsRes] = await Promise.all([
        api.getBanks(),
        api.getAdminBankApplications(),
      ]);
      setBanks(banksRes.banks);
      setApplications(appsRes.applications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.legal_name.toLowerCase().includes(q) ||
      b.registration_licence_number.toLowerCase().includes(q) ||
      b.registered_address.toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || b.bank_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleApproveApplication = async (appId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.approveBankApplication(appId, actionNotes || 'Compliance and regulatory standards verified.');
      setSelectedApplication(null);
      setActionNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve bank application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    if (!actionNotes) {
      setActionError('Please provide a specific reason for rejection');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.rejectBankApplication(appId, actionNotes);
      setSelectedApplication(null);
      setActionNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject bank application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (appId: string) => {
    if (!actionNotes) {
      setActionError('Please specify the additional information required');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.requestApplicationInfo(appId, actionNotes);
      setSelectedApplication(null);
      setActionNotes('');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to request additional information');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingAppsCount = applications.filter(
    (a) => a.application_status === 'SUBMITTED' || a.application_status === 'UNDER_REVIEW'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>FEDERATED BANKING DIRECTORY</span>
            <span>·</span>
            <span>MULTI-BANK PARTICIPATING NETWORK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Registered Banking Institutions & Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized banking institutions permitted to participate in the SecureCross cross-branch identity and cash authorization framework.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register a Bank</span>
          </button>
        </div>
      </div>

      {/* Primary Tabs (Directory vs Administrator Review Portal) */}
      <div className="flex items-center justify-between border-b border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 font-mono text-xs whitespace-nowrap min-w-max">
          <button
            onClick={() => setActiveTab('directory')}
            className={`min-h-[40px] py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Approved Banks Directory ({banks.length})</span>
          </button>

          {isPlatformAdmin && (
            <button
              onClick={() => setActiveTab('reviews')}
              className={`min-h-[40px] py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Admin Onboarding Review Portal</span>
              {pendingAppsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/40">
                  {pendingAppsCount} pending
                </span>
              )}
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 shrink-0 pl-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>mTLS Core Banking Federation</span>
        </div>
      </div>

      {/* TAB 1: APPROVED BANKS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search bank name, licence number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">TYPE:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white font-mono focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="PUBLIC_SECTOR">Public Sector</option>
                <option value="PRIVATE">Private Sector</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="COOPERATIVE">Cooperative</option>
                <option value="PAYMENT_BANK">Payments Bank</option>
              </select>
            </div>
          </div>

          {/* Banks Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Loading federated directory...
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-xl bg-slate-900 border border-slate-800">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <p className="text-base text-slate-200 font-semibold">
                  {banks.length === 0 ? 'No banks registered yet.' : 'No banks found matching filter'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {banks.length === 0
                    ? 'Submit a bank application to register a participating institution, declare regulatory licence, and register authorized branches.'
                    : 'Try adjusting your search keywords or selecting a different category filter.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register a Bank</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBanks.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{b.legal_name}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 uppercase">
                            {b.bank_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block mt-1">
                          Licence: <strong className="text-slate-300">{b.registration_licence_number}</strong> · {b.country}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${
                          b.directory_status === 'APPROVED'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : b.directory_status === 'UNDER_REVIEW'
                            ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                            : 'bg-rose-950/60 border-rose-800 text-rose-400'
                        }`}
                      >
                        {b.directory_status}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{b.registered_address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                        <span>{b.official_email}</span>
                        <span>{b.contact_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Integration Status & Branch Drawer CTA */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">SWITCH INTEGRATION:</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          b.integration_status === 'APPROVED'
                            ? 'bg-indigo-950 border-indigo-800 text-indigo-300'
                            : b.integration_status === 'SANDBOX_READY'
                            ? 'bg-amber-950 border-amber-800 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {b.integration_status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBankForBranches(b)}
                      className="min-h-[38px] text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-start sm:justify-end gap-1 font-semibold cursor-pointer"
                    >
                      <span>{b.branches?.length || b.participating_branches_count || 1} Branches</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLATFORM ADMINISTRATOR REVIEW PORTAL */}
      {activeTab === 'reviews' && isPlatformAdmin && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <h3 className="font-bold text-white text-xs font-mono uppercase text-amber-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Platform Administrator Review Queue</span>
            </h3>
            <p className="text-xs text-slate-400">
              Applications submitted by institutions must be vetted for regulatory compliance before directory listing and switch connectivity.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">APPLICATION ID</th>
                  <th className="py-3 px-4 font-semibold">LEGAL INSTITUTION</th>
                  <th className="py-3 px-4 font-semibold">LICENCE NUMBER</th>
                  <th className="py-3 px-4 font-semibold">REPRESENTATIVE</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applications.map((appItem) => (
                  <tr key={appItem.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-indigo-400">{appItem.id}</td>
                    <td className="py-3 px-4 text-white font-semibold">{appItem.legal_name}</td>
                    <td className="py-3 px-4 text-slate-300">{appItem.registration_licence_number}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {appItem.representative?.full_name} ({appItem.representative?.designation})
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                          appItem.application_status === 'APPROVED'
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : appItem.application_status === 'UNDER_REVIEW'
                            ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                            : appItem.application_status === 'ADDITIONAL_INFO_REQUIRED'
                            ? 'bg-purple-950/60 border-purple-800 text-purple-400'
                            : appItem.application_status === 'REJECTED'
                            ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {appItem.application_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedApplication(appItem)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-xs transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Review Drawer / Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-4 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">
                  Application Dossier Review
                </span>
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedApplication.legal_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-mono">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Licence Number:</span>
                  <span className="text-white font-bold">{selectedApplication.registration_licence_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution Type:</span>
                  <span className="text-indigo-300">{selectedApplication.bank_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Address:</span>
                  <span className="text-slate-200 truncate max-w-xs">{selectedApplication.registered_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Official Email:</span>
                  <span className="text-slate-200">{selectedApplication.official_email}</span>
                </div>
              </div>

              {/* Representative */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold block">AUTHORIZED REPRESENTATIVE</span>
                <p className="text-white font-semibold">
                  {selectedApplication.representative?.full_name} · {selectedApplication.representative?.designation}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedApplication.representative?.authorization_evidence_summary}
                </p>
              </div>

              {/* Documents */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-indigo-400 font-bold block">ATTACHED REGULATORY DOCUMENTS</span>
                {selectedApplication.documents?.length === 0 ? (
                  <span className="text-slate-500 text-[11px]">No uploaded documents attached.</span>
                ) : (
                  selectedApplication.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-900 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-200">{d.file_name}</span>
                      </div>
                      <span className="text-emerald-400">{d.verification_status}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Review notes input */}
              <div>
                <label className="text-slate-400 block mb-1">
                  Administrator Review Notes / Reason Code:
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter compliance decision rationale..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white text-xs focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRequestInfo(selectedApplication.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono"
              >
                Request Additional Info
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectApplication(selectedApplication.id)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveApplication(selectedApplication.id)}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold"
                >
                  Approve to Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branches Drawer */}
      {selectedBankForBranches && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">
                  Authorized Branch Directory
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedBankForBranches.legal_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBankForBranches(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(!selectedBankForBranches.branches || selectedBankForBranches.branches.length === 0) ? (
                <p className="text-xs text-slate-500 font-mono py-4 text-center">
                  No registered active branches currently enrolled.
                </p>
              ) : (
                selectedBankForBranches.branches.map((br) => (
                  <div key={br.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{br.name}</span>
                      <span className="font-mono text-[10px] text-indigo-400">{br.branch_code}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{br.address || br.location}</span>
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedBankForBranches(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <BankRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onApplicationCreated={loadData}
      />
    </div>
  );
};
