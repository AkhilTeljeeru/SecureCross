import datetime
from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    JSON,
    Integer,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(64), primary_key=True)
    branch_code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    customers = relationship("Customer", back_populates="home_branch")
    operators = relationship("Operator", back_populates="branch")
    transactions = relationship("Transaction", back_populates="branch")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True)
    customer_reference = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    synthetic_pan = Column(String(16), nullable=False)
    home_branch_id = Column(String(64), ForeignKey("branches.id"), nullable=False)
    account_status = Column(String(32), nullable=False, default="ACTIVE")
    available_balance = Column(Numeric(14, 2), nullable=False)
    daily_withdrawal_limit = Column(Numeric(14, 2), nullable=False, default=50000.00)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    home_branch = relationship("Branch", back_populates="customers")
    verification_sessions = relationship("VerificationSession", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")

    __table_args__ = (
        CheckConstraint("available_balance >= 0", name="chk_positive_balance"),
    )


class Operator(Base):
    __tablename__ = "operators"

    id = Column(String(64), primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False)
    branch_id = Column(String(64), ForeignKey("branches.id"), nullable=False)
    status = Column(String(32), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

    branch = relationship("Branch", back_populates="operators")
    transactions = relationship("Transaction", back_populates="operator")

    __table_args__ = (
        CheckConstraint("role IN ('OPERATOR', 'MANAGER', 'AUDITOR')", name="chk_operator_role"),
    )


class VerificationSession(Base):
    __tablename__ = "verification_sessions"

    id = Column(String(64), primary_key=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    branch_id = Column(String(64), ForeignKey("branches.id"), nullable=False)
    session_status = Column(String(32), nullable=False)
    face_result = Column(JSON, nullable=False)
    additional_biometric_result = Column(JSON, nullable=False)
    overall_result = Column(String(32), nullable=False)
    failure_reason_code = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    customer = relationship("Customer", back_populates="verification_sessions")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True)
    transaction_reference = Column(String(64), unique=True, nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    branch_id = Column(String(64), ForeignKey("branches.id"), nullable=False)
    operator_id = Column(String(64), ForeignKey("operators.id"), nullable=False)
    verification_session_id = Column(String(64), ForeignKey("verification_sessions.id"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    status = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    authorized_at = Column(DateTime(timezone=True), nullable=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)

    branch = relationship("Branch", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    operator = relationship("Operator", back_populates="transactions")
    authorization_token = relationship("AuthorizationToken", uselist=False, back_populates="transaction")

    __table_args__ = (
        CheckConstraint("amount > 0 AND amount <= 50000", name="chk_transaction_amount_limit"),
    )


class AuthorizationToken(Base):
    __tablename__ = "authorization_tokens"

    id = Column(String(64), primary_key=True)
    transaction_id = Column(String(64), ForeignKey("transactions.id"), unique=True, nullable=False)
    token_jti = Column(String(128), unique=True, nullable=False, index=True)
    issued_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), nullable=False, default="ISSUED")

    transaction = relationship("Transaction", back_populates="authorization_token")


class DailyWithdrawalUsage(Base):
    __tablename__ = "daily_withdrawal_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=False)
    usage_date = Column(DateTime(timezone=False), nullable=False)
    total_withdrawn = Column(Numeric(14, 2), nullable=False, default=0.00)

    __table_args__ = (
        UniqueConstraint("customer_id", "usage_date", name="uq_customer_usage_date"),
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)
    event_type = Column(String(64), nullable=False, index=True)
    actor_id = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    transaction_id = Column(String(64), nullable=True, index=True)
    event_timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    outcome = Column(String(32), nullable=False)
    reason_code = Column(String(64), nullable=True)
    correlation_id = Column(String(64), nullable=False, index=True)
    metadata = Column(JSON, nullable=False)


class Bank(Base):
    __tablename__ = "banks"

    id = Column(String(64), primary_key=True)
    legal_name = Column(String(255), nullable=False, unique=True)
    bank_type = Column(String(64), nullable=False)
    country = Column(String(64), nullable=False, default="India")
    registered_address = Column(String(512), nullable=False)
    official_website = Column(String(255), nullable=False)
    registration_licence_number = Column(String(64), unique=True, nullable=False, index=True)
    official_email = Column(String(255), nullable=False)
    contact_number = Column(String(32), nullable=False)
    logo_url = Column(String(512), nullable=True)
    directory_status = Column(String(32), nullable=False, default="DRAFT")
    integration_status = Column(String(32), nullable=False, default="NOT_STARTED")
    live_transaction_authorized = Column(Integer, nullable=False, default=0)
    participating_branches_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)


class BankApplication(Base):
    __tablename__ = "bank_applications"

    id = Column(String(64), primary_key=True)
    legal_name = Column(String(255), nullable=False)
    bank_type = Column(String(64), nullable=False)
    country = Column(String(64), nullable=False, default="India")
    registered_address = Column(String(512), nullable=False)
    official_website = Column(String(255), nullable=False)
    registration_licence_number = Column(String(64), nullable=False, index=True)
    official_email = Column(String(255), nullable=False)
    contact_number = Column(String(32), nullable=False)
    security_contact_email = Column(String(255), nullable=False)
    technical_contact_email = Column(String(255), nullable=False)
    sandbox_readiness = Column(Integer, nullable=False, default=0)
    preferred_integration_notes = Column(String(1024), nullable=True)
    general_requirements = Column(String(1024), nullable=True)
    application_status = Column(String(32), nullable=False, default="SUBMITTED")
    declaration_accepted = Column(Integer, nullable=False, default=1)
    bank_id = Column(String(64), ForeignKey("banks.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime(timezone=True), nullable=True)


class BankBranch(Base):
    __tablename__ = "bank_branches"

    id = Column(String(64), primary_key=True)
    bank_id = Column(String(64), ForeignKey("banks.id"), nullable=True)
    application_id = Column(String(64), ForeignKey("bank_applications.id"), nullable=True)
    branch_code = Column(String(32), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(512), nullable=False)
    location = Column(String(255), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    contact_email = Column(String(255), nullable=False)
    is_home_branch_enabled = Column(Integer, nullable=False, default=1)
    status = Column(String(32), nullable=False, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)


class BankRepresentative(Base):
    __tablename__ = "bank_representatives"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), ForeignKey("bank_applications.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
    designation = Column(String(128), nullable=False)
    work_email = Column(String(255), nullable=False)
    work_phone = Column(String(32), nullable=False)
    authorization_evidence_summary = Column(String(1024), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)


class BankDocument(Base):
    __tablename__ = "bank_documents"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), ForeignKey("bank_applications.id"), nullable=False)
    document_type = Column(String(64), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(64), nullable=False)
    storage_reference = Column(String(512), nullable=False)
    verification_status = Column(String(32), nullable=False, default="PENDING")
    uploaded_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)


class BankApplicationReview(Base):
    __tablename__ = "bank_application_reviews"

    id = Column(String(64), primary_key=True)
    application_id = Column(String(64), ForeignKey("bank_applications.id"), nullable=False)
    previous_status = Column(String(32), nullable=False)
    new_status = Column(String(32), nullable=False)
    reviewer_id = Column(String(64), nullable=False)
    reviewer_role = Column(String(32), nullable=False)
    review_notes = Column(String(1024), nullable=True)
    reason_code = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

