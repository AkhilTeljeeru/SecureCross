# SecureCross V2.0 — Architecture & Data Flow Document

## 1. Monorepo Architectural Overview

SecureCross is architected as an academic banking prototype combining a React 19 frontend with an authoritative API backend, simulated core-switch interfaces, and tamper-evident audit logging.

```text
securecross/
├── frontend/ (src/)
│   ├── api/             # Typed API client and data contracts
│   ├── components/      # Accessible components following Top Bar Contract
│   ├── context/         # AuthContext and RBAC role provider
│   ├── features/
│   │   ├── dashboard/   # Live application metrics and KPIs
│   │   ├── withdrawals/ # 5-step non-home branch withdrawal stepper
│   │   ├── transactions/# Transaction ledger with RBAC scoping
│   │   ├── audit/       # Security event viewer with correlation IDs
│   │   └── tests/       # 28-test automated security suite runner
│   └── main.tsx
├── backend/
│   ├── app/
│   │   ├── api/v1/      # Versioned REST endpoints
│   │   ├── core/        # Security config, crypto HMAC, JTI registry
│   │   ├── models/      # SQLAlchemy ORM models
│   │   ├── schemas/     # Pydantic validation schemas
│   │   ├── services/    # Home branch switch & transaction logic
│   │   ├── adapters/    # Biometric adapter interfaces
│   │   └── main.py      # FastAPI application entry point
│   ├── migrations/      # Alembic database migration scripts
│   └── pyproject.toml
├── docs/                # Architecture, ERD, Threat Model, Demo Scripts
├── scripts/             # Data seeding & reset scripts
└── compose.yaml         # Multi-container Docker deployment
```

## 2. 5-Step Core Business Process

1. **Step 1: Non-Home Branch Request Initiation**
   The customer presents at a visiting branch counter. The branch teller selects their branch terminal and retrieves the customer record via synthetic ID.
2. **Step 2: Combined Multi-Modal Identity Verification**
   Single stage: Live camera capture, candidate face feature vector comparison, presentation attack detection (liveness score), and secondary biometric adapter (fingerprint/iris) verification. Backend evaluates authoritatively.
3. **Step 3: Real-Time Home-Branch Authentication Check**
   Secure RPC simulation to the registered home branch core banking switch. Verifies customer KYC standing and account status. Fails closed on timeout or network fault.
4. **Step 4: Transaction-Security Authorization Gate**
   Authoritative backend ledger checks: account active, balance sufficient, ₹50,000 daily cap not exceeded, risk policies satisfied. Issues signed HMAC-SHA256 token with 180s TTL and unique JTI.
5. **Step 5: Authorized Withdrawal & Redemption**
   Redemption request burns token JTI, updates ledger balance and daily usage atomically, emits audit event, and simulates currency notes dispensed.

## 3. Cryptographic Token Binding Specification

Authorization tokens use the format: `SCV2.<Base64Payload>.<HMAC-SHA256-Signature>`
Payload fields:
- `jti`: Unique single-use token identifier
- `tx_id`: Bound transaction identifier
- `cust_id`: Bound customer identifier
- `branch_id`: Bound visiting branch identifier
- `amt`: Bound monetary withdrawal amount
- `iat`: Epoch timestamp issued
- `exp`: Epoch timestamp expiring (180 seconds TTL)
- `iss`: Issuer (`securecross.auth.internal`)
