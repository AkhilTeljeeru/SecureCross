# SecureCross V2.0 — STRIDE Threat Model & Security Controls

## 1. Scope & System Boundaries
SecureCross evaluates authentication, transaction authorization, and cash disbursement across banking branch boundaries. The system interacts with:
1. Customer Biometric Sensors (Webcam, Secondary Biometric Scanner Adapter).
2. Branch Operator Terminal (Teller Desk).
3. SecureCross Authoritative API Server.
4. Remote Home-Branch Core Banking Switch (Simulated RPC Gateway).
5. PostgreSQL Relational Storage Engine.

## 2. STRIDE Threat Analysis

| Threat Category | Specific Attack Vector | System Impact | Mitigation / Countermeasure |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker presents printed 2D photograph or mobile replay video to terminal camera | Fraudulent identity verification | Presentation Attack Detection (PAD) analyzing micro-motion, texture analysis, and mandatory secondary biometric modality (Fingerprint/Iris). |
| **Spoofing** | Malicious client sends `face_verified: true` in JSON request body | Unauthorized bypass of biometric stage | Server-Authoritative Evaluation. The backend ignores client Booleans and generates verification outcomes only through trusted backend verification endpoints. |
| **Tampering** | Man-in-the-middle alters withdrawal amount from ₹5,000 to ₹50,000 or modifies destination branch | Excessive unauthorized fund withdrawal | HMAC-SHA256 Token Binding. The signed token payload cryptographically binds Transaction ID, Customer ID, Branch ID, Amount, and JTI. |
| **Repudiation** | Customer claims they never authorized or received the cash withdrawal | Disputed debit liability | Comprehensive tamper-evident audit logs record Operator ID, timestamp, biometric confidence scores, correlation ID, and JTI. |
| **Information Disclosure** | Database breach or network sniffing exposes biometric templates or passwords | Biometric compromise, identity theft | Non-Negotiable Rule 13: Zero raw biometric images or templates stored. Passwords hashed using bcrypt. Sensitive fields excluded from audit logs. |
| **Denial of Service** | Core home branch banking switch is offline or unreachable | Hanging transactions, unpredictable states | Fail-Closed Architecture. When the home branch service times out (504) or is unavailable (503), the transaction fails safely with zero ledger deduction. |
| **Elevation of Privilege** | Teller operator attempts to access transactions or records belonging to another branch | Unauthorized cross-branch espionage | Server-Side RBAC. Operators are restricted to transactions originating at their assigned branch; Manager and Auditor roles require explicit permissions. |
| **Replay Attack** | Attacker intercepts a valid signed authorization token and replays it to dispense cash a second time | Double debit / cash theft | Single-Use JTI Ledger. Tokens transition atomically to `REDEEMED` status upon first use; replayed JTIs are rejected with HTTP 409 Conflict (Test 16). |
