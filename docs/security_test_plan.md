# SecureCross V2.0 — Security Test Plan (28 Test Cases)

This test plan defines the formal test specifications matching Section 13 of the Master Project Development Prompt.

## Test Matrix

| Test ID | Test Name | Preconditions | Input | Expected Result | Actual Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Successful eligible withdrawal | Active customer, sufficient balance, within daily cap | Request ₹15,000 | Token signed, redeemed, cash dispensed | PASS |
| **02** | Face mismatch rejection | Enrolled customer reference | Vector similarity 0.38 (< 0.80) | Verification REJECTED with FACE_EMBEDDING_MISMATCH | PASS |
| **03** | Liveness PAD spoof detection | Enrolled customer | Presentation attack score 0.18 (< 0.60) | Verification REJECTED with LIVENESS_SPOOF_DETECTED | PASS |
| **04** | Secondary biometric failure | Enrolled customer | Fingerprint adapter returns mismatch | Verification REJECTED with SECONDARY_BIOMETRIC_MISMATCH | PASS |
| **05** | Unknown customer lookup | Empty or invalid ID | Query non-existent customer `cust_null` | HTTP 404 UNKNOWN_CUSTOMER | PASS |
| **06** | Inactive or blocked account | Customer `cust_kavita_711` (FROZEN) | Request withdrawal | Authorization DENIED with ACCOUNT_NOT_ACTIVE | PASS |
| **07** | Insufficient balance | Customer balance ₹21,500 | Request ₹40,000 | Authorization DENIED with INSUFFICIENT_BALANCE | PASS |
| **08** | Zero or negative amount | Active customer | Request amount ₹0 or -₹500 | HTTP 400 Bad Request validation | PASS |
| **09** | Exceeding daily limit | Active customer | Request amount ₹55,000 | Denied with DAILY_LIMIT_VIOLATION | PASS |
| **10** | Multiple withdrawals reaching cap | Customer has used ₹40,000 today | Request ₹15,000 | Denied; remaining allowance is ₹10,000 | PASS |
| **11** | Concurrent withdrawals race condition | Simultaneous requests | Two ₹30,000 requests | Exactly one succeeds, second rejected by atomic check | PASS |
| **12** | Expired authorization token | Token TTL > 180s | Submit expired token | Redemption rejected: AUTHORIZATION_TOKEN_EXPIRED | PASS |
| **13** | Modified / Tampered token | Valid token generated | Append character to signature | Rejected: TOKEN_SIGNATURE_TAMPERED | PASS |
| **14** | Token bound to different branch | Delhi branch token | Redeem at Mumbai branch | Rejected: TOKEN_BINDING_MISMATCH_BRANCH | PASS |
| **15** | Token bound to different amount | Token authorized for ₹10,000 | Redeem request for ₹20,000 | Rejected: TOKEN_BINDING_MISMATCH_AMOUNT | PASS |
| **16** | Replay of redeemed token | Token already redeemed | Re-submit redeemed token | Rejected: TOKEN_REPLAY_ATTEMPT_ALREADY_REDEEMED | PASS |
| **17** | Duplicate redemption request | Concurrent redemption | Submit identical token simultaneously | Exactly one succeeds; other receives HTTP 409 | PASS |
| **18** | Home-branch service timeout | Home branch switch simulated delay | RPC delay > threshold | HTTP 504 Gateway Timeout fail-closed | PASS |
| **19** | Home-branch invalid payload | Malformed switch response | Core switch returns incomplete data | Schema validation fails closed | PASS |
| **20** | Database failure during redemption | Simulated DB disconnection | Redeem request | Transaction rollback; zero cash debited | PASS |
| **21** | Unauthorized operator | Non-teller user | Privileged cash dispense endpoint | HTTP 403 Forbidden | PASS |
| **22** | Operator cross-branch record access | Delhi branch operator | Query Mumbai branch transaction | RBAC limits record access | PASS |
| **23** | Rate-limit violation | Rapid verification requests | 100 requests in 2 seconds | HTTP 429 Too Many Requests | PASS |
| **24** | Audit event generation | Any withdrawal action | Action initiated and completed | Structured audit event recorded with correlation ID | PASS |
| **25** | Restart persistence verification | Server restarts | Re-query transaction ledger | Persistent state intact | PASS |
| **26** | Malformed API input | JSON parsing error | Send invalid JSON types | HTTP 400 validation error | PASS |
| **27** | Frontend backend error handling | Backend returns error | User receives clear notification | UI displays safe error without crashing | PASS |
| **28** | Biometric sensor unavailable | No camera connected | Initiate verification | Graceful fallback to synthetic simulation mode | PASS |
