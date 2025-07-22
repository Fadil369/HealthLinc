"""
Authentication Service for BrainSAIT ClaimLinc-NPHIES Integration
Handles user registration, authentication, and subscription management
Author: BrainSAIT Team
Date: May 21, 2025
"""

import os
import json
import logging
import uuid
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, EmailStr, validator, Field
from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException, Depends, Header, Request, status, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.sql import func
import stripe

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("auth.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("auth")

# Initialize FastAPI app
app = FastAPI(
    title="BrainSAIT Authentication Service",
    description="Authentication, User Management and Subscription Service for BrainSAIT NPHIES Integration",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./brainsait.db")
Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Token config
SECRET_KEY = os.environ.get("JWT_SECRET", "brainsait2025supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Stripe setup
stripe.api_key = os.environ.get("STRIPE_API_KEY", "sk_test_example")

# OAuth2 password bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Subscription tiers
SUBSCRIPTION_TIERS = {
    "basic": {
        "name": "Basic",
        "price": 17,  # SAR
        "description": "Single claim request and response",
        "features": ["1 claim request", "Basic support"],
        "stripe_price_id": os.environ.get("STRIPE_BASIC_PRICE_ID", "price_basic"),
    },
    "plus": {
        "name": "Plus Integration",
        "price": 363,  # SAR
        "description": "Full NPHIES integration with basic features",
        "features": ["Unlimited claims", "Eligibility checks", "Basic reporting", "Email support"],
        "stripe_price_id": os.environ.get("STRIPE_PLUS_PRICE_ID", "price_plus"),
    },
    "pro": {
        "name": "Pro Integration",
        "price": 693,  # SAR
        "description": "Advanced NPHIES integration with premium features",
        "features": ["Everything in Plus", "Batch processing", "Advanced reporting", "Priority support"],
        "stripe_price_id": os.environ.get("STRIPE_PRO_PRICE_ID", "price_pro"),
    },
    "enterprise": {
        "name": "Enterprise Integration",
        "price": 963,  # SAR
        "description": "Complete NPHIES solution for large organizations",
        "features": ["Everything in Pro", "Dedicated support", "Custom integration", "SLA guarantee"],
        "stripe_price_id": os.environ.get("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise"),
    }
}

# Database Models
class User(Base):
    """User model in the database"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    company_name = Column(String, nullable=True)
    role = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    api_keys = relationship("ApiKey", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")

class Subscription(Base):
    """Subscription model in the database"""
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    tier = Column(String)
    status = Column(String)
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    payment_methods = relationship("PaymentMethod", back_populates="subscription")

class PaymentMethod(Base):
    """Payment method model in the database"""
    __tablename__ = "payment_methods"
    
    id = Column(String, primary_key=True, index=True)
    subscription_id = Column(String, ForeignKey("subscriptions.id"))
    stripe_payment_method_id = Column(String)
    payment_type = Column(String)  # credit_card, apple_pay, google_pay, paypal
    last_four = Column(String, nullable=True)
    expiry_month = Column(Integer, nullable=True)
    expiry_year = Column(Integer, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    subscription = relationship("Subscription", back_populates="payment_methods")

class ApiKey(Base):
    """API Key model in the database"""
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    key = Column(String, index=True)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")

class UsageLog(Base):
    """Usage log model in the database"""
    __tablename__ = "usage_logs"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    api_key_id = Column(String, nullable=True)
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    request_id = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime, default=func.now())
    response_time_ms = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="usage_logs")

# Create all tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    role: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    sub: str
    exp: Optional[int] = None

class SubscriptionCreate(BaseModel):
    tier: str
    payment_method_id: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: str
    tier: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    
    class Config:
        orm_mode = True

class PaymentMethodCreate(BaseModel):
    payment_type: str
    stripe_payment_method_id: str

class PaymentMethodResponse(BaseModel):
    id: str
    payment_type: str
    last_four: Optional[str]
    expiry_month: Optional[int]
    expiry_year: Optional[int]
    is_default: bool
    
    class Config:
        orm_mode = True

class ApiKeyCreate(BaseModel):
    name: str
    expires_in_days: Optional[int] = None

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Only shown on creation
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class ApiKeyListResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class StripeCheckoutSession(BaseModel):
    checkout_url: str

class TierInfo(BaseModel):
    name: str
    price: float
    description: str
    features: List[str]

class SubscriptionTiersResponse(BaseModel):
    tiers: Dict[str, TierInfo]

# Helper functions
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the current authenticated user from the JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenData(sub=user_id, exp=payload.get("exp"))
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Check if the authenticated user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def validate_api_key(api_key: str = Header(..., convert_underscores=False), db: Session = Depends(get_db)) -> ApiKey:
    """Validate an API key"""
    db_api_key = db.query(ApiKey).filter(ApiKey.key == api_key, ApiKey.is_active == True).first()
    if not db_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Check if the API key has expired
    if db_api_key.expires_at and db_api_key.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="API key has expired")
    
    # Update last used timestamp
    db_api_key.last_used_at = datetime.utcnow()
    db.commit()
    
    return db_api_key

# Endpoints
@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    db_user = User(
        id=user_id,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        company_name=user.company_name,
        role=user.role,
        is_active=True,
        is_verified=False  # Will be set to true after email verification
    )
    
    # Save user to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # TODO: Send verification email
    
    return db_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and provide JWT token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Authentication", "version": "1.0.0"}

# Run the FastAPI application with uvicorn when script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
