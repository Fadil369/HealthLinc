"""
NphiesLinc Agent - Main entry point

This agent handles NPHIES (National Platform for Health Information Exchange Services) 
integration operations for the HealthLinc ecosystem:
- Process NPHIES FHIR bundles
- Route messages to appropriate agents
- Handle NPHIES-specific transformations
- Manage bidirectional communication with NPHIES
"""

import os
import json
import logging
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("nphieslinc")

# Initialize FastAPI app
app = FastAPI(
    title="NphiesLinc Agent",
    description="LINC Agent for handling NPHIES integration operations",
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
class NphiesBundleData(BaseModel):
    bundle: Dict[str, Any]
    message_type: str
    priority: Optional[str] = "normal"
    correlation_id: Optional[str] = None


class NphiesTransformData(BaseModel):
    source_format: str  # "healthlinc" or "nphies"
    target_format: str  # "healthlinc" or "nphies"
    data: Dict[str, Any]
    message_type: Optional[str] = None


class NphiesRouteData(BaseModel):
    message_type: str
    extracted_data: Dict[str, Any]
    target_agent: Optional[str] = None


class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


# Configuration
NPHIES_INTEGRATION_URL = os.environ.get("NPHIES_INTEGRATION_URL", "http://localhost:3010")
AGENT_ENDPOINTS = {
    "authlinc": os.environ.get("AUTHLINC_URL", "http://localhost:3003"),
    "claimlinc": os.environ.get("CLAIMLINC_URL", "http://localhost:3001"),
    "notifylinc": os.environ.get("NOTIFYLINC_URL", "http://localhost:3006"),
    "matchlinc": os.environ.get("MATCHLINC_URL", "http://localhost:3004"),
    "recordlinc": os.environ.get("RECORDLINC_URL", "http://localhost:3007"),
    "doculinc": os.environ.get("DOCULINC_URL", "http://localhost:3005")
}

# NPHIES Message Type to Agent Mapping
MESSAGE_AGENT_MAPPING = {
    "eligibility-request": "authlinc",
    "eligibility-response": "authlinc", 
    "priorauth-request": "claimlinc",
    "priorauth-response": "claimlinc",
    "claim-request": "claimlinc",
    "claim-response": "claimlinc",
    "communication-request": "notifylinc",
    "communication-response": "notifylinc",
    "prescriber-request": "matchlinc",
    "prescriber-response": "matchlinc",
    "payment-notice": "recordlinc",
    "payment-reconciliation": "recordlinc"
}


# Helper functions
def generate_correlation_id() -> str:
    """Generate a unique correlation ID for tracking"""
    return f"NPHIES-{uuid.uuid4().hex[:8].upper()}"


def log_request(task: str, data: Dict[str, Any], request_id: str) -> None:
    """Log the incoming request details"""
    logger.info(f"Task: {task}, Request ID: {request_id}")
    logger.debug(f"Data: {json.dumps(data, default=str)}")


async def forward_to_nphies_integration(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Forward request to NPHIES integration service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{NPHIES_INTEGRATION_URL}{endpoint}",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"NPHIES integration error: {response.text}"
                )
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"NPHIES integration service unavailable: {str(e)}"
            )


async def forward_to_agent(agent_name: str, task: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Forward request to appropriate HealthLinc agent"""
    if agent_name not in AGENT_ENDPOINTS:
        raise ValueError(f"Unknown agent: {agent_name}")
    
    agent_url = AGENT_ENDPOINTS[agent_name]
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{agent_url}/agents/{agent_name.replace('linc', '')}",
                json=data,
                headers={
                    "Content-Type": "application/json",
                    "X-MCP-Task": task,
                    "X-Request-ID": str(uuid.uuid4())
                },
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Agent {agent_name} error: {response.text}"
                )
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Agent {agent_name} unavailable: {str(e)}"
            )


# API Routes
@app.post("/agents/nphies")
async def handle_nphies_request(request: Request) -> JSONResponse:
    """Main entry point for all NPHIES-related tasks"""
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
        if task == "process_bundle":
            bundle_data = NphiesBundleData(**data)
            return await process_nphies_bundle(bundle_data, request_id)
            
        elif task == "transform":
            transform_data = NphiesTransformData(**data)
            return await transform_data_format(transform_data, request_id)
            
        elif task == "route":
            route_data = NphiesRouteData(**data)
            return await route_to_agent(route_data, request_id)
            
        elif task == "extract":
            return await extract_nphies_data(data, request_id)
            
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
async def process_nphies_bundle(bundle_data: NphiesBundleData, request_id: str) -> JSONResponse:
    """Process NPHIES FHIR Bundle"""
    try:
        correlation_id = bundle_data.correlation_id or generate_correlation_id()
        
        # Extract data using NPHIES integration service
        extracted_result = await forward_to_nphies_integration(
            "/nphies/extract",
            {
                "resource_type": "Bundle",
                "id": bundle_data.bundle.get("id", str(uuid.uuid4())),
                "entry": bundle_data.bundle.get("entry", []),
                "type": bundle_data.bundle.get("type", "message"),
                "timestamp": bundle_data.bundle.get("timestamp", datetime.now().isoformat())
            }
        )
        
        if extracted_result.get("status") != "success":
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Failed to extract bundle data",
                    "details": extracted_result
                }
            )
        
        extracted_data = extracted_result["data"]
        message_type = extracted_data.get("message_type")
        
        # Route to appropriate agent
        target_agent = MESSAGE_AGENT_MAPPING.get(message_type, "recordlinc")
        
        # Determine the appropriate task for the target agent
        agent_task_mapping = {
            "eligibility-request": "check",
            "eligibility-response": "validate", 
            "priorauth-request": "submit",
            "priorauth-response": "verify",
            "claim-request": "submit",
            "claim-response": "verify",
            "communication-request": "send",
            "prescriber-request": "validate",
            "payment-notice": "create",
            "payment-reconciliation": "create"
        }
        
        agent_task = agent_task_mapping.get(message_type, "process")
        
        # Transform data for the target agent
        agent_data = transform_for_agent(target_agent, extracted_data)
        
        # Forward to agent
        try:
            agent_result = await forward_to_agent(target_agent, agent_task, agent_data)
            
            return JSONResponse(
                content={
                    "status": "success",
                    "message": f"Bundle processed and forwarded to {target_agent}",
                    "data": {
                        "correlation_id": correlation_id,
                        "message_type": message_type,
                        "target_agent": target_agent,
                        "agent_task": agent_task,
                        "agent_result": agent_result,
                        "bundle_id": bundle_data.bundle.get("id"),
                        "processed_at": datetime.now().isoformat()
                    },
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
            
        except HTTPException as e:
            # If agent forwarding fails, still return success for bundle processing
            logger.warning(f"Agent forwarding failed: {str(e)}")
            return JSONResponse(
                content={
                    "status": "partial_success",
                    "message": f"Bundle processed but agent {target_agent} forwarding failed",
                    "data": {
                        "correlation_id": correlation_id,
                        "message_type": message_type,
                        "target_agent": target_agent,
                        "error": str(e),
                        "bundle_id": bundle_data.bundle.get("id")
                    },
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
        
    except Exception as e:
        logger.error(f"Error processing NPHIES bundle: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to process bundle: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def transform_data_format(transform_data: NphiesTransformData, request_id: str) -> JSONResponse:
    """Transform data between NPHIES and HealthLinc formats"""
    try:
        if transform_data.source_format == "nphies" and transform_data.target_format == "healthlinc":
            # Use NPHIES integration service to extract and transform
            result = await forward_to_nphies_integration(
                f"/nphies/transform/{transform_data.message_type}",
                transform_data.data
            )
            
        elif transform_data.source_format == "healthlinc" and transform_data.target_format == "nphies":
            # Transform HealthLinc format to NPHIES Bundle
            result = transform_healthlinc_to_nphies(transform_data.data, transform_data.message_type)
            
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": f"Unsupported transformation: {transform_data.source_format} to {transform_data.target_format}"
                }
            )
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Data transformation completed",
                "data": result,
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
        
    except Exception as e:
        logger.error(f"Error transforming data: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to transform data: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def route_to_agent(route_data: NphiesRouteData, request_id: str) -> JSONResponse:
    """Route extracted NPHIES data to appropriate agent"""
    try:
        target_agent = route_data.target_agent or MESSAGE_AGENT_MAPPING.get(
            route_data.message_type, "recordlinc"
        )
        
        # Transform data for the target agent
        agent_data = transform_for_agent(target_agent, route_data.extracted_data)
        
        # Determine task
        agent_task = get_agent_task(target_agent, route_data.message_type)
        
        # Forward to agent
        agent_result = await forward_to_agent(target_agent, agent_task, agent_data)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": f"Data routed to {target_agent}",
                "data": {
                    "target_agent": target_agent,
                    "agent_task": agent_task,
                    "result": agent_result
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
        
    except Exception as e:
        logger.error(f"Error routing to agent: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to route data: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def extract_nphies_data(data: Dict[str, Any], request_id: str) -> JSONResponse:
    """Extract data from NPHIES bundle"""
    try:
        result = await forward_to_nphies_integration("/nphies/extract", data)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "NPHIES data extracted",
                "data": result,
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
        
    except Exception as e:
        logger.error(f"Error extracting NPHIES data: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to extract data: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


# Helper functions
def transform_for_agent(agent_name: str, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform extracted NPHIES data for specific agent"""
    if agent_name == "claimlinc":
        # Transform for claim processing
        if extracted_data.get("claims"):
            claim = extracted_data["claims"][0]
            return {
                "patient_id": claim.get("patient", {}).get("reference", "").replace("Patient/", ""),
                "provider_id": claim.get("provider", {}).get("reference", "").replace("Organization/", ""),
                "service_date": claim.get("created"),
                "diagnosis_codes": [d.get("diagnosisCodeableConcept", {}).get("coding", [{}])[0].get("code", "") 
                                  for d in claim.get("diagnosis", [])],
                "procedure_codes": [item.get("productOrService", {}).get("coding", [{}])[0].get("code", "")
                                  for item in claim.get("items", [])],
                "total_amount": claim.get("total", {}).get("value", 0),
                "insurance_id": claim.get("insurance", [{}])[0].get("coverage", {}).get("reference", "").replace("Coverage/", ""),
                "notes": f"NPHIES Bundle: {extracted_data.get('message_header', {}).get('id', 'Unknown')}"
            }
    
    elif agent_name == "authlinc":
        # Transform for eligibility checking
        if extracted_data.get("eligibility_requests"):
            eligibility = extracted_data["eligibility_requests"][0]
            return {
                "patient_id": eligibility.get("patient", {}).get("reference", "").replace("Patient/", ""),
                "procedure_codes": [],  # Extract from eligibility request if available
                "diagnosis_codes": [],
                "insurance_id": eligibility.get("insurance", [{}])[0].get("coverage", {}).get("reference", "").replace("Coverage/", "")
            }
    
    elif agent_name == "notifylinc":
        # Transform for communication
        if extracted_data.get("communications"):
            comm = extracted_data["communications"][0]
            return {
                "recipient": comm.get("recipient", [{}])[0].get("reference", ""),
                "subject": f"NPHIES Communication: {comm.get('category', [{}])[0].get('text', '')}",
                "message": " ".join([p.get("contentString", "") for p in comm.get("payload", [])]),
                "priority": comm.get("priority", "normal"),
                "template": "nphies_communication"
            }
    
    # Default transformation
    return extracted_data


def get_agent_task(agent_name: str, message_type: str) -> str:
    """Get the appropriate task for an agent based on message type"""
    task_mapping = {
        "claimlinc": {
            "claim-request": "submit",
            "priorauth-request": "submit",
            "claim-response": "verify",
            "priorauth-response": "verify"
        },
        "authlinc": {
            "eligibility-request": "validate",
            "eligibility-response": "validate"
        },
        "notifylinc": {
            "communication-request": "send",
            "communication-response": "send"
        },
        "matchlinc": {
            "prescriber-request": "validate",
            "prescriber-response": "validate"
        }
    }
    
    return task_mapping.get(agent_name, {}).get(message_type, "process")


def transform_healthlinc_to_nphies(data: Dict[str, Any], message_type: str) -> Dict[str, Any]:
    """Transform HealthLinc format to NPHIES FHIR Bundle"""
    bundle_id = str(uuid.uuid4())
    
    base_bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "meta": {
            "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle"]
        },
        "type": "message",
        "timestamp": datetime.now().isoformat(),
        "entry": []
    }
    
    # Add MessageHeader
    message_header = {
        "fullUrl": f"MessageHeader/{uuid.uuid4()}",
        "resource": {
            "resourceType": "MessageHeader",
            "id": str(uuid.uuid4()),
            "eventCoding": {
                "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                "code": message_type
            },
            "source": {
                "endpoint": "https://healthlinc.app/fhir"
            },
            "focus": []
        }
    }
    
    base_bundle["entry"].append(message_header)
    
    # Add specific resources based on data type
    if "claims" in data:
        for claim in data["claims"]:
            claim_entry = {
                "fullUrl": f"Claim/{claim.get('claim_id', uuid.uuid4())}",
                "resource": {
                    "resourceType": "Claim",
                    "id": claim.get("claim_id", str(uuid.uuid4())),
                    "status": claim.get("status", "active"),
                    "type": claim.get("type", {}),
                    "use": claim.get("use", "claim"),
                    "patient": {"reference": f"Patient/{claim.get('patient_id')}"},
                    "created": claim.get("service_date", datetime.now().isoformat()),
                    "provider": {"reference": f"Organization/{claim.get('provider_id')}"},
                    "total": {"value": claim.get("total_amount", 0), "currency": "SAR"}
                }
            }
            base_bundle["entry"].append(claim_entry)
            message_header["resource"]["focus"].append({
                "reference": f"Claim/{claim.get('claim_id')}"
            })
    
    return {"status": "success", "data": base_bundle}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "NphiesLinc", 
        "timestamp": datetime.now().isoformat(),
        "integration_status": "connected" if NPHIES_INTEGRATION_URL else "disconnected"
    }


# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3009))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
