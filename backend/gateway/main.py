"""
API Gateway for BrainSAIT NPHIES Integration
Routes requests to appropriate    services = {
        "auth": AUTH_SERVICE_URL,
        "claimlinc": CLAIMLINC_SERVICE_URL,
        "payments": PAYMENT_SERVICE_URL,
        "agents": AGENTS_SERVICE_URL,
    }oservices
Author: BrainSAIT Team
Date: May 21, 2025
"""

import os
import json
import logging
import time
from fastapi import FastAPI, HTTPException, Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
import jwt
from fastapi.security import OAuth2PasswordBearer

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("gateway.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("gateway")

# Initialize FastAPI app
app = FastAPI(
    title="BrainSAIT API Gateway",
    description="API Gateway for BrainSAIT NPHIES Integration",
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

# OAuth2 for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Service URLs from environment variables with defaults
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://auth:8000")
CLAIMLINC_SERVICE_URL = os.environ.get("CLAIMLINC_SERVICE_URL", "http://claimlinc:8000")
PAYMENT_SERVICE_URL = os.environ.get("PAYMENT_SERVICE_URL", "http://payments:8000")
AGENTS_SERVICE_URL = os.environ.get("AGENTS_SERVICE_URL", "http://agents:8004")

# JWT configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "brainsait2025supersecret")
JWT_ALGORITHM = "HS256"

# Authentication functions
def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current user from token"""
    return verify_token(token)

# Service discovery function
def get_service_url(service_name: str) -> Optional[str]:
    """Get service URL by name"""
    service_map = {
        "auth": AUTH_SERVICE_URL,
        "claimlinc": CLAIMLINC_SERVICE_URL,
        "payments": PAYMENT_SERVICE_URL,
    }
    return service_map.get(service_name.lower())

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and their processing time"""
    start_time = time.time()
    
    # Generate request ID
    request_id = f"req_{int(start_time * 1000)}"
    
    # Log request details
    logger.info(f"Request {request_id}: {request.method} {request.url.path}")
    
    # Process request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        # Log response details
        logger.info(f"Response {request_id}: {response.status_code} (took {process_time:.4f}s)")
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Error {request_id}: {str(e)} (took {process_time:.4f}s)")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Gateway health check endpoint"""
    return {
        "status": "healthy",
        "service": "API Gateway",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# Service health checks
@app.get("/services/health")
async def services_health(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Check health of all services"""
    services = ["auth", "claimlinc", "payments"]
    results = {}
    
    async with httpx.AsyncClient() as client:
        for service in services:
            service_url = get_service_url(service)
            if not service_url:
                results[service] = {"status": "unknown", "error": "Service URL not configured"}
                continue
            
            try:
                response = await client.get(f"{service_url}/health", timeout=5.0)
                if response.status_code == 200:
                    results[service] = {"status": "healthy", **response.json()}
                else:
                    results[service] = {"status": "unhealthy", "error": f"HTTP {response.status_code}"}
            except Exception as e:
                results[service] = {"status": "unhealthy", "error": str(e)}
    
    return {
        "gateway": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        },
        "services": results
    }

# Authentication endpoints
@app.post("/auth/login")
async def login(request: Request):
    """Forward login request to auth service"""
    return await forward_request(request, "auth", "/login")

@app.post("/auth/register")
async def register(request: Request):
    """Forward registration request to auth service"""
    return await forward_request(request, "auth", "/register")

@app.post("/auth/refresh")
async def refresh_token(request: Request):
    """Forward token refresh request to auth service"""
    return await forward_request(request, "auth", "/refresh")

# NPHIES Integration endpoints
@app.post("/nphies/eligibility")
async def nphies_eligibility_check(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Check patient eligibility with NPHIES through ClaimLinc"""
    return await forward_request_with_auth(request, "claimlinc", "/check-eligibility", current_user)

@app.post("/nphies/claim")
async def nphies_submit_claim(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Submit a claim to NPHIES through ClaimLinc"""
    return await forward_request_with_auth(request, "claimlinc", "/process", current_user)

@app.post("/nphies/status")
async def nphies_check_claim_status(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Check claim status with NPHIES through ClaimLinc"""
    return await forward_request_with_auth(request, "claimlinc", "/status", current_user)

@app.get("/nphies/test-connection")
async def test_nphies_connection(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Test connection to NPHIES through ClaimLinc"""
    service_url = get_service_url("claimlinc")
    if not service_url:
        raise HTTPException(status_code=503, detail="ClaimLinc service not available")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{service_url}/test-nphies-connection",
            headers={"Authorization": f"Bearer {generate_internal_token(current_user)}"}
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )

# Batch processing endpoints
@app.post("/nphies/batch")
async def batch_process_claims(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Process claims in batch through ClaimLinc"""
    return await forward_request_with_auth(request, "claimlinc", "/batch/process", current_user)

# Reporting endpoints
@app.get("/reports/daily-claims")
async def get_daily_claims_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get daily claims report from ClaimLinc"""
    service_url = get_service_url("claimlinc")
    if not service_url:
        raise HTTPException(status_code=503, detail="ClaimLinc service not available")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{service_url}/reports/daily-claims",
            headers={"Authorization": f"Bearer {generate_internal_token(current_user)}"}
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )

@app.get("/reports/eligibility-checks")
async def get_eligibility_checks_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get eligibility checks report from ClaimLinc"""
    service_url = get_service_url("claimlinc")
    if not service_url:
        raise HTTPException(status_code=503, detail="ClaimLinc service not available")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{service_url}/reports/eligibility-checks",
            headers={"Authorization": f"Bearer {generate_internal_token(current_user)}"}
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )

# Subscription and Billing endpoints
@app.post("/subscription/create")
async def create_subscription(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create subscription for user"""
    return await forward_request_with_auth(request, "auth", "/subscription/create", current_user)

@app.get("/subscription/status")
async def get_subscription_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get subscription status for current user"""
    service_url = get_service_url("auth")
    if not service_url:
        raise HTTPException(status_code=503, detail="Auth service not available")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{service_url}/subscription/status",
            headers={"Authorization": f"Bearer {generate_internal_token(current_user)}"}
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )

@app.post("/payment/process")
async def process_payment(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Process payment for subscription"""
    return await forward_request_with_auth(request, "payments", "/process", current_user)

# User management endpoints
@app.get("/user/profile")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get profile for current user"""
    service_url = get_service_url("auth")
    if not service_url:
        raise HTTPException(status_code=503, detail="Auth service not available")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{service_url}/user/profile",
            headers={"Authorization": f"Bearer {generate_internal_token(current_user)}"}
        )
        return JSONResponse(
            status_code=response.status_code,
            content=response.json()
        )

@app.put("/user/profile")
async def update_user_profile(
    request: Request, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update profile for current user"""
    return await forward_request_with_auth(request, "auth", "/user/profile", current_user)

# AI Agents endpoints
@app.post("/agents/{agent_name}/execute")
async def execute_agent(
    agent_name: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Execute AI agent through agents service"""
    return await forward_request_with_auth(request, "agents", f"/agents/{agent_name}/execute", current_user)

@app.get("/agents/status")
async def get_agents_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get status of all AI agents"""
    return await forward_authenticated_request_simple("agents", "/agents/status", current_user)

# Helper functions
async def forward_request(request: Request, service_name: str, endpoint: str):
    """Forward request to specified service"""
    service_url = get_service_url(service_name)
    if not service_url:
        raise HTTPException(status_code=503, detail=f"{service_name.capitalize()} service not available")
    
    # Get request body
    body = await request.body()
    
    # Extract headers to forward
    headers = {
        "Content-Type": request.headers.get("Content-Type", "application/json")
    }
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=f"{service_url}{endpoint}",
                content=body,
                headers=headers,
                timeout=30.0
            )
            
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
        except httpx.RequestError as e:
            logger.error(f"Error forwarding request to {service_name}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Error communicating with {service_name} service")

async def forward_request_with_auth(request: Request, service_name: str, endpoint: str, user: Dict[str, Any]):
    """Forward authenticated request to specified service with internal token"""
    service_url = get_service_url(service_name)
    if not service_url:
        raise HTTPException(status_code=503, detail=f"{service_name.capitalize()} service not available")
    
    # Get request body
    body = await request.body()
    
    # Generate internal JWT for service-to-service communication
    internal_token = generate_internal_token(user)
    
    # Extract headers to forward
    headers = {
        "Content-Type": request.headers.get("Content-Type", "application/json"),
        "Authorization": f"Bearer {internal_token}"
    }
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=f"{service_url}{endpoint}",
                content=body,
                headers=headers,
                timeout=30.0
            )
            
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
        except httpx.RequestError as e:
            logger.error(f"Error forwarding request to {service_name}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Error communicating with {service_name} service")

def generate_internal_token(user: Dict[str, Any]) -> str:
    """Generate internal JWT token for service-to-service communication"""
    payload = {
        "sub": user.get("sub", user.get("username", "unknown")),
        "user_id": user.get("user_id", user.get("id", "unknown")),
        "exp": datetime.now().timestamp() + 300,  # 5 minutes expiry
        "iat": datetime.now().timestamp(),
        "internal": True,
        "scope": "service",
        "roles": user.get("roles", [])
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Helper function for simple GET requests
async def forward_authenticated_request_simple(service_name: str, path: str, user: Dict[str, Any]):
    """Forward simple GET request to service"""
    service_url = get_service_url(service_name)
    if not service_url:
        raise HTTPException(status_code=503, detail=f"{service_name} service not available")
    
    internal_token = generate_internal_token(user)
    headers = {"Authorization": f"Bearer {internal_token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{service_url}{path}",
                headers=headers,
                timeout=30.0
            )
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
        except httpx.RequestError as e:
            logger.error(f"Error communicating with {service_name}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Error communicating with {service_name} service")

# Main function for direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)