# SecureCross V2.0 — PostgreSQL Database Design & ERD

## 1. Overview
SecureCross utilizes normalized PostgreSQL tables with foreign key constraints, fixed-precision `NUMERIC(14, 2)` monetary values, and single-use cryptographic token indices.

## 2. Table Specifications

### 2.1 `branches`
- `id` (VARCHAR(64), PK): Unique branch identifier (e.g., `br_delhi_cp`).
- `branch_code` (VARCHAR(32), UNIQUE): Official routing code (e.g., `DEL-0101`).
- `name` (VARCHAR(255)): Full branch title.
- `location` (VARCHAR(255)): Physical city and territory.
- `status` (VARCHAR(32)): `ACTIVE` | `MAINTENANCE` | `OFFLINE`.
- `created_at` (TIMESTAMP WITH TIME ZONE).

### 2.2 `customers`
- `id` (VARCHAR(64), PK): Synthetic customer ID (e.g., `cust_aarav_901`).
- `customer_reference` (VARCHAR(64), UNIQUE): Synthetic Aadhaar-derived synthetic reference (e.g., `SYN-IN-908124`).
- `full_name` (VARCHAR(255)): Synthetic customer name.
- `synthetic_pan` (VARCHAR(16)): Synthetic tax identifier.
- `home_branch_id` (VARCHAR(64), FK -> `branches.id`): Registered home branch.
- `account_status` (VARCHAR(32)): `ACTIVE` | `DORMANT` | `FROZEN` | `SUSPENDED`.
- `available_balance` (NUMERIC(14, 2), CHECK >= 0): Available ledger funds.
- `daily_withdrawal_limit` (NUMERIC(14, 2), DEFAULT 50000.00): Configurable daily cap.
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE).

### 2.3 `operators`
- `id` (VARCHAR(64), PK): Operator ID.
- `username` (VARCHAR(64), UNIQUE): Login username.
- `password_hash` (VARCHAR(255)): Bcrypt password hash.
- `role` (VARCHAR(32), CHECK): `OPERATOR` | `MANAGER` | `AUDITOR`.
- `branch_id` (VARCHAR(64), FK -> `branches.id`): Primary assigned branch.
- `status` (VARCHAR(32)): `ACTIVE` | `INACTIVE`.
- `created_at` (TIMESTAMP WITH TIME ZONE).

### 2.4 `verification_sessions`
- `id` (VARCHAR(64), PK): Unique session ID.
- `customer_id` (VARCHAR(64), FK -> `customers.id`).
- `branch_id` (VARCHAR(64), FK -> `branches.id`).
- `session_status` (VARCHAR(32)): `INITIATED` | `IN_PROGRESS` | `PASSED` | `FAILED` | `EXPIRED`.
- `face_result` (JSONB): Match status, confidence score, PAD liveness score. Zero raw biometric images.
- `additional_biometric_result` (JSONB): Secondary modality (fingerprint/iris) status, adapter version.
- `overall_result` (VARCHAR(32)): `PENDING` | `VERIFIED` | `REJECTED`.
- `failure_reason_code` (VARCHAR(64)): Reason code if rejected.
- `created_at`, `expires_at` (TIMESTAMP WITH TIME ZONE).

### 2.5 `transactions`
- `id` (VARCHAR(64), PK): Transaction ID.
- `transaction_reference` (VARCHAR(64), UNIQUE): Customer-facing reference (e.g., `SC-123456-AB`).
- `customer_id` (VARCHAR(64), FK -> `customers.id`).
- `branch_id` (VARCHAR(64), FK -> `branches.id`).
- `operator_id` (VARCHAR(64), FK -> `operators.id`).
- `verification_session_id` (VARCHAR(64), FK -> `verification_sessions.id`).
- `amount` (NUMERIC(14, 2), CHECK > 0 AND <= 50000): Authorized amount.
- `status` (VARCHAR(32)): `CREATED` | `AUTHORIZED` | `REDEEMED` | `REJECTED` | `EXPIRED` | `CANCELLED`.
- `created_at`, `authorized_at`, `redeemed_at` (TIMESTAMP WITH TIME ZONE).

### 2.6 `authorization_tokens`
- `id` (VARCHAR(64), PK).
- `transaction_id` (VARCHAR(64), UNIQUE, FK -> `transactions.id`).
- `token_jti` (VARCHAR(128), UNIQUE): Single-use cryptographic nonce.
- `issued_at`, `expires_at`, `redeemed_at` (TIMESTAMP WITH TIME ZONE).
- `status` (VARCHAR(32)): `ISSUED` | `REDEEMED` | `EXPIRED` | `REVOKED`.

### 2.7 `daily_withdrawal_usage`
- `id` (SERIAL, PK).
- `customer_id` (VARCHAR(64), FK -> `customers.id`).
- `usage_date` (DATE).
- `total_withdrawn` (NUMERIC(14, 2), DEFAULT 0.00).
- UNIQUE CONSTRAINT (`customer_id`, `usage_date`).

### 2.8 `audit_events`
- `id` (VARCHAR(64), PK).
- `event_type` (VARCHAR(64)).
- `actor_id` (VARCHAR(64)).
- `actor_role` (VARCHAR(32)).
- `transaction_id` (VARCHAR(64), NULLABLE).
- `event_timestamp` (TIMESTAMP WITH TIME ZONE).
- `outcome` (VARCHAR(32)): `SUCCESS` | `DENIED` | `FAILED` | `WARNING`.
- `reason_code` (VARCHAR(64)).
- `correlation_id` (VARCHAR(64)).
- `metadata` (JSONB, sanitized).
