from fastapi import FastAPI, Depends, HTTPException, Body, status, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any, Optional
import httpx
import os
import json
import uvicorn
from urllib.parse import urljoin
import logging
import hashlib
from datetime import datetime
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.getLevelName(os.environ.get("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("claimtrackerlinc")

app = FastAPI(title="ClaimTrackerLinc Agent - Claim Tracking with Duplicate Detection")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
PORT = int(os.environ.get("PORT", 3008))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
FHIR_SERVER_URL = os.environ.get("FHIR_SERVER_URL", "http://fhir-gateway:8000/fhir")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://authlinc:3003")

# Data models
class ClaimIdentifier(BaseModel):
    claim_id: str
    payer_id: Optional[str] = None
    patient_id: str
    provider_id: str
    date_of_service: str

class Claim(BaseModel):
    claim_id: str
    patient_id: str
    patient_name: str
    provider_id: str
    provider_name: str
    date_of_service: str
    payer_id: Optional[str] = None
    payer_name: Optional[str] = None
    total_charge: float
    procedures: List[Dict[str, Any]]
    diagnoses: List[Dict[str, Any]]
    submission_date: Optional[str] = None
    status: str = "draft"
    hash_signature: Optional[str] = None

class TrackedClaim(BaseModel):
    claim: Claim
    tracking_events: List[Dict[str, Any]] = []
    duplicate_check_result: Optional[Dict[str, Any]] = None
    validation_results: Optional[Dict[str, Any]] = None
    
class ClaimStatusUpdate(BaseModel):
    claim_id: str
    status: str
    notes: Optional[str] = None
    updated_by: Optional[str] = None

# Authentication middleware
async def validate_token(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    try:
        token = auth_header.split(" ")[1]
        async with httpx.AsyncClient() as client:
            response = await client.post(
                urljoin(AUTH_SERVICE_URL, "/auth/validate"),
                json={"token": token},
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                )
                
            return response.json()
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "claimtrackerlinc"}

# API endpoints
@app.post("/claims/track")
async def track_claim(
    claim: Claim,
    user_data: Dict = Depends(validate_token)
):
    """
    Track a new claim and perform duplicate detection
    """
    # Generate hash signature for duplicate detection
    hash_input = f"{claim.patient_id}|{claim.date_of_service}|{claim.total_charge}"
    for proc in claim.procedures:
        hash_input += f"|{proc.get('code')}"
    for diag in claim.diagnoses:
        hash_input += f"|{diag.get('code')}"
    
    claim.hash_signature = hashlib.md5(hash_input.encode()).hexdigest()
    
    # Check for duplicates
    duplicate_check = await check_for_duplicates(claim)
    
    # Create tracking record
    tracked_claim = TrackedClaim(
        claim=claim,
        tracking_events=[
            {
                "event_type": "created",
                "timestamp": datetime.now().isoformat(),
                "user_id": user_data.get("sub", "unknown"),
                "notes": "Initial claim tracking started"
            }
        ],
        duplicate_check_result=duplicate_check
    )
    
    # In a real implementation, this would save to a database
    # For now, we'll save to a local file for demonstration
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
        else:
            claims_data = []
        
        # Convert to dict for JSON serialization
        claims_data.append(tracked_claim.dict())
        
        with open(claims_file, "w") as f:
            json.dump(claims_data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving claim tracking data: {str(e)}")
    
    return {
        "tracking_id": claim.claim_id,
        "status": "tracked",
        "duplicate_check": duplicate_check
    }

async def check_for_duplicates(claim: Claim) -> Dict[str, Any]:
    """
    Check for duplicate claims
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
        else:
            return {"is_duplicate": False, "duplicate_claims": []}
        
        # Find potential duplicates
        potential_duplicates = []
        exact_match = False
        
        for tracked_claim in claims_data:
            existing_claim = tracked_claim["claim"]
            
            # Check for exact hash match
            if existing_claim.get("hash_signature") == claim.hash_signature and existing_claim.get("claim_id") != claim.claim_id:
                exact_match = True
                potential_duplicates.append({
                    "claim_id": existing_claim.get("claim_id"),
                    "patient_id": existing_claim.get("patient_id"),
                    "date_of_service": existing_claim.get("date_of_service"),
                    "match_type": "exact",
                    "similarity": 1.0
                })
                continue
            
            # Check for potential duplicates (same patient, DOS, similar procedures)
            if (existing_claim.get("patient_id") == claim.patient_id and
                existing_claim.get("date_of_service") == claim.date_of_service and
                existing_claim.get("claim_id") != claim.claim_id):
                
                # Simple similarity calculation based on procedures
                existing_procs = set(p.get("code") for p in existing_claim.get("procedures", []))
                new_procs = set(p.get("code") for p in claim.procedures)
                
                if existing_procs and new_procs:
                    intersection = existing_procs.intersection(new_procs)
                    union = existing_procs.union(new_procs)
                    similarity = len(intersection) / len(union)
                    
                    if similarity > 0.5:  # Threshold for potential duplicate
                        potential_duplicates.append({
                            "claim_id": existing_claim.get("claim_id"),
                            "patient_id": existing_claim.get("patient_id"),
                            "date_of_service": existing_claim.get("date_of_service"),
                            "match_type": "potential",
                            "similarity": similarity
                        })
        
        return {
            "is_duplicate": exact_match,
            "duplicate_claims": potential_duplicates,
            "needs_review": len(potential_duplicates) > 0 and not exact_match
        }
    except Exception as e:
        logger.error(f"Error checking for duplicates: {str(e)}")
        return {"is_duplicate": False, "duplicate_claims": [], "error": str(e)}

@app.get("/claims")
async def get_claims(
    patient_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    has_duplicate: Optional[bool] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get tracked claims with filtering options
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
        else:
            return {"claims": []}
        
        # Apply filters
        filtered_claims = claims_data
        
        if patient_id:
            filtered_claims = [c for c in filtered_claims if c["claim"]["patient_id"] == patient_id]
        
        if provider_id:
            filtered_claims = [c for c in filtered_claims if c["claim"]["provider_id"] == provider_id]
        
        if status:
            filtered_claims = [c for c in filtered_claims if c["claim"]["status"] == status]
        
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            filtered_claims = [
                c for c in filtered_claims if 
                datetime.fromisoformat(c["claim"]["date_of_service"].replace("Z", "+00:00")) >= date_from_obj
            ]
        
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            filtered_claims = [
                c for c in filtered_claims if 
                datetime.fromisoformat(c["claim"]["date_of_service"].replace("Z", "+00:00")) <= date_to_obj
            ]
        
        if has_duplicate is not None:
            filtered_claims = [
                c for c in filtered_claims if 
                (c.get("duplicate_check_result", {}).get("is_duplicate", False) == has_duplicate)
            ]
        
        return {"claims": filtered_claims}
    except Exception as e:
        logger.error(f"Error retrieving claims: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving claims: {str(e)}"
        )

@app.get("/claims/{claim_id}")
async def get_claim(
    claim_id: str,
    user_data: Dict = Depends(validate_token)
):
    """
    Get details for a specific claim
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
            
            for claim in claims_data:
                if claim["claim"]["claim_id"] == claim_id:
                    return claim
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with ID {claim_id} not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving claim: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving claim: {str(e)}"
        )

@app.post("/claims/{claim_id}/status")
async def update_claim_status(
    claim_id: str,
    status_update: ClaimStatusUpdate,
    user_data: Dict = Depends(validate_token)
):
    """
    Update the status of a claim
    """
    # In a real implementation, this would update a database
    # This is a mock implementation for demonstration
    
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
            
            claim_updated = False
            for i, claim in enumerate(claims_data):
                if claim["claim"]["claim_id"] == claim_id:
                    # Update claim status
                    claims_data[i]["claim"]["status"] = status_update.status
                    
                    # Add tracking event
                    claims_data[i]["tracking_events"].append({
                        "event_type": "status_update",
                        "timestamp": datetime.now().isoformat(),
                        "user_id": status_update.updated_by or user_data.get("sub", "unknown"),
                        "old_status": claim["claim"]["status"],
                        "new_status": status_update.status,
                        "notes": status_update.notes
                    })
                    
                    claim_updated = True
                    break
            
            if not claim_updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Claim with ID {claim_id} not found"
                )
            
            with open(claims_file, "w") as f:
                json.dump(claims_data, f, indent=2)
            
            return {
                "status": "updated",
                "claim_id": claim_id,
                "new_status": status_update.status
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim with ID {claim_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating claim status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating claim status: {str(e)}"
        )

@app.get("/analytics/duplicates")
async def analyze_duplicates(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get analytics on duplicate claims
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    claims_file = "data/tracked_claims.json"
    try:
        if os.path.exists(claims_file):
            with open(claims_file, "r") as f:
                claims_data = json.load(f)
        else:
            claims_data = []
        
        # Filter by date if provided
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            claims_data = [
                c for c in claims_data if 
                datetime.fromisoformat(c["claim"]["date_of_service"].replace("Z", "+00:00")) >= date_from_obj
            ]
        
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            claims_data = [
                c for c in claims_data if 
                datetime.fromisoformat(c["claim"]["date_of_service"].replace("Z", "+00:00")) <= date_to_obj
            ]
        
        # Calculate duplicate statistics
        total_claims = len(claims_data)
        exact_duplicates = sum(1 for c in claims_data if c.get("duplicate_check_result", {}).get("is_duplicate", False))
        potential_duplicates = sum(
            1 for c in claims_data if 
            not c.get("duplicate_check_result", {}).get("is_duplicate", False) and 
            len(c.get("duplicate_check_result", {}).get("duplicate_claims", [])) > 0
        )
        
        # Calculate potential financial impact
        financial_impact = sum(
            c["claim"]["total_charge"] for c in claims_data 
            if c.get("duplicate_check_result", {}).get("is_duplicate", False)
        )
        
        # Group duplicates by provider
        provider_duplicates = {}
        for claim in claims_data:
            if claim.get("duplicate_check_result", {}).get("is_duplicate", False) or len(claim.get("duplicate_check_result", {}).get("duplicate_claims", [])) > 0:
                provider_id = claim["claim"]["provider_id"]
                provider_name = claim["claim"]["provider_name"]
                
                if provider_id not in provider_duplicates:
                    provider_duplicates[provider_id] = {
                        "provider_id": provider_id,
                        "provider_name": provider_name,
                        "duplicate_count": 0,
                        "total_charge": 0
                    }
                
                provider_duplicates[provider_id]["duplicate_count"] += 1
                provider_duplicates[provider_id]["total_charge"] += claim["claim"]["total_charge"]
        
        return {
            "total_claims": total_claims,
            "exact_duplicates": exact_duplicates,
            "potential_duplicates": potential_duplicates,
            "duplicate_percentage": (exact_duplicates + potential_duplicates) / total_claims * 100 if total_claims > 0 else 0,
            "financial_impact": financial_impact,
            "provider_analysis": list(provider_duplicates.values())
        }
    except Exception as e:
        logger.error(f"Error analyzing duplicates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing duplicates: {str(e)}"
        )

# Main execution for direct running
if __name__ == "__main__":
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True if ENVIRONMENT == "development" else False)
