import React, { useState } from 'react';
import { Customer, Branch, VerificationSession, Transaction } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { Step1BranchCustomer } from './Step1BranchCustomer';
import { Step2CombinedVerification } from './Step2CombinedVerification';
import { Step3HomeBranchCheck } from './Step3HomeBranchCheck';
import { Step4TransactionSecurity } from './Step4TransactionSecurity';
import { Step5AuthorizedResult } from './Step5AuthorizedResult';

interface NewWithdrawalViewProps {
  onFinish: () => void;
  onViewAudit: () => void;
}

export const NewWithdrawalView: React.FC<NewWithdrawalViewProps> = ({
  onFinish,
  onViewAudit,
}) => {
  const { branch: currentBranch } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [claimReference, setClaimReference] = useState<string | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState<number>(15000);
  const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
  const [homeBranchData, setHomeBranchData] = useState<any>(null);
  const [authorizedTx, setAuthorizedTx] = useState<Transaction | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [tokenJti, setTokenJti] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  const stepLabels = [
    '1. Visiting Branch & Amount',
    '2. Identity-First Verification',
    '3. Home-Branch Check',
    '4. Security Gate',
    '5. Authorized Cash',
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Visual Stepper Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-900 border border-slate-800">
        {/* Mobile Stepper: Compact step counter + segmented progress bar */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-indigo-400 font-semibold">
              STEP {step} OF 5: {stepLabels[step - 1].split('. ')[1]}
            </span>
            <span className="text-slate-500 text-[11px]">
              {Math.round((step / 5) * 100)}% Complete
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all ${
                  s < step
                    ? 'bg-emerald-500'
                    : s === step
                    ? 'bg-indigo-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop / Tablet Stepper: Full 5-box step grid */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-2">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCurrent = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <div
                key={label}
                className={`py-2 px-3 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/60 font-semibold'
                    : isCompleted
                    ? 'bg-slate-950 text-emerald-400 border border-slate-800'
                    : 'bg-slate-950/40 text-slate-500 border border-transparent'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span className="truncate">{label.split('. ')[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Render Area */}
      {step === 1 && (
        <Step1BranchCustomer
          currentBranch={currentBranch}
          onProceed={(br, amt, claimRef) => {
            setSelectedBranch(br);
            setAmount(amt);
            setClaimReference(claimRef);
            setStep(2);
          }}
          onCancel={onFinish}
        />
      )}

      {step === 2 && selectedBranch && (
        <Step2CombinedVerification
          branch={selectedBranch}
          amount={amount}
          claimReference={claimReference}
          onVerificationPassed={(sess, cust) => {
            setVerificationSession(sess);
            setSelectedCustomer(cust);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedCustomer && selectedBranch && verificationSession && (
        <Step3HomeBranchCheck
          customer={selectedCustomer}
          branch={selectedBranch}
          session={verificationSession}
          amount={amount}
          onHomeBranchVerified={(data) => {
            setHomeBranchData(data);
            setStep(4);
          }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && selectedCustomer && selectedBranch && verificationSession && (
        <Step4TransactionSecurity
          customer={selectedCustomer}
          branch={selectedBranch}
          session={verificationSession}
          amount={amount}
          homeBranchData={homeBranchData}
          onAuthorized={(tx, token, jti, exp) => {
            setAuthorizedTx(tx);
            setAuthToken(token);
            setTokenJti(jti);
            setExpiresAt(exp);
            setStep(5);
          }}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && selectedCustomer && selectedBranch && authorizedTx && (
        <Step5AuthorizedResult
          transaction={authorizedTx}
          customer={selectedCustomer}
          branch={selectedBranch}
          authToken={authToken}
          tokenJti={tokenJti}
          expiresAt={expiresAt}
          onFinish={onFinish}
          onViewAudit={onViewAudit}
        />
      )}
    </div>
  );
};
