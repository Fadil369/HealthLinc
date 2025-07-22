"""
FHIR Gateway - Main Server Implementation

Serves as the interoperability layer for the HealthLinc ecosystem,
providing standardized FHIR R4 APIs and translating between HL7v2 and FHIR.
"""

import os
import yaml
import json
import logging
from typing import Dict, Any, List, Optional, Union

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

# Import FHIR Resource models from fhir.resources
from fhir.resources.patient import Patient
from fhir.resources.claim import Claim
from fhir.resources.bundle import Bundle
from fhir.resources.operationoutcome import OperationOutcome
from fhir.resources.coverageeligibilityrequest import CoverageEligibilityRequest
from fhir.resources.communication import Communication
from fhir.resources.messageheader import MessageHeader

# Import HTTP client for NPHIES integration
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fhir-gateway")

# Load configuration
config_path = os.environ.get('CONFIG_PATH', 'config.yaml')
try:
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        logger.info(f"Configuration loaded from {config_path}")
except Exception as e:
    logger.error(f"Error loading configuration: {e}")
    config = {
        'server': {
            'port': 8000,
            'host': '0.0.0.0',
            'base_url': '/fhir',
            'version': 'R4',
            'name': 'HealthLinc FHIR Gateway'
        },
        'security': {
            'auth_required': True,
            'jwt': {
                'secret_key': 'dev_only_secret',
                'algorithm': 'HS256',
                'expiration_minutes': 60
            },
            'cors': {
                'allow_origins': ['http://localhost:3000']
            }
        },
        'nphies': {
            'integration_url': 'http://localhost:3010',
            'enabled': True,
            'auto_forward': True
        }
    }

# Initialize FastAPI app
app = FastAPI(
    title=config['server']['name'],
    description="FHIR Gateway for HealthLinc Ecosystem",
    version="1.0.0",
    docs_url="/fhir/docs",
    openapi_url="/fhir/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config['security']['cors']['allow_origins'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth models
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


# Authentication functions
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# For demo, we'll use a simple user database (replace with actual DB in production)
fake_users_db = {
    "test_user": {
        "username": "test_user",
        "full_name": "Test User",
        "email": "test@healthlinc.app",
        "hashed_password": "fakehashedsecret",
        "disabled": False,
    }
}


def verify_password(plain_password, hashed_password):
    """In production, use proper password hashing"""
    return plain_password == "test_password" and hashed_password == "fakehashedsecret"


def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None


def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        config['security']['jwt']['secret_key'], 
        algorithm=config['security']['jwt']['algorithm']
    )
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            config['security']['jwt']['secret_key'], 
            algorithms=[config['security']['jwt']['algorithm']]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# Authentication endpoint
@app.post("/fhir/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=config['security']['jwt']['expiration_minutes'])
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# FHIR Resource endpoints
@app.get("/fhir/Patient/{id}")
async def get_patient(id: str, current_user: User = Depends(get_current_active_user)):
    """Retrieve a single patient by ID"""
    try:
        # In a real implementation, this would fetch from a database or external service
        # For demo, return a sample patient
        patient_data = {
            "resourceType": "Patient",
            "id": id,
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.utcnow().isoformat()
            },
            "identifier": [
                {
                    "system": "https://healthlinc.app/identifiers/patient",
                    "value": id
                }
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "family": "Smith",
                    "given": ["Jane"]
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
                    "value": "jane.smith@example.com"
                }
            ],
            "gender": "female",
            "birthDate": "1980-01-15",
            "address": [
                {
                    "use": "home",
                    "line": ["123 Main St"],
                    "city": "Anytown",
                    "state": "CA",
                    "postalCode": "12345",
                    "country": "USA"
                }
            ]
        }
        
        # Create and validate the FHIR Patient resource
        patient = Patient.parse_obj(patient_data)
        return patient.dict()
    
    except Exception as e:
        logger.error(f"Error retrieving patient {id}: {e}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to retrieve patient: {str(e)}"
        )


@app.post("/fhir/Patient")
async def create_patient(patient: dict, current_user: User = Depends(get_current_active_user)):
    """Create a new patient resource"""
    try:
        # Validate the resource is a valid FHIR Patient
        patient_resource = Patient.parse_obj(patient)
        
        # In a real implementation, this would save to a database
        # For demo purposes, just validate and return
        
        # Generate an ID 
        if not patient_resource.id:
            import uuid
            patient_resource.id = str(uuid.uuid4())
        
        # Update metadata
        if not patient_resource.meta:
            patient_resource.meta = {"versionId": "1"}
        
        patient_resource.meta["lastUpdated"] = datetime.utcnow().isoformat()
        
        return JSONResponse(
            status_code=201,
            content=patient_resource.dict(),
            headers={"Location": f"/fhir/Patient/{patient_resource.id}"}
        )
        
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to create patient: {str(e)}"
        )


@app.get("/fhir/Claim/{id}")
async def get_claim(id: str, current_user: User = Depends(get_current_active_user)):
    """Retrieve a single claim by ID"""
    try:
        # In a real implementation, this would fetch from a database or external service
        # For demo, return a sample claim
        claim_data = {
            "resourceType": "Claim",
            "id": id,
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.utcnow().isoformat()
            },
            "status": "active",
            "type": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/claim-type",
                        "code": "professional",
                        "display": "Professional"
                    }
                ]
            },
            "use": "claim",
            "patient": {
                "reference": "Patient/example"
            },
            "created": datetime.utcnow().isoformat(),
            "provider": {
                "reference": "Practitioner/example"
            },
            "priority": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/processpriority",
                        "code": "normal"
                    }
                ]
            },
            "insurance": [
                {
                    "sequence": 1,
                    "focal": True,
                    "coverage": {
                        "reference": "Coverage/example"
                    }
                }
            ],
            "item": [
                {
                    "sequence": 1,
                    "productOrService": {
                        "coding": [
                            {
                                "system": "http://www.ama-assn.org/go/cpt",
                                "code": "99213",
                                "display": "Office or other outpatient visit for the evaluation and management"
                            }
                        ]
                    },
                    "servicedDate": datetime.utcnow().strftime("%Y-%m-%d"),
                    "unitPrice": {
                        "value": 120.00,
                        "currency": "USD"
                    }
                }
            ]
        }
        
        # Create and validate the FHIR Claim resource
        claim = Claim.parse_obj(claim_data)
        return claim.dict()
    
    except Exception as e:
        logger.error(f"Error retrieving claim {id}: {e}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to retrieve claim: {str(e)}"
        )


@app.post("/fhir/Claim")
async def create_claim(claim: dict, current_user: User = Depends(get_current_active_user)):
    """Create a new claim resource"""
    try:
        # Validate the resource is a valid FHIR Claim
        claim_resource = Claim.parse_obj(claim)
        
        # In a real implementation:
        # 1. Save to database
        # 2. Forward to appropriate LINC agent (ClaimLinc)
        # For demo purposes, just validate and return
        
        # Generate an ID 
        if not claim_resource.id:
            import uuid
            claim_resource.id = str(uuid.uuid4())
        
        # Update metadata
        if not claim_resource.meta:
            claim_resource.meta = {"versionId": "1"}
        
        claim_resource.meta["lastUpdated"] = datetime.utcnow().isoformat()
        
        # In production, this would initiate an async job to process the claim
        # e.g., send to ClaimLinc agent
        
        return JSONResponse(
            status_code=201,
            content=claim_resource.dict(),
            headers={"Location": f"/fhir/Claim/{claim_resource.id}"}
        )
        
    except Exception as e:
        logger.error(f"Error creating claim: {e}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to create claim: {str(e)}"
        )


def create_operation_outcome(severity: str, code: str, diagnostics: str) -> JSONResponse:
    """Create a FHIR OperationOutcome for error responses"""
    outcome = OperationOutcome(
        resourceType="OperationOutcome",
        issue=[
            {
                "severity": severity,
                "code": code,
                "diagnostics": diagnostics
            }
        ]
    )
    
    status_code = 500 if severity == "error" else 400
    return JSONResponse(status_code=status_code, content=outcome.dict())


@app.get("/fhir/metadata")
async def capability_statement():
    """Return FHIR CapabilityStatement (metadata)"""
    # In a production system, this would return a detailed capability statement
    # showing all supported resources and operations
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "publisher": "HealthLinc",
        "kind": "instance",
        "software": {
            "name": "HealthLinc FHIR Gateway",
            "version": "1.0.0"
        },
        "implementation": {
            "description": "HealthLinc FHIR API with NPHIES Integration",
            "url": "https://api.healthlinc.app/fhir"
        },
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [
            {
                "mode": "server",
                "security": {
                    "cors": True,
                    "service": [
                        {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
                                    "code": "OAuth",
                                    "display": "OAuth2 using SMART-on-FHIR profile"
                                }
                            ]
                        }
                    ],
                    "description": "OAuth2 Bearer Token required"
                },
                "resource": [
                    {
                        "type": "Patient",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/patient",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "update"},
                            {"code": "search-type"}
                        ],
                        "searchParam": [
                            {"name": "name", "type": "string"},
                            {"name": "identifier", "type": "token"},
                            {"name": "birthdate", "type": "date"},
                            {"name": "gender", "type": "token"}
                        ]
                    },
                    {
                        "type": "Claim",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/institutional-claim",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "update"},
                            {"code": "search-type"}
                        ],
                        "searchParam": [
                            {"name": "patient", "type": "reference"},
                            {"name": "created", "type": "date"},
                            {"name": "status", "type": "token"},
                            {"name": "use", "type": "token"}
                        ]
                    },
                    {
                        "type": "CoverageEligibilityRequest",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/eligibility-request",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "search-type"}
                        ],
                        "searchParam": [
                            {"name": "patient", "type": "reference"},
                            {"name": "created", "type": "date"},
                            {"name": "status", "type": "token"}
                        ]
                    },
                    {
                        "type": "Bundle",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle",
                        "interaction": [
                            {"code": "create"},
                            {"code": "read"}
                        ]
                    },
                    {
                        "type": "Communication",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/communication-request",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "search-type"}
                        ]
                    },
                    {
                        "type": "Organization",
                        "profile": "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization",
                        "interaction": [
                            {"code": "read"},
                            {"code": "search-type"}
                        ]
                    }
                ],
                "operation": [
                    {
                        "name": "process-nphies-bundle",
                        "definition": "/fhir/nphies/bundle"
                    },
                    {
                        "name": "submit-eligibility",
                        "definition": "/fhir/nphies/eligibility"
                    },
                    {
                        "name": "submit-preauth",
                        "definition": "/fhir/nphies/preauth"
                    }
                ]
            }
        ]
    }


@app.get("/fhir/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FHIR Gateway", "timestamp": datetime.utcnow().isoformat()}


# NPHIES Integration Endpoints
@app.post("/fhir/nphies/bundle")
async def process_nphies_bundle(request: Request, current_user: User = Depends(get_current_active_user)):
    """Process NPHIES FHIR Bundle and forward to NPHIES integration service"""
    try:
        bundle_data = await request.json()
        
        # Validate it's a proper FHIR Bundle
        try:
            bundle_resource = Bundle.parse_obj(bundle_data)
        except Exception as e:
            return create_operation_outcome(
                severity="error",
                code="invalid",
                diagnostics=f"Invalid FHIR Bundle: {str(e)}"
            )
        
        # Forward to NPHIES integration service if enabled
        if config.get('nphies', {}).get('enabled', False):
            integration_url = config['nphies']['integration_url']
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"{integration_url}/nphies/process",
                        json=bundle_data,
                        headers={"Content-Type": "application/json"},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        return JSONResponse(
                            content={
                                "status": "success",
                                "message": "NPHIES bundle processed successfully",
                                "nphies_result": result,
                                "bundle_id": bundle_resource.id
                            }
                        )
                    else:
                        logger.error(f"NPHIES integration error: {response.status_code}")
                        return create_operation_outcome(
                            severity="error",
                            code="processing",
                            diagnostics="Failed to process bundle with NPHIES integration service"
                        )
                        
                except httpx.RequestError as e:
                    logger.error(f"NPHIES integration connection error: {str(e)}")
                    return create_operation_outcome(
                        severity="warning",
                        code="timeout",
                        diagnostics="NPHIES integration service unavailable, bundle stored locally"
                    )
        
        # If NPHIES integration is disabled, just acknowledge receipt
        return JSONResponse(
            content={
                "status": "success", 
                "message": "Bundle received (NPHIES integration disabled)",
                "bundle_id": bundle_resource.id
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing NPHIES bundle: {str(e)}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to process bundle: {str(e)}"
        )


@app.post("/fhir/nphies/eligibility")
async def create_eligibility_request(request: Request, current_user: User = Depends(get_current_active_user)):
    """Create and submit NPHIES eligibility request"""
    try:
        eligibility_data = await request.json()
        
        # Validate FHIR CoverageEligibilityRequest
        try:
            eligibility_resource = CoverageEligibilityRequest.parse_obj(eligibility_data)
        except Exception as e:
            return create_operation_outcome(
                severity="error",
                code="invalid",
                diagnostics=f"Invalid CoverageEligibilityRequest: {str(e)}"
            )
        
        # Generate ID if not provided
        if not eligibility_resource.id:
            import uuid
            eligibility_resource.id = str(uuid.uuid4())
        
        # Create FHIR Bundle for NPHIES submission
        bundle_data = {
            "resourceType": "Bundle",
            "id": str(uuid.uuid4()),
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.utcnow().isoformat(),
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle"]
            },
            "type": "message",
            "timestamp": datetime.utcnow().isoformat(),
            "entry": [
                {
                    "fullUrl": f"MessageHeader/{uuid.uuid4()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "id": str(uuid.uuid4()),
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "eligibility-request"
                        },
                        "source": {
                            "endpoint": "https://healthlinc.app/fhir"
                        },
                        "focus": [{
                            "reference": f"CoverageEligibilityRequest/{eligibility_resource.id}"
                        }]
                    }
                },
                {
                    "fullUrl": f"CoverageEligibilityRequest/{eligibility_resource.id}",
                    "resource": eligibility_resource.dict()
                }
            ]
        }
        
        # Forward to NPHIES if enabled
        if config.get('nphies', {}).get('enabled', False):
            integration_url = config['nphies']['integration_url']
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"{integration_url}/nphies/process",
                        json=bundle_data,
                        headers={"Content-Type": "application/json"},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        return JSONResponse(
                            status_code=201,
                            content={
                                "status": "success",
                                "message": "Eligibility request submitted to NPHIES",
                                "eligibility_id": eligibility_resource.id,
                                "bundle_id": bundle_data["id"]
                            },
                            headers={"Location": f"/fhir/CoverageEligibilityRequest/{eligibility_resource.id}"}
                        )
                except httpx.RequestError as e:
                    logger.error(f"NPHIES connection error: {str(e)}")
        
        # Fallback: store locally
        return JSONResponse(
            status_code=201,
            content={
                "status": "success",
                "message": "Eligibility request created (stored locally)",
                "eligibility_id": eligibility_resource.id
            },
            headers={"Location": f"/fhir/CoverageEligibilityRequest/{eligibility_resource.id}"}
        )
        
    except Exception as e:
        logger.error(f"Error creating eligibility request: {str(e)}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to create eligibility request: {str(e)}"
        )


@app.post("/fhir/nphies/preauth")
async def create_preauth_request(claim: dict, current_user: User = Depends(get_current_active_user)):
    """Create and submit NPHIES prior authorization request"""
    try:
        # Validate FHIR Claim resource for preauth
        claim_resource = Claim.parse_obj(claim)
        
        # Ensure it's marked as preauth
        if claim_resource.use != "preauthorization":
            claim_resource.use = "preauthorization"
        
        # Generate ID if not provided
        if not claim_resource.id:
            import uuid
            claim_resource.id = str(uuid.uuid4())
        
        # Create NPHIES Bundle for preauth submission
        bundle_data = {
            "resourceType": "Bundle",
            "id": str(uuid.uuid4()),
            "meta": {
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle"]
            },
            "type": "message",
            "timestamp": datetime.utcnow().isoformat(),
            "entry": [
                {
                    "fullUrl": f"MessageHeader/{uuid.uuid4()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "id": str(uuid.uuid4()),
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "priorauth-request"
                        },
                        "source": {
                            "endpoint": "https://healthlinc.app/fhir"
                        },
                        "focus": [{
                            "reference": f"Claim/{claim_resource.id}"
                        }]
                    }
                },
                {
                    "fullUrl": f"Claim/{claim_resource.id}",
                    "resource": claim_resource.dict()
                }
            ]
        }
        
        # Forward to NPHIES and potentially ClaimLinc
        if config.get('nphies', {}).get('enabled', False):
            integration_url = config['nphies']['integration_url']
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        f"{integration_url}/nphies/process",
                        json=bundle_data,
                        headers={"Content-Type": "application/json"},
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        return JSONResponse(
                            status_code=201,
                            content={
                                "status": "success",
                                "message": "Prior authorization request submitted to NPHIES",
                                "claim_id": claim_resource.id,
                                "bundle_id": bundle_data["id"]
                            },
                            headers={"Location": f"/fhir/Claim/{claim_resource.id}"}
                        )
                except httpx.RequestError as e:
                    logger.error(f"NPHIES connection error: {str(e)}")
        
        return JSONResponse(
            status_code=201,
            content={
                "status": "success",
                "message": "Prior authorization request created",
                "claim_id": claim_resource.id
            }
        )
        
    except Exception as e:
        logger.error(f"Error creating preauth request: {str(e)}")
        return create_operation_outcome(
            severity="error",
            code="processing",
            diagnostics=f"Failed to create preauth request: {str(e)}"
        )


# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", config['server']['port']))
    uvicorn.run("main:app", host=config['server']['host'], port=port, reload=True)
