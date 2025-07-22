"""
NPHIES Integration Module for BrainSAIT Healthcare Ecosystem
Handles communication with Saudi Arabian National Platform for Health Information Exchange Services
Author: BrainSAIT Team
Date: May 21, 2025
"""

import os
import json
import logging
import requests
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from requests.auth import HTTPBasicAuth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("nphies_integration.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("nphies_integration")

class NPHIESIntegration:
    """Integration client for NPHIES Saudi Arabia"""
    
    def __init__(self, 
                 api_url: Optional[str] = None, 
                 base_url: Optional[str] = None,
                 client_id: Optional[str] = None,
                 client_secret: Optional[str] = None):
        """
        Initialize NPHIES Integration client
        
        Args:
            api_url: NPHIES API URL (defaults to environment variable)
            base_url: NPHIES Base URL (defaults to environment variable)
            client_id: NPHIES client ID (defaults to environment variable)
            client_secret: NPHIES client secret (defaults to environment variable)
        """
        # Load from provided parameters or environment variables
        self.api_url = api_url or os.environ.get("NPHIES_API_URL", "http://172.16.6.66:7000")
        self.base_url = base_url or os.environ.get("NPHIES_BASE_URL", "https://HSB.nphies.sa/$process-message")
        self.client_id = client_id or os.environ.get("NPHIES_CLIENT_ID", "developer_client")
        self.client_secret = client_secret or os.environ.get("NPHIES_CLIENT_SECRET", "developer_secret")
        
        # Access token storage
        self.access_token = None
        self.token_expiry = None
        
        logger.info(f"NPHIES Integration initialized with API URL: {self.api_url}")

    def _get_auth_token(self) -> str:
        """
        Get authentication token from NPHIES
        
        Returns:
            str: Authentication token
        """
        try:
            logger.info("Getting authentication token from NPHIES")
            
            # Check if we have a valid token
            if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
                logger.info("Using cached token")
                return self.access_token
            
            # Make token request
            auth_url = f"{self.api_url}/oauth2/token"
            
            # Using client credentials flow
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "nphies_api"
            }
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            logger.info(f"Requesting token from {auth_url}")
            response = requests.post(
                auth_url,
                data=data,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Token request failed: {response.status_code} {response.text}")
                return None
            
            # Parse response
            token_data = response.json()
            self.access_token = token_data.get("access_token")
            
            # Set token expiry (usually 1 hour, but subtract 5 minutes for safety)
            expires_in = token_data.get("expires_in", 3600) - 300
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
            
            logger.info("Successfully obtained NPHIES auth token")
            return self.access_token
        
        except Exception as e:
            logger.error(f"Error getting auth token: {str(e)}")
            return None
    
    def _create_bundle(self, message_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create FHIR Bundle for NPHIES message
        
        Args:
            message_type: Type of message (claim, eligibility, etc.)
            payload: Payload resources to include in the bundle
            
        Returns:
            dict: FHIR Bundle
        """
        # Create a FHIR Bundle with the appropriate message type
        bundle_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        bundle = {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "message",
            "timestamp": timestamp,
            "entry": [
                {
                    "fullUrl": f"urn:uuid:{str(uuid.uuid4())}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "id": str(uuid.uuid4()),
                        "eventCoding": {
                            "system": "https://nphies.sa/terminology/message-events",
                            "code": message_type
                        },
                        "source": {
                            "name": "BrainSAIT Healthcare",
                            "software": "ClaimLinc",
                            "version": "2.0.0",
                            "endpoint": "https://api.brainsait.com"
                        },
                        "destination": [
                            {
                                "name": "NPHIES",
                                "endpoint": self.base_url
                            }
                        ]
                    }
                }
            ]
        }
        
        # Add payload resources to the bundle
        for resource in payload.get("resources", []):
            resource_id = resource.get("id", str(uuid.uuid4()))
            bundle["entry"].append({
                "fullUrl": f"urn:uuid:{resource_id}",
                "resource": resource
            })
        
        return bundle

    def send_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a claim to NPHIES
        
        Args:
            claim_data: Claim data in BrainSAIT format
            
        Returns:
            dict: NPHIES response
        """
        try:
            logger.info(f"Sending claim {claim_data.get('claim_id')} to NPHIES")
            
            # Convert to NPHIES format
            nphies_claim = self._convert_to_nphies_claim_format(claim_data)
            
            # Create bundle
            bundle = self._create_bundle("claim", {"resources": [nphies_claim]})
            
            # Get auth token
            token = self._get_auth_token()
            if not token:
                return {
                    "success": False,
                    "message": "Failed to get authentication token",
                    "data": None
                }
            
            # Send to NPHIES
            headers = {
                "Content-Type": "application/fhir+json",
                "Authorization": f"Bearer {token}",
                "X-Request-ID": str(uuid.uuid4())
            }
            
            logger.info(f"Sending claim bundle to {self.base_url}")
            response = requests.post(
                self.base_url,
                json=bundle,
                headers=headers
            )
            
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Claim submission failed: {response.status_code} {response.text}")
                return {
                    "success": False,
                    "message": f"Claim submission failed: {response.status_code}",
                    "data": response.text if response.text else None
                }
            
            logger.info("Claim submission successful")
            
            # Parse response
            response_data = response.json()
            
            return {
                "success": True,
                "message": "Claim submitted successfully",
                "data": response_data,
                "nphies_claim_id": self._extract_nphies_claim_id(response_data)
            }
            
        except Exception as e:
            logger.error(f"Error sending claim: {str(e)}")
            return {
                "success": False,
                "message": f"Error sending claim: {str(e)}",
                "data": None
            }
    
    def check_claim_status(self, claim_id: str) -> Dict[str, Any]:
        """
        Check the status of a claim with NPHIES
        
        Args:
            claim_id: Claim ID to check
            
        Returns:
            dict: Claim status response
        """
        try:
            logger.info(f"Checking status for claim {claim_id}")
            
            # Create claim status request
            status_request = {
                "resourceType": "ClaimStatus",
                "id": str(uuid.uuid4()),
                "status": "active",
                "patient": {
                    "reference": "Patient/1"
                },
                "created": datetime.utcnow().isoformat() + "Z",
                "claim": {
                    "reference": f"Claim/{claim_id}"
                }
            }
            
            # Create bundle
            bundle = self._create_bundle("claim-status", {"resources": [status_request]})
            
            # Get auth token
            token = self._get_auth_token()
            if not token:
                return {
                    "success": False,
                    "message": "Failed to get authentication token",
                    "data": None
                }
            
            # Send to NPHIES
            headers = {
                "Content-Type": "application/fhir+json",
                "Authorization": f"Bearer {token}",
                "X-Request-ID": str(uuid.uuid4())
            }
            
            logger.info(f"Sending status check to {self.base_url}")
            response = requests.post(
                self.base_url,
                json=bundle,
                headers=headers
            )
            
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Status check failed: {response.status_code} {response.text}")
                return {
                    "success": False,
                    "message": f"Status check failed: {response.status_code}",
                    "data": response.text if response.text else None
                }
            
            logger.info("Claim status check successful")
            
            # Parse response
            response_data = response.json()
            
            # Extract status information
            status_info = self._extract_claim_status(response_data)
            
            return {
                "success": True,
                "message": "Status check successful",
                "status": status_info.get("status", "unknown"),
                "details": status_info,
                "data": response_data
            }
            
        except Exception as e:
            logger.error(f"Error checking claim status: {str(e)}")
            return {
                "success": False,
                "message": f"Error checking claim status: {str(e)}",
                "data": None
            }
    
    def check_eligibility(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check patient eligibility with NPHIES
        
        Args:
            patient_data: Patient data including insurance information
            
        Returns:
            dict: Eligibility response
        """
        try:
            logger.info(f"Checking eligibility for patient ID: {patient_data.get('id', 'unknown')}")
            
            # Convert BrainSAIT patient format to NPHIES FHIR format
            eligibility_request = self._convert_to_eligibility_request(patient_data)
            
            # Create bundle
            bundle = self._create_bundle("coverage-eligibility", {"resources": [eligibility_request]})
            
            # Get auth token
            token = self._get_auth_token()
            if not token:
                return {
                    "success": False,
                    "message": "Failed to get authentication token",
                    "data": None
                }
            
            # Send to NPHIES
            headers = {
                "Content-Type": "application/fhir+json",
                "Authorization": f"Bearer {token}",
                "X-Request-ID": str(uuid.uuid4())
            }
            
            logger.info("Sending eligibility request to NPHIES")
            response = requests.post(
                self.base_url,
                json=bundle,
                headers=headers
            )
            
            if response.status_code not in [200, 201, 202]:
                logger.error(f"Eligibility check failed: {response.status_code} {response.text}")
                return {
                    "success": False,
                    "message": f"Eligibility check failed: {response.status_code}",
                    "data": response.text if response.text else None
                }
            
            logger.info("Eligibility check successful")
            
            # Parse response
            response_data = response.json()
            
            # Extract eligibility information
            eligibility_info = self._extract_eligibility_info(response_data)
            
            return {
                "success": True,
                "message": "Eligibility check successful",
                "is_eligible": eligibility_info.get("is_eligible", False),
                "coverage_period": eligibility_info.get("coverage_period"),
                "benefit_details": eligibility_info.get("benefit_details", []),
                "data": response_data
            }
            
        except Exception as e:
            logger.error(f"Error checking eligibility: {str(e)}")
            return {
                "success": False,
                "message": f"Error checking eligibility: {str(e)}",
                "data": None
            }
    
    def _extract_nphies_claim_id(self, response_data: Dict[str, Any]) -> Optional[str]:
        """Extract the NPHIES claim ID from the response"""
        try:
            # Navigate through the response to find the claim ID
            entries = response_data.get("entry", [])
            for entry in entries:
                resource = entry.get("resource", {})
                if resource.get("resourceType") == "ClaimResponse":
                    return resource.get("id")
            
            return None
        except Exception as e:
            logger.error(f"Error extracting claim ID: {str(e)}")
            return None
    
    def _extract_claim_status(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract claim status information from the response"""
        try:
            status_info = {
                "status": "unknown",
                "adjudication": [],
                "payment_amount": None,
                "payment_date": None
            }
            
            # Navigate through the response to find status information
            entries = response_data.get("entry", [])
            for entry in entries:
                resource = entry.get("resource", {})
                if resource.get("resourceType") == "ClaimResponse":
                    status_info["status"] = resource.get("outcome", "unknown")
                    
                    # Extract payment information
                    payment = resource.get("payment", {})
                    if payment:
                        status_info["payment_amount"] = payment.get("amount", {}).get("value")
                        status_info["payment_date"] = payment.get("date")
                    
                    # Extract adjudication details
                    for item in resource.get("item", []):
                        for adjudication in item.get("adjudication", []):
                            status_info["adjudication"].append({
                                "category": adjudication.get("category", {}).get("coding", [{}])[0].get("code"),
                                "reason": adjudication.get("reason", {}).get("coding", [{}])[0].get("code"),
                                "amount": adjudication.get("amount", {}).get("value")
                            })
            
            return status_info
        except Exception as e:
            logger.error(f"Error extracting claim status: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def _extract_eligibility_info(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract eligibility information from the response"""
        try:
            eligibility_info = {
                "is_eligible": False,
                "coverage_period": None,
                "benefit_details": []
            }
            
            # Navigate through the response to find eligibility information
            entries = response_data.get("entry", [])
            for entry in entries:
                resource = entry.get("resource", {})
                if resource.get("resourceType") == "CoverageEligibilityResponse":
                    # Check if the overall response indicates eligibility
                    outcome = resource.get("outcome")
                    eligibility_info["is_eligible"] = outcome == "complete"
                    
                    # Extract coverage period
                    for insurance in resource.get("insurance", []):
                        if insurance.get("inforce") is True:
                            coverage = insurance.get("coverage", {})
                            period = coverage.get("period", {})
                            eligibility_info["coverage_period"] = {
                                "start": period.get("start"),
                                "end": period.get("end")
                            }
                            
                            # Extract benefit details
                            for benefit in insurance.get("item", []):
                                benefit_info = {
                                    "type": benefit.get("category", {}).get("coding", [{}])[0].get("code"),
                                    "description": benefit.get("name"),
                                    "is_covered": benefit.get("excluded") is not True,
                                    "network": benefit.get("network", {}).get("coding", [{}])[0].get("code"),
                                    "unit": benefit.get("unit", {}).get("coding", [{}])[0].get("code"),
                                    "term": benefit.get("term", {}).get("coding", [{}])[0].get("code"),
                                }
                                eligibility_info["benefit_details"].append(benefit_info)
            
            return eligibility_info
        except Exception as e:
            logger.error(f"Error extracting eligibility info: {str(e)}")
            return {"is_eligible": False, "message": str(e)}
    
    def _convert_to_nphies_claim_format(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert BrainSAIT claim format to NPHIES FHIR Claim format
        
        Args:
            claim_data: Claim data in BrainSAIT format
            
        Returns:
            dict: NPHIES FHIR Claim resource
        """
        # Extract patient data
        patient = claim_data.get("patient", {})
        provider = claim_data.get("provider", {})
        encounter = claim_data.get("encounter", {})
        diagnosis = claim_data.get("diagnosis", [])
        procedures = claim_data.get("procedures", [])
        
        # Create NPHIES FHIR Claim
        claim_id = claim_data.get("claim_id", str(uuid.uuid4()))
        
        nphies_claim = {
            "resourceType": "Claim",
            "id": claim_id,
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
                "reference": f"Patient/{patient.get('id', '1')}",
                "display": f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
            },
            "created": datetime.utcnow().isoformat() + "Z",
            "provider": {
                "reference": f"Practitioner/{provider.get('id', '1')}",
                "display": provider.get('name', 'Provider')
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
                        "reference": f"Coverage/{patient.get('insurance', {}).get('id', '1')}"
                    }
                }
            ],
            "item": []
        }
        
        # Add diagnoses
        if diagnosis:
            nphies_claim["diagnosis"] = []
            for i, diag in enumerate(diagnosis):
                nphies_claim["diagnosis"].append({
                    "sequence": i + 1,
                    "diagnosisCodeableConcept": {
                        "coding": [
                            {
                                "system": "http://hl7.org/fhir/sid/icd-10",
                                "code": diag.get("code", "R69"),
                                "display": diag.get("description", "Illness, unspecified")
                            }
                        ]
                    }
                })
        
        # Add procedures as items
        for i, proc in enumerate(procedures):
            nphies_claim["item"].append({
                "sequence": i + 1,
                "productOrService": {
                    "coding": [
                        {
                            "system": "http://www.ama-assn.org/go/cpt",
                            "code": proc.get("code", "99213"),
                            "display": proc.get("description", "Office visit")
                        }
                    ]
                },
                "unitPrice": {
                    "value": proc.get("cost", 0),
                    "currency": "SAR"
                },
                "net": {
                    "value": proc.get("cost", 0),
                    "currency": "SAR"
                },
                "encounter": [
                    {
                        "reference": f"Encounter/{encounter.get('id', '1')}"
                    }
                ]
            })
        
        return nphies_claim
    
    def _convert_to_eligibility_request(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert patient data to NPHIES FHIR EligibilityRequest format
        
        Args:
            patient_data: Patient data in BrainSAIT format
            
        Returns:
            dict: NPHIES FHIR CoverageEligibilityRequest resource
        """
        insurance = patient_data.get("insurance", {})
        
        eligibility_request = {
            "resourceType": "CoverageEligibilityRequest",
            "id": str(uuid.uuid4()),
            "status": "active",
            "purpose": [
                "benefits"
            ],
            "patient": {
                "reference": f"Patient/{patient_data.get('id', '1')}",
                "display": f"{patient_data.get('firstName', '')} {patient_data.get('lastName', '')}"
            },
            "created": datetime.utcnow().isoformat() + "Z",
            "insurer": {
                "reference": f"Organization/{insurance.get('provider_id', '1')}",
                "display": insurance.get('provider', 'Insurance Provider')
            },
            "provider": {
                "reference": "Organization/brainsait",
                "display": "BrainSAIT Healthcare"
            },
            "insurance": [
                {
                    "focal": True,
                    "coverage": {
                        "reference": f"Coverage/{insurance.get('id', '1')}",
                        "display": insurance.get('plan_name', 'Insurance Plan')
                    }
                }
            ]
        }
        
        return eligibility_request
