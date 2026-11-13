import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  RefreshCw,
  KeyRound,
  Building2,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Database,
  LayoutDashboard,
  Wallet,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onRefreshData }) => {
  const { operator, branch, switchRole } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'fixtures' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setResetting(true);
    setActionError(null);
    try {
      if (confirmAction === 'reset') {
        await api.resetDemoData();
      } else {
        await api.seedTestFixtures();
      }
      if (onRefreshData) onRefreshData();
      setMobileMenuOpen(false);
      setConfirmAction(null);
    } catch (e: any) {
      console.error(e);
      setActionError(e?.message || 'Action failed');
    } finally {
      setResetting(false);
    }
  };

  const handleResetData = () => {
    setActionError(null);
    setConfirmAction('reset');
  };

  const handleLoadFixtures = () => {
    setActionError(null);
    setConfirmAction('fixtures');
  };

  const handleNavItemClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_withdrawal', label: 'New Withdrawal', icon: Wallet },
    { id: 'history', label: 'Transactions', icon: Clock },
    { id: 'audit', label: 'Security Audit', icon: ShieldAlert },
    { id: 'banks', label: 'Banks Directory', icon: Building2 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavItemClick('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg p-1 -m-1 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-[#172554] whitespace-nowrap block leading-tight">
                  SecureCross
                </span>
                <span className="text-[10px] tracking-wider text-[#64748B] font-medium uppercase block -mt-0.5">
                  Cross-Branch Auth V2.0
                </span>
              </div>
            </button>

            {/* Desktop branch chip */}
            {branch ? (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                <Building2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="text-[#172554] font-medium truncate max-w-[140px]">{branch.name}</span>
                <span className="text-[#64748B] font-mono text-[11px]">({branch.branch_code})</span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                <Building2 className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span className="text-[#64748B] font-medium">No branch selected</span>
              </div>
            )}
          </div>

          {/* Zone 2: Desktop 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavItemClick(link.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs cursor-pointer ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border border-blue-200'
                      : 'text-[#64748B] hover:text-[#172554] hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Desktop Operator & Actions / Mobile Hamburger Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Quick Actions */}
            <button
              onClick={handleLoadFixtures}
              disabled={resetting}
              title="Seed isolated test fixtures into database"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2563EB] hover:text-blue-700 bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="whitespace-nowrap">Load Fixtures</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={resetting}
              title="Reset database to clean initial state (zero banks and zero branches)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#172554] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-[#2563EB]' : ''}`} />
              <span className="whitespace-nowrap">Reset</span>
            </button>

            {/* Desktop Operator Role Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#172554] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span className="truncate max-w-[120px]">{operator?.full_name || 'Operator'}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                  {operator?.role || 'OPERATOR'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#E2E8F0]">
                    <p className="font-semibold text-[#172554]">Switch Operator Role (Dev)</p>
                    <p className="text-[11px] text-[#64748B]">Prototype role-based simulation</p>
                  </div>

                  <button
                    onClick={() => {
                      switchRole('OPERATOR');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      operator?.role === 'OPERATOR' ? 'text-[#2563EB] font-semibold bg-[#EFF6FF]/60' : 'text-[#172554]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Priya Sharma</p>
                      <p className="text-[10px] text-[#64748B]">Branch Teller · Delhi CP Branch</p>
                    </div>
                    <span className="font-mono text-[10px] text-[#64748B]">OPERATOR</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('MANAGER');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      operator?.role === 'MANAGER' ? 'text-[#2563EB] font-semibold bg-[#EFF6FF]/60' : 'text-[#172554]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Ananya Verma</p>
                      <p className="text-[10px] text-[#64748B]">Branch Manager · Delhi CP Branch</p>
                    </div>
                    <span className="font-mono text-[10px] text-[#64748B]">MANAGER</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('AUDITOR');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      operator?.role === 'AUDITOR' ? 'text-[#2563EB] font-semibold bg-[#EFF6FF]/60' : 'text-[#172554]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Vikramaditya Rao</p>
                      <p className="text-[10px] text-[#64748B]">Security & Compliance Auditor · HQ</p>
                    </div>
                    <span className="font-mono text-[10px] text-[#64748B]">AUDITOR</span>
                  </button>

                  <div className="mt-2 pt-2 border-t border-[#E2E8F0] px-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                      <KeyRound className="w-3 h-3 text-[#64748B]" />
                      <span>Future: OIDC / Azure AD SSO</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button (min 44px x 44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white border border-[#E2E8F0] text-[#172554] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-start">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-full max-h-[90vh] bg-white border-b border-[#E2E8F0] shadow-xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB] shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <span className="text-base font-bold text-[#172554] block">SecureCross</span>
                  <span className="text-[10px] font-medium text-[#64748B] uppercase block -mt-0.5">
                    Mobile Navigation
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-slate-100 transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Destinations */}
            <div className="p-4 space-y-1">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider px-3 pb-1 block">
                Platform Sections
              </span>
              {navLinks.map((link) => {
                const isActive = currentView === link.id;
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavItemClick(link.id)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#EFF6FF] border border-blue-200 text-[#2563EB] font-semibold'
                        : 'text-[#172554] hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`}
                      />
                      <span>{link.label}</span>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Operator Profile & Role Switcher */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">
                  Active Operator (RBAC)
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                  {operator?.role || 'OPERATOR'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A] shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#172554] truncate">{operator?.full_name}</p>
                    <p className="text-[11px] text-[#64748B] font-mono truncate">
                      {branch ? `${branch.name} (${branch.branch_code})` : 'Unassigned Branch'}
                    </p>
                  </div>
                </div>

                {/* Role Switcher Buttons */}
                <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-3 gap-1.5">
                  {(['OPERATOR', 'MANAGER', 'AUDITOR'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                      }}
                      className={`min-h-[40px] py-1.5 px-2 rounded-lg font-medium text-[11px] transition-colors ${
                        operator?.role === r
                          ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                          : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172554] border border-[#E2E8F0]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Database & Demo Actions */}
            <div className="p-4 border-t border-[#E2E8F0] bg-white space-y-2">
              <button
                type="button"
                onClick={handleLoadFixtures}
                disabled={resetting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Database className="w-4 h-4 text-[#2563EB]" />
                <span>Load Demonstration Banks & Branches</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#172554] text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span>Reset to Clean Initial Database State</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal (replaces browser confirm() blocked in iframe contexts) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="font-bold text-sm text-[#172554]">
                {confirmAction === 'reset'
                  ? 'Reset Application Data'
                  : 'Load Synthetic Test Fixtures'}
              </span>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="text-[#64748B] hover:text-[#172554] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#64748B] leading-relaxed">
              {confirmAction === 'reset'
                ? 'Reset all banks, branches, verification sessions, and transactions back to the clean empty initial state?'
                : 'Populate synthetic test fixtures (demonstration banks, branches, and test identities) for evaluation?'}
            </p>

            {actionError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] font-medium">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={resetting}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#172554] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={resetting}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold cursor-pointer"
              >
                {resetting
                  ? 'Applying...'
                  : confirmAction === 'reset'
                  ? 'Confirm Reset'
                  : 'Load Fixtures'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
