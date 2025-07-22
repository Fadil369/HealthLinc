from fastapi import FastAPI, Depends, HTTPException, Body, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any, Optional
import httpx
import os
import json
import uvicorn
from urllib.parse import urljoin
import logging

# Configure logging
logging.basicConfig(
    level=logging.getLevelName(os.environ.get("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("doculinc")

app = FastAPI(title="DocuLinc Agent - Clinical Documentation Enhancement Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
PORT = int(os.environ.get("PORT", 3005))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
FHIR_SERVER_URL = os.environ.get("FHIR_SERVER_URL", "http://fhir-gateway:8000/fhir")
AUTH_SERVICE_URL = os.environ.get("AUTH_SERVICE_URL", "http://authlinc:3003")

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
    return {"status": "healthy", "service": "doculinc"}

# API endpoints
@app.get("/templates")
async def get_templates(user_data: Dict = Depends(validate_token)):
    """
    Get available documentation templates
    """
    templates = [
        {
            "id": "template-1",
            "name": "General Physical Exam",
            "specialty": "Primary Care",
            "sections": ["Chief Complaint", "HPI", "Review of Systems", "Physical Exam", "Assessment", "Plan"]
        },
        {
            "id": "template-2",
            "name": "Diabetic Follow-up",
            "specialty": "Endocrinology",
            "sections": ["Blood Glucose Readings", "Medication Adherence", "Foot Exam", "Treatment Plan"]
        },
        {
            "id": "template-3",
            "name": "Orthopedic Evaluation",
            "specialty": "Orthopedics",
            "sections": ["Injury Description", "Pain Assessment", "Range of Motion", "Treatment Options"]
        },
        {
            "id": "template-4",
            "name": "Annual Wellness Visit",
            "specialty": "Primary Care",
            "sections": ["Preventive Services", "Health Risk Assessment", "Personalized Prevention Plan"]
        }
    ]
    
    return {"templates": templates}

@app.get("/templates/{template_id}")
async def get_template_details(
    template_id: str,
    user_data: Dict = Depends(validate_token)
):
    """
    Get detailed template structure with all fields and prompts
    """
    # In a real implementation, fetch from database based on template_id
    # This is a mock example for demonstration
    
    if template_id == "template-1":
        return {
            "id": "template-1",
            "name": "General Physical Exam",
            "specialty": "Primary Care",
            "sections": [
                {
                    "name": "Chief Complaint",
                    "fields": [
                        {
                            "id": "cc-description",
                            "type": "text",
                            "label": "Chief complaint description",
                            "required": True,
                            "helper_text": "Document the patient's main concern in their own words"
                        },
                        {
                            "id": "cc-duration",
                            "type": "text",
                            "label": "Duration of symptoms",
                            "required": False,
                            "helper_text": "How long has the patient been experiencing these symptoms?"
                        }
                    ]
                },
                {
                    "name": "HPI",
                    "fields": [
                        {
                            "id": "hpi-location",
                            "type": "text",
                            "label": "Location",
                            "required": False,
                            "helper_text": "Where is the pain or symptom located?"
                        },
                        {
                            "id": "hpi-quality",
                            "type": "text",
                            "label": "Quality",
                            "required": False,
                            "helper_text": "How would the patient describe the pain or symptom?"
                        },
                        {
                            "id": "hpi-severity",
                            "type": "select",
                            "label": "Severity",
                            "required": True,
                            "options": ["Mild", "Moderate", "Severe"],
                            "helper_text": "How severe is the pain or symptom?"
                        }
                    ]
                }
                # Additional sections would be included here
            ],
            "medical_necessity_prompts": [
                "Document any functional limitations related to the complaint",
                "Note how symptoms affect activities of daily living",
                "Include objective measurements where applicable"
            ]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found"
        )

@app.post("/generate-documentation")
async def generate_documentation(
    request_data: Dict = Body(...),
    user_data: Dict = Depends(validate_token)
):
    """
    Generate documentation based on template and input data
    """
    template_id = request_data.get("template_id")
    patient_id = request_data.get("patient_id")
    form_data = request_data.get("form_data", {})
    
    if not template_id or not patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required fields: template_id or patient_id"
        )
    
    # In a production system, this would:
    # 1. Retrieve the template structure
    # 2. Fetch relevant patient data from FHIR
    # 3. Generate documentation using the form data and patient context
    # 4. Apply medical necessity enhancement
    
    # This is a simplified mock response
    generated_document = {
        "id": f"doc-{patient_id}-{template_id}",
        "patient_id": patient_id,
        "template_id": template_id,
        "content": "Generated clinical documentation would appear here, formatted according to the template structure and incorporating the form data provided.",
        "medical_necessity_score": 85,
        "improvement_suggestions": [
            "Add more detail about how symptoms impact daily activities",
            "Include specific measurements for objective findings",
            "Document failed conservative treatments to establish necessity"
        ]
    }
    
    return generated_document

@app.post("/validate-documentation")
async def validate_documentation(
    request_data: Dict = Body(...),
    user_data: Dict = Depends(validate_token)
):
    """
    Validate documentation for medical necessity and completeness
    """
    document_content = request_data.get("document_content")
    
    if not document_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing document content"
        )
    
    # In a production system, this would analyze the documentation for:
    # - Medical necessity criteria
    # - Completeness
    # - Consistency
    # - Compliance with billing requirements
    
    # Mock response
    validation_result = {
        "medical_necessity_score": 75,
        "completeness_score": 80,
        "gaps": [
            {
                "section": "Assessment",
                "issue": "Missing severity assessment for primary diagnosis"
            },
            {
                "section": "Plan",
                "issue": "Treatment rationale not clearly linked to functional limitations"
            }
        ],
        "suggestions": [
            "Document how the condition limits the patient's ability to perform specific activities",
            "Include failed conservative treatments to justify the current plan",
            "Quantify severity with appropriate scales or measurements"
        ],
        "billing_impact": {
            "current_level": "3",
            "potential_level": "4",
            "missing_elements_for_upgrade": [
                "Comprehensive review of systems",
                "Detailed examination of affected body area"
            ]
        }
    }
    
    return validation_result

# Main execution for direct running
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True if ENVIRONMENT == "development" else False)
