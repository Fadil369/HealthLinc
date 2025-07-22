"""
FHIR Adapter for RecordLinc

This module handles the translation between internal database models and FHIR resources.
"""

from typing import Dict, Any, List, Optional
import json
from datetime import datetime


def patient_to_fhir(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert internal patient data to a FHIR Patient resource
    
    Args:
        patient_data: Internal patient data
        
    Returns:
        Dict[str, Any]: FHIR Patient resource
    """
    # Create identifier list
    identifiers = [
        {
            "system": "https://healthlinc.app/ids/patients",
            "value": patient_data.get("identifier")
        }
    ]
    
    # Add insurance identifier if available
    if patient_data.get("insurance_id"):
        identifiers.append({
            "system": "https://healthlinc.app/ids/insurance",
            "value": patient_data.get("insurance_id")
        })
    
    # Create address
    address = []
    if patient_data.get("address"):
        addr = patient_data["address"]
        address.append({
            "use": "home",
            "type": "physical",
            "line": [addr.get("street", "")],
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "postalCode": addr.get("zip", ""),
            "country": addr.get("country", "US")
        })
    
    # Create telecom entries for contact info
    telecom = []
    if patient_data.get("phone"):
        telecom.append({
            "system": "phone",
            "value": patient_data["phone"],
            "use": "home"
        })
    if patient_data.get("email"):
        telecom.append({
            "system": "email",
            "value": patient_data["email"]
        })
    
    # Build FHIR Patient resource
    fhir_patient = {
        "resourceType": "Patient",
        "id": patient_data.get("identifier"),
        "identifier": identifiers,
        "active": True,
        "name": [
            {
                "use": "official",
                "family": patient_data.get("last_name", ""),
                "given": [patient_data.get("first_name", "")]
            }
        ],
        "telecom": telecom,
        "gender": patient_data.get("gender", "unknown"),
        "birthDate": patient_data.get("birth_date"),
        "address": address,
        "contact": [],
        "communication": [],
        "generalPractitioner": []
    }
    
    # Add primary provider if available
    if patient_data.get("primary_provider_id"):
        fhir_patient["generalPractitioner"].append({
            "reference": f"Practitioner/{patient_data['primary_provider_id']}",
            "type": "Practitioner"
        })
    
    # Add allergies as an extension if available
    if patient_data.get("allergies") and len(patient_data["allergies"]) > 0:
        if "extension" not in fhir_patient:
            fhir_patient["extension"] = []
        
        fhir_patient["extension"].append({
            "url": "https://healthlinc.app/extensions/patient-allergies",
            "valueString": json.dumps(patient_data["allergies"])
        })
    
    # Add medications as an extension if available
    if patient_data.get("medications") and len(patient_data["medications"]) > 0:
        if "extension" not in fhir_patient:
            fhir_patient["extension"] = []
        
        fhir_patient["extension"].append({
            "url": "https://healthlinc.app/extensions/patient-medications",
            "valueString": json.dumps(patient_data["medications"])
        })
    
    return fhir_patient


def fhir_to_patient(fhir_patient: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a FHIR Patient resource to internal patient data
    
    Args:
        fhir_patient: FHIR Patient resource
        
    Returns:
        Dict[str, Any]: Internal patient data
    """
    # Extract patient identifier
    identifier = None
    insurance_id = None
    
    for ident in fhir_patient.get("identifier", []):
        if ident.get("system") == "https://healthlinc.app/ids/patients":
            identifier = ident.get("value")
        elif ident.get("system") == "https://healthlinc.app/ids/insurance":
            insurance_id = ident.get("value")
    
    # If no custom identifier, use the resource ID
    if not identifier and "id" in fhir_patient:
        identifier = fhir_patient["id"]
    
    # Extract name
    first_name = ""
    last_name = ""
    
    if fhir_patient.get("name") and len(fhir_patient["name"]) > 0:
        first_name_list = fhir_patient["name"][0].get("given", [])
        if first_name_list and len(first_name_list) > 0:
            first_name = first_name_list[0]
        last_name = fhir_patient["name"][0].get("family", "")
    
    # Extract address
    address = {}
    if fhir_patient.get("address") and len(fhir_patient["address"]) > 0:
        addr = fhir_patient["address"][0]
        line = addr.get("line", [""])[0] if addr.get("line") and len(addr.get("line", [])) > 0 else ""
        
        address = {
            "street": line,
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "zip": addr.get("postalCode", ""),
            "country": addr.get("country", "US")
        }
    
    # Extract contact info
    phone = None
    email = None
    
    for telecom in fhir_patient.get("telecom", []):
        if telecom.get("system") == "phone":
            phone = telecom.get("value")
        elif telecom.get("system") == "email":
            email = telecom.get("value")
    
    # Extract primary provider
    primary_provider_id = None
    if fhir_patient.get("generalPractitioner") and len(fhir_patient["generalPractitioner"]) > 0:
        reference = fhir_patient["generalPractitioner"][0].get("reference", "")
        if reference.startswith("Practitioner/"):
            primary_provider_id = reference[13:]  # Remove "Practitioner/" prefix
    
    # Extract extensions
    allergies = []
    medications = []
    
    for ext in fhir_patient.get("extension", []):
        if ext.get("url") == "https://healthlinc.app/extensions/patient-allergies":
            try:
                allergies = json.loads(ext.get("valueString", "[]"))
            except json.JSONDecodeError:
                allergies = []
        
        elif ext.get("url") == "https://healthlinc.app/extensions/patient-medications":
            try:
                medications = json.loads(ext.get("valueString", "[]"))
            except json.JSONDecodeError:
                medications = []
    
    # Build internal patient data
    patient_data = {
        "identifier": identifier,
        "first_name": first_name,
        "last_name": last_name,
        "birth_date": fhir_patient.get("birthDate"),
        "gender": fhir_patient.get("gender", "unknown"),
        "address": address,
        "phone": phone,
        "email": email,
        "insurance_id": insurance_id,
        "primary_provider_id": primary_provider_id,
        "allergies": allergies,
        "medications": medications,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    return patient_data


def observation_to_fhir(observation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert internal observation data to a FHIR Observation resource
    
    Args:
        observation_data: Internal observation data
        
    Returns:
        Dict[str, Any]: FHIR Observation resource
    """
    # Determine the value[x] field based on the type of the value
    value_field = None
    value_content = None
    
    if isinstance(observation_data.get("value"), str):
        value_field = "valueString"
        value_content = observation_data["value"]
    elif isinstance(observation_data.get("value"), (int, float)):
        value_field = "valueQuantity"
        value_content = {
            "value": observation_data["value"],
            "unit": observation_data.get("unit", ""),
            "system": "https://healthlinc.app/units",
            "code": observation_data.get("unit_code", "")
        }
    elif isinstance(observation_data.get("value"), dict):
        value_field = "valueCodeableConcept"
        value_content = {
            "coding": [
                {
                    "system": observation_data["value"].get("system", "https://healthlinc.app/codes"),
                    "code": observation_data["value"].get("code", ""),
                    "display": observation_data["value"].get("display", "")
                }
            ],
            "text": observation_data["value"].get("text", "")
        }
    else:
        value_field = "valueString"
        value_content = str(observation_data.get("value", ""))
    
    # Build FHIR Observation resource
    fhir_observation = {
        "resourceType": "Observation",
        "id": observation_data.get("identifier"),
        "status": observation_data.get("status", "final"),
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "vital-signs",
                        "display": "Vital Signs"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": observation_data.get("code_system", "https://healthlinc.app/codes"),
                    "code": observation_data.get("code"),
                    "display": observation_data.get("code_display", "")
                }
            ],
            "text": observation_data.get("code_display", "")
        },
        "subject": {
            "reference": f"Patient/{observation_data.get('patient_id')}",
            "type": "Patient"
        },
        value_field: value_content,
        "effectiveDateTime": observation_data.get("effective_date"),
        "issued": observation_data.get("created_at", datetime.now().isoformat())
    }
    
    # Add performer if available
    if observation_data.get("performer_id"):
        fhir_observation["performer"] = [
            {
                "reference": f"Practitioner/{observation_data['performer_id']}",
                "type": "Practitioner"
            }
        ]
    
    # Add notes if available
    if observation_data.get("notes"):
        fhir_observation["note"] = [
            {
                "text": observation_data["notes"]
            }
        ]
    
    return fhir_observation


def fhir_to_observation(fhir_observation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a FHIR Observation resource to internal observation data
    
    Args:
        fhir_observation: FHIR Observation resource
        
    Returns:
        Dict[str, Any]: Internal observation data
    """
    # Extract patient ID
    patient_id = None
    if fhir_observation.get("subject") and "reference" in fhir_observation["subject"]:
        reference = fhir_observation["subject"]["reference"]
        if reference.startswith("Patient/"):
            patient_id = reference[8:]  # Remove "Patient/" prefix
    
    # Extract observation code
    code = ""
    code_system = "https://healthlinc.app/codes"
    code_display = ""
    
    if fhir_observation.get("code") and "coding" in fhir_observation["code"]:
        for coding in fhir_observation["code"]["coding"]:
            code = coding.get("code", "")
            code_system = coding.get("system", code_system)
            code_display = coding.get("display", "")
            break  # Just take the first coding
    
    # Extract the value
    value = None
    unit = None
    unit_code = None
    
    if "valueQuantity" in fhir_observation:
        value = fhir_observation["valueQuantity"].get("value")
        unit = fhir_observation["valueQuantity"].get("unit")
        unit_code = fhir_observation["valueQuantity"].get("code")
    elif "valueString" in fhir_observation:
        value = fhir_observation["valueString"]
    elif "valueCodeableConcept" in fhir_observation:
        value = {
            "system": fhir_observation["valueCodeableConcept"]["coding"][0].get("system") if fhir_observation["valueCodeableConcept"].get("coding") else "",
            "code": fhir_observation["valueCodeableConcept"]["coding"][0].get("code") if fhir_observation["valueCodeableConcept"].get("coding") else "",
            "display": fhir_observation["valueCodeableConcept"]["coding"][0].get("display") if fhir_observation["valueCodeableConcept"].get("coding") else "",
            "text": fhir_observation["valueCodeableConcept"].get("text", "")
        }
    elif "valueBoolean" in fhir_observation:
        value = fhir_observation["valueBoolean"]
    
    # Extract performer
    performer_id = None
    if fhir_observation.get("performer") and len(fhir_observation["performer"]) > 0:
        reference = fhir_observation["performer"][0].get("reference", "")
        if reference.startswith("Practitioner/"):
            performer_id = reference[13:]  # Remove "Practitioner/" prefix
    
    # Extract notes
    notes = None
    if fhir_observation.get("note") and len(fhir_observation["note"]) > 0:
        notes = fhir_observation["note"][0].get("text", "")
    
    # Build internal observation data
    observation_data = {
        "identifier": fhir_observation.get("id"),
        "patient_id": patient_id,
        "code": code,
        "code_system": code_system,
        "code_display": code_display,
        "value": value,
        "unit": unit,
        "unit_code": unit_code,
        "status": fhir_observation.get("status", "final"),
        "effective_date": fhir_observation.get("effectiveDateTime"),
        "performer_id": performer_id,
        "notes": notes,
        "created_at": fhir_observation.get("issued", datetime.now().isoformat()),
        "updated_at": datetime.now().isoformat()
    }
    
    return observation_data
