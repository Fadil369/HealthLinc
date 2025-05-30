from fastapi import FastAPI, Depends, HTTPException, Body, status, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any, Optional
import httpx
import os
import json
import uvicorn
from urllib.parse import urljoin
import logging
from datetime import datetime
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.getLevelName(os.environ.get("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("reviewerlinc")

app = FastAPI(title="ReviewerLinc Module - Fee Schedule Management")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
PORT = int(os.environ.get("PORT", 3007))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
FHIR_SERVER_URL = os.environ.get("FHIR_SERVER_URL", "http://fhir-gateway:8000/fhir")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://authlinc:3003")

# Data models
class FeeScheduleItem(BaseModel):
    procedure_code: str
    description: str
    fee: float
    effective_date: str
    end_date: Optional[str] = None
    payer_id: str
    payer_name: Optional[str] = None
    notes: Optional[str] = None

class FeeScheduleUpdate(BaseModel):
    items: List[FeeScheduleItem]
    update_reason: str
    update_date: str = datetime.now().isoformat()
    updated_by: Optional[str] = None

class ContractTerm(BaseModel):
    payer_id: str
    payer_name: str
    contract_id: str
    term_id: str
    description: str
    value: Any
    effective_date: str
    end_date: Optional[str] = None

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
    return {"status": "healthy", "service": "reviewerlinc"}

# API endpoints
@app.get("/fee-schedules")
async def get_fee_schedules(
    payer_id: Optional[str] = None,
    procedure_code: Optional[str] = None,
    effective_date: Optional[str] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get fee schedules with optional filtering
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    # Load mock data from file
    try:
        with open("data/fee_schedules.json", "r") as f:
            fee_schedules = json.load(f)
    except FileNotFoundError:
        fee_schedules = []
    
    # Apply filters
    if payer_id:
        fee_schedules = [fs for fs in fee_schedules if fs.get("payer_id") == payer_id]
    
    if procedure_code:
        filtered_schedules = []
        for schedule in fee_schedules:
            filtered_items = [item for item in schedule.get("items", []) if item.get("procedure_code") == procedure_code]
            if filtered_items:
                filtered_schedule = schedule.copy()
                filtered_schedule["items"] = filtered_items
                filtered_schedules.append(filtered_schedule)
        fee_schedules = filtered_schedules
    
    if effective_date:
        date_obj = datetime.fromisoformat(effective_date.replace("Z", "+00:00"))
        filtered_schedules = []
        for schedule in fee_schedules:
            filtered_items = []
            for item in schedule.get("items", []):
                item_start = datetime.fromisoformat(item.get("effective_date").replace("Z", "+00:00"))
                item_end = None
                if item.get("end_date"):
                    item_end = datetime.fromisoformat(item.get("end_date").replace("Z", "+00:00"))
                
                if item_start <= date_obj and (not item_end or date_obj <= item_end):
                    filtered_items.append(item)
            
            if filtered_items:
                filtered_schedule = schedule.copy()
                filtered_schedule["items"] = filtered_items
                filtered_schedules.append(filtered_schedule)
        fee_schedules = filtered_schedules
    
    return {"fee_schedules": fee_schedules}

@app.get("/fee-schedules/{payer_id}")
async def get_payer_fee_schedule(
    payer_id: str,
    user_data: Dict = Depends(validate_token)
):
    """
    Get fee schedule for a specific payer
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    try:
        with open("data/fee_schedules.json", "r") as f:
            fee_schedules = json.load(f)
            for schedule in fee_schedules:
                if schedule.get("payer_id") == payer_id:
                    return schedule
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.error(f"Error retrieving fee schedule: {str(e)}")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Fee schedule for payer ID {payer_id} not found"
    )

@app.put("/fee-schedules/{payer_id}")
async def update_fee_schedule(
    payer_id: str,
    fee_update: FeeScheduleUpdate,
    user_data: Dict = Depends(validate_token)
):
    """
    Update a fee schedule
    """
    # In a real implementation, this would update a database
    # This is a mock implementation for demonstration
    
    try:
        with open("data/fee_schedules.json", "r") as f:
            fee_schedules = json.load(f)
        
        schedule_updated = False
        for i, schedule in enumerate(fee_schedules):
            if schedule.get("payer_id") == payer_id:
                # Update existing schedule
                fee_schedules[i]["items"] = [item.dict() for item in fee_update.items]
                fee_schedules[i]["last_updated"] = fee_update.update_date
                fee_schedules[i]["updated_by"] = fee_update.updated_by or user_data.get("email")
                fee_schedules[i]["update_reason"] = fee_update.update_reason
                schedule_updated = True
                break
        
        if not schedule_updated:
            # Create new schedule
            new_schedule = {
                "payer_id": payer_id,
                "payer_name": fee_update.items[0].payer_name if fee_update.items else "Unknown Payer",
                "items": [item.dict() for item in fee_update.items],
                "last_updated": fee_update.update_date,
                "updated_by": fee_update.updated_by or user_data.get("email"),
                "update_reason": fee_update.update_reason
            }
            fee_schedules.append(new_schedule)
        
        # Save updated data
        with open("data/fee_schedules.json", "w") as f:
            json.dump(fee_schedules, f, indent=2)
        
        return {"status": "success", "message": f"Fee schedule for payer ID {payer_id} updated successfully"}
    
    except Exception as e:
        logger.error(f"Error updating fee schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating fee schedule: {str(e)}"
        )

@app.get("/contracts")
async def get_contracts(
    payer_id: Optional[str] = None,
    status: Optional[str] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get payer contracts
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    try:
        with open("data/contracts.json", "r") as f:
            contracts = json.load(f)
    except FileNotFoundError:
        contracts = []
    
    # Apply filters
    if payer_id:
        contracts = [c for c in contracts if c.get("payer_id") == payer_id]
    
    if status:
        contracts = [c for c in contracts if c.get("status") == status]
    
    return {"contracts": contracts}

@app.get("/contracts/{contract_id}")
async def get_contract_details(
    contract_id: str,
    user_data: Dict = Depends(validate_token)
):
    """
    Get details for a specific contract
    """
    # In a real implementation, this would query a database
    # This is a mock implementation for demonstration
    
    try:
        with open("data/contracts.json", "r") as f:
            contracts = json.load(f)
            for contract in contracts:
                if contract.get("id") == contract_id:
                    return contract
    except FileNotFoundError:
        pass
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Contract with ID {contract_id} not found"
    )

@app.post("/contracts/{contract_id}/terms")
async def add_contract_term(
    contract_id: str,
    term: ContractTerm,
    user_data: Dict = Depends(validate_token)
):
    """
    Add a term to a contract
    """
    # In a real implementation, this would update a database
    # This is a mock implementation for demonstration
    
    try:
        with open("data/contracts.json", "r") as f:
            contracts = json.load(f)
        
        contract_found = False
        for i, contract in enumerate(contracts):
            if contract.get("id") == contract_id:
                # Add term to contract
                if "terms" not in contract:
                    contracts[i]["terms"] = []
                
                contracts[i]["terms"].append(term.dict())
                contract_found = True
                break
        
        if not contract_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contract with ID {contract_id} not found"
            )
        
        # Save updated data
        with open("data/contracts.json", "w") as f:
            json.dump(contracts, f, indent=2)
        
        return {"status": "success", "message": f"Term added to contract {contract_id} successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding contract term: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding contract term: {str(e)}"
        )

@app.get("/analysis/fee-comparison")
async def analyze_fee_comparison(
    payer_id: Optional[str] = None,
    benchmark: Optional[str] = Query("medicare", enum=["medicare", "average", "top_payer"]),
    user_data: Dict = Depends(validate_token)
):
    """
    Analyze and compare fee schedules against benchmarks
    """
    # In a real implementation, this would perform actual analysis
    # This is a mock implementation for demonstration
    
    analysis_result = {
        "benchmark_type": benchmark,
        "analysis_date": datetime.now().isoformat(),
        "overall_comparison": {
            "average_difference_percentage": -5.2,
            "highest_difference_percentage": 15.8,
            "lowest_difference_percentage": -25.3,
        },
        "potential_revenue_impact": {
            "monthly": 12500.00,
            "annual": 150000.00,
            "notes": "Based on current procedure volume and payer mix"
        },
        "procedure_analysis": [
            {
                "procedure_code": "99213",
                "description": "Office/outpatient visit est",
                "your_fee": 78.50,
                "benchmark_fee": 82.53,
                "difference_percentage": -4.9,
                "volume_last_month": 320,
                "revenue_impact": -1289.60
            },
            {
                "procedure_code": "99214",
                "description": "Office/outpatient visit est",
                "your_fee": 110.00,
                "benchmark_fee": 120.15,
                "difference_percentage": -8.4,
                "volume_last_month": 150,
                "revenue_impact": -1522.50
            },
            {
                "procedure_code": "99396",
                "description": "Preventive visit est, 40-64 years",
                "your_fee": 130.00,
                "benchmark_fee": 125.42,
                "difference_percentage": 3.7,
                "volume_last_month": 45,
                "revenue_impact": 206.10
            }
        ],
        "payer_analysis": [
            {
                "payer_id": "BCBS001",
                "payer_name": "BlueCross BlueShield",
                "average_difference_percentage": -2.8,
                "contract_renewal_date": "2025-09-15",
                "negotiation_opportunity": "Medium"
            },
            {
                "payer_id": "AETNA001",
                "payer_name": "Aetna",
                "average_difference_percentage": -7.5,
                "contract_renewal_date": "2025-06-30",
                "negotiation_opportunity": "High"
            },
            {
                "payer_id": "MCARE001",
                "payer_name": "Medicare",
                "average_difference_percentage": 0.0,
                "contract_renewal_date": "N/A",
                "negotiation_opportunity": "None"
            }
        ],
        "recommendations": [
            "Focus negotiation efforts on Aetna with renewal approaching in 45 days",
            "Consider raising fees for preventive services which are currently above benchmark",
            "Review high-volume E&M codes which are significantly below benchmark"
        ]
    }
    
    if payer_id:
        # Filter analysis to specific payer
        filtered_payer = None
        for payer in analysis_result["payer_analysis"]:
            if payer["payer_id"] == payer_id:
                filtered_payer = payer
                break
        
        if filtered_payer:
            analysis_result["payer_analysis"] = [filtered_payer]
            analysis_result["overall_comparison"] = {
                "average_difference_percentage": filtered_payer["average_difference_percentage"],
                "highest_difference_percentage": filtered_payer["average_difference_percentage"] + 5,
                "lowest_difference_percentage": filtered_payer["average_difference_percentage"] - 10,
            }
            
            # Adjust recommendations for specific payer
            if filtered_payer["negotiation_opportunity"] == "High":
                analysis_result["recommendations"] = [
                    f"Prioritize {filtered_payer['payer_name']} contract negotiations",
                    f"Prepare data showing volume and quality metrics for {filtered_payer['payer_name']}",
                    "Request fee increases for codes that are significantly below benchmark"
                ]
            elif filtered_payer["negotiation_opportunity"] == "Medium":
                analysis_result["recommendations"] = [
                    f"Schedule preliminary discussions with {filtered_payer['payer_name']} representative",
                    "Focus on high-volume procedures for targeted increases",
                    "Consider value-based incentives as negotiation leverage"
                ]
            else:
                analysis_result["recommendations"] = [
                    f"No immediate action needed for {filtered_payer['payer_name']}",
                    "Monitor changes in fee schedule and procedure volume",
                    "Prepare for future negotiations by collecting outcomes data"
                ]
        else:
            analysis_result["payer_analysis"] = []
            analysis_result["recommendations"] = [f"No data available for payer ID {payer_id}"]
    
    return analysis_result

# Main execution for direct running
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True if ENVIRONMENT == "development" else False)
