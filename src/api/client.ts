import {
  Branch,
  Customer,
  Operator,
  VerificationSession,
  Transaction,
  AuditEvent,
  SecurityTestResult,
  Bank,
  BankApplication,
  BankBranch,
  BankDocument,
  IntegrationApprovalStatus,
  BankApplicationReview,
} from './types';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  operatorId?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (operatorId) {
    headers.set('x-operator-id', operatorId);
  } else {
    const stored = localStorage.getItem('sc_operator_id');
    if (stored) {
      headers.set('x-operator-id', stored);
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (username: string, role?: string) =>
    request<{ access_token: string; operator: Operator; branch: Branch }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    }),

  getCurrentOperator: () => request<{ operator: Operator; branch: Branch }>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Branches & Customers
  getBranches: () => request<{ branches: Branch[] }>('/branches'),

  getCustomers: (query = '') =>
    request<{ customers: Customer[] }>(`/customers?q=${encodeURIComponent(query)}`),

  getCustomer: (id: string) => request<Customer>(`/customers/${id}`),

  getWithdrawalLimit: (id: string) =>
    request<{
      customer_id: string;
      daily_limit: number;
      used_today: number;
      remaining_allowance: number;
      max_policy_limit: number;
      is_limit_reached: boolean;
    }>(`/customers/${id}/withdrawal-limit`),

  // Verification
  createVerificationSession: (
    branchIdOrCustomerId: string,
    branchIdOrAmount?: string | number,
    amountOrClaimRef?: number | string,
    claimReference?: string
  ) => {
    let payload: Record<string, any> = {};
    if (typeof branchIdOrAmount === 'string' && !branchIdOrCustomerId.startsWith('br_')) {
      // Legacy signature: (customerId, branchId)
      payload = { customer_id: branchIdOrCustomerId, branch_id: branchIdOrAmount };
    } else {
      // V2.2 Identity-First signature: (branchId, amount, claimReference)
      payload = {
        branch_id: branchIdOrCustomerId,
        amount: typeof branchIdOrAmount === 'number' ? branchIdOrAmount : 15000,
        customer_claim_reference: typeof amountOrClaimRef === 'string' ? amountOrClaimRef : claimReference,
      };
    }
    return request<VerificationSession>('/verification/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitFaceVerification: (
    sessionId: string,
    payload: {
      frame?: string;
      image_format?: string;
      image_width?: number;
      image_height?: number;
      simulate_face_mismatch?: boolean;
      simulate_liveness_fail?: boolean;
      simulate_unknown_customer?: boolean;
      simulate_no_face?: boolean;
      simulate_multiple_faces?: boolean;
      simulate_models_unconfigured?: boolean;
      client_face_present?: boolean;
    }
  ) =>
    request<VerificationSession>(`/verification/sessions/${sessionId}/face`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitBiometricVerification: (
    sessionId: string,
    payload: {
      modality?: 'FINGERPRINT' | 'IRIS';
      simulate_biometric_fail?: boolean;
      simulate_biometric_unavailable?: boolean;
    }
  ) =>
    request<VerificationSession>(`/verification/sessions/${sessionId}/biometric`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getVerificationSession: (sessionId: string) =>
    request<VerificationSession>(`/verification/sessions/${sessionId}`),

  // Home-Branch Verification (Step 3)
  verifyHomeBranch: (payload: {
    customer_id: string;
    simulate_timeout?: boolean;
    simulate_down?: boolean;
  }) =>
    request<{
      success: boolean;
      home_branch: Branch;
      customer_id: string;
      customer_reference: string;
      account_status: string;
      is_eligible: boolean;
      available_balance: number;
      daily_limit: number;
      remaining_daily_allowance: number;
      simulated_switch_latency_ms: number;
      timestamp: string;
    }>('/home-branch/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Withdrawals
  createWithdrawal: (payload: {
    customer_id: string;
    branch_id: string;
    amount: number;
    verification_session_id?: string;
  }) =>
    request<Transaction>('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWithdrawal: (id: string) => request<Transaction>(`/withdrawals/${id}`),

  getWithdrawals: () => request<{ transactions: Transaction[] }>('/withdrawals'),

  authorizeWithdrawal: (id: string) =>
    request<{
      transaction: Transaction;
      auth_token: string;
      token_jti: string;
      expires_at: string;
    }>(`/withdrawals/${id}/authorize`, {
      method: 'POST',
    }),

  redeemWithdrawal: (
    id: string,
    payload: { auth_token?: string; force_tamper_token?: boolean } = {}
  ) =>
    request<{
      message: string;
      transaction: Transaction;
      customer_updated: { available_balance: number; remaining_daily_allowance: number };
    }>(`/withdrawals/${id}/redeem`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Audit Events
  getAuditEvents: (filters: {
    event_type?: string;
    outcome?: string;
    transaction_id?: string;
    date?: string;
    limit?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.event_type) params.set('event_type', filters.event_type);
    if (filters.outcome) params.set('outcome', filters.outcome);
    if (filters.transaction_id) params.set('transaction_id', filters.transaction_id);
    if (filters.date) params.set('date', filters.date);
    if (filters.limit) params.set('limit', filters.limit);
    return request<{ total: number; events: AuditEvent[] }>(`/audit-events?${params.toString()}`);
  },

  // Security Test Runner
  runSecurityTests: () =>
    request<{
      timestamp: string;
      total_tests: number;
      passed_tests: number;
      failed_tests: number;
      results: SecurityTestResult[];
    }>('/security-tests/run', {
      method: 'POST',
    }),

  // Reset demo data
  resetDemoData: () => request<{ message: string }>('/admin/reset-data', { method: 'POST' }),

  // -----------------------------------------------------------
  // SecureCross V2.1 — Multi-Bank Directory & Onboarding APIs
  // -----------------------------------------------------------
  // Directory (Public / Approved Banks)
  getBanks: (filters: { search?: string; type?: string; region?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type && filters.type !== 'ALL') params.set('type', filters.type);
    if (filters.region && filters.region !== 'ALL') params.set('region', filters.region);
    return request<{ banks: Bank[] }>(`/banks?${params.toString()}`);
  },

  getBank: (id: string) => request<Bank>(`/banks/${id}`),

  getBankBranches: (id: string) => request<{ branches: BankBranch[] }>(`/banks/${id}/branches`),

  // Bank Registration & Applications
  createBankApplication: (payload: Partial<BankApplication>) =>
    request<BankApplication>('/bank-applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBankApplication: (id: string) => request<BankApplication>(`/bank-applications/${id}`),

  updateBankApplication: (id: string, payload: Partial<BankApplication>) =>
    request<BankApplication>(`/bank-applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  submitBankApplication: (id: string) =>
    request<BankApplication>(`/bank-applications/${id}/submit`, {
      method: 'POST',
    }),

  uploadApplicationDocument: (
    applicationId: string,
    doc: {
      document_type: string;
      file_name: string;
      file_size_bytes: number;
      mime_type: string;
    }
  ) =>
    request<BankDocument>(`/bank-applications/${applicationId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc),
    }),

  getApplicationDocuments: (applicationId: string) =>
    request<{ documents: BankDocument[] }>(`/bank-applications/${applicationId}/documents`),

  // Platform Administrator Review Portal
  getAdminBankApplications: (filters: { status?: string; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    return request<{ applications: BankApplication[] }>(`/admin/bank-applications?${params.toString()}`);
  },

  requestApplicationInfo: (id: string, notes: string) =>
    request<BankApplication>(`/admin/bank-applications/${id}/request-information`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  approveBankApplication: (id: string, notes?: string) =>
    request<{ application: BankApplication; bank: Bank }>(`/admin/bank-applications/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  rejectBankApplication: (id: string, reason: string) =>
    request<BankApplication>(`/admin/bank-applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  suspendBank: (bankId: string, reason: string) =>
    request<Bank>(`/admin/banks/${bankId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  updateBankIntegrationStatus: (
    bankId: string,
    payload: { integration_status?: IntegrationApprovalStatus; live_transaction_authorized?: boolean }
  ) =>
    request<Bank>(`/admin/banks/${bankId}/integration-status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminApplicationReviews: () =>
    request<{ reviews: BankApplicationReview[] }>('/admin/bank-application-reviews'),

  seedTestFixtures: () =>
    request<{ message: string; banks_count: number; branches_count: number }>('/dev/seed-test-fixtures', {
      method: 'POST',
    }),
};
