"""
NPHIES Data Models and Validators

Defines comprehensive data models for NPHIES FHIR resources with validation
and transformation capabilities for integration with HealthLinc.
"""

from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

class NphiesCodeSystem(str, Enum):
    """NPHIES-specific code systems"""
    KSA_MESSAGE_EVENTS = "http://nphies.sa/terminology/CodeSystem/ksa-message-events"
    COVERAGE_TYPE = "http://nphies.sa/terminology/CodeSystem/coverage-type"
    CLAIM_SUBTYPE = "http://nphies.sa/terminology/CodeSystem/claim-subtype"
    DIAGNOSIS_TYPE = "http://nphies.sa/terminology/CodeSystem/diagnosis-type"
    DIAGNOSIS_ON_ADMISSION = "http://nphies.sa/terminology/CodeSystem/diagnosis-on-admission"
    CLAIM_INFO_CATEGORY = "http://nphies.sa/terminology/CodeSystem/claim-information-category"
    PROCEDURES = "http://nphies.sa/terminology/CodeSystem/procedures"
    MOH_CATEGORY = "http://nphies.sa/terminology/CodeSystem/moh-category"
    SCIENTIFIC_CODES = "http://nphies.sa/terminology/CodeSystem/scientific-codes"
    PRACTICE_CODES = "http://nphies.sa/terminology/CodeSystem/practice-codes"
    ORGANIZATION_TYPE = "http://nphies.sa/terminology/CodeSystem/organization-type"
    PROVIDER_TYPE = "http://nphies.sa/terminology/CodeSystem/provider-type"
    KSA_GENDER = "http://nphies.sa/terminology/CodeSystem/ksa-administrative-gender"
    OCCUPATION = "http://nphies.sa/terminology/CodeSystem/occupation"
    SERVICE_TYPE = "http://nphies.sa/terminology/CodeSystem/service-type"
    ADMIT_SOURCE = "http://nphies.sa/terminology/CodeSystem/admit-source"
    DISCHARGE_DISPOSITION = "http://nphies.sa/terminology/CodeSystem/discharge-disposition"
    EMERGENCY_ARRIVAL = "http://nphies.sa/terminology/CodeSystem/emergency-arrival-code"
    TRIAGE_CATEGORY = "http://nphies.sa/terminology/CodeSystem/triage-category"

class NphiesExtensionUrl(str, Enum):
    """NPHIES-specific extension URLs"""
    NEWBORN = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-newborn"
    NATIONALITY = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-nationality"
    OCCUPATION = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-occupation"
    KSA_GENDER = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-ksa-administrative-gender"
    PROVIDER_TYPE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-provider-type"
    ELIGIBILITY_OFFLINE_REF = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-eligibility-offline-reference"
    ELIGIBILITY_OFFLINE_DATE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-eligibility-offline-date"
    ENCOUNTER = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-encounter"
    EPISODE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-episode"
    ACCOUNTING_PERIOD = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-accountingPeriod"
    TAX = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-tax"
    PATIENT_SHARE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-patient-share"
    PACKAGE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-package"
    MATERNITY = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-maternity"
    PATIENT_INVOICE = "http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/extension-patientInvoice"

# Core Data Models
class NphiesCoding(BaseModel):
    """NPHIES Coding structure"""
    system: Optional[str] = None
    code: Optional[str] = None
    display: Optional[str] = None

class NphiesCodeableConcept(BaseModel):
    """NPHIES CodeableConcept structure"""
    coding: Optional[List[NphiesCoding]] = []
    text: Optional[str] = None

class NphiesIdentifier(BaseModel):
    """NPHIES Identifier structure"""
    use: Optional[str] = None
    type: Optional[NphiesCodeableConcept] = None
    system: Optional[str] = None
    value: str
    period: Optional[Dict[str, str]] = None

class NphiesReference(BaseModel):
    """NPHIES Reference structure"""
    reference: Optional[str] = None
    type: Optional[str] = None
    identifier: Optional[NphiesIdentifier] = None
    display: Optional[str] = None

class NphiesMoney(BaseModel):
    """NPHIES Money structure"""
    value: float
    currency: str = "SAR"

class NphiesQuantity(BaseModel):
    """NPHIES Quantity structure"""
    value: float
    comparator: Optional[str] = None
    unit: Optional[str] = None
    system: Optional[str] = None
    code: Optional[str] = None

class NphiesAddress(BaseModel):
    """NPHIES Address structure"""
    use: Optional[str] = None
    type: Optional[str] = None
    text: Optional[str] = None
    line: Optional[List[str]] = []
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    period: Optional[Dict[str, str]] = None

class NphiesTelecom(BaseModel):
    """NPHIES ContactPoint structure"""
    system: Optional[str] = None  # phone, fax, email, pager, url, sms, other
    value: Optional[str] = None
    use: Optional[str] = None  # home, work, temp, old, mobile
    rank: Optional[int] = None
    period: Optional[Dict[str, str]] = None

class NphiesHumanName(BaseModel):
    """NPHIES HumanName structure"""
    use: Optional[str] = None  # usual, official, temp, nickname, anonymous, old, maiden
    text: Optional[str] = None
    family: Optional[str] = None
    given: Optional[List[str]] = []
    prefix: Optional[List[str]] = []
    suffix: Optional[List[str]] = []
    period: Optional[Dict[str, str]] = None

class NphiesExtension(BaseModel):
    """NPHIES Extension structure"""
    url: str
    valueBoolean: Optional[bool] = None
    valueString: Optional[str] = None
    valueDate: Optional[str] = None
    valueDateTime: Optional[str] = None
    valueReference: Optional[NphiesReference] = None
    valueCodeableConcept: Optional[NphiesCodeableConcept] = None
    valueMoney: Optional[NphiesMoney] = None
    valueQuantity: Optional[NphiesQuantity] = None
    valueIdentifier: Optional[NphiesIdentifier] = None
    valueAttachment: Optional[Dict[str, Any]] = None

# Resource-specific Models
class NphiesPatient(BaseModel):
    """NPHIES Patient resource"""
    resourceType: str = "Patient"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    extension: Optional[List[NphiesExtension]] = []
    identifier: Optional[List[NphiesIdentifier]] = []
    active: Optional[bool] = True
    name: Optional[List[NphiesHumanName]] = []
    telecom: Optional[List[NphiesTelecom]] = []
    gender: Optional[str] = None
    _gender: Optional[Dict[str, Any]] = None  # For KSA gender extension
    birthDate: Optional[str] = None
    deceased: Optional[Union[bool, str]] = None
    address: Optional[List[NphiesAddress]] = []
    maritalStatus: Optional[NphiesCodeableConcept] = None
    contact: Optional[List[Dict[str, Any]]] = []
    communication: Optional[List[Dict[str, Any]]] = []
    generalPractitioner: Optional[List[NphiesReference]] = []

class NphiesOrganization(BaseModel):
    """NPHIES Organization resource"""
    resourceType: str = "Organization"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    extension: Optional[List[NphiesExtension]] = []
    identifier: Optional[List[NphiesIdentifier]] = []
    active: Optional[bool] = True
    type: Optional[List[NphiesCodeableConcept]] = []
    name: Optional[str] = None
    alias: Optional[List[str]] = []
    telecom: Optional[List[NphiesTelecom]] = []
    address: Optional[List[NphiesAddress]] = []
    partOf: Optional[NphiesReference] = None
    contact: Optional[List[Dict[str, Any]]] = []

class NphiesPractitioner(BaseModel):
    """NPHIES Practitioner resource"""
    resourceType: str = "Practitioner"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    identifier: Optional[List[NphiesIdentifier]] = []
    active: Optional[bool] = True
    name: Optional[List[NphiesHumanName]] = []
    telecom: Optional[List[NphiesTelecom]] = []
    address: Optional[List[NphiesAddress]] = []
    gender: Optional[str] = None
    birthDate: Optional[str] = None
    photo: Optional[List[Dict[str, Any]]] = []
    qualification: Optional[List[Dict[str, Any]]] = []
    communication: Optional[List[NphiesCodeableConcept]] = []

class NphiesLocation(BaseModel):
    """NPHIES Location resource"""
    resourceType: str = "Location"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    identifier: Optional[List[NphiesIdentifier]] = []
    status: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    mode: Optional[str] = None
    type: Optional[List[NphiesCodeableConcept]] = []
    telecom: Optional[List[NphiesTelecom]] = []
    address: Optional[NphiesAddress] = None
    physicalType: Optional[NphiesCodeableConcept] = None
    managingOrganization: Optional[NphiesReference] = None

class NphiesCoverage(BaseModel):
    """NPHIES Coverage resource"""
    resourceType: str = "Coverage"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    identifier: Optional[List[NphiesIdentifier]] = []
    status: str
    type: Optional[NphiesCodeableConcept] = None
    policyHolder: Optional[NphiesReference] = None
    subscriber: Optional[NphiesReference] = None
    subscriberId: Optional[str] = None
    beneficiary: NphiesReference
    dependent: Optional[str] = None
    relationship: Optional[NphiesCodeableConcept] = None
    period: Optional[Dict[str, str]] = None
    payor: List[NphiesReference]
    class_: Optional[List[Dict[str, Any]]] = Field(None, alias="class")
    order: Optional[int] = None
    network: Optional[str] = None
    contract: Optional[List[NphiesReference]] = []

class NphiesEncounter(BaseModel):
    """NPHIES Encounter resource"""
    resourceType: str = "Encounter"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    extension: Optional[List[NphiesExtension]] = []
    identifier: Optional[List[NphiesIdentifier]] = []
    status: str
    statusHistory: Optional[List[Dict[str, Any]]] = []
    class_: Optional[NphiesCoding] = Field(None, alias="class")
    classHistory: Optional[List[Dict[str, Any]]] = []
    type: Optional[List[NphiesCodeableConcept]] = []
    serviceType: Optional[NphiesCodeableConcept] = None
    priority: Optional[NphiesCodeableConcept] = None
    subject: Optional[NphiesReference] = None
    episodeOfCare: Optional[List[NphiesReference]] = []
    basedOn: Optional[List[NphiesReference]] = []
    participant: Optional[List[Dict[str, Any]]] = []
    appointment: Optional[List[NphiesReference]] = []
    period: Optional[Dict[str, str]] = None
    length: Optional[NphiesQuantity] = None
    reasonCode: Optional[List[NphiesCodeableConcept]] = []
    reasonReference: Optional[List[NphiesReference]] = []
    diagnosis: Optional[List[Dict[str, Any]]] = []
    account: Optional[List[NphiesReference]] = []
    hospitalization: Optional[Dict[str, Any]] = None
    location: Optional[List[Dict[str, Any]]] = []
    serviceProvider: Optional[NphiesReference] = None
    partOf: Optional[NphiesReference] = None

class NphiesClaim(BaseModel):
    """NPHIES Claim resource"""
    resourceType: str = "Claim"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    extension: Optional[List[NphiesExtension]] = []
    identifier: Optional[List[NphiesIdentifier]] = []
    status: str
    type: NphiesCodeableConcept
    subType: Optional[NphiesCodeableConcept] = None
    use: str  # claim, preauthorization, predetermination
    patient: NphiesReference
    billablePeriod: Optional[Dict[str, str]] = None
    created: str
    enterer: Optional[NphiesReference] = None
    insurer: NphiesReference
    provider: NphiesReference
    priority: NphiesCodeableConcept
    fundsReserve: Optional[NphiesCodeableConcept] = None
    related: Optional[List[Dict[str, Any]]] = []
    prescription: Optional[NphiesReference] = None
    originalPrescription: Optional[NphiesReference] = None
    payee: Optional[Dict[str, Any]] = None
    referral: Optional[NphiesReference] = None
    facility: Optional[NphiesReference] = None
    careTeam: Optional[List[Dict[str, Any]]] = []
    supportingInfo: Optional[List[Dict[str, Any]]] = []
    diagnosis: Optional[List[Dict[str, Any]]] = []
    procedure: Optional[List[Dict[str, Any]]] = []
    insurance: List[Dict[str, Any]]
    accident: Optional[Dict[str, Any]] = None
    item: Optional[List[Dict[str, Any]]] = []
    total: Optional[NphiesMoney] = None

class NphiesCoverageEligibilityRequest(BaseModel):
    """NPHIES CoverageEligibilityRequest resource"""
    resourceType: str = "CoverageEligibilityRequest"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    extension: Optional[List[NphiesExtension]] = []
    identifier: Optional[List[NphiesIdentifier]] = []
    status: str
    priority: Optional[NphiesCodeableConcept] = None
    purpose: List[str]  # auth-requirements, benefits, discovery, validation
    patient: NphiesReference
    serviced: Optional[Union[str, Dict[str, str]]] = None
    created: str
    enterer: Optional[NphiesReference] = None
    provider: NphiesReference
    insurer: NphiesReference
    facility: Optional[NphiesReference] = None
    supportingInfo: Optional[List[Dict[str, Any]]] = []
    insurance: List[Dict[str, Any]]
    item: Optional[List[Dict[str, Any]]] = []

class NphiesCommunicationRequest(BaseModel):
    """NPHIES CommunicationRequest resource"""
    resourceType: str = "CommunicationRequest"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    identifier: Optional[List[NphiesIdentifier]] = []
    basedOn: Optional[List[NphiesReference]] = []
    replaces: Optional[List[NphiesReference]] = []
    groupIdentifier: Optional[NphiesIdentifier] = None
    status: str
    statusReason: Optional[NphiesCodeableConcept] = None
    category: Optional[List[NphiesCodeableConcept]] = []
    priority: Optional[str] = None
    doNotPerform: Optional[bool] = None
    medium: Optional[List[NphiesCodeableConcept]] = []
    subject: Optional[NphiesReference] = None
    about: Optional[List[Dict[str, Any]]] = []
    encounter: Optional[NphiesReference] = None
    payload: Optional[List[Dict[str, Any]]] = []
    occurrence: Optional[Union[str, Dict[str, str]]] = None
    authoredOn: Optional[str] = None
    requester: Optional[NphiesReference] = None
    recipient: Optional[List[NphiesReference]] = []
    sender: Optional[NphiesReference] = None
    reasonCode: Optional[List[NphiesCodeableConcept]] = []
    reasonReference: Optional[List[NphiesReference]] = []
    note: Optional[List[Dict[str, str]]] = []

class NphiesMessageHeader(BaseModel):
    """NPHIES MessageHeader resource"""
    resourceType: str = "MessageHeader"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    event: Union[NphiesCoding, str]  # Can be Coding or canonical URI
    destination: Optional[List[Dict[str, Any]]] = []
    sender: Optional[NphiesReference] = None
    enterer: Optional[NphiesReference] = None
    author: Optional[NphiesReference] = None
    source: Dict[str, Any]
    responsible: Optional[NphiesReference] = None
    reason: Optional[NphiesCodeableConcept] = None
    response: Optional[Dict[str, Any]] = None
    focus: Optional[List[NphiesReference]] = []
    definition: Optional[str] = None

    @validator('event', pre=True)
    def validate_event(cls, v):
        if isinstance(v, dict):
            return NphiesCoding(**v)
        return v

class NphiesBundle(BaseModel):
    """NPHIES Bundle resource"""
    resourceType: str = "Bundle"
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    identifier: Optional[NphiesIdentifier] = None
    type: str  # document, message, transaction, transaction-response, batch, batch-response, history, searchset, collection
    timestamp: Optional[str] = None
    total: Optional[int] = None
    link: Optional[List[Dict[str, str]]] = []
    entry: Optional[List[Dict[str, Any]]] = []
    signature: Optional[Dict[str, Any]] = None

# Validation and transformation utilities
class NphiesValidator:
    """Validator for NPHIES FHIR resources"""
    
    @staticmethod
    def validate_saudi_national_id(national_id: str) -> bool:
        """Validate Saudi National ID format"""
        if not national_id or len(national_id) != 10:
            return False
        return national_id.isdigit() and national_id.startswith(('1', '2'))
    
    @staticmethod
    def validate_iqama_number(iqama: str) -> bool:
        """Validate Iqama number format"""
        if not iqama or len(iqama) != 10:
            return False
        return iqama.isdigit() and not iqama.startswith(('1', '2'))
    
    @staticmethod
    def validate_provider_license(license_id: str) -> bool:
        """Validate NPHIES provider license format"""
        return license_id and license_id.startswith(('N-F-', 'PR-'))
    
    @staticmethod
    def validate_payer_license(license_id: str) -> bool:
        """Validate NPHIES payer license format"""
        return license_id and license_id.startswith(('N-I-', 'INS-'))
    
    @staticmethod
    def validate_practitioner_license(license_id: str) -> bool:
        """Validate NPHIES practitioner license format"""
        return license_id and license_id.startswith(('N-P-', 'MDH-'))

class NphiesTransformer:
    """Transformer for converting between NPHIES and HealthLinc formats"""
    
    @staticmethod
    def extract_patient_identifiers(patient: NphiesPatient) -> Dict[str, str]:
        """Extract structured identifiers from patient"""
        identifiers = {}
        
        for identifier in patient.identifier or []:
            system = identifier.system or ""
            if "nationalid" in system:
                identifiers["national_id"] = identifier.value
            elif "iqama" in system:
                identifiers["iqama"] = identifier.value
            elif "passport" in system:
                identifiers["passport"] = identifier.value
            elif "mrn" in system.lower():
                identifiers["medical_record_number"] = identifier.value
        
        return identifiers
    
    @staticmethod
    def extract_organization_info(organization: NphiesOrganization) -> Dict[str, Any]:
        """Extract structured organization information"""
        info = {
            "id": organization.id,
            "name": organization.name,
            "active": organization.active,
            "type": "unknown",
            "licenses": []
        }
        
        # Extract organization type
        for org_type in organization.type or []:
            for coding in org_type.coding or []:
                if coding.code == "prov":
                    info["type"] = "provider"
                elif coding.code == "ins":
                    info["type"] = "insurer"
        
        # Extract licenses
        for identifier in organization.identifier or []:
            system = identifier.system or ""
            if "provider-license" in system:
                info["licenses"].append({"type": "provider", "value": identifier.value})
            elif "payer-license" in system:
                info["licenses"].append({"type": "payer", "value": identifier.value})
        
        return info
    
    @staticmethod
    def extract_claim_summary(claim: NphiesClaim) -> Dict[str, Any]:
        """Extract claim summary information"""
        summary = {
            "id": claim.id,
            "status": claim.status,
            "type": claim.type.coding[0].code if claim.type.coding else "unknown",
            "use": claim.use,
            "created": claim.created,
            "total_amount": 0.0,
            "currency": "SAR",
            "diagnosis_count": len(claim.diagnosis or []),
            "item_count": len(claim.item or [])
        }
        
        if claim.total:
            summary["total_amount"] = claim.total.value
            summary["currency"] = claim.total.currency
        
        return summary
    
    @staticmethod
    def to_healthlinc_format(nphies_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform NPHIES data to HealthLinc internal format"""
        return {
            "source": "nphies",
            "timestamp": datetime.now().isoformat(),
            "original_data": nphies_data,
            "transformed_at": datetime.now().isoformat()
        }
