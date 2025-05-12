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
            "description": "HealthLinc FHIR API",
            "url": "https://api.healthlinc.app/fhir"
        },
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [
            {
                "mode": "server",
                "resource": [
                    {
                        "type": "Patient",
                        "interaction": [
                            {"code": "read"},
                            {"code": "create"},
                            {"code": "search-type"}
                        ],
                        "searchParam": [
                            {"name": "name", "type": "string"},
                            {"name": "identifier", "type": "token"},
                            {"name": "birthdate", "type": "date"}
                        ]
                    },
                    {
                        "type": "Claim",
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
                    }
                ]
            }
        ]
    }


@app.get("/fhir/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FHIR Gateway", "timestamp": datetime.utcnow().isoformat()}


# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", config['server']['port']))
    uvicorn.run("main:app", host=config['server']['host'], port=port, reload=True)
