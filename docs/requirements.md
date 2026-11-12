# SecureCross V2.0 — Functional & Non-Functional Requirements Specification

## 1. Project Identification
- **Project Name:** SecureCross
- **Version:** 2.0.0 (Academic Prototype)
- **Title:** AI-Powered Real-Time Cross-Branch Identity Verification and Secure Cash Withdrawal Authorization

## 2. Executive Summary
SecureCross addresses the problem of an eligible banking customer visiting a non-home branch without their physical debit card. The application allows cross-branch cash withdrawals while strictly preserving banking security, anti-spoofing controls, and server-authoritative balance/daily limit enforcement.

## 3. Functional Requirements (FR)

### FR-01: Non-Home Branch Visit & Request Initiation
- Customer visits any branch other than their registered home branch.
- Branch operator selects the visiting branch terminal and looks up synthetic customer records by customer reference ID, PAN, or name.
- Operator enters requested withdrawal amount up to ₹50,000 per day.

### FR-02: Combined Identity Verification Stage (Single Stage)
- Live face capture through permitted camera interface (`navigator.mediaDevices.getUserMedia` or synthetic sensor feed).
- Facial feature matching against enrolled reference embedding hash.
- Presentation Attack Detection (PAD / Liveness) analyzing skin texture, screen reflectance, and micro-motion.
- Secondary biometric modality verification through an adapter interface (`IBiometricAdapter` / `MockHardwareAdapterV2`) supporting fingerprint or iris scan.
- Authoritative backend evaluation: Client-supplied Booleans (`face_verified: true`) are strictly rejected.

### FR-03: Real-Time Home-Branch Authentication Service
- Authoritative query to simulated home branch core banking switch.
- Verification of synthetic customer's registered identity, KYC standing, and active account status.
- Fail-Closed Security Boundary: Network timeouts (HTTP 504) or core service unavailability (HTTP 503) immediately pause transaction without funds disbursement.

### FR-04: Authoritative Transaction-Security Gate
- Server-side validation of customer account status (`ACTIVE` vs `FROZEN`/`DORMANT`).
- Verification that ledger available balance is greater than or equal to requested amount.
- Enforcement of prototype daily withdrawal cap (₹50,000 policy) calculated atomically.
- Generation of signed, short-lived authorization token (HMAC-SHA256, 180s TTL, single-use JTI).

### FR-05: Authorized Withdrawal & Atomic Redemption
- Redemption request submitted with signed authorization token.
- Server validates HMAC signature, JTI status, and parameter bindings in constant time.
- Prevention of replay attacks: Token status transitions to `REDEEMED` atomically upon first redemption; subsequent submissions return HTTP 409 Conflict.
- Atomic balance debit and daily allowance update.
- Simulated physical cash dispense notification and receipt generation.

### FR-06: Security Audit & Monitoring
- Structured audit event logging for all authentication attempts, biometric evaluations, authorization issues, redemptions, and denial events.
- Audit logs contain correlation IDs and reason codes, strictly excluding plaintext secrets, passwords, or raw biometric images.

## 4. Non-Functional Requirements (NFR)

### NFR-01: Performance & Latency
- Biometric evaluation latency < 1,500ms on client/server boundary.
- Home-branch simulated switch query latency ~ 120ms.
- Cryptographic verification time < 10ms.

### NFR-02: Security & Defense in Depth
- Constant-time HMAC signature verification to resist timing attacks.
- Fail-closed default across all network, biometric, and database failure points.
- Strict Role-Based Access Control (RBAC): `OPERATOR` restricted to local branch records; `MANAGER` and `AUDITOR` granted supervisory visibility.

### NFR-03: Biometric Privacy & Ethics
- Zero raw biometric images or templates persisted in database storage.
- Clear disclosure that secondary hardware biometrics are mediated via evaluated mock adapter.
