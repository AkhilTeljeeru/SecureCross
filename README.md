# SecureCross V2.0

> **AI-Powered Real-Time Cross-Branch Identity Verification and Secure Cash Withdrawal Authorization**
>
> Academic Prototype Banking Architecture

---

## 1. Project Objective

SecureCross demonstrates how an eligible banking customer without their physical debit card available can request a secure cash withdrawal at a **non-home branch** (a branch other than their registered home branch).

The application verifies the customer's identity through a **combined live face, liveness detection, and secondary biometric verification stage**, queries a **real-time home-branch authentication service**, executes **server-authoritative transaction-security checks**, and authorizes a simulated cash withdrawal subject to a prototype policy cap of **₹50,000 per customer per day**.

---

## 2. The 5-Step SecureCross Workflow

1. **Step 1: Non-Home Branch Visit & Request Initiation**
   - The customer presents at a visiting branch counter (e.g., Delhi Connaught Place Branch).
   - Teller selects branch terminal, searches synthetic customer record (e.g., *Aarav Mehta*, whose home branch is Mumbai BKC), and specifies requested withdrawal amount.
2. **Step 2: Combined Identity Verification Stage**
   - Multi-modal verification executed as a single stage:
     - Live camera capture (`navigator.mediaDevices.getUserMedia` or synthetic sensor feed).
     - Face matching against enrolled reference embedding hash (ArcFace/InsightFace candidate interface).
     - Presentation Attack Detection (PAD / Liveness analysis).
     - Secondary biometric adapter (`MockHardwareAdapterV2` for fingerprint or iris).
   - Backend evaluates authoritatively (client-side Booleans like `face_verified: true` are strictly rejected).
3. **Step 3: Real-Time Home-Branch Authentication Check**
   - Inter-branch core switch query to customer's registered home branch.
   - Verifies customer KYC status, account status (`ACTIVE` vs `FROZEN`), and cross-branch permissions.
   - Fail-closed boundary: Timeouts (504) or network errors (503) fail safely with zero cash disbursement.
4. **Step 4: Authoritative Transaction-Security Gate**
   - Authoritative ledger validation: Available balance >= requested amount.
   - Server-side daily limit calculation: Cumulative usage + requested <= ₹50,000.
   - Risk policies and velocity evaluation.
   - Generates an immutable, short-lived **HMAC-SHA256 Authorization Token** (180s TTL) with a unique **JTI (JWT ID)** bound to transaction, customer, branch, and amount.
5. **Step 5: Authorized Withdrawal & Redemption**
   - Submits signed token for redemption.
   - Validates cryptographic signature and parameter binding in constant time.
   - Single-use JTI check prevents token replay attacks (Test 16).
   - Atomically deducts customer balance, updates daily usage, and simulates physical cash dispenser release.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, React Router, Tailwind CSS, Lucide Icons, Motion.
- **Backend Server:** Node.js 22 / Express full-stack authoritative API server mounting Vite in dev (`server.ts`).
- **Python / FastAPI Standalone:** `backend/app/` with FastAPI, Pydantic, SQLAlchemy models, and Alembic migrations.
- **Database:** PostgreSQL schema with fixed-precision `NUMERIC(14, 2)` monetary values and atomic constraints.
- **Biometric Integration:** Replaceable adapter pattern (`IBiometricAdapter` with `MockHardwareAdapterV2`).

---

## 4. Running the Application

### Local Development (AI Studio & Local Node)
```bash
# Install dependencies
npm install

# Start full-stack authoritative server & frontend (Port 3000)
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Multi-Container Deployment (Docker Compose)
```bash
docker compose up -d
```

---

## 5. Security & Test Harness

The system includes an automated **Security Test Lab** executing the **28 Required Security Test Cases** from Section 13 of the specification:
- Test 1: Successful eligible withdrawal
- Test 2: Face mismatch rejection
- Test 3: Liveness PAD spoof detection
- Test 4: Secondary biometric adapter failure
- Test 6: Inactive / frozen account denial
- Test 7: Insufficient ledger balance
- Test 9: Daily limit violation (₹50,000 policy)
- Test 12: Expired authorization token rejection
- Test 13: Modified / tampered token detection
- Test 14: Token branch binding mismatch
- Test 16: Replay of redeemed token prevention
- Test 18: Home-branch service timeout safety (Fail-closed)
- Test 24: Comprehensive audit event generation

---

## 6. Academic Prototype Notice

This application is an academic technology prototype. It uses synthetic customer profiles and simulated banking switches. In accordance with strict ethical and legal rules, zero raw biometric images, templates, or live bank accounts are stored or connected.
