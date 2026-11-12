export interface Branch {
  id: string;
  bank_id?: string;
  bank_name?: string;
  branch_code: string;
  name: string;
  address?: string;
  location: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  is_home_eligible: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_reference: string;
  full_name: string;
  synthetic_pan: string;
  home_branch_id: string;
  home_branch_name?: string;
  home_bank_id?: string;
  home_bank_name?: string;
  account_status: 'ACTIVE' | 'DORMANT' | 'FROZEN' | 'SUSPENDED';
  available_balance: number;
  daily_withdrawal_limit: number;
  remaining_daily_allowance?: number;
  used_today?: number;
  enrolled_biometrics: {
    face_enrolled: boolean;
    iris_enrolled: boolean;
    fingerprint_enrolled: boolean;
    reference_face_hash: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Operator {
  id: string;
  username: string;
  full_name: string;
  role: 'OPERATOR' | 'MANAGER' | 'AUDITOR';
  branch_id: string;
  bank_id?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface VerifiedCustomerSummary {
  id: string;
  full_name: string;
  customer_reference: string;
  synthetic_pan: string;
  home_branch_id: string;
  home_branch_name: string;
  home_bank_name: string;
  available_balance: number;
  remaining_daily_allowance: number;
  account_status: string;
}

export interface VerificationSession {
  id: string;
  customer_id?: string;
  customer_claim_reference?: string;
  branch_id: string;
  amount?: number;
  session_status: 'INITIATED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'EXPIRED';
  face_result: {
    status: 'PENDING' | 'MATCH' | 'MISMATCH' | 'FAILED' | 'NOT_CONFIGURED';
    detection_status?: 'PENDING' | 'FACE_DETECTED' | 'NO_FACE_DETECTED' | 'MULTIPLE_FACES_DETECTED';
    confidence_score: number;
    liveness_status: 'PENDING' | 'LIVE' | 'SPOOF_DETECTED' | 'INCONCLUSIVE' | 'NOT_CONFIGURED';
    liveness_score: number;
    face_matching_configured?: boolean;
    liveness_configured?: boolean;
    notes?: string;
  };
  additional_biometric_result: {
    status: 'PENDING' | 'MATCH' | 'MISMATCH' | 'NOT_REQUIRED' | 'UNAVAILABLE';
    modality: 'FINGERPRINT' | 'IRIS' | 'NONE';
    confidence_score: number;
    adapter_version: string;
  };
  simulation_mode?: {
    is_simulated: boolean;
    adapter_name: string;
    model_family: string;
    notice: string;
  };
  overall_result: 'PENDING' | 'VERIFIED' | 'REJECTED';
  failure_reason_code?: string;
  verified_customer?: VerifiedCustomerSummary;
  created_at: string;
  expires_at: string;
}

export interface Transaction {
  id: string;
  transaction_reference: string;
  customer_id: string;
  branch_id: string;
  operator_id: string;
  verification_session_id: string;
  session_id?: string;
  amount: number;
  status: 'CREATED' | 'AUTHORIZED' | 'REDEEMED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  rejection_reason?: string;
  failure_reason_code?: string;
  auth_token?: string;
  token_jti?: string;
  created_at: string;
  authorized_at?: string;
  redeemed_at?: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor_id: string;
  actor_role: string;
  transaction_id?: string;
  event_timestamp: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED' | 'WARNING';
  reason_code?: string;
  correlation_id: string;
  metadata: Record<string, any>;
}

export interface SecurityTestResult {
  id: number;
  name: string;
  description: string;
  status: 'PASSED' | 'FAILED';
  expected: string;
  actual: string;
  details: string;
}

// -------------------------------------------------------------
// SecureCross V2.1 — Multi-Bank Onboarding & Directory Types
// -------------------------------------------------------------
export type BankType =
  | 'COMMERCIAL'
  | 'PUBLIC_SECTOR'
  | 'PRIVATE'
  | 'COOPERATIVE'
  | 'REGIONAL_RURAL'
  | 'PAYMENT_BANK';

export type DirectoryApprovalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type IntegrationApprovalStatus =
  | 'NOT_STARTED'
  | 'SANDBOX_READY'
  | 'TESTING'
  | 'APPROVED'
  | 'SUSPENDED';

export interface BankBranch {
  id: string;
  bank_id: string;
  application_id?: string;
  branch_code: string;
  name: string;
  address: string;
  location: string;
  contact_phone: string;
  contact_email: string;
  is_home_branch_enabled: boolean;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  created_at: string;
}

export interface BankDocument {
  id: string;
  application_id: string;
  document_type: 'REGULATORY_LICENCE' | 'AUTHORIZATION_LETTER' | 'COMPLIANCE_CERT' | 'SECURITY_AUDIT_REPORT';
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_reference: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploaded_at: string;
}

export interface BankRepresentative {
  id: string;
  application_id: string;
  full_name: string;
  designation: string;
  work_email: string;
  work_phone: string;
  authorization_evidence_summary: string;
  created_at: string;
}

export interface BankApplicationReview {
  id: string;
  application_id: string;
  previous_status: DirectoryApprovalStatus;
  new_status: DirectoryApprovalStatus;
  reviewer_id: string;
  reviewer_role: string;
  review_notes?: string;
  reason_code?: string;
  created_at: string;
}

export interface Bank {
  id: string;
  legal_name: string;
  bank_type: BankType;
  country: string;
  registered_address: string;
  official_website: string;
  registration_licence_number: string;
  official_email: string;
  contact_number: string;
  logo_url?: string;
  directory_status: DirectoryApprovalStatus;
  integration_status: IntegrationApprovalStatus;
  live_transaction_authorized: boolean;
  participating_branches_count: number;
  branches?: BankBranch[];
  created_at: string;
  updated_at: string;
}

export interface BankApplication {
  id: string;
  legal_name: string;
  bank_type: BankType;
  country: string;
  registered_address: string;
  official_website: string;
  registration_licence_number: string;
  official_email: string;
  contact_number: string;
  representative: BankRepresentative;
  branches: BankBranch[];
  security_contact_email: string;
  technical_contact_email: string;
  sandbox_readiness: boolean;
  preferred_integration_notes?: string;
  general_requirements?: string;
  documents: BankDocument[];
  application_status: DirectoryApprovalStatus;
  declaration_accepted: boolean;
  reviews: BankApplicationReview[];
  bank_id?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}
