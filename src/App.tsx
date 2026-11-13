import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DashboardView } from './features/dashboard/DashboardView';
import { NewWithdrawalView } from './features/withdrawals/NewWithdrawalView';
import { TransactionHistoryView } from './features/transactions/TransactionHistoryView';
import { AuditLogView } from './features/audit/AuditLogView';
import { SecurityTestLabView } from './features/tests/SecurityTestLabView';
import { DocsView } from './features/docs/DocsView';
import { BanksDirectoryView } from './features/banks/BanksDirectoryView';

function AppContent() {
  const { loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [auditFilterTxId, setAuditFilterTxId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-[#64748B]">Initializing SecureCross Engine...</span>
      </div>
    );
  }

  const handleNavigateToAuditWithTx = (txId?: string) => {
    setAuditFilterTxId(txId);
    setCurrentView('audit');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#172554] flex flex-col font-sans selection:bg-[#EFF6FF] selection:text-[#2563EB]">
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setAuditFilterTxId(undefined);
          setCurrentView(view);
        }}
        onRefreshData={() => setRefreshKey((k) => k + 1)}
      />

      <main className="flex-1 pb-16">
        {currentView === 'dashboard' && (
          <DashboardView
            key={refreshKey}
            onStartWithdrawal={() => setCurrentView('new_withdrawal')}
            onViewTransactions={() => setCurrentView('history')}
            onViewAudit={() => setCurrentView('audit')}
            onViewBanks={() => setCurrentView('banks')}
            onViewTests={() => setCurrentView('tests')}
          />
        )}

        {currentView === 'new_withdrawal' && (
          <NewWithdrawalView
            key={refreshKey}
            onFinish={() => setCurrentView('dashboard')}
            onViewAudit={() => setCurrentView('audit')}
          />
        )}

        {currentView === 'history' && (
          <TransactionHistoryView
            key={refreshKey}
            onViewAudit={handleNavigateToAuditWithTx}
          />
        )}

        {currentView === 'audit' && (
          <AuditLogView
            key={`${refreshKey}_${auditFilterTxId}`}
            initialTransactionId={auditFilterTxId}
          />
        )}

        {currentView === 'banks' && <BanksDirectoryView key={refreshKey} />}

        {currentView === 'tests' && <SecurityTestLabView />}

        {currentView === 'docs' && <DocsView />}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-4 px-6 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SecureCross V2.0 Academic Banking Prototype · Cardless Cross-Branch Authorization</span>
          <span className="font-medium text-[#64748B]">Zero Real Financial Connections · Synthetic Data Model</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
