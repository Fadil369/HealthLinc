"""
NPHIES Integration Service for HealthLinc

This service handles communication between HealthLinc and the Saudi NPHIES (National Platform 
for Health Information Exchange Services) system. It extracts essential data from FHIR bundles,
transforms them to NPHIES format, and manages bidirectional communication.

Key Features:
- Extract and transform NPHIES FHIR bundles
- Handle eligibility requests/responses
- Process authorization/preauth requests
- Manage claim submissions and responses
- Communication management
- Payment and reconciliation
"""

import os
import json
import logging
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union
from enum import Enum

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import FHIR resources
from fhir.resources.bundle import Bundle
from fhir.resources.patient import Patient
from fhir.resources.claim import Claim
from fhir.resources.coverageeligibilityrequest import CoverageEligibilityRequest
from fhir.resources.communication import Communication
from fhir.resources.messageheader import MessageHeader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("nphies-integration")

# Initialize FastAPI app
app = FastAPI(
    title="NPHIES Integration Service",
    description="Integration service for Saudi NPHIES platform with HealthLinc",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NPHIES Message Types
class NphiesMessageType(str, Enum):
    ELIGIBILITY_REQUEST = "eligibility-request"
    ELIGIBILITY_RESPONSE = "eligibility-response"
    PRIORAUTH_REQUEST = "priorauth-request"
    PRIORAUTH_RESPONSE = "priorauth-response"
    CLAIM_REQUEST = "claim-request"
    CLAIM_RESPONSE = "claim-response"
    COMMUNICATION_REQUEST = "communication-request"
    COMMUNICATION_RESPONSE = "communication-response"
    PRESCRIBER_REQUEST = "prescriber-request"
    PRESCRIBER_RESPONSE = "prescriber-response"
    PAYMENT_NOTICE = "payment-notice"
    PAYMENT_RECONCILIATION = "payment-reconciliation"

# Models
class NphiesPatientData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    active: bool
    name: List[Dict[str, Any]]
    telecom: Optional[List[Dict[str, Any]]] = None
    gender: str
    birth_date: str
    address: Optional[List[Dict[str, Any]]] = None
    marital_status: Optional[Dict[str, Any]] = None
    nationality: Optional[str] = None
    occupation: Optional[str] = None

class NphiesOrganizationData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    active: bool
    type: List[Dict[str, Any]]
    name: str
    provider_type: Optional[str] = None

class NphiesCoverageData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    status: str
    type: Dict[str, Any]
    policy_holder: Optional[Dict[str, Any]] = None
    subscriber: Dict[str, Any]
    subscriber_id: str
    beneficiary: Dict[str, Any]
    relationship: Dict[str, Any]
    period: Optional[Dict[str, str]] = None
    payor: List[Dict[str, Any]]
    class_info: Optional[List[Dict[str, Any]]] = None
    network: Optional[str] = None

class NphiesClaimData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    status: str
    type: Dict[str, Any]
    sub_type: Optional[Dict[str, Any]] = None
    use: str
    patient: Dict[str, Any]
    created: str
    insurer: Dict[str, Any]
    provider: Dict[str, Any]
    priority: Dict[str, Any]
    care_team: List[Dict[str, Any]]
    supporting_info: Optional[List[Dict[str, Any]]] = None
    diagnosis: List[Dict[str, Any]]
    insurance: List[Dict[str, Any]]
    items: List[Dict[str, Any]]
    total: Dict[str, Any]
    extensions: Optional[Dict[str, Any]] = None

class NphiesEligibilityData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    status: str
    priority: Dict[str, Any]
    purpose: List[str]
    patient: Dict[str, Any]
    serviced_period: Dict[str, str]
    created: str
    provider: Dict[str, Any]
    insurer: Dict[str, Any]
    facility: Optional[Dict[str, Any]] = None
    insurance: List[Dict[str, Any]]
    extensions: Optional[Dict[str, Any]] = None

class NphiesCommunicationData(BaseModel):
    id: str
    identifier: List[Dict[str, Any]]
    status: str
    category: List[Dict[str, Any]]
    priority: str
    subject: Dict[str, Any]
    about: Optional[List[Dict[str, Any]]] = None
    payload: List[Dict[str, Any]]
    recipient: List[Dict[str, Any]]
    sender: Dict[str, Any]

class NphiesExtractedData(BaseModel):
    message_type: NphiesMessageType
    message_header: Dict[str, Any]
    timestamp: str
    patients: List[NphiesPatientData] = []
    organizations: List[NphiesOrganizationData] = []
    coverages: List[NphiesCoverageData] = []
    claims: List[NphiesClaimData] = []
    eligibility_requests: List[NphiesEligibilityData] = []
    communications: List[NphiesCommunicationData] = []
    practitioners: List[Dict[str, Any]] = []
    encounters: List[Dict[str, Any]] = []
    locations: List[Dict[str, Any]] = []
    medication_requests: List[Dict[str, Any]] = []
    attachments: List[Dict[str, Any]] = []
    
class NphiesBundle(BaseModel):
    resource_type: str
    id: str
    meta: Dict[str, Any]
    type: str
    timestamp: str
    entry: List[Dict[str, Any]]

class AgentResponse(BaseModel):
    status: str = Field(..., description="success or error")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))

class NphiesExtractor:
    """Main class for extracting data from NPHIES FHIR bundles"""
    
    def __init__(self):
        self.supported_profiles = {
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle": "Bundle",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/patient": "Patient",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/coverage": "Coverage",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/institutional-claim": "Claim",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/institutional-priorauth": "Claim",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/prescriber-priorauth": "Claim",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/eligibility-request": "CoverageEligibilityRequest",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/communication-request": "CommunicationRequest",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/provider-organization": "Organization",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/insurer-organization": "Organization",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/practitioner": "Practitioner",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/encounter": "Encounter",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/location": "Location",
            "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/medicationRequest": "MedicationRequest"
        }
        
        self.code_systems = {
            "http://nphies.sa/terminology/CodeSystem/ksa-message-events": "NPHIES Message Events",
            "http://nphies.sa/terminology/CodeSystem/coverage-type": "Coverage Types",
            "http://nphies.sa/terminology/CodeSystem/claim-subtype": "Claim Subtypes",
            "http://nphies.sa/terminology/CodeSystem/diagnosis-type": "Diagnosis Types",
            "http://nphies.sa/terminology/CodeSystem/claim-information-category": "Claim Information Categories",
            "http://nphies.sa/terminology/CodeSystem/procedures": "NPHIES Procedures",
            "http://nphies.sa/terminology/CodeSystem/moh-category": "MOH Categories",
            "http://nphies.sa/terminology/CodeSystem/scientific-codes": "Scientific Codes",
            "http://nphies.sa/terminology/CodeSystem/practice-codes": "Practice Codes",
            "http://hl7.org/fhir/sid/icd-10-am": "ICD-10-AM",
            "http://loinc.org": "LOINC"
        }

    def extract_bundle_data(self, bundle_data: Dict[str, Any]) -> NphiesExtractedData:
        """Extract all essential data from a NPHIES FHIR Bundle"""
        try:
            extracted_data = NphiesExtractedData(
                message_type=self._determine_message_type(bundle_data),
                message_header=self._extract_message_header(bundle_data),
                timestamp=bundle_data.get("timestamp", datetime.now().isoformat())
            )
            
            # Process each entry in the bundle
            for entry in bundle_data.get("entry", []):
                resource = entry.get("resource", {})
                resource_type = resource.get("resourceType", "")
                
                if resource_type == "Patient":
                    patient_data = self._extract_patient_data(resource)
                    extracted_data.patients.append(patient_data)
                    
                elif resource_type == "Organization":
                    org_data = self._extract_organization_data(resource)
                    extracted_data.organizations.append(org_data)
                    
                elif resource_type == "Coverage":
                    coverage_data = self._extract_coverage_data(resource)
                    extracted_data.coverages.append(coverage_data)
                    
                elif resource_type == "Claim":
                    claim_data = self._extract_claim_data(resource)
                    extracted_data.claims.append(claim_data)
                    
                elif resource_type == "CoverageEligibilityRequest":
                    eligibility_data = self._extract_eligibility_data(resource)
                    extracted_data.eligibility_requests.append(eligibility_data)
                    
                elif resource_type == "CommunicationRequest":
                    comm_data = self._extract_communication_data(resource)
                    extracted_data.communications.append(comm_data)
                    
                elif resource_type == "Practitioner":
                    extracted_data.practitioners.append(resource)
                    
                elif resource_type == "Encounter":
                    extracted_data.encounters.append(resource)
                    
                elif resource_type == "Location":
                    extracted_data.locations.append(resource)
                    
                elif resource_type == "MedicationRequest":
                    extracted_data.medication_requests.append(resource)
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error extracting bundle data: {str(e)}")
            raise
    
    def _determine_message_type(self, bundle_data: Dict[str, Any]) -> NphiesMessageType:
        """Determine the message type from the bundle"""
        try:
            # Look for MessageHeader to determine event type
            for entry in bundle_data.get("entry", []):
                resource = entry.get("resource", {})
                if resource.get("resourceType") == "MessageHeader":
                    event_coding = resource.get("eventCoding", {})
                    code = event_coding.get("code", "")
                    
                    # Map NPHIES codes to our enum
                    code_mapping = {
                        "eligibility-request": NphiesMessageType.ELIGIBILITY_REQUEST,
                        "eligibility-response": NphiesMessageType.ELIGIBILITY_RESPONSE,
                        "priorauth-request": NphiesMessageType.PRIORAUTH_REQUEST,
                        "priorauth-response": NphiesMessageType.PRIORAUTH_RESPONSE,
                        "claim-request": NphiesMessageType.CLAIM_REQUEST,
                        "claim-response": NphiesMessageType.CLAIM_RESPONSE,
                        "communication-request": NphiesMessageType.COMMUNICATION_REQUEST,
                        "communication-response": NphiesMessageType.COMMUNICATION_RESPONSE,
                        "prescriber-request": NphiesMessageType.PRESCRIBER_REQUEST,
                        "prescriber-response": NphiesMessageType.PRESCRIBER_RESPONSE,
                        "payment-notice": NphiesMessageType.PAYMENT_NOTICE,
                        "payment-reconciliation": NphiesMessageType.PAYMENT_RECONCILIATION
                    }
                    
                    return code_mapping.get(code, NphiesMessageType.CLAIM_REQUEST)
            
            # Fallback: try to infer from bundle contents
            resource_types = [entry.get("resource", {}).get("resourceType") for entry in bundle_data.get("entry", [])]
            
            if "CoverageEligibilityRequest" in resource_types:
                return NphiesMessageType.ELIGIBILITY_REQUEST
            elif "Claim" in resource_types:
                return NphiesMessageType.CLAIM_REQUEST
            elif "CommunicationRequest" in resource_types:
                return NphiesMessageType.COMMUNICATION_REQUEST
            else:
                return NphiesMessageType.CLAIM_REQUEST
                
        except Exception as e:
            logger.warning(f"Could not determine message type: {str(e)}")
            return NphiesMessageType.CLAIM_REQUEST
    
    def _extract_message_header(self, bundle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract MessageHeader information"""
        for entry in bundle_data.get("entry", []):
            resource = entry.get("resource", {})
            if resource.get("resourceType") == "MessageHeader":
                return {
                    "id": resource.get("id"),
                    "event_coding": resource.get("eventCoding", {}),
                    "destination": resource.get("destination", []),
                    "sender": resource.get("sender", {}),
                    "source": resource.get("source", {}),
                    "focus": resource.get("focus", [])
                }
        return {}
    
    def _extract_patient_data(self, patient_resource: Dict[str, Any]) -> NphiesPatientData:
        """Extract patient data from FHIR Patient resource"""
        extensions = patient_resource.get("extension", [])
        
        # Extract nationality and occupation from extensions
        nationality = None
        occupation = None
        
        for ext in extensions:
            if "nationality" in ext.get("url", ""):
                nationality = ext.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
            elif "occupation" in ext.get("url", ""):
                occupation = ext.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
        
        return NphiesPatientData(
            id=patient_resource.get("id"),
            identifier=patient_resource.get("identifier", []),
            active=patient_resource.get("active", True),
            name=patient_resource.get("name", []),
            telecom=patient_resource.get("telecom"),
            gender=patient_resource.get("gender"),
            birth_date=patient_resource.get("birthDate"),
            address=patient_resource.get("address"),
            marital_status=patient_resource.get("maritalStatus"),
            nationality=nationality,
            occupation=occupation
        )
    
    def _extract_organization_data(self, org_resource: Dict[str, Any]) -> NphiesOrganizationData:
        """Extract organization data from FHIR Organization resource"""
        extensions = org_resource.get("extension", [])
        provider_type = None
        
        for ext in extensions:
            if "provider-type" in ext.get("url", ""):
                provider_type = ext.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
        
        return NphiesOrganizationData(
            id=org_resource.get("id"),
            identifier=org_resource.get("identifier", []),
            active=org_resource.get("active", True),
            type=org_resource.get("type", []),
            name=org_resource.get("name"),
            provider_type=provider_type
        )
    
    def _extract_coverage_data(self, coverage_resource: Dict[str, Any]) -> NphiesCoverageData:
        """Extract coverage data from FHIR Coverage resource"""
        return NphiesCoverageData(
            id=coverage_resource.get("id"),
            identifier=coverage_resource.get("identifier", []),
            status=coverage_resource.get("status"),
            type=coverage_resource.get("type", {}),
            policy_holder=coverage_resource.get("policyHolder"),
            subscriber=coverage_resource.get("subscriber", {}),
            subscriber_id=coverage_resource.get("subscriberId", ""),
            beneficiary=coverage_resource.get("beneficiary", {}),
            relationship=coverage_resource.get("relationship", {}),
            period=coverage_resource.get("period"),
            payor=coverage_resource.get("payor", []),
            class_info=coverage_resource.get("class"),
            network=coverage_resource.get("network")
        )
    
    def _extract_claim_data(self, claim_resource: Dict[str, Any]) -> NphiesClaimData:
        """Extract claim data from FHIR Claim resource"""
        extensions = {}
        for ext in claim_resource.get("extension", []):
            url = ext.get("url", "")
            if "eligibility-offline" in url:
                extensions["eligibility_offline_reference"] = ext.get("valueString")
            elif "newborn" in url:
                extensions["is_newborn"] = ext.get("valueBoolean")
            elif "encounter" in url:
                extensions["encounter_reference"] = ext.get("valueReference")
            elif "episode" in url:
                extensions["episode_id"] = ext.get("valueIdentifier")
            elif "accountingPeriod" in url:
                extensions["accounting_period"] = ext.get("valueDate")
        
        return NphiesClaimData(
            id=claim_resource.get("id"),
            identifier=claim_resource.get("identifier", []),
            status=claim_resource.get("status"),
            type=claim_resource.get("type", {}),
            sub_type=claim_resource.get("subType"),
            use=claim_resource.get("use"),
            patient=claim_resource.get("patient", {}),
            created=claim_resource.get("created"),
            insurer=claim_resource.get("insurer", {}),
            provider=claim_resource.get("provider", {}),
            priority=claim_resource.get("priority", {}),
            care_team=claim_resource.get("careTeam", []),
            supporting_info=claim_resource.get("supportingInfo"),
            diagnosis=claim_resource.get("diagnosis", []),
            insurance=claim_resource.get("insurance", []),
            items=claim_resource.get("item", []),
            total=claim_resource.get("total", {}),
            extensions=extensions if extensions else None
        )
    
    def _extract_eligibility_data(self, eligibility_resource: Dict[str, Any]) -> NphiesEligibilityData:
        """Extract eligibility data from FHIR CoverageEligibilityRequest resource"""
        extensions = {}
        for ext in eligibility_resource.get("extension", []):
            url = ext.get("url", "")
            if "newborn" in url:
                extensions["is_newborn"] = ext.get("valueBoolean")
        
        return NphiesEligibilityData(
            id=eligibility_resource.get("id"),
            identifier=eligibility_resource.get("identifier", []),
            status=eligibility_resource.get("status"),
            priority=eligibility_resource.get("priority", {}),
            purpose=eligibility_resource.get("purpose", []),
            patient=eligibility_resource.get("patient", {}),
            serviced_period=eligibility_resource.get("servicedPeriod", {}),
            created=eligibility_resource.get("created"),
            provider=eligibility_resource.get("provider", {}),
            insurer=eligibility_resource.get("insurer", {}),
            facility=eligibility_resource.get("facility"),
            insurance=eligibility_resource.get("insurance", []),
            extensions=extensions if extensions else None
        )
    
    def _extract_communication_data(self, comm_resource: Dict[str, Any]) -> NphiesCommunicationData:
        """Extract communication data from FHIR CommunicationRequest resource"""
        return NphiesCommunicationData(
            id=comm_resource.get("id"),
            identifier=comm_resource.get("identifier", []),
            status=comm_resource.get("status"),
            category=comm_resource.get("category", []),
            priority=comm_resource.get("priority"),
            subject=comm_resource.get("subject", {}),
            about=comm_resource.get("about"),
            payload=comm_resource.get("payload", []),
            recipient=comm_resource.get("recipient", []),
            sender=comm_resource.get("sender", {})
        )

# Initialize the extractor
extractor = NphiesExtractor()

# API Endpoints
@app.post("/nphies/extract")
async def extract_nphies_bundle(bundle: NphiesBundle) -> JSONResponse:
    """Extract essential data from a NPHIES FHIR Bundle"""
    try:
        bundle_dict = bundle.dict()
        extracted_data = extractor.extract_bundle_data(bundle_dict)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": "NPHIES bundle data extracted successfully",
                "data": extracted_data.dict(),
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error extracting NPHIES bundle: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to extract NPHIES bundle: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )

@app.post("/nphies/process")
async def process_nphies_message(request: Request, background_tasks: BackgroundTasks) -> JSONResponse:
    """Process incoming NPHIES message and route to appropriate HealthLinc agent"""
    try:
        bundle_data = await request.json()
        extracted_data = extractor.extract_bundle_data(bundle_data)
        
        # Route to appropriate HealthLinc agent based on message type
        agent_routing = {
            NphiesMessageType.ELIGIBILITY_REQUEST: "authlinc",
            NphiesMessageType.PRIORAUTH_REQUEST: "claimlinc", 
            NphiesMessageType.CLAIM_REQUEST: "claimlinc",
            NphiesMessageType.COMMUNICATION_REQUEST: "notifylinc",
            NphiesMessageType.PRESCRIBER_REQUEST: "matchlinc"
        }
        
        target_agent = agent_routing.get(extracted_data.message_type, "recordlinc")
        
        # Add background task to forward to agent
        background_tasks.add_task(
            forward_to_agent,
            target_agent,
            extracted_data.dict()
        )
        
        return JSONResponse(
            content={
                "status": "success",
                "message": f"NPHIES message processed and forwarded to {target_agent}",
                "data": {
                    "message_type": extracted_data.message_type,
                    "target_agent": target_agent,
                    "patient_count": len(extracted_data.patients),
                    "claim_count": len(extracted_data.claims),
                    "eligibility_count": len(extracted_data.eligibility_requests)
                },
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error processing NPHIES message: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to process NPHIES message: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )

@app.get("/nphies/transform/{message_type}")
async def transform_to_healthlinc_format(message_type: NphiesMessageType, request: Request) -> JSONResponse:
    """Transform NPHIES data to HealthLinc internal format"""
    try:
        bundle_data = await request.json()
        extracted_data = extractor.extract_bundle_data(bundle_data)
        
        # Transform to HealthLinc format based on message type
        transformed_data = {}
        
        if message_type in [NphiesMessageType.CLAIM_REQUEST, NphiesMessageType.PRIORAUTH_REQUEST]:
            transformed_data = transform_claim_data(extracted_data)
        elif message_type == NphiesMessageType.ELIGIBILITY_REQUEST:
            transformed_data = transform_eligibility_data(extracted_data)
        elif message_type == NphiesMessageType.COMMUNICATION_REQUEST:
            transformed_data = transform_communication_data(extracted_data)
        
        return JSONResponse(
            content={
                "status": "success",
                "message": f"Data transformed to HealthLinc format",
                "data": transformed_data,
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )
    except Exception as e:
        logger.error(f"Error transforming data: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to transform data: {str(e)}",
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
        )

# Helper functions
async def forward_to_agent(agent_name: str, data: Dict[str, Any]) -> None:
    """Forward extracted data to appropriate HealthLinc agent"""
    try:
        # In production, this would make HTTP requests to agent endpoints
        logger.info(f"Forwarding data to {agent_name} agent")
        logger.debug(f"Data: {json.dumps(data, indent=2)}")
        
        # Simulate agent processing time
        import asyncio
        await asyncio.sleep(1)
        
    except Exception as e:
        logger.error(f"Error forwarding to agent {agent_name}: {str(e)}")

def transform_claim_data(extracted_data: NphiesExtractedData) -> Dict[str, Any]:
    """Transform NPHIES claim data to HealthLinc format"""
    transformed = {
        "healthlinc_format": "claim_submission",
        "patients": [],
        "claims": [],
        "providers": [],
        "payers": []
    }
    
    # Transform patients
    for patient in extracted_data.patients:
        transformed["patients"].append({
            "patient_id": patient.id,
            "name": patient.name,
            "birth_date": patient.birth_date,
            "gender": patient.gender,
            "identifiers": patient.identifier,
            "contact_info": patient.telecom
        })
    
    # Transform claims
    for claim in extracted_data.claims:
        transformed["claims"].append({
            "claim_id": claim.id,
            "status": claim.status,
            "type": claim.type,
            "use": claim.use,
            "patient_reference": claim.patient,
            "provider_reference": claim.provider,
            "items": claim.items,
            "total_amount": claim.total,
            "diagnosis_codes": [d.get("diagnosisCodeableConcept", {}) for d in claim.diagnosis],
            "supporting_info": claim.supporting_info
        })
    
    return transformed

def transform_eligibility_data(extracted_data: NphiesExtractedData) -> Dict[str, Any]:
    """Transform NPHIES eligibility data to HealthLinc format"""
    transformed = {
        "healthlinc_format": "eligibility_check",
        "patients": [],
        "eligibility_requests": [],
        "coverages": []
    }
    
    # Transform eligibility requests
    for eligibility in extracted_data.eligibility_requests:
        transformed["eligibility_requests"].append({
            "request_id": eligibility.id,
            "status": eligibility.status,
            "patient_reference": eligibility.patient,
            "provider_reference": eligibility.provider,
            "insurer_reference": eligibility.insurer,
            "purpose": eligibility.purpose,
            "service_period": eligibility.serviced_period
        })
    
    return transformed

def transform_communication_data(extracted_data: NphiesExtractedData) -> Dict[str, Any]:
    """Transform NPHIES communication data to HealthLinc format"""
    transformed = {
        "healthlinc_format": "communication_request",
        "communications": []
    }
    
    for comm in extracted_data.communications:
        transformed["communications"].append({
            "communication_id": comm.id,
            "status": comm.status,
            "category": comm.category,
            "priority": comm.priority,
            "subject_reference": comm.subject,
            "about": comm.about,
            "message_content": [p.get("contentString", "") for p in comm.payload],
            "sender": comm.sender,
            "recipients": comm.recipient
        })
    
    return transformed

@app.get("/nphies/supported-profiles")
async def get_supported_profiles():
    """Get list of supported NPHIES FHIR profiles"""
    return {
        "status": "success",
        "data": {
            "profiles": extractor.supported_profiles,
            "code_systems": extractor.code_systems,
            "message_types": [mt.value for mt in NphiesMessageType]
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "NPHIES Integration Service",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3010))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
