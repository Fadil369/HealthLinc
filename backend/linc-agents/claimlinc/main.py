"""
ClaimLinc Agent - Main entry point

This agent handles claim-related operations for the HealthLinc ecosystem:
- Submit new insurance claims
- Verify claim status 
- Dispute denied claims
- Check claim eligibility
"""

import os
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("claimlinc")

# Initialize FastAPI app
app = FastAPI(
    title="ClaimLinc Agent",
    description="LINC Agent for handling healthcare claims processing",
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

# Models
class ClaimData(BaseModel):
    patient_id: str
    provider_id: str
    service_date: str
    diagnosis_codes: List[str]
    procedure_codes: List[str]
    total_amount: float
    insurance_id: str
    notes: Optional[str] = None


class ClaimVerifyData(BaseModel):
    claim_id: str


class ClaimDisputeData(BaseModel):
    claim_id: str
    reason: str
    supporting_documents: Optional[List[str]] = None
    appeal_text: Optional[str] = None


class ClaimCheckData(BaseModel):
    patient_id: str
    procedure_codes: List[str]
    diagnosis_codes: List[str]
    insurance_id: str


class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


# Helper functions
def generate_claim_id() -> str:
    """Generate a unique claim ID with HL prefix"""
    return f"HL-{uuid.uuid4().hex[:8].upper()}"


def log_request(task: str, data: Dict[str, Any], request_id: str) -> None:
    """Log the incoming request details"""
    logger.info(f"Task: {task}, Request ID: {request_id}")
    logger.debug(f"Data: {json.dumps(data)}")


# API Routes
@app.post("/agents/claim")
async def handle_claim_request(request: Request) -> JSONResponse:
    """Main entry point for all claim-related tasks"""
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
        if task == "submit":
            claim_data = ClaimData(**data)
            return await submit_claim(claim_data, request_id)
            
        elif task == "verify":
            verify_data = ClaimVerifyData(**data)
            return await verify_claim(verify_data, request_id)
            
        elif task == "dispute":
            dispute_data = ClaimDisputeData(**data)
            return await dispute_claim(dispute_data, request_id)
            
        elif task == "check":
            check_data = ClaimCheckData(**data)
            return await check_eligibility(check_data, request_id)
            
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
async def submit_claim(claim_data: ClaimData, request_id: str) -> JSONResponse:
    """Handle new claim submission"""
    try:
        # Generate a claim ID
        claim_id = generate_claim_id()
        
        # In a real implementation, this would:
        # 1. Validate the claim data against insurance rules
        # 2. Transform to X12 837 format or FHIR Claim
        # 3. Submit to clearinghouse or payer
        # 4. Store in database
        
        # For demo purposes, we'll simulate a successful submission
        return JSONResponse(
            content={
                "status": "success",
                "message": "Claim submitted successfully",
                "data": {
                    "claim_id": claim_id,
                    "status": "pending",
                    "submitted_at": datetime.now().isoformat(),
                    "expected_response": "7-10 business days"
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error submitting claim: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to submit claim: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def verify_claim(verify_data: ClaimVerifyData, request_id: str) -> JSONResponse:
    """Check status of an existing claim"""
    try:
        # In a real implementation, this would:
        # 1. Query the claim status from database
        # 2. If needed, make external API call to clearinghouse/payer
        
        # For demo, simulate random status
        import random
        statuses = ["pending", "processed", "paid", "denied", "appealed"]
        status = random.choice(statuses)
        
        status_details = {
            "pending": {"message": "Claim is pending review", "eta_days": 5},
            "processed": {"message": "Claim processed on 2025-05-10", "amount_approved": 420.50},
            "paid": {"message": "Payment issued on 2025-05-11", "payment_amount": 385.75, "check_number": "EFT-38291"},
            "denied": {"message": "Claim denied due to missing information", "denial_code": "A382", "appeal_deadline": "2025-05-30"},
            "appealed": {"message": "Appeal in progress", "submitted_on": "2025-05-05"}
        }
        
        return JSONResponse(
            content={
                "status": "success",
                "message": f"Claim status retrieved",
                "data": {
                    "claim_id": verify_data.claim_id,
                    "status": status,
                    "details": status_details[status],
                    "last_updated": datetime.now().isoformat()
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error verifying claim: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to verify claim: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def dispute_claim(dispute_data: ClaimDisputeData, request_id: str) -> JSONResponse:
    """Handle dispute of denied claim"""
    try:
        # In a real implementation, this would:
        # 1. Validate the dispute reason against allowed appeal reasons
        # 2. Upload any supporting documents to secure storage
        # 3. Submit appeal to payer
        # 4. Update claim status in database
        
        # For demo purposes, we'll simulate a successful appeal submission
        return JSONResponse(
            content={
                "status": "success",
                "message": "Claim dispute submitted successfully",
                "data": {
                    "claim_id": dispute_data.claim_id,
                    "dispute_id": f"DSP-{uuid.uuid4().hex[:6].upper()}",
                    "status": "appeal_submitted",
                    "submitted_at": datetime.now().isoformat(),
                    "expected_response": "14-21 business days"
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error disputing claim: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to submit dispute: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def check_eligibility(check_data: ClaimCheckData, request_id: str) -> JSONResponse:
    """Check if a procedure is covered for a patient"""
    try:
        # In a real implementation, this would:
        # 1. Query insurance eligibility via X12 270/271 transaction
        # 2. Check benefits for specific procedure codes
        # 3. Validate medical necessity based on diagnosis codes
        
        # For demo purposes, generate plausible coverage data
        import random
        procedures_covered = {}
        for code in check_data.procedure_codes:
            covered = random.random() > 0.2  # 80% chance of being covered
            if covered:
                copay = random.choice([0, 20, 35, 50, 75])
                coinsurance = random.choice([0, 10, 20, 30])
                procedures_covered[code] = {
                    "covered": True,
                    "requires_authorization": random.choice([True, False]),
                    "copay": copay,
                    "coinsurance_percentage": coinsurance,
                    "notes": None if copay == 0 and coinsurance == 0 else "Standard cost sharing applies"
                }
            else:
                procedures_covered[code] = {
                    "covered": False,
                    "reason": random.choice([
                        "Excluded from plan",
                        "Experimental/investigational",
                        "Not medically necessary for diagnosis",
                        "Annual limit exceeded"
                    ])
                }
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Eligibility check completed",
                "data": {
                    "patient_id": check_data.patient_id,
                    "insurance_id": check_data.insurance_id,
                    "insurance_status": "Active",
                    "plan_name": "Premium Health PPO",
                    "procedures": procedures_covered,
                    "deductible_met": random.choice([True, False]),
                    "check_date": datetime.now().isoformat()
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error checking eligibility: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to check eligibility: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ClaimLinc", "timestamp": datetime.now().isoformat()}


# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
