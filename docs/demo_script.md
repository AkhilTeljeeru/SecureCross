# SecureCross V2.0 — Demonstration Script & Examiner Walkthrough

## Scenario Overview
A bank customer, **Aarav Mehta**, is on a business trip in New Delhi. His registered home branch is in **Mumbai (Bandra-Kurla Complex Branch)**. He left his physical debit card in Mumbai and requires cash for an urgent local expense. He walks into the **Connaught Place Main Branch (Delhi)** to request a cardless cross-branch cash withdrawal.

## Step-by-Step Demonstration

### 1. Operator Terminal Sign-In & Dashboard Inspection
- **Action:** Open application. Notice operator is authenticated as **Priya Sharma (Branch Teller, Delhi CP)**.
- **Verification:** Dashboard displays real statistics: Total Requests, Authorized Amount, Policy Limit (₹50,000/day), and Recent Transactions.

### 2. Step 1: Branch Selection & Customer Lookup
- **Action:** Click **"Initiate Cardless Withdrawal"**.
- **Action:** Confirm visiting branch is **Connaught Place Main Branch (Delhi)**.
- **Action:** Select customer **Aarav Mehta (SYN-IN-908124)**.
- **Verification:** System automatically recognizes Aarav's home branch is **Mumbai BKC** and highlights: *"Valid Cross-Branch Request Detected"*.
- **Action:** Enter requested cash amount: **₹15,000.00**. Click **Proceed**.

### 3. Step 2: Combined Identity Verification Stage
- **Action:** Camera viewport activates. Position face inside alignment guide.
- **Action:** Click **"Capture Frame & Run Combined Verification"**.
- **Verification:** Backend executes inference:
  - Face feature matching: ArcFace similarity **94.2%** (> 80% threshold).
  - Liveness detection: PAD score **96.7%** (LIVE verified).
  - Secondary biometric adapter: Fingerprint verified via `MOCK_HARDWARE_ADAPTER_V2`.
  - Overall status: **VERIFIED**.
- **Security Check Demonstration (Optional):** Check *"Simulate Presentation Attack / Spoof"* and re-capture. Watch the backend immediately fail with `LIVENESS_SPOOF_DETECTED`.

### 4. Step 3: Real-Time Home-Branch Authentication Check
- **Action:** Click **"Proceed to Home-Branch Check"**.
- **Verification:** SecureCross simulates core-switch RPC to Mumbai BKC Branch.
- **Verification:** Displays: Available balance (₹1,42,500.00), Account status (`ACTIVE`), and Remaining daily cap (₹50,000.00).
- **Fault Injection Check (Optional):** Toggle *"Simulate Gateway Timeout"* to demonstrate the fail-closed defense.

### 5. Step 4: Authoritative Transaction-Security Gate
- **Action:** Click **"Proceed to Transaction Security Checks"**.
- **Verification:** Review the 6-point compliance checklist.
- **Verification:** Confirm balance >= ₹15,000 and ₹0 used today + ₹15,000 <= ₹50,000 policy limit.
- **Action:** Click **"Authorize & Sign Withdrawal Token"**.
- **Verification:** Backend generates immutable HMAC-SHA256 authorization token with 180-second TTL.

### 6. Step 5: Cash Dispense & Anti-Replay Proof
- **Action:** Click **"Redeem Authorization & Dispense Cash"**.
- **Verification:** Animated cash dispenser displays notes released. Customer's new balance updates to ₹1,27,500.00 and remaining daily cap updates to ₹35,000.00.
- **Attack Resistance Proof:**
  - Click **"Attempt Token Replay (Test 16)"**. Confirm server rejects with HTTP 409 Conflict.
  - Click **"Attempt Tampered Signature (Test 13)"**. Confirm server rejects with altered signature error.

### 7. Security Lab & Audit Verification
- **Action:** Navigate to **Security Lab** in top nav.
- **Action:** Click **"Run All 28 Tests"** to execute the complete Section 13 automated test suite.
- **Action:** Navigate to **Security Audit** in top nav. Filter by transaction ID to inspect the immutable audit trail with correlation IDs.
