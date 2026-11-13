import base64
from fastapi.testclient import TestClient
from app.main import (
    app,
    banks_store,
    bank_applications_store,
    branches_store,
    verification_sessions,
    transactions_store,
    tokens_store,
    daily_usage_store,
    customers_store,
    _default_customers,
)

client = TestClient(app)


def reset_state():
    banks_store.clear()
    bank_applications_store.clear()
    branches_store.clear()
    verification_sessions.clear()
    transactions_store.clear()
    tokens_store.clear()
    daily_usage_store.clear()
    customers_store[:] = _default_customers()


def test_clean_initial_state_no_default_banks_or_branches():
    reset_state()
    r_banks = client.get("/api/v1/banks")
    r_branches = client.get("/api/v1/branches")
    assert r_banks.status_code == 200
    assert r_branches.status_code == 200
    assert r_banks.json()["banks"] == []
    assert r_branches.json()["branches"] == []


def test_bank_onboarding_rbac_and_full_withdrawal_flow():
    reset_state()

    app_resp = client.post(
        "/api/v1/bank-applications",
        json={
            "legal_name": "Test National Bank Ltd",
            "bank_type": "COMMERCIAL",
            "registration_licence_number": "RBI/2026/TNB-01",
            "official_email": "ops@testnational.example",
            "declaration_accepted": True,
            "branches": [
                {
                    "id": "br_test_delhi",
                    "branch_code": "TNB-DEL-01",
                    "name": "Connaught Terminal",
                    "location": "New Delhi",
                }
            ],
        },
    )
    assert app_resp.status_code == 201
    app_id = app_resp.json()["id"]

    # OPERATOR cannot approve applications
    denied = client.post(
        f"/api/v1/admin/bank-applications/{app_id}/approve",
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert denied.status_code == 403

    # MANAGER can approve
    approved = client.post(
        f"/api/v1/admin/bank-applications/{app_id}/approve",
        headers={"x-operator-id": "mgr_delhi_01"},
    )
    assert approved.status_code == 200

    # Create verification session at visiting branch
    sess_resp = client.post(
        "/api/v1/verification/sessions",
        json={"branch_id": "br_test_delhi", "amount": 10000},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert sess_resp.status_code == 201
    sess_id = sess_resp.json()["id"]

    # Submit valid synthetic frame (small JPEG header > 64 bytes)
    frame_b64 = "data:image/jpeg;base64," + base64.b64encode(b"\xff\xd8\xff" + b"0" * 128).decode()
    face_resp = client.post(
        f"/api/v1/verification/sessions/{sess_id}/face",
        json={"frame": frame_b64},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert face_resp.status_code == 200
    assert face_resp.json()["face_result"]["status"] == "MATCH"

    bio_resp = client.post(
        f"/api/v1/verification/sessions/{sess_id}/biometric",
        json={"modality": "FINGERPRINT"},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert bio_resp.status_code == 200
    assert bio_resp.json()["overall_result"] == "VERIFIED"
    cust_id = bio_resp.json()["customer_id"]

    # Create, authorize, and redeem withdrawal
    tx_resp = client.post(
        "/api/v1/withdrawals",
        json={
            "customer_id": cust_id,
            "branch_id": "br_test_delhi",
            "amount": 10000,
            "verification_session_id": sess_id,
        },
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert tx_resp.status_code == 201
    tx_id = tx_resp.json()["id"]

    auth_resp = client.post(
        f"/api/v1/withdrawals/{tx_id}/authorize",
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert auth_resp.status_code == 200
    token = auth_resp.json()["auth_token"]

    # Tampered token must fail with 403
    tamper_resp = client.post(
        f"/api/v1/withdrawals/{tx_id}/redeem",
        json={"auth_token": token, "force_tamper_token": True},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert tamper_resp.status_code == 403

    # Valid redeem succeeds
    redeem_resp = client.post(
        f"/api/v1/withdrawals/{tx_id}/redeem",
        json={"auth_token": token},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert redeem_resp.status_code == 200

    # Replay must fail with 409
    replay_resp = client.post(
        f"/api/v1/withdrawals/{tx_id}/redeem",
        json={"auth_token": token},
        headers={"x-operator-id": "op_delhi_01"},
    )
    assert replay_resp.status_code == 409
