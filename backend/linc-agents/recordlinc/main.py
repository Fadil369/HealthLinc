"""
RecordLinc Agent - Main entry point

This agent handles patient record operations for the HealthLinc ecosystem:
- Create new patient records
- Read existing patient records
- Update patient information
- Delete patient records (with proper authorization)
- Search for patients by various criteria
- Analytics and reporting
"""

import os
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import database modules
from database.connection import (
    connect_to_mongodb,
    close_mongodb_connection,
    get_patients_collection,
    get_observations_collection
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("recordlinc")

# Initialize FastAPI app
app = FastAPI(
    title="RecordLinc Agent",
    description="LINC Agent for handling patient healthcare records",
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
class PatientData(BaseModel):
    identifier: Optional[str] = None
    first_name: str
    last_name: str
    birth_date: str
    gender: str
    address: Optional[Dict[str, str]] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    insurance_id: Optional[str] = None
    primary_provider_id: Optional[str] = None
    allergies: Optional[List[str]] = None
    medications: Optional[List[Dict[str, str]]] = None


class RecordUpdateData(BaseModel):
    patient_id: str
    updates: Dict[str, Any]


class RecordDeleteData(BaseModel):
    patient_id: str
    reason: Optional[str] = None
    authorized_by: str


class RecordSearchData(BaseModel):
    name: Optional[str] = None
    identifier: Optional[str] = None
    birth_date: Optional[str] = None
    insurance_id: Optional[str] = None
    provider_id: Optional[str] = None


class ObservationData(BaseModel):
    patient_id: str
    code: str
    code_system: str
    value: Union[str, float, Dict[str, Any]]
    status: str = "final"
    effective_date: str
    performer_id: Optional[str] = None
    notes: Optional[str] = None


class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


class AnalyticsTimeFrame(BaseModel):
    start_date: str
    end_date: str
    grouping: str = "day"  # day, week, month


class AnalyticsRequest(BaseModel):
    time_frame: AnalyticsTimeFrame
    metrics: List[str]
    filters: Optional[Dict[str, Any]] = None

# Helper functions
def generate_patient_id() -> str:
    """Generate a unique patient ID with PT prefix"""
    return f"PT-{uuid.uuid4().hex[:8].upper()}"


def generate_observation_id() -> str:
    """Generate a unique observation ID with OBS prefix"""
    return f"OBS-{uuid.uuid4().hex[:8].upper()}"


def log_request(task: str, data: Dict[str, Any], request_id: str) -> None:
    """Log the incoming request details"""
    logger.info(f"Task: {task}, Request ID: {request_id}")
    logger.debug(f"Data: {json.dumps(data)}")


# API Routes
@app.post("/agents/record")
async def handle_record_request(request: Request) -> JSONResponse:
    """Main entry point for all record-related tasks"""
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
        if task == "create":
            patient_data = PatientData(**data)
            return await create_patient(patient_data, request_id)
            
        elif task == "read":
            # Can accept either patient_id as string or complex search criteria
            if isinstance(data, dict) and "patient_id" in data and isinstance(data["patient_id"], str):
                patient_id = data["patient_id"]
                return await get_patient(patient_id, request_id)
            else:
                search_data = RecordSearchData(**data)
                return await search_patients(search_data, request_id)
            
        elif task == "update":
            update_data = RecordUpdateData(**data)
            return await update_patient(update_data, request_id)
            
        elif task == "delete":
            delete_data = RecordDeleteData(**data)
            return await delete_patient(delete_data, request_id)
            
        elif task == "search":
            search_data = RecordSearchData(**data)
            return await search_patients(search_data, request_id)
            
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
async def create_patient(patient_data: PatientData, request_id: str) -> JSONResponse:
    """Handle new patient record creation"""
    try:
        # Generate a patient ID
        patient_id = generate_patient_id()
        
        # Create FHIR Patient resource
        fhir_patient = {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.now().isoformat()
            },
            "active": True,
            "identifier": [
                {
                    "system": "https://healthlinc.app/identifiers/patient",
                    "value": patient_id
                }
            ],
            "name": [
                {
                    "use": "official",
                    "family": patient_data.last_name,
                    "given": [patient_data.first_name]
                }
            ],
            "gender": patient_data.gender,
            "birthDate": patient_data.birth_date
        }
        
        # Add optional fields if provided
        if patient_data.address:
            fhir_patient["address"] = [patient_data.address]
        
        if patient_data.phone:
            fhir_patient["telecom"] = [
                {
                    "system": "phone",
                    "value": patient_data.phone
                }
            ]
            
            if patient_data.email:
                fhir_patient["telecom"].append({
                    "system": "email",
                    "value": patient_data.email
                })
        elif patient_data.email:
            fhir_patient["telecom"] = [
                {
                    "system": "email",
                    "value": patient_data.email
                }
            ]
            
        # In a real implementation, this would save to a database/FHIR server
        # For demo purposes, we'll simulate a successful creation
        return JSONResponse(
            status_code=201,
            content={
                "status": "success",
                "message": "Patient record created successfully",
                "data": {
                    "patient_id": patient_id,
                    "fhir_resource": fhir_patient,
                    "created_at": datetime.now().isoformat()
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error creating patient record: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to create patient record: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def get_patient(patient_id: str, request_id: str) -> JSONResponse:
    """Retrieve a patient record by ID"""
    try:
        # In a real implementation, this would query a database/FHIR server
        # For demo, return mock patient data
        
        # Check if patient ID format is valid
        if not patient_id.startswith("PT-"):
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Invalid patient ID format",
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }
            )
            
        # Create mock patient data
        mock_patient = {
            "resourceType": "Patient",
            "id": patient_id,
            "meta": {
                "versionId": "1",
                "lastUpdated": "2025-05-01T10:30:00Z"
            },
            "active": True,
            "identifier": [
                {
                    "system": "https://healthlinc.app/identifiers/patient",
                    "value": patient_id
                },
                {
                    "system": "http://hl7.org/fhir/sid/us-ssn",
                    "value": "123-45-6789"
                }
            ],
            "name": [
                {
                    "use": "official",
                    "family": "Johnson",
                    "given": ["Robert", "James"]
                }
            ],
            "telecom": [
                {
                    "system": "phone",
                    "value": "555-123-4567",
                    "use": "home"
                },
                {
                    "system": "email",
                    "value": "robert.johnson@example.com"
                }
            ],
            "gender": "male",
            "birthDate": "1980-07-15",
            "address": [
                {
                    "use": "home",
                    "line": ["123 Main Street"],
                    "city": "Anytown",
                    "state": "CA",
                    "postalCode": "90210",
                    "country": "USA"
                }
            ],
            "contact": [
                {
                    "relationship": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
                                    "code": "N",
                                    "display": "Next of kin"
                                }
                            ]
                        }
                    ],
                    "name": {
                        "family": "Johnson",
                        "given": ["Mary"]
                    },
                    "telecom": [
                        {
                            "system": "phone",
                            "value": "555-888-9999"
                        }
                    ]
                }
            ],
            "communication": [
                {
                    "language": {
                        "coding": [
                            {
                                "system": "urn:ietf:bcp:47",
                                "code": "en",
                                "display": "English"
                            }
                        ]
                    },
                    "preferred": True
                }
            ],
            "generalPractitioner": [
                {
                    "reference": "Practitioner/dr-smith-123",
                    "display": "Dr. Sarah Smith"
                }
            ]
        }
        
        # Also include some recent observations
        observations = [
            {
                "resourceType": "Observation",
                "id": "obs-1234",
                "status": "final",
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8480-6",
                            "display": "Systolic blood pressure"
                        }
                    ],
                    "text": "Systolic blood pressure"
                },
                "subject": {
                    "reference": f"Patient/{patient_id}"
                },
                "effectiveDateTime": "2025-04-29T09:30:00Z",
                "valueQuantity": {
                    "value": 120,
                    "unit": "mm[Hg]",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]"
                }
            },
            {
                "resourceType": "Observation",
                "id": "obs-5678",
                "status": "final",
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "8462-4",
                            "display": "Diastolic blood pressure"
                        }
                    ],
                    "text": "Diastolic blood pressure"
                },
                "subject": {
                    "reference": f"Patient/{patient_id}"
                },
                "effectiveDateTime": "2025-04-29T09:30:00Z",
                "valueQuantity": {
                    "value": 80,
                    "unit": "mm[Hg]",
                    "system": "http://unitsofmeasure.org",
                    "code": "mm[Hg]"
                }
            }
        ]
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Patient record retrieved",
                "data": {
                    "patient": mock_patient,
                    "recent_observations": observations
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error retrieving patient record: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": f"Failed to retrieve patient record: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def update_patient(update_data: RecordUpdateData, request_id: str) -> JSONResponse:
    """Update an existing patient record"""
    try:
        patient_id = update_data.patient_id
        updates = update_data.updates
        
        # In a real implementation, this would:
        # 1. Validate the patient exists
        # 2. Check permissions
        # 3. Apply updates to database/FHIR server
        
        # For demo, just echo back the updates
        return JSONResponse(
            content={
                "status": "success",
                "message": "Patient record updated successfully",
                "data": {
                    "patient_id": patient_id,
                    "updated_fields": list(updates.keys()),
                    "updated_at": datetime.now().isoformat()
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error updating patient record: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to update patient record: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def delete_patient(delete_data: RecordDeleteData, request_id: str) -> JSONResponse:
    """Delete a patient record (or mark as inactive)"""
    try:
        patient_id = delete_data.patient_id
        
        # In a real implementation, this would:
        # 1. Verify authorization (admin or provider only)
        # 2. Mark patient as inactive rather than delete
        # 3. Log the action for audit purposes
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "Patient record marked as inactive",
                "data": {
                    "patient_id": patient_id,
                    "deactivated_at": datetime.now().isoformat(),
                    "authorized_by": delete_data.authorized_by,
                    "reason": delete_data.reason or "Not provided"
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error deleting patient record: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to delete patient record: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


async def search_patients(search_data: RecordSearchData, request_id: str) -> JSONResponse:
    """Search for patients matching criteria"""
    try:
        # In a real implementation, this would:
        # 1. Build a FHIR search query based on parameters
        # 2. Execute search against FHIR server/database
        # 3. Return paginated results
        
        # For demo, return mock search results
        results = []
        
        # Generate 0-3 random results based on search criteria
        import random
        result_count = random.randint(0, 3)
        
        for i in range(result_count):
            patient_id = f"PT-{uuid.uuid4().hex[:8].upper()}"
            results.append({
                "resourceType": "Patient",
                "id": patient_id,
                "meta": {
                    "versionId": "1",
                    "lastUpdated": (datetime.now().isoformat())
                },
                "active": True,
                "name": [
                    {
                        "family": f"Last{i+1}",
                        "given": [f"First{i+1}"]
                    }
                ],
                "gender": random.choice(["male", "female"]),
                "birthDate": f"{random.randint(1950, 2010)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
            })
        
        return JSONResponse(
            content={
                "status": "success",
                "message": f"Found {len(results)} matching patients",
                "data": {
                    "results": results,
                    "count": len(results),
                    "search_criteria": search_data.dict(exclude_none=True)
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error searching patient records: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to search patient records: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )


# Analytics endpoints
@app.post("/api/analytics/patient-demographics", response_model=AgentResponse)
async def get_patient_demographics():
    """Get demographic breakdown of patients"""
    try:
        patients_collection = await get_patients_collection()
        
        # Get gender distribution
        gender_pipeline = [
            {"$group": {"_id": "$gender", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        gender_results = await patients_collection.aggregate(gender_pipeline).to_list(length=10)
        
        # Get age distribution
        current_year = datetime.now().year
        age_pipeline = [
            {
                "$project": {
                    "birth_year": {"$substr": ["$birth_date", 0, 4]},
                    "first_name": 1,
                    "last_name": 1
                }
            },
            {
                "$project": {
                    "age": {"$subtract": [current_year, {"$toInt": "$birth_year"}]},
                    "first_name": 1,
                    "last_name": 1
                }
            },
            {
                "$bucket": {
                    "groupBy": "$age",
                    "boundaries": [0, 18, 30, 45, 65, 80, 120],
                    "default": "Unknown",
                    "output": {
                        "count": {"$sum": 1}
                    }
                }
            }
        ]
        age_results = await patients_collection.aggregate(age_pipeline).to_list(length=10)
        
        return AgentResponse(
            status="success",
            message="Demographics data retrieved successfully",
            data={
                "gender_distribution": gender_results,
                "age_distribution": age_results
            }
        )
    except Exception as e:
        logger.error(f"Error retrieving demographics: {e}")
        return AgentResponse(
            status="error",
            message=f"Error retrieving demographics data: {str(e)}"
        )


@app.post("/api/analytics/patient-trends", response_model=AgentResponse)
async def get_patient_trends(request: AnalyticsRequest):
    """Get patient registration trends over time"""
    try:
        start_date = datetime.fromisoformat(request.time_frame.start_date.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(request.time_frame.end_date.replace('Z', '+00:00'))
        
        # Determine grouping format
        date_format = "%Y-%m-%d"
        if request.time_frame.grouping == "week":
            date_format = "%Y-W%W"
        elif request.time_frame.grouping == "month":
            date_format = "%Y-%m"
            
        patients_collection = await get_patients_collection()
        
        # Find patients created between dates
        date_pipeline = [
            {
                "$match": {
                    "created_at": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                }
            },
            {
                "$project": {
                    "date_str": {"$dateToString": {"format": date_format, "date": "$created_at"}}
                }
            },
            {
                "$group": {
                    "_id": "$date_str",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ]
        
        trend_results = await patients_collection.aggregate(date_pipeline).to_list(length=1000)
        
        return AgentResponse(
            status="success",
            message="Patient trends data retrieved successfully",
            data={
                "trends": trend_results,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "grouping": request.time_frame.grouping
                }
            }
        )
    except Exception as e:
        logger.error(f"Error retrieving patient trends: {e}")
        return AgentResponse(
            status="error",
            message=f"Error retrieving patient trends data: {str(e)}"
        )


@app.post("/api/analytics/clinical-metrics", response_model=AgentResponse)
async def get_clinical_metrics(request: AnalyticsRequest):
    """Get clinical metrics such as diagnosis trends, observation values, etc."""
    try:
        observations_collection = await get_observations_collection()
        
        # Filter by date range if provided
        match_stage = {}
        if "time_frame" in request and request.time_frame:
            start_date = datetime.fromisoformat(request.time_frame.start_date.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(request.time_frame.end_date.replace('Z', '+00:00'))
            match_stage = {
                "$match": {
                    "effective_date": {
                        "$gte": start_date.isoformat(),
                        "$lte": end_date.isoformat()
                    }
                }
            }
        
        # Get top diagnoses
        diagnosis_pipeline = [
            match_stage,
            {"$match": {"code_system": "http://loinc.org"}},
            {"$group": {"_id": "$code", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        if not match_stage:
            diagnosis_pipeline.pop(0)  # Remove empty match stage
            
        diagnosis_results = await observations_collection.aggregate(diagnosis_pipeline).to_list(length=10)
        
        return AgentResponse(
            status="success",
            message="Clinical metrics retrieved successfully",
            data={
                "top_diagnoses": diagnosis_results
            }
        )
    except Exception as e:
        logger.error(f"Error retrieving clinical metrics: {e}")
        return AgentResponse(
            status="error",
            message=f"Error retrieving clinical metrics: {str(e)}"
        )


# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongodb()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongodb_connection()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RecordLinc", "timestamp": datetime.now().isoformat()}


# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
