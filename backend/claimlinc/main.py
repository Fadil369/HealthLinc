"""
ClaimLinc Agent - Enhanced with NPHIES Integration
Part of BrainSAIT Unified Agentic Healthcare Ecosystem
Author: BrainSAIT Team
Date: May 21, 2025
"""

import os
import json
import logging
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import httpx
import uuid
import jwt
from fastapi.security import OAuth2PasswordBearer

# Import NPHIES integration
from nphies_integration import NPHIESIntegration

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("claimlinc.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("claimlinc")

# Initialize FastAPI app
app = FastAPI(
    title="ClaimLinc Agent API",
    description="Medical Claims Processing Agent with NPHIES Integration",
    version="2.0.0",
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

# Initialize NPHIES client
nphies_client = NPHIESIntegration(
    api_url=os.environ.get("NPHIES_API_URL", "http://172.16.6.66:7000"),
    base_url=os.environ.get("NPHIES_BASE_URL", "https://HSB.nphies.sa/$process-message")
)

# Models
class ClaimStatusRequest(BaseModel):
    claim_id: str = Field(..., description="Unique identifier for the claim")

class EligibilityRequest(BaseModel):
    patient: Dict[str, Any] = Field(..., description="Patient information including insurance details")

class PatientInfo(BaseModel):
    id: str = Field(..., description="Unique identifier for the patient")
    firstName: str = Field(..., description="Patient's first name")
    lastName: str = Field(..., description="Patient's last name")
    dateOfBirth: str = Field(..., description="Patient's date of birth in format YYYY-MM-DD")
    gender: str = Field(..., description="Patient's gender (male, female, other)")
    nationalId: Optional[str] = Field(None, description="Patient's national ID")
    phoneNumber: Optional[str] = Field(None, description="Patient's phone number")
    email: Optional[str] = Field(None, description="Patient's email address")
    address: Optional[Dict[str, Any]] = Field(None, description="Patient's address")
    insurance: Dict[str, Any] = Field(..., description="Patient's insurance information")

class ProviderInfo(BaseModel):
    id: str = Field(..., description="Unique identifier for the provider")
    name: str = Field(..., description="Provider's name")
    specialty: Optional[str] = Field(None, description="Provider's medical specialty")
    licenseNumber: Optional[str] = Field(None, description="Provider's license number")
    npi: Optional[str] = Field(None, description="Provider's NPI (National Provider Identifier)")
    address: Optional[Dict[str, Any]] = Field(None, description="Provider's address")
    contact: Optional[Dict[str, Any]] = Field(None, description="Provider's contact information")

class EncounterInfo(BaseModel):
    id: str = Field(..., description="Unique identifier for the encounter")
    date: str = Field(..., description="Date of the encounter in format YYYY-MM-DD")
    type: str = Field(..., description="Type of encounter (e.g., outpatient, inpatient)")
    location: Optional[str] = Field(None, description="Location of the encounter")
    chief_complaint: str = Field(..., description="Primary reason for the visit")
    notes: Optional[str] = Field(None, description="Clinical notes from the encounter")

class DiagnosisInfo(BaseModel):
    code: str = Field(..., description="Diagnosis code (ICD-10)")
    description: str = Field(..., description="Diagnosis description")
    type: Optional[str] = Field("primary", description="Type of diagnosis (primary, secondary)")
    date: Optional[str] = Field(None, description="Date of diagnosis")

class ProcedureInfo(BaseModel):
    code: str = Field(..., description="Procedure code (CPT/HCPCS)")
    description: str = Field(..., description="Procedure description")
    cost: float = Field(..., description="Cost of the procedure")
    date: Optional[str] = Field(None, description="Date of procedure")
    quantity: Optional[int] = Field(1, description="Quantity of the procedure")

class ClaimRequest(BaseModel):
    claim_id: Optional[str] = Field(None, description="Unique identifier for the claim (will be generated if not provided)")
    patient: PatientInfo = Field(..., description="Patient information")
    provider: ProviderInfo = Field(..., description="Provider information")
    encounter: EncounterInfo = Field(..., description="Encounter information")
    diagnosis: List[DiagnosisInfo] = Field(..., description="List of diagnoses")
    procedures: List[ProcedureInfo] = Field(..., description="List of procedures")
    total_charge: Optional[float] = Field(None, description="Total charge for the claim (will be calculated if not provided)")

# Authentication functions
def get_token_from_header(authorization: str = Header(None)) -> str:
    """Extract token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    return parts[1]

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token"""
    try:
        jwt_secret = os.environ.get("JWT_SECRET", "brainsait2025supersecret")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get current user from token"""
    return verify_token(token)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ClaimLinc", "version": "2.0.0"}

# Process claim endpoint
@app.post("/process")
async def process_claim(claim: ClaimRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Process a medical claim with NPHIES integration"""
    try:
        # Generate claim ID if not provided
        if not claim.claim_id:
            claim.claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
        
        logger.info(f"Processing claim {claim.claim_id} for user {current_user.get('username')}")
        
        # Calculate total charge if not provided
        if claim.total_charge is None:
            claim.total_charge = sum(proc.cost * (proc.quantity or 1) for proc in claim.procedures)
        
        # Submit claim to NPHIES
        nphies_response = nphies_client.send_claim(claim.dict())
        
        if not nphies_response["success"]:
            logger.warning(f"NPHIES claim submission failed: {nphies_response['message']}")
        else:
            logger.info(f"NPHIES claim submission successful: {nphies_response['message']}")
        
        # Process claim internally
        processed_claim = {
            "claim_id": claim.claim_id,
            "claim_status": "submitted",
            "processing_date": datetime.utcnow().isoformat(),
            "patient_id": claim.patient.id,
            "provider_id": claim.provider.id,
            "total_charge": claim.total_charge,
            "currency": "SAR",
            "nphies_status": "submitted" if nphies_response["success"] else "failed",
            "nphies_details": nphies_response.get("data"),
            "nphies_claim_id": nphies_response.get("nphies_claim_id")
        }
        
        # Record usage for billing
        await record_usage(current_user.get("user_id"), "claim_submission", 1)
        
        return processed_claim
    
    except Exception as e:
        logger.error(f"Error processing claim: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing claim: {str(e)}")

# Check claim status endpoint
@app.post("/status")
async def check_claim_status(status_request: ClaimStatusRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Check status of a claim with NPHIES"""
    try:
        logger.info(f"Checking status for claim {status_request.claim_id}")
        
        # Check status with NPHIES
        nphies_status = nphies_client.check_claim_status(status_request.claim_id)
        
        # Record usage for billing
        await record_usage(current_user.get("user_id"), "claim_status_check", 1)
        
        return {
            "claim_id": status_request.claim_id,
            "check_date": datetime.utcnow().isoformat(),
            "nphies_status": nphies_status.get("status", "unknown"),
            "payment_info": {
                "amount": nphies_status.get("details", {}).get("payment_amount"),
                "currency": "SAR",
                "date": nphies_status.get("details", {}).get("payment_date")
            },
            "adjudication": nphies_status.get("details", {}).get("adjudication", []),
            "success": nphies_status.get("success", False),
            "message": nphies_status.get("message", "")
        }
    
    except Exception as e:
        logger.error(f"Error checking claim status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking claim status: {str(e)}")

# Check eligibility endpoint
@app.post("/check-eligibility")
async def check_eligibility(eligibility_request: EligibilityRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Check patient eligibility with NPHIES"""
    try:
        logger.info(f"Checking eligibility for patient {eligibility_request.patient.get('id')}")
        
        # Check eligibility with NPHIES
        eligibility_response = nphies_client.check_eligibility(eligibility_request.patient)
        
        # Record usage for billing
        await record_usage(current_user.get("user_id"), "eligibility_check", 1)
        
        return {
            "patient_id": eligibility_request.patient.get("id"),
            "patient_name": f"{eligibility_request.patient.get('firstName', '')} {eligibility_request.patient.get('lastName', '')}",
            "eligibility_status": "eligible" if eligibility_response.get("is_eligible", False) else "not_eligible",
            "check_date": datetime.utcnow().isoformat(),
            "coverage_period": eligibility_response.get("coverage_period"),
            "benefits": eligibility_response.get("benefit_details", []),
            "success": eligibility_response.get("success", False),
            "message": eligibility_response.get("message", "")
        }
    
    except Exception as e:
        logger.error(f"Error checking eligibility: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking eligibility: {str(e)}")

# Test endpoint for NPHIES connection
@app.get("/test-nphies-connection")
async def test_nphies_connection(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Test connection to NPHIES"""
    try:
        # Get auth token as a simple connection test
        token = nphies_client._get_auth_token()
        
        if token:
            return {
                "status": "success", 
                "message": "Successfully connected to NPHIES",
                "connection_details": {
                    "api_url": nphies_client.api_url,
                    "base_url": nphies_client.base_url,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        else:
            return {
                "status": "error", 
                "message": "Failed to connect to NPHIES - no token received",
                "connection_details": {
                    "api_url": nphies_client.api_url,
                    "base_url": nphies_client.base_url,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    except Exception as e:
        logger.error(f"Error testing NPHIES connection: {str(e)}")
        return {
            "status": "error", 
            "message": f"Failed to connect to NPHIES: {str(e)}",
            "connection_details": {
                "api_url": nphies_client.api_url,
                "base_url": nphies_client.base_url,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

# Reporting endpoints
@app.get("/reports/daily-claims")
async def get_daily_claims_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Generate a report of claims submitted by day
    Only accessible to users with reporting privileges
    """
    try:
        # Check if user has reporting privileges
        if "reporting" not in current_user.get("roles", []):
            raise HTTPException(status_code=403, detail="You don't have permission to access reports")
        
        # In a production environment, this would query a database
        # For this prototype, we'll return sample data
        return {
            "report_id": f"REP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "report_type": "daily_claims",
            "generated_at": datetime.now().isoformat(),
            "generated_by": current_user.get("user_id"),
            "data": [
                {
                    "date": (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
                    "claims_submitted": int(50 * (1 - i*0.1) + 5 * (hash(current_user.get("user_id", "")) % 10)),
                    "claims_processed": int(48 * (1 - i*0.1) + 5 * (hash(current_user.get("user_id", "")) % 10)),
                    "total_value": round(15000 * (1 - i*0.05) + 1000 * (hash(current_user.get("user_id", "")) % 10), 2),
                    "currency": "SAR"
                }
                for i in range(7)  # Last 7 days
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating daily claims report: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating report")

@app.get("/reports/eligibility-checks")
async def get_eligibility_checks_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Generate a report of eligibility checks performed
    Only accessible to users with reporting privileges
    """
    try:
        # Check if user has reporting privileges
        if "reporting" not in current_user.get("roles", []):
            raise HTTPException(status_code=403, detail="You don't have permission to access reports")
        
        # In a production environment, this would query a database
        # For this prototype, we'll return sample data
        return {
            "report_id": f"REP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "report_type": "eligibility_checks",
            "generated_at": datetime.now().isoformat(),
            "generated_by": current_user.get("user_id"),
            "data": [
                {
                    "date": (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
                    "checks_performed": int(120 * (1 - i*0.08) + 10 * (hash(current_user.get("user_id", "")) % 10)),
                    "eligible_results": int(100 * (1 - i*0.08) + 8 * (hash(current_user.get("user_id", "")) % 10)),
                    "not_eligible_results": int(20 * (1 - i*0.08) + 2 * (hash(current_user.get("user_id", "")) % 10))
                }
                for i in range(7)  # Last 7 days
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating eligibility checks report: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating report")

# Batch processing endpoints
class BatchClaimRequest(BaseModel):
    claims: List[ClaimRequest] = Field(..., description="List of claims to process in batch")
    parallel_processing: Optional[bool] = Field(False, description="Whether to process claims in parallel")

@app.post("/batch/process")
async def process_claims_batch(
    batch_request: BatchClaimRequest, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Process multiple claims in a batch"""
    try:
        logger.info(f"Processing batch of {len(batch_request.claims)} claims for user {current_user.get('username')}")
        
        # Check if user subscription allows batch processing
        user_tier = current_user.get("subscription", {}).get("tier")
        if user_tier not in ["pro", "enterprise"]:
            raise HTTPException(
                status_code=403, 
                detail="Batch processing requires a Pro or Enterprise subscription"
            )
        
        # Process claims
        results = []
        
        if batch_request.parallel_processing:
            # In a production environment, we would use async tasks or a task queue
            # For this prototype, we'll process sequentially
            logger.warning("Parallel processing requested but not implemented, processing sequentially")
        
        for claim in batch_request.claims:
            try:
                # Generate claim ID if not provided
                if not claim.claim_id:
                    claim.claim_id = f"CLM-{uuid.uuid4().hex[:8].upper()}"
                
                # Calculate total charge if not provided
                if claim.total_charge is None:
                    claim.total_charge = sum(proc.cost * (proc.quantity or 1) for proc in claim.procedures)
                
                # Submit claim to NPHIES
                nphies_response = nphies_client.send_claim(claim.dict())
                
                # Process claim internally
                processed_claim = {
                    "claim_id": claim.claim_id,
                    "claim_status": "submitted",
                    "processing_date": datetime.utcnow().isoformat(),
                    "patient_id": claim.patient.id,
                    "provider_id": claim.provider.id,
                    "total_charge": claim.total_charge,
                    "currency": "SAR",
                    "nphies_status": "submitted" if nphies_response["success"] else "failed",
                    "nphies_details": nphies_response.get("data"),
                    "nphies_claim_id": nphies_response.get("nphies_claim_id")
                }
                
                results.append({
                    "success": True,
                    "claim": processed_claim
                })
                
            except Exception as e:
                results.append({
                    "success": False,
                    "claim_id": getattr(claim, "claim_id", "unknown"),
                    "error": str(e)
                })
        
        # Record usage for billing
        await record_usage(current_user.get("user_id"), "batch_claim_submission", len(batch_request.claims))
        
        return {
            "batch_id": f"BATCH-{uuid.uuid4().hex[:8].upper()}",
            "total_claims": len(batch_request.claims),
            "successful_claims": sum(1 for r in results if r.get("success")),
            "failed_claims": sum(1 for r in results if not r.get("success")),
            "processing_date": datetime.utcnow().isoformat(),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing batch of claims: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing batch of claims: {str(e)}")

# Record usage for billing
async def record_usage(user_id: str, operation_type: str, count: int = 1):
    """Record API usage for billing purposes"""
    try:
        # In a production environment, this would make an async call to the billing service
        billing_url = os.environ.get("BILLING_SERVICE_URL", "http://billing-service:8080/api/usage")
        
        usage_data = {
            "user_id": user_id,
            "service": "claimlinc",
            "operation": operation_type,
            "count": count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # In this prototype, we'll just log the usage
        logger.info(f"Usage recorded: {json.dumps(usage_data)}")
        
        # In production, uncomment this to send to billing service
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(billing_url, json=usage_data)
        #     if response.status_code != 200:
        #         logger.error(f"Failed to record usage: {response.text}")
        
    except Exception as e:
        logger.error(f"Error recording usage: {str(e)}")
        # Don't re-raise, as this is a background operation that shouldn't affect the main API response

# Main function for direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
