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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#2563EB] uppercase">
            <span>Federated Banking Directory</span>
            <span>·</span>
            <span>Multi-Bank Participating Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172554] mt-1">
            Registered Banking Institutions &amp; Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Authorized banking institutions permitted to participate in the SecureCross cross-branch identity and cash authorization framework.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register a Bank</span>
          </button>
        </div>
      </div>

      {/* Primary Tabs (Directory vs Administrator Review Portal) */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] overflow-x-auto no-scrollbar">
        <div className="flex gap-2 text-xs sm:text-sm whitespace-nowrap min-w-max">
          <button
            onClick={() => setActiveTab('directory')}
            className={`min-h-[42px] py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'border-[#2563EB] text-[#172554]'
                : 'border-transparent text-[#64748B] hover:text-[#172554]'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'directory' ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
            <span>Approved Banks Directory ({banks.length})</span>
          </button>

          {isPlatformAdmin && (
            <button
              onClick={() => setActiveTab('reviews')}
              className={`min-h-[42px] py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-[#2563EB] text-[#172554]'
                  : 'border-transparent text-[#64748B] hover:text-[#172554]'
              }`}
            >
              <Shield className="w-4 h-4 text-[#D97706]" />
              <span>Admin Onboarding Review Portal</span>
              {pendingAppsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#D97706] text-[11px] font-semibold border border-amber-200">
                  {pendingAppsCount} pending
                </span>
              )}
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-[#64748B] shrink-0 pl-4">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>mTLS Core Banking Federation</span>
        </div>
      </div>

      {/* TAB 1: APPROVED BANKS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search bank name, licence number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-2 px-3 text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#172554] font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
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
            <div className="p-12 text-center text-xs sm:text-sm text-[#64748B] bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
              Loading federated directory...
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <p className="text-base text-[#172554] font-semibold">
                  {banks.length === 0 ? 'No banks registered yet.' : 'No banks found matching filter'}
                </p>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
                  {banks.length === 0
                    ? 'Submit a bank application to register a participating institution, declare regulatory licence, and register authorized branches.'
                    : 'Try adjusting your search keywords or selecting a different category filter.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register a Bank</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBanks.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-bold text-[#172554] text-sm sm:text-base">{b.legal_name}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200 uppercase tracking-wide">
                            {b.bank_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#64748B] block mt-1">
                          Licence: <strong className="text-[#172554]">{b.registration_licence_number}</strong> · {b.country}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${
                          b.directory_status === 'APPROVED'
                            ? 'bg-green-50 border-green-200 text-[#16A34A]'
                            : b.directory_status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                            : 'bg-red-50 border-red-200 text-[#DC2626]'
                        }`}
                      >
                        {b.directory_status}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-[#64748B] space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                        <span className="truncate">{b.registered_address}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#64748B] pt-0.5">
                        <span>{b.official_email}</span>
                        <span>{b.contact_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Integration Status & Branch Drawer CTA */}
                  <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Switch Integration:</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          b.integration_status === 'APPROVED'
                            ? 'bg-[#EFF6FF] border-blue-200 text-[#2563EB]'
                            : b.integration_status === 'SANDBOX_READY'
                            ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                        }`}
                      >
                        {b.integration_status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBankForBranches(b)}
                      className="min-h-[38px] text-xs text-[#2563EB] hover:text-blue-700 flex items-center justify-start sm:justify-end gap-1 font-semibold cursor-pointer"
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
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#D97706] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Platform Administrator Review Queue</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Applications submitted by institutions must be vetted for regulatory compliance before directory listing and switch connectivity.
            </p>
          </div>

          <div className="rounded-xl bg-white border border-[#E2E8F0] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Application ID</th>
                  <th className="py-3 px-4 font-semibold">Legal Institution</th>
                  <th className="py-3 px-4 font-semibold">Licence Number</th>
                  <th className="py-3 px-4 font-semibold">Representative</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {applications.map((appItem) => (
                  <tr key={appItem.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-[#2563EB] font-mono font-medium">{appItem.id}</td>
                    <td className="py-3 px-4 text-[#172554] font-semibold">{appItem.legal_name}</td>
                    <td className="py-3 px-4 text-[#172554] font-mono">{appItem.registration_licence_number}</td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {appItem.representative?.full_name} ({appItem.representative?.designation})
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                          appItem.application_status === 'APPROVED'
                            ? 'bg-green-50 border-green-200 text-[#16A34A]'
                            : appItem.application_status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                            : appItem.application_status === 'ADDITIONAL_INFO_REQUIRED'
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : appItem.application_status === 'REJECTED'
                            ? 'bg-red-50 border-red-200 text-[#DC2626]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                        }`}
                      >
                        {appItem.application_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedApplication(appItem)}
                        className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-semibold text-xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl my-4 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 shrink-0">
              <div>
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                  Application Dossier Review
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#172554]">
                  {selectedApplication.legal_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-[#64748B] hover:text-[#172554] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium">
                {actionError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-[#64748B]">Licence Number:</span>
                  <span className="text-[#172554] font-bold font-mono">{selectedApplication.registration_licence_number}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#64748B]">Institution Type:</span>
                  <span className="text-[#2563EB] font-semibold">{selectedApplication.bank_type}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#64748B]">Registered Address:</span>
                  <span className="text-[#172554] truncate max-w-xs">{selectedApplication.registered_address}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#64748B]">Official Email:</span>
                  <span className="text-[#172554] font-mono">{selectedApplication.official_email}</span>
                </div>
              </div>

              {/* Representative */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] text-[#2563EB] font-bold uppercase tracking-wider block">Authorized Representative</span>
                <p className="text-[#172554] font-semibold">
                  {selectedApplication.representative?.full_name} · {selectedApplication.representative?.designation}
                </p>
                <p className="text-xs text-[#64748B]">
                  {selectedApplication.representative?.authorization_evidence_summary}
                </p>
              </div>

              {/* Documents */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-[11px] text-[#2563EB] font-bold uppercase tracking-wider block">Attached Regulatory Documents</span>
                {selectedApplication.documents?.length === 0 ? (
                  <span className="text-[#64748B] text-xs">No uploaded documents attached.</span>
                ) : (
                  selectedApplication.documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E2E8F0] last:border-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-[#172554] font-mono">{d.file_name}</span>
                      </div>
                      <span className="text-[#16A34A] font-semibold">{d.verification_status}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Review notes input */}
              <div>
                <label className="text-[#172554] font-medium block mb-1.5">
                  Administrator Review Notes / Reason Code:
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter compliance decision rationale..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-[#E2E8F0] pt-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRequestInfo(selectedApplication.id)}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#D97706] border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Request Additional Info
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectApplication(selectedApplication.id)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveApplication(selectedApplication.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                  Authorized Branch Directory
                </span>
                <h3 className="text-base font-bold text-[#172554]">
                  {selectedBankForBranches.legal_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBankForBranches(null)}
                className="text-[#64748B] hover:text-[#172554] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(!selectedBankForBranches.branches || selectedBankForBranches.branches.length === 0) ? (
                <p className="text-xs text-[#64748B] py-4 text-center">
                  No registered active branches currently enrolled.
                </p>
              ) : (
                selectedBankForBranches.branches.map((br) => (
                  <div key={br.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172554]">{br.name}</span>
                      <span className="font-mono text-[11px] text-[#2563EB] font-semibold">{br.branch_code}</span>
                    </div>
                    <p className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span>{br.address || br.location}</span>
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#E2E8F0] pt-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedBankForBranches(null)}
                className="px-4 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#172554] text-xs font-semibold transition-colors cursor-pointer"
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
