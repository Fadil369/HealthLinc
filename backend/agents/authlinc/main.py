"""
AuthLinc Agent - Main entry point

This agent handles authentication and authorization operations for the HealthLinc ecosystem:
- User authentication
- Token generation and validation
- Role-based access control
- Security auditing and logging
"""

import os
import json
import logging
import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("authlinc")

# Initialize FastAPI app
app = FastAPI(
    title="AuthLinc Agent",
    description="LINC Agent for handling authentication and authorization",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme for token validation
security = HTTPBearer()

# Environment variables
JWT_SECRET = os.environ.get("JWT_SECRET", "healthlinc-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Models
class UserCredentials(BaseModel):
    username: str
    password: str


class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = Field(..., description="Role of the user (patient, doctor, admin, etc.)")
    organization_id: Optional[str] = None


class TokenData(BaseModel):
    user_id: str
    username: str
    role: str
    expires: datetime
    organization_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


# Helper functions
def generate_user_id(role: str) -> str:
    """Generate a unique user ID with role prefix"""
    if role.lower() == "patient":
        prefix = "PT"
    elif role.lower() == "doctor" or role.lower() == "provider":
        prefix = "DR"
    elif role.lower() == "admin":
        prefix = "AD"
    elif role.lower() == "staff":
        prefix = "ST"
    else:
        prefix = "US"
    
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def log_request(task: str, data: Dict[str, Any], request_id: str) -> None:
    """Log the incoming request details"""
    logger.info(f"Task: {task}, Request ID: {request_id}")
    logger.debug(f"Data: {json.dumps(data)}")


def hash_password(password: str) -> str:
    """Hash a password for storing in the database"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a new JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """Get the current user from the token"""
    token = credentials.credentials
    payload = decode_token(token)
    return payload


# API Routes
@app.post("/agents/auth")
async def handle_auth_request(request: Request) -> JSONResponse:
    """Main entry point for all authentication-related tasks"""
    try:
        # Get the task type from header
        task = request.headers.get("X-MCP-Task")
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        if not task:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Missing X-MCP-Task header"}
            )
        
        # Parse request body
        data = await request.json()
        log_request(task, data, request_id)
        
        # Route to appropriate handler based on task
        if task == "login":
            credentials = UserCredentials(**data)
            return await login_user(credentials, request_id)
            
        elif task == "register":
            user_data = UserRegistration(**data)
            return await register_user(user_data, request_id)
            
        elif task == "refresh":
            refresh_data = RefreshRequest(**data)
            return await refresh_token(refresh_data, request_id)
            
        elif task == "validate":
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"status": "error", "message": "Invalid or missing token"}
                )
            token = auth_header.replace("Bearer ", "")
            return await validate_token(token, request_id)
            
        elif task == "logout":
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"status": "error", "message": "Invalid or missing token"}
                )
            token = auth_header.replace("Bearer ", "")
            return await logout_user(token, request_id)
            
        else:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": f"Unknown task: {task}"}
            )
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Internal server error: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


# Task handlers
async def login_user(credentials: UserCredentials, request_id: str) -> JSONResponse:
    """Handle user login and token generation"""
    try:
        # In a real implementation, this would:
        # 1. Look up the user in the database
        # 2. Verify the password hash
        # 3. Generate and return tokens if valid
        
        # Mock user lookup for demo purposes
        # In production, you would fetch this from a database
        mock_users = {
            "doctor": {
                "user_id": "DR-12345678",
                "username": "doctor",
                "password": hash_password("doctor123"),
                "role": "doctor",
                "email": "doctor@healthlinc.app",
                "first_name": "Jane",
                "last_name": "Smith",
                "organization_id": "ORG-GENERAL"
            },
            "patient": {
                "user_id": "PT-87654321",
                "username": "patient",
                "password": hash_password("patient123"),
                "role": "patient",
                "email": "patient@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "organization_id": None
            }
        }
        
        # Check if user exists
        user = mock_users.get(credentials.username)
        if not user:
            return JSONResponse(
                status_code=401,
                content={
                    "status": "error",
                    "message": "Invalid credentials",
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
        
        # Verify password
        if not verify_password(credentials.password, user["password"]):
            return JSONResponse(
                status_code=401,
                content={
                    "status": "error",
                    "message": "Invalid credentials",
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
        
        # Create token data
        token_data = {
            "sub": user["user_id"],
            "username": user["username"],
            "role": user["role"],
            "organization_id": user["organization_id"]
        }
        
        # Generate access and refresh tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Login successful",
                "data": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "user": {
                        "user_id": user["user_id"],
                        "username": user["username"],
                        "role": user["role"],
                        "first_name": user["first_name"],
                        "last_name": user["last_name"],
                        "organization_id": user["organization_id"]
                    }
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error logging in user: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": f"Failed to log in: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def register_user(user_data: UserRegistration, request_id: str) -> JSONResponse:
    """Register a new user"""
    try:
        # Generate a unique user ID
        user_id = generate_user_id(user_data.role)
        
        # Hash the password
        hashed_password = hash_password(user_data.password)
        
        # In a real implementation, this would:
        # 1. Validate that the username/email isn't already taken
        # 2. Store the user info in a database
        # 3. Send a welcome email
        
        # For demo purposes, we'll just create a mock user object
        new_user = {
            "user_id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role,
            "organization_id": user_data.organization_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Create token data
        token_data = {
            "sub": new_user["user_id"],
            "username": new_user["username"],
            "role": new_user["role"],
            "organization_id": new_user["organization_id"]
        }
        
        # Generate tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return JSONResponse(
            status_code=201,
            content={
                "status": "success",
                "message": "User registered successfully",
                "data": {
                    "user_id": new_user["user_id"],
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "user": {
                        "user_id": new_user["user_id"],
                        "username": new_user["username"],
                        "role": new_user["role"],
                        "first_name": new_user["first_name"],
                        "last_name": new_user["last_name"],
                        "organization_id": new_user["organization_id"]
                    }
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to register user: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def refresh_token(refresh_data: RefreshRequest, request_id: str) -> JSONResponse:
    """Refresh an expired access token"""
    try:
        # Decode and validate refresh token
        refresh_token = refresh_data.refresh_token
        try:
            payload = decode_token(refresh_token)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "status": "error",
                    "message": e.detail,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
        
        # Extract user data from payload
        token_data = {
            "sub": payload["sub"],
            "username": payload["username"],
            "role": payload["role"],
            "organization_id": payload.get("organization_id")
        }
        
        # Generate new tokens
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Token refreshed successfully",
                "data": {
                    "access_token": new_access_token,
                    "refresh_token": new_refresh_token,
                    "token_type": "bearer",
                    "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to refresh token: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def validate_token(token: str, request_id: str) -> JSONResponse:
    """Validate a token and return user information"""
    try:
        # Decode and validate token
        try:
            payload = decode_token(token)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "status": "error",
                    "message": e.detail,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
        
        # Return user data
        return JSONResponse(
            content={
                "status": "success",
                "message": "Token is valid",
                "data": {
                    "user_id": payload["sub"],
                    "username": payload["username"],
                    "role": payload["role"],
                    "organization_id": payload.get("organization_id"),
                    "exp": payload["exp"]
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to validate token: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def logout_user(token: str, request_id: str) -> JSONResponse:
    """Log out a user by invalidating their token"""
    try:
        # In a real implementation, this would:
        # 1. Add the token to a blacklist in Redis/DB
        # 2. Or, if using short-lived tokens, nothing is needed
        
        # For demo purposes, we'll just return a success message
        return JSONResponse(
            content={
                "status": "success",
                "message": "Logged out successfully",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error logging out user: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to log out: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AuthLinc", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3003))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
