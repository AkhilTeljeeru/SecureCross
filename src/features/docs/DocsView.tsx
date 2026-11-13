import React, { useState } from 'react';
import {
  FileText,
  Database,
  Shield,
  Layers,
  Network,
  CheckCircle,
  FileCode,
  Terminal,
} from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('architecture');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Title */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
          <span>Academic Deliverables</span>
          <span>·</span>
          <span>Section 15 Specifications</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172554] mt-1">
          System Architecture, Database ERD &amp; Security Documentation
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Formal engineering documentation for the SecureCross V2.0 biometric cross-branch cash withdrawal authorization engine.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
        {[
          { id: 'architecture', label: 'Architecture & Flow', icon: Layers },
          { id: 'database', label: 'PostgreSQL Schema & ERD', icon: Database },
          { id: 'threat_model', label: 'Threat Model (STRIDE)', icon: Shield },
          { id: 'api', label: 'API Endpoints (/api/v1)', icon: Network },
          { id: 'biometrics', label: 'Biometric Strategy', icon: FileCode },
          { id: 'demo_script', label: 'Evaluation & Demo Script', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200 shadow-2xs'
                  : 'bg-white text-[#64748B] hover:text-[#172554] hover:bg-slate-50 border border-[#E2E8F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Architecture & Flow */}
      {activeTab === 'architecture' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              System Architecture &amp; 5-Step Workflow Pipeline
            </h2>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] leading-relaxed text-[#172554]">
              <pre className="overflow-x-auto whitespace-pre">
{`+---------------------------------------------------------------------------------------------------+
|                                      SECURECROSS V2.0 PIPELINE                                     |
+---------------------------------------------------------------------------------------------------+

[STEP 1: Visiting Branch Terminal]
   |
   +---> Teller selects Non-Home Branch & identifies Synthetic Customer (e.g. Aarav Mehta)
   +---> Enters requested withdrawal amount (up to ₹50,000 prototype daily cap)
   |
[STEP 2: Combined Identity Verification Stage]
   |
   +---> Permitted Camera Capture (HTML5 Video Stream / Synthetic Sensor)
   +---> Feature Extraction & Similarity Matching against Enrolled Reference (ArcFace/InsightFace)
   +---> Presentation Attack Detection (Liveness / Spoof check on texture, reflection & micro-motion)
   +---> Secondary Biometric Adapter (Fingerprint / Iris scanner via MOCK_HARDWARE_ADAPTER_V2)
   +---> Authoritative Backend Decision generated (Zero client-trust Boolean acceptance)
   |
[STEP 3: Real-Time Home-Branch Authentication Check]
   |
   +---> Secure RPC Gateway query to registered home branch core banking switch (e.g. Mumbai BKC)
   +---> Verifies customer KYC standing, account status (ACTIVE vs FROZEN), and cross-branch permissions
   +---> Fail-Closed boundary: Timeouts (504) or Offline (503) immediately pause withdrawal
   |
[STEP 4: Authoritative Transaction-Security Gate]
   |
   +---> Server-side ledger balance verification (Available balance >= requested amount)
   +---> Atomic Daily Limit Enforcement (Cumulative daily usage + requested <= ₹50,000 policy)
   +---> Fraud Velocity & Risk Scoring Rule Checks
   +---> Cryptographic Token Generation: HMAC-SHA256 signature binding tx, customer, branch, amount, JTI
   |
[STEP 5: Authorized Withdrawal & Redemption]
   |
   +---> Redemption request submitted with signed token
   +---> Token signature and parameter bindings verified in constant time
   +---> JTI validated against single-use registry (Anti-replay defense)
   +---> Atomic balance debit and daily usage increment executed in single transaction
   +---> Token marked REDEEMED; simulated physical cash dispenser releases currency notes
   +---> Structured security audit event emitted with correlation ID`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PostgreSQL Schema & ERD */}
      {activeTab === 'database' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              PostgreSQL Relational Schema &amp; Table Definitions (Section 8)
            </h2>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] leading-relaxed text-[#172554]">
              <pre className="overflow-x-auto whitespace-pre">
{`-- 1. Branches Table
CREATE TABLE branches (
    id VARCHAR(64) PRIMARY KEY,
    branch_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table (Synthetic records only, fixed-precision NUMERIC)
CREATE TABLE customers (
    id VARCHAR(64) PRIMARY KEY,
    customer_reference VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    synthetic_pan VARCHAR(16) NOT NULL,
    home_branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
    account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    available_balance NUMERIC(14, 2) NOT NULL CHECK (available_balance >= 0),
    daily_withdrawal_limit NUMERIC(14, 2) NOT NULL DEFAULT 50000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Operators Table (RBAC roles, bcrypt password hashes)
CREATE TABLE operators (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('OPERATOR', 'MANAGER', 'AUDITOR')),
    branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Verification Sessions Table (No raw biometrics stored)
CREATE TABLE verification_sessions (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
    session_status VARCHAR(32) NOT NULL,
    face_result JSONB NOT NULL,
    additional_biometric_result JSONB NOT NULL,
    overall_result VARCHAR(32) NOT NULL,
    failure_reason_code VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Transactions Table (Immutable ledger)
CREATE TABLE transactions (
    id VARCHAR(64) PRIMARY KEY,
    transaction_reference VARCHAR(64) NOT NULL UNIQUE,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
    operator_id VARCHAR(64) NOT NULL REFERENCES operators(id),
    verification_session_id VARCHAR(64) NOT NULL REFERENCES verification_sessions(id),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0 AND amount <= 50000),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    authorized_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Authorization Tokens Table (HMAC-SHA256, JTI replay guard)
CREATE TABLE authorization_tokens (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE REFERENCES transactions(id),
    token_jti VARCHAR(128) NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED'
);

-- 7. Daily Withdrawal Usage Table (Atomic concurrency lock)
CREATE TABLE daily_withdrawal_usage (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    usage_date DATE NOT NULL,
    total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT uq_customer_date UNIQUE (customer_id, usage_date)
);

-- 8. Audit Events Table (Tamper-evident log, zero secrets)
CREATE TABLE audit_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    transaction_id VARCHAR(64),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(32) NOT NULL,
    reason_code VARCHAR(64),
    correlation_id VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL
);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Threat Model (STRIDE) */}
      {activeTab === 'threat_model' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              STRIDE Threat Modeling &amp; Countermeasure Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="font-bold text-[#DC2626] uppercase tracking-wide block">
                  1. Spoofing Identity
                </span>
                <p className="text-[#64748B]">
                  <strong className="text-[#172554]">Threat:</strong> Impersonator uses 2D photo, video loop, or silicon mask of customer.
                </p>
                <p className="text-[#64748B]">
                  <strong className="text-[#16A34A]">Mitigation:</strong> Presentation Attack Detection (PAD) liveness analysis coupled with mandatory secondary biometric modality (fingerprint/iris).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="font-bold text-[#D97706] uppercase tracking-wide block">
                  2. Tampering with Transaction
                </span>
                <p className="text-[#64748B]">
                  <strong className="text-[#172554]">Threat:</strong> Rogue actor modifies authorization payload to inflate amount or change branch.
                </p>
                <p className="text-[#64748B]">
                  <strong className="text-[#16A34A]">Mitigation:</strong> HMAC-SHA256 signature strictly binds Transaction ID, Customer ID, Branch ID, and Amount. Any tampering invalidates signature.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="font-bold text-[#2563EB] uppercase tracking-wide block">
                  3. Repudiation
                </span>
                <p className="text-[#64748B]">
                  <strong className="text-[#172554]">Threat:</strong> Customer or teller denies authorizing withdrawal.
                </p>
                <p className="text-[#64748B]">
                  <strong className="text-[#16A34A]">Mitigation:</strong> Structured audit logs record correlation IDs, operator credentials, timestamp, biometric confidence scores, and token JTI.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="font-bold text-purple-700 uppercase tracking-wide block">
                  4. Replay Attacks
                </span>
                <p className="text-[#64748B]">
                  <strong className="text-[#172554]">Threat:</strong> Intercepted valid token submitted repeatedly to disburse cash multiple times.
                </p>
                <p className="text-[#64748B]">
                  <strong className="text-[#16A34A]">Mitigation:</strong> Single-use JTI ledger. Token status transitions to REDEEMED atomically upon first use; subsequent submissions are rejected (Test 16).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: API Endpoints */}
      {activeTab === 'api' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              Versioned REST API Endpoints (/api/v1)
            </h2>
            <div className="divide-y divide-[#E2E8F0] text-xs">
              {[
                { method: 'POST', path: '/api/v1/auth/login', desc: 'Operator login with RBAC role' },
                { method: 'GET', path: '/api/v1/branches', desc: 'List active banking branches' },
                { method: 'GET', path: '/api/v1/customers', desc: 'Synthetic customer lookup' },
                { method: 'POST', path: '/api/v1/verification/sessions', desc: 'Initiate combined identity verification session' },
                { method: 'POST', path: '/api/v1/verification/sessions/:id/face', desc: 'Face feature match & PAD liveness inference' },
                { method: 'POST', path: '/api/v1/verification/sessions/:id/biometric', desc: 'Secondary biometric adapter verification' },
                { method: 'POST', path: '/api/v1/home-branch/verify', desc: 'Real-time query to registered home branch' },
                { method: 'POST', path: '/api/v1/withdrawals', desc: 'Create withdrawal transaction' },
                { method: 'POST', path: '/api/v1/withdrawals/:id/authorize', desc: 'Authoritative rule evaluation & signed token issue' },
                { method: 'POST', path: '/api/v1/withdrawals/:id/redeem', desc: 'Atomic cash redemption & anti-replay token burning' },
                { method: 'GET', path: '/api/v1/audit-events', desc: 'Query tamper-evident audit records' },
                { method: 'POST', path: '/api/v1/security-tests/run', desc: 'Execute Section 13 security test suite' },
              ].map((ep) => (
                <div key={ep.path} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                        ep.method === 'POST'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-blue-200'
                          : 'bg-green-50 text-[#16A34A] border-green-200'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[#172554] font-mono font-semibold">{ep.path}</span>
                  </div>
                  <span className="text-[#64748B]">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Biometric Strategy */}
      {activeTab === 'biometrics' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              Biometric Verification Architecture &amp; Adapter Strategy (Section 10)
            </h2>
            <p className="text-[#64748B]">
              In accordance with project rules 8, 9, and 13:
            </p>
            <ul className="list-disc pl-5 space-y-2.5 text-[#64748B] leading-relaxed">
              <li>
                <strong className="text-[#172554]">Zero Raw Biometric Storage:</strong> Raw camera frames and full biometric samples are processed in volatile memory only and discarded. Only authorized cryptographic reference hashes are verified.
              </li>
              <li>
                <strong className="text-[#172554]">Adapter Decoupling:</strong> The hardware biometric layer is mediated via <code className="text-[#2563EB] bg-[#EFF6FF] border border-blue-200 px-1.5 py-0.5 rounded font-mono">IBiometricAdapter</code>, with active <code className="text-[#2563EB] bg-[#EFF6FF] border border-blue-200 px-1.5 py-0.5 rounded font-mono">MockHardwareAdapterV2</code> allowing plug-and-play future connection to certified UIDAI/Aadhaar or bank-approved physical scanners without altering withdrawal workflows.
              </li>
              <li>
                <strong className="text-[#172554]">Honest Labeling:</strong> The prototype explicitly labels mock and simulated results as such. Ordinary webcams are never claimed to perform physical fingerprint scanning.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 6: Demo Script */}
      {activeTab === 'demo_script' && (
        <div className="space-y-6 text-xs text-[#64748B]">
          <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#172554] uppercase tracking-wider">
              Examiner Demonstration Walkthrough &amp; Script
            </h2>
            <ol className="list-decimal pl-5 space-y-3 leading-relaxed">
              <li>
                <strong className="text-[#172554]">Step 1 — Start Cardless Withdrawal:</strong> Navigate to New Withdrawal. Select Delhi Connaught Place Branch (visiting). Select synthetic customer <em>Aarav Mehta</em> (registered in Mumbai BKC). Enter ₹15,000.
              </li>
              <li>
                <strong className="text-[#172554]">Step 2 — Combined Identity Verification:</strong> Open live webcam or synthetic camera. Show facial alignment guide. Click &quot;Capture Frame &amp; Run Combined Verification&quot;. Point out ArcFace similarity (94.2%), PAD liveness score (96.7%), and secondary biometric adapter match.
              </li>
              <li>
                <strong className="text-[#172554]">Step 3 — Fault Injection Demonstration:</strong> On Step 2 or 3, toggle &quot;Simulate Presentation Attack / Spoof&quot; or &quot;Simulate Gateway Timeout&quot;. Demonstrate that the backend fails closed immediately with descriptive security messages.
              </li>
              <li>
                <strong className="text-[#172554]">Step 4 — Authoritative Transaction Security:</strong> Review the 6-point checklist. Verify available ledger balance and ₹50,000 daily limit deduction math. Click &quot;Authorize &amp; Sign Withdrawal Token&quot;.
              </li>
              <li>
                <strong className="text-[#172554]">Step 5 — Redemption &amp; Anti-Replay Proof:</strong> Click &quot;Redeem Authorization &amp; Dispense Cash&quot;. Once redeemed, click &quot;Attempt Token Replay (Test 16)&quot; and &quot;Attempt Tampered Signature (Test 13)&quot; to show live server rejection!
              </li>
              <li>
                <strong className="text-[#172554]">Step 6 — Security Test Lab &amp; Audit Log:</strong> Navigate to Security Lab to execute all 28 automated tests. Open Security Audit to view the complete tamper-evident audit trail with correlation IDs.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
