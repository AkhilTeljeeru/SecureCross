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

  const handleResetData = async () => {
    if (confirm('Reset all synthetic demo data, verification sessions and transactions to initial state?')) {
      setResetting(true);
      try {
        await api.resetDemoData();
        if (onRefreshData) onRefreshData();
        setMobileMenuOpen(false);
      } catch (e) {
        console.error(e);
      } finally {
        setResetting(false);
      }
    }
  };

  const handleLoadFixtures = async () => {
    if (confirm('Load synthetic test fixtures (demonstration banks, branches and test identities) into directory?')) {
      setResetting(true);
      try {
        await api.seedTestFixtures();
        if (onRefreshData) onRefreshData();
        setMobileMenuOpen(false);
        window.location.reload();
      } catch (e) {
        console.error(e);
      } finally {
        setResetting(false);
      }
    }
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
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavItemClick('dashboard')}
              className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1 -m-1"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block leading-tight">
                  SecureCross
                </span>
                <span className="text-[10px] tracking-wider text-slate-400 font-mono uppercase block -mt-0.5">
                  Cross-Branch Auth V2.0
                </span>
              </div>
            </button>

            {/* Desktop branch chip */}
            {branch ? (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-300 font-medium truncate max-w-[140px]">{branch.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">({branch.branch_code})</span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400 font-medium">No branch selected</span>
              </div>
            )}
          </div>

          {/* Zone 2: Desktop 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavItemClick(link.id)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs tracking-wide ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-300 hover:text-indigo-100 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/80 rounded-md transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="whitespace-nowrap">Load Fixtures</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={resetting}
              title="Reset database to clean initial state (zero banks and zero branches)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="whitespace-nowrap">Reset</span>
            </button>

            {/* Desktop Operator Role Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[120px]">{operator?.full_name || 'Operator'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {operator?.role || 'OPERATOR'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200">Switch Operator Role (Dev)</p>
                    <p className="text-[11px] text-slate-400">Prototype role-based simulation</p>
                  </div>

                  <button
                    onClick={() => {
                      switchRole('OPERATOR');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                      operator?.role === 'OPERATOR' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Priya Sharma</p>
                      <p className="text-[10px] text-slate-500">Branch Teller · Delhi CP Branch</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">OPERATOR</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('MANAGER');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                      operator?.role === 'MANAGER' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Ananya Verma</p>
                      <p className="text-[10px] text-slate-500">Branch Manager · Delhi CP Branch</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">MANAGER</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('AUDITOR');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${
                      operator?.role === 'AUDITOR' ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium">Vikramaditya Rao</p>
                      <p className="text-[10px] text-slate-500">Security & Compliance Auditor · HQ</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">AUDITOR</span>
                  </button>

                  <div className="mt-2 pt-2 border-t border-slate-800 px-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <KeyRound className="w-3 h-3 text-slate-400" />
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
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-full max-h-[90vh] bg-slate-900 border-b border-slate-800 shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-base font-bold text-white block">SecureCross</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block -mt-0.5">
                    Mobile Navigation
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Destinations */}
            <div className="p-4 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase px-3 pb-1 block">
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
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-200 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}
                      />
                      <span>{link.label}</span>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Operator Profile & Role Switcher */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Active Operator (RBAC)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {operator?.role || 'OPERATOR'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{operator?.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {branch ? `${branch.name} (${branch.branch_code})` : 'Unassigned Branch'}
                    </p>
                  </div>
                </div>

                {/* Role Switcher Buttons */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-1.5">
                  {(['OPERATOR', 'MANAGER', 'AUDITOR'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                      }}
                      className={`min-h-[40px] py-1.5 px-2 rounded font-mono text-[11px] transition-colors ${
                        operator?.role === r
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Database & Demo Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
              <button
                type="button"
                onClick={handleLoadFixtures}
                disabled={resetting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800 text-indigo-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Load Demonstration Banks & Branches</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Reset to Clean Initial Database State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
