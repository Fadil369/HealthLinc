from fastapi import FastAPI, Depends, HTTPException, Body, status, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any, Optional
import httpx
import os
import json
import uvicorn
from urllib.parse import urljoin
import logging
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.getLevelName(os.environ.get("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("matchlinc")

app = FastAPI(title="MatchLinc Agent - Diagnosis-Procedure Matching Validation")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
PORT = int(os.environ.get("PORT", 3006))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
FHIR_SERVER_URL = os.environ.get("FHIR_SERVER_URL", "http://fhir-gateway:8000/fhir")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://authlinc:3003")

# Data models
class DiagnosisCode(BaseModel):
    code: str
    system: str = "http://hl7.org/fhir/sid/icd-10"
    display: str

class ProcedureCode(BaseModel):
    code: str
    system: str = "http://www.ama-assn.org/go/cpt"
    display: str

class ValidationRequest(BaseModel):
    diagnosis_codes: List[DiagnosisCode]
    procedure_codes: List[ProcedureCode]
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

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
    return {"status": "healthy", "service": "matchlinc"}

# API endpoints
@app.post("/validate")
async def validate_diagnosis_procedure_match(
    validation_request: ValidationRequest,
    user_data: Dict = Depends(validate_token)
):
    """
    Validate if the provided diagnosis codes support the procedure codes
    """
    # In a real implementation, this would use rules-based logic or ML models to validate
    # Here we're using a mock implementation for demonstration
    
    diagnosis_codes = [d.code for d in validation_request.diagnosis_codes]
    procedure_codes = [p.code for p in validation_request.procedure_codes]
    
    # Mock validation logic - this would be replaced with actual validation rules
    # based on medical coding guidelines, CMS rules, and payer policies
    validation_results = []
    
    for proc in validation_request.procedure_codes:
        proc_result = {
            "procedure_code": proc.code,
            "procedure_display": proc.display,
            "is_valid": False,
            "matched_diagnosis": None,
            "confidence": 0,
            "issues": [],
            "suggestions": []
        }
        
        # Very simplified mock validation logic
        # In reality, this would use complex rule sets and potentially ML
        for diag in validation_request.diagnosis_codes:
            # Mock check based on code patterns (would be much more sophisticated in reality)
            if (proc.code.startswith("992") and diag.code.startswith("M")):  # E&M codes with musculoskeletal
                proc_result["is_valid"] = True
                proc_result["matched_diagnosis"] = diag.code
                proc_result["confidence"] = 0.95
                break
            elif (proc.code.startswith("706") and diag.code.startswith("J")):  # Respiratory procedures
                proc_result["is_valid"] = True
                proc_result["matched_diagnosis"] = diag.code
                proc_result["confidence"] = 0.9
                break
            elif (proc.code.startswith("431") and diag.code.startswith("I")):  # Cardiovascular
                proc_result["is_valid"] = True
                proc_result["matched_diagnosis"] = diag.code
                proc_result["confidence"] = 0.85
                break
        
        if not proc_result["is_valid"]:
            proc_result["issues"].append("No supporting diagnosis found for this procedure")
            
            # Generate suggestions based on the procedure code
            if proc.code.startswith("992"):  # E&M codes
                proc_result["suggestions"].append("Consider adding a more specific diagnosis that details the patient's condition")
            elif proc.code.startswith("706"):  # Respiratory
                proc_result["suggestions"].append("Add a respiratory diagnosis (J00-J99) that supports this procedure")
            elif proc.code.startswith("431"):  # Cardiovascular
                proc_result["suggestions"].append("Add a cardiovascular diagnosis (I00-I99) that supports this procedure")
            else:
                proc_result["suggestions"].append("Review documentation for a diagnosis that supports medical necessity")
        
        validation_results.append(proc_result)
    
    # Overall validation result
    result = {
        "validation_results": validation_results,
        "overall_valid": all(r["is_valid"] for r in validation_results),
        "documentation_guidance": []
    }
    
    # Add documentation guidance if issues were found
    if not result["overall_valid"]:
        result["documentation_guidance"] = [
            "Ensure documentation clearly connects the diagnosis to the procedures performed",
            "Document the medical necessity for each procedure",
            "Include severity and impact on patient's function where appropriate"
        ]
    
    return result

@app.get("/coding-rules")
async def get_coding_rules(
    diagnosis_code: Optional[str] = None,
    procedure_code: Optional[str] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get coding rules for specific diagnosis or procedure codes
    """
    rules = []
    
    # In a real implementation, this would retrieve actual coding rules from a database
    # This is a mock implementation for demonstration purposes
    
    if diagnosis_code:
        if diagnosis_code.startswith("M"):
            rules.append({
                "code": diagnosis_code,
                "code_type": "diagnosis",
                "compatible_procedures": ["992xx", "977xx", "202xx"],
                "documentation_requirements": [
                    "Document location, severity, and functional impact",
                    "Note duration of symptoms",
                    "Include any failed conservative treatments"
                ],
                "common_pitfalls": [
                    "Using unspecified codes when more specific ones are available",
                    "Missing laterality when applicable"
                ]
            })
        elif diagnosis_code.startswith("J"):
            rules.append({
                "code": diagnosis_code,
                "code_type": "diagnosis",
                "compatible_procedures": ["706xx", "943xx"],
                "documentation_requirements": [
                    "Document severity and duration of symptoms",
                    "Note impact on breathing/oxygenation",
                    "Include relevant test results (PFTs, O2 sats)"
                ],
                "common_pitfalls": [
                    "Missing documentation of respiratory status",
                    "Using acute codes for chronic conditions"
                ]
            })
    
    if procedure_code:
        if procedure_code.startswith("992"):
            rules.append({
                "code": procedure_code,
                "code_type": "procedure",
                "supporting_diagnoses": ["Any medically necessary diagnosis"],
                "documentation_requirements": [
                    "Document history elements appropriate for service level",
                    "Include examination elements required for service level",
                    "Document appropriate complexity of medical decision making"
                ],
                "common_pitfalls": [
                    "Missing documentation to support the level of service billed",
                    "Inadequate medical decision making documentation"
                ]
            })
        elif procedure_code.startswith("706"):
            rules.append({
                "code": procedure_code,
                "code_type": "procedure",
                "supporting_diagnoses": ["J00-J99", "R05", "R06.0"],
                "documentation_requirements": [
                    "Document medical necessity for the procedure",
                    "Include relevant respiratory findings",
                    "Note the patient's response to the procedure"
                ],
                "common_pitfalls": [
                    "Missing documentation of medical necessity",
                    "Inadequate description of procedure findings"
                ]
            })
    
    return {"rules": rules}

@app.get("/training-resources")
async def get_training_resources(
    topic: Optional[str] = None,
    user_data: Dict = Depends(validate_token)
):
    """
    Get training resources for diagnosis-procedure matching
    """
    # In a real implementation, this would retrieve actual training resources
    # This is a mock implementation for demonstration purposes
    
    resources = [
        {
            "title": "Medical Necessity Documentation Guide",
            "type": "pdf",
            "url": "/resources/medical_necessity_guide.pdf",
            "topics": ["documentation", "medical necessity", "general"],
            "description": "Comprehensive guide to documenting medical necessity"
        },
        {
            "title": "ICD-10 to CPT Mapping Tutorial",
            "type": "video",
            "url": "/resources/icd10_cpt_mapping.mp4",
            "topics": ["coding", "diagnosis", "procedure", "mapping"],
            "description": "Tutorial on appropriate diagnosis-procedure mapping"
        },
        {
            "title": "Interactive Coding Quiz",
            "type": "interactive",
            "url": "/resources/coding_quiz",
            "topics": ["training", "testing", "diagnosis", "procedure"],
            "description": "Test your knowledge of procedure-diagnosis matching"
        }
    ]
    
    # Filter by topic if specified
    if topic:
        resources = [r for r in resources if topic.lower() in [t.lower() for t in r["topics"]]]
    
    return {"resources": resources}

# Main execution for direct running
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True if ENVIRONMENT == "development" else False)
