import React, { useState } from 'react';
import { api } from '../../api/client';
import { BankApplication, BankType } from '../../api/types';
import {
  X,
  Building,
  User,
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';

interface BankRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationCreated: () => void;
}

export const BankRegistrationModal: React.FC<BankRegistrationModalProps> = ({
  isOpen,
  onClose,
  onApplicationCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form State
  const [legalName, setLegalName] = useState('');
  const [bankType, setBankType] = useState<BankType>('COMMERCIAL');
  const [country, setCountry] = useState('India');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Representative
  const [repName, setRepName] = useState('');
  const [repDesignation, setRepDesignation] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repAuthSummary, setRepAuthSummary] = useState('');

  // Branches
  const [branches, setBranches] = useState<
    Array<{
      branch_code: string;
      name: string;
      address: string;
      location: string;
      contact_phone: string;
      contact_email: string;
      is_home_branch_enabled: boolean;
    }>
  >([
    {
      branch_code: '',
      name: '',
      address: '',
      location: '',
      contact_phone: '',
      contact_email: '',
      is_home_branch_enabled: true,
    },
  ]);

  // Technical & Security
  const [securityEmail, setSecurityEmail] = useState('');
  const [technicalEmail, setTechnicalEmail] = useState('');
  const [sandboxReady, setSandboxReady] = useState(true);
  const [integrationNotes, setIntegrationNotes] = useState('');
  const [generalRequirements, setGeneralRequirements] = useState('');

  // Document metadata
  const [documents, setDocuments] = useState<
    Array<{
      document_type: string;
      file_name: string;
      file_size_bytes: number;
      mime_type: string;
    }>
  >([
    {
      document_type: 'REGULATORY_LICENCE',
      file_name: 'Central_Bank_Banking_Licence.pdf',
      file_size_bytes: 1240000,
      mime_type: 'application/pdf',
    },
  ]);

  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAddBranch = () => {
    setBranches([
      ...branches,
      {
        branch_code: '',
        name: '',
        address: '',
        location: '',
        contact_phone: '',
        contact_email: '',
        is_home_branch_enabled: true,
      },
    ]);
  };

  const handleRemoveBranch = (idx: number) => {
    if (branches.length === 1) return;
    setBranches(branches.filter((_, i) => i !== idx));
  };

  const handleBranchChange = (index: number, field: string, value: any) => {
    const updated = [...branches];
    updated[index] = { ...updated[index], [field]: value };
    setBranches(updated);
  };

  const handleSubmit = async () => {
    if (!declarationAccepted) {
      setError('You must accept the compliance and security declaration to proceed.');
      return;
    }
    if (!legalName || !licenceNumber || !officialEmail) {
      setError('Please fill in all required bank legal details.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: Partial<BankApplication> = {
        legal_name: legalName,
        bank_type: bankType,
        country,
        registered_address: registeredAddress,
        official_website: officialWebsite,
        registration_licence_number: licenceNumber,
        official_email: officialEmail,
        contact_number: contactNumber,
        representative: {
          id: `rep_${Date.now()}`,
          application_id: '',
          full_name: repName || 'Authorized Nodal Officer',
          designation: repDesignation || 'Chief Compliance Officer',
          work_email: repEmail || officialEmail,
          work_phone: repPhone || contactNumber,
          authorization_evidence_summary: repAuthSummary || 'Board resolution submitted.',
          created_at: new Date().toISOString(),
        },
        branches: branches.map((br, i) => ({
          id: `br_reg_${Date.now()}_${i}`,
          bank_id: '',
          application_id: '',
          branch_code: br.branch_code || `BR-${(i + 1).toString().padStart(3, '0')}`,
          name: br.name || `${legalName} Branch ${i + 1}`,
          address: br.address || registeredAddress,
          location: br.location || 'Metro Hub',
          contact_phone: br.contact_phone || contactNumber,
          contact_email: br.contact_email || officialEmail,
          is_home_branch_enabled: br.is_home_branch_enabled,
          status: 'PENDING' as const,
          created_at: new Date().toISOString(),
        })),
        security_contact_email: securityEmail || `security@${officialWebsite.replace(/^https?:\/\//, '') || 'bank.org'}`,
        technical_contact_email: technicalEmail || `tech@${officialWebsite.replace(/^https?:\/\//, '') || 'bank.org'}`,
        sandbox_readiness: sandboxReady,
        preferred_integration_notes: integrationNotes,
        general_requirements: generalRequirements,
        documents: documents.map((doc, idx) => ({
          id: `doc_${Date.now()}_${idx}`,
          application_id: '',
          document_type: doc.document_type as any,
          file_name: doc.file_name,
          file_size_bytes: doc.file_size_bytes,
          mime_type: doc.mime_type,
          storage_reference: `vault://securecross/${doc.file_name}`,
          verification_status: 'PENDING' as const,
          uploaded_at: new Date().toISOString(),
        })),
        declaration_accepted: declarationAccepted,
      };

      await api.createBankApplication(payload);
      setSuccess(true);
      onApplicationCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to submit bank onboarding application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl my-4 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 sm:pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
              <span>SecureCross Onboarding</span>
              <span>·</span>
              <span>Multi-Bank Directory Registration</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#172554] mt-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#2563EB]" />
              <span>Register a Financial Institution</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#172554] transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {success ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#172554]">
              Bank Application Successfully Submitted
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Your registration for <strong className="text-[#172554]">{legalName}</strong> has entered the compliance queue under status <span className="font-mono text-[#2563EB] font-semibold">SUBMITTED</span>. A platform administrator will review your regulatory licence before directory activation.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
              >
                Close &amp; Return to Directory
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs shrink-0">
              {[
                { s: 1, label: '1. Legal Identity' },
                { s: 2, label: '2. Representative' },
                { s: 3, label: '3. Initial Branches' },
                { s: 4, label: '4. Documents & Submit' },
              ].map((item) => (
                <button
                  key={item.s}
                  onClick={() => setStep(item.s)}
                  className={`min-h-[38px] py-2 px-2.5 rounded-lg text-left transition-colors border cursor-pointer ${
                    step === item.s
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-blue-200 font-semibold'
                      : step > item.s
                      ? 'bg-green-50 text-[#16A34A] border-green-200 font-medium'
                      : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:text-[#172554]'
                  }`}
                >
                  <span className="truncate block">{item.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* STEP 1: Legal Identity */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Bank Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Universal Bank Ltd"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>

                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Bank Institution Type *</label>
                      <select
                        value={bankType}
                        onChange={(e) => setBankType(e.target.value as BankType)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      >
                        <option value="COMMERCIAL">Commercial Scheduled Bank</option>
                        <option value="PUBLIC_SECTOR">Public Sector Undertaking</option>
                        <option value="PRIVATE">Private Sector Bank</option>
                        <option value="COOPERATIVE">Urban Cooperative Bank</option>
                        <option value="REGIONAL_RURAL">Regional Rural Bank (RRB)</option>
                        <option value="PAYMENT_BANK">Payments &amp; Small Finance Bank</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">
                        Regulatory Licence Number (RBI / Central Bank) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RBI/2026/LIC-9901"
                        value={licenceNumber}
                        onChange={(e) => setLicenceNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] font-mono focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>

                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Jurisdiction Country *</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#172554] font-medium block mb-1">Official Registered Headquarters Address</label>
                    <textarea
                      rows={2}
                      placeholder="Street, City, Postal Code"
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Official Website</label>
                      <input
                        type="url"
                        placeholder="https://bank.com"
                        value={officialWebsite}
                        onChange={(e) => setOfficialWebsite(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Official Nodal Email *</label>
                      <input
                        type="email"
                        placeholder="compliance@bank.com"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="+91-..."
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Representative */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-[#64748B] text-xs">
                    Provide the verified details of the designated bank officer authorized by the Board or power of attorney to manage the SecureCross directory integration:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Chandra"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Official Designation *</label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Risk Officer / Executive Director"
                        value={repDesignation}
                        onChange={(e) => setRepDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Work Email *</label>
                      <input
                        type="email"
                        placeholder="name@bank.com"
                        value={repEmail}
                        onChange={(e) => setRepEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                    <div>
                      <label className="text-[#172554] font-medium block mb-1">Direct Phone</label>
                      <input
                        type="tel"
                        placeholder="+91-..."
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#172554] font-medium block mb-1">
                      Authorization Evidence Summary (Board Resolution / Power of Attorney)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Board Resolution ref 2026/02 adopted on 14-Feb-2026 delegating cross-branch inter-bank authority."
                      value={repAuthSummary}
                      onChange={(e) => setRepAuthSummary(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Initial Branch Registration */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#172554]">Initial Participating Branches</h4>
                      <p className="text-[#64748B] text-xs">
                        Register initial branch terminals to be included upon directory approval.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBranch}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-[#2563EB] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Branch</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {branches.map((br, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                            Branch #{idx + 1}
                          </span>
                          {branches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBranch(idx)}
                              className="text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                              Branch Code *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. DEL-0402"
                              value={br.branch_code}
                              onChange={(e) =>
                                handleBranchChange(idx, 'branch_code', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] font-mono text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                              Branch Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Connaught Place Branch"
                              value={br.name}
                              onChange={(e) => handleBranchChange(idx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                              City &amp; State Location *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. New Delhi, NCR"
                              value={br.location}
                              onChange={(e) => handleBranchChange(idx, 'location', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                              Address Details
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 14 Barakhamba Road"
                              value={br.address}
                              onChange={(e) => handleBranchChange(idx, 'address', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Technical, Documents & Declaration */}
              {step === 4 && (
                <div className="space-y-4">
                  {/* Technical Contacts */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                    <span className="text-[11px] text-[#2563EB] font-bold uppercase tracking-wider block">
                      Technical &amp; Security Integration
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                          Security / CISO Email *
                        </label>
                        <input
                          type="email"
                          placeholder="secops@bank.com"
                          value={securityEmail}
                          onChange={(e) => setSecurityEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#64748B] block mb-1">
                          Core Switch Lead Email *
                        </label>
                        <input
                          type="email"
                          placeholder="switch-ops@bank.com"
                          value={technicalEmail}
                          onChange={(e) => setTechnicalEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] text-xs focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={sandboxReady}
                        onChange={(e) => setSandboxReady(e.target.checked)}
                        className="rounded border-[#E2E8F0] bg-white text-[#2563EB] focus:ring-0"
                      />
                      <span className="text-[#172554] text-xs font-medium">
                        Institution is ready for mTLS Sandbox Integration upon Directory Approval
                      </span>
                    </label>
                  </div>

                  {/* Documents Attached */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <span className="text-[11px] text-[#2563EB] font-bold uppercase tracking-wider block">
                      Compliance Documents (Metadata Enclosed)
                    </span>
                    <div className="space-y-1.5">
                      {documents.map((d, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 font-mono">
                            <FileText className="w-4 h-4 text-[#2563EB]" />
                            <span className="text-[#172554] font-medium">{d.file_name}</span>
                            <span className="text-[10px] text-[#64748B]">
                              ({(d.file_size_bytes / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-[#16A34A] px-2 py-0.5 rounded bg-green-50 border border-green-200">
                            ATTACHED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Declaration Acceptance */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => setDeclarationAccepted(e.target.checked)}
                        className="rounded border-[#E2E8F0] bg-white text-[#2563EB] focus:ring-0 mt-0.5"
                      />
                      <span className="text-[#64748B] text-xs leading-relaxed">
                        I hereby declare on behalf of <strong className="text-[#172554]">{legalName || 'the applicant institution'}</strong> that all regulatory registration numbers, compliance certifications, and representative details provided are genuine. I understand that directory listing approval does not automatically authorize live inter-bank transactions until formal mTLS technical verification has been completed.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="border-t border-[#E2E8F0] pt-3 sm:pt-4 flex items-center justify-between shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#64748B] hover:text-[#172554] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="min-h-[44px] flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <span>{submitting ? 'Submitting Application...' : 'Submit Bank Application'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
