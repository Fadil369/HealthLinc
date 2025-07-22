"""
NPHIES Agent Integration Module

This module integrates NPHIES data processing with existing HealthLinc agents.
It routes NPHIES messages to appropriate agents and handles bidirectional communication.
"""

import asyncio
import aiohttp
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

from models import (
    NphiesMessageType,
    NphiesExtractedData,
    NphiesPatient,
    NphiesClaim,
    NphiesCoverageEligibilityRequest,
    NphiesCommunicationRequest
)

logger = logging.getLogger(__name__)

class AgentType(str, Enum):
    """HealthLinc Agent Types"""
    CLAIMLINC = "claimlinc"
    RECORDLINC = "recordlinc"
    AUTHLINC = "authlinc"
    NOTIFYLINC = "notifylinc"
    DOCULINC = "doculinc"
    MATCHLINC = "matchlinc"
    REVIEWERLINC = "reviewerlinc"
    CLAIMTRACKERLINC = "claimtrackerlinc"

class NphiesAgentRouter:
    """Routes NPHIES messages to appropriate HealthLinc agents"""
    
    def __init__(self, base_urls: Dict[str, str] = None):
        self.base_urls = base_urls or {
            AgentType.CLAIMLINC: "http://localhost:3001",
            AgentType.RECORDLINC: "http://localhost:3002",
            AgentType.AUTHLINC: "http://localhost:3003",
            AgentType.NOTIFYLINC: "http://localhost:3004",
            AgentType.DOCULINC: "http://localhost:3005",
            AgentType.MATCHLINC: "http://localhost:3006",
            AgentType.REVIEWERLINC: "http://localhost:3007",
            AgentType.CLAIMTRACKERLINC: "http://localhost:3008"
        }
        
        # Message type to agent routing
        self.routing_map = {
            NphiesMessageType.CLAIM_REQUEST: [AgentType.CLAIMLINC, AgentType.CLAIMTRACKERLINC, AgentType.MATCHLINC],
            NphiesMessageType.PRIORAUTH_REQUEST: [AgentType.AUTHLINC, AgentType.DOCULINC, AgentType.MATCHLINC],
            NphiesMessageType.ELIGIBILITY_REQUEST: [AgentType.AUTHLINC, AgentType.RECORDLINC],
            NphiesMessageType.COMMUNICATION_REQUEST: [AgentType.NOTIFYLINC, AgentType.DOCULINC],
            NphiesMessageType.PRESCRIBER_REQUEST: [AgentType.MATCHLINC, AgentType.REVIEWERLINC],
            NphiesMessageType.PAYMENT_NOTICE: [AgentType.CLAIMLINC, AgentType.NOTIFYLINC],
            NphiesMessageType.PAYMENT_RECONCILIATION: [AgentType.CLAIMLINC, AgentType.REVIEWERLINC]
        }
    
    async def route_message(self, extracted_data: NphiesExtractedData) -> Dict[str, Any]:
        """Route NPHIES message to appropriate agents"""
        agents = self.routing_map.get(extracted_data.message_type, [AgentType.RECORDLINC])
        results = {}
        
        # Process with multiple agents concurrently
        tasks = []
        for agent in agents:
            task = self._process_with_agent(agent, extracted_data)
            tasks.append(task)
        
        agent_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(agent_results):
            agent_name = agents[i]
            if isinstance(result, Exception):
                results[agent_name] = {"status": "error", "error": str(result)}
            else:
                results[agent_name] = result
        
        return {
            "message_type": extracted_data.message_type,
            "routed_agents": [agent.value for agent in agents],
            "agent_results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _process_with_agent(self, agent: AgentType, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process data with specific agent"""
        try:
            if agent == AgentType.CLAIMLINC:
                return await self._process_with_claimlinc(data)
            elif agent == AgentType.RECORDLINC:
                return await self._process_with_recordlinc(data)
            elif agent == AgentType.AUTHLINC:
                return await self._process_with_authlinc(data)
            elif agent == AgentType.NOTIFYLINC:
                return await self._process_with_notifylinc(data)
            elif agent == AgentType.DOCULINC:
                return await self._process_with_doculinc(data)
            elif agent == AgentType.MATCHLINC:
                return await self._process_with_matchlinc(data)
            elif agent == AgentType.REVIEWERLINC:
                return await self._process_with_reviewerlinc(data)
            elif agent == AgentType.CLAIMTRACKERLINC:
                return await self._process_with_claimtrackerlinc(data)
            else:
                return {"status": "error", "message": f"Unknown agent: {agent}"}
                
        except Exception as e:
            logger.error(f"Error processing with agent {agent}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def _make_agent_request(self, agent: AgentType, endpoint: str, task: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to agent"""
        url = f"{self.base_urls[agent]}/{endpoint}"
        headers = {
            "X-MCP-Task": task,
            "X-Request-ID": str(datetime.now().timestamp()),
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers, timeout=30) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Agent request failed: {response.status} - {error_text}")
    
    async def _process_with_claimlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with ClaimLinc agent"""
        if not data.claims:
            return {"status": "skipped", "reason": "No claims found"}
        
        results = []
        for claim in data.claims:
            # Transform NPHIES claim to ClaimLinc format
            claim_payload = {
                "patient_id": claim.patient.get("reference", "").replace("Patient/", ""),
                "provider_id": claim.provider.get("reference", "").replace("Organization/", ""),
                "service_date": claim.created,
                "diagnosis_codes": [d.get("diagnosisCodeableConcept", {}).get("coding", [{}])[0].get("code", "") 
                                 for d in claim.diagnosis],
                "procedure_codes": [item.get("productOrService", {}).get("coding", [{}])[0].get("code", "") 
                                  for item in claim.items],
                "total_amount": claim.total.get("value", 0) if claim.total else 0,
                "insurance_id": claim.insurance[0].get("coverage", {}).get("reference", "") if claim.insurance else "",
                "notes": f"NPHIES Claim ID: {claim.id}"
            }
            
            # Determine task based on claim use
            task = "submit" if claim.use == "claim" else "check"
            
            try:
                result = await self._make_agent_request(
                    AgentType.CLAIMLINC, 
                    "agents/claim", 
                    task, 
                    claim_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "claims": results}
    
    async def _process_with_recordlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with RecordLinc agent"""
        if not data.patients:
            return {"status": "skipped", "reason": "No patients found"}
        
        results = []
        for patient in data.patients:
            # Transform NPHIES patient to RecordLinc format
            name = patient.name[0] if patient.name else {}
            telecom = patient.telecom[0] if patient.telecom else {}
            address = patient.address[0] if patient.address else {}
            
            patient_payload = {
                "first_name": name.get("given", [""])[0],
                "last_name": name.get("family", ""),
                "birth_date": patient.birth_date,
                "gender": patient.gender,
                "phone": telecom.get("value") if telecom.get("system") == "phone" else None,
                "email": telecom.get("value") if telecom.get("system") == "email" else None,
                "address": {
                    "line": address.get("line", []),
                    "city": address.get("city"),
                    "state": address.get("state"),
                    "postalCode": address.get("postalCode"),
                    "country": address.get("country")
                } if address else None,
                "identifiers": patient.identifier,
                "nationality": patient.nationality,
                "occupation": patient.occupation
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.RECORDLINC, 
                    "agents/record", 
                    "create", 
                    patient_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "patient_id": patient.id, "error": str(e)})
        
        return {"status": "processed", "patients": results}
    
    async def _process_with_authlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with AuthLinc agent"""
        results = []
        
        # Process eligibility requests
        for eligibility in data.eligibility_requests:
            auth_payload = {
                "patient_id": eligibility.patient.get("reference", "").replace("Patient/", ""),
                "provider_id": eligibility.provider.get("reference", "").replace("Organization/", ""),
                "insurer_id": eligibility.insurer.get("reference", "").replace("Organization/", ""),
                "purpose": eligibility.purpose,
                "service_period": eligibility.serviced_period,
                "insurance_info": eligibility.insurance
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.AUTHLINC, 
                    "agents/auth", 
                    "validate", 
                    auth_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "eligibility_id": eligibility.id, "error": str(e)})
        
        # Process prior auth claims
        for claim in data.claims:
            if claim.use == "preauthorization":
                auth_payload = {
                    "claim_id": claim.id,
                    "patient_id": claim.patient.get("reference", "").replace("Patient/", ""),
                    "provider_id": claim.provider.get("reference", "").replace("Organization/", ""),
                    "procedures": [item.get("productOrService", {}) for item in claim.items],
                    "diagnoses": claim.diagnosis,
                    "total_amount": claim.total.get("value", 0) if claim.total else 0
                }
                
                try:
                    result = await self._make_agent_request(
                        AgentType.AUTHLINC, 
                        "agents/auth", 
                        "preauth", 
                        auth_payload
                    )
                    results.append(result)
                except Exception as e:
                    results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "authorizations": results}
    
    async def _process_with_notifylinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with NotifyLinc agent"""
        results = []
        
        # Process communication requests
        for comm in data.communications:
            notification_payload = {
                "recipient_type": "provider",  # Assume provider notification
                "message_type": "communication_request",
                "subject": f"NPHIES Communication Request - {comm.id}",
                "content": " ".join([p.get("contentString", "") for p in comm.payload]),
                "priority": comm.priority,
                "sender_id": comm.sender.get("reference", "").replace("Organization/", ""),
                "recipient_ids": [r.get("reference", "").replace("Organization/", "") for r in comm.recipient]
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.NOTIFYLINC, 
                    "agents/notify", 
                    "send", 
                    notification_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "communication_id": comm.id, "error": str(e)})
        
        return {"status": "processed", "notifications": results}
    
    async def _process_with_doculinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with DocuLinc agent"""
        results = []
        
        # Extract documentation from claims
        for claim in data.claims:
            if claim.supporting_info:
                doc_payload = {
                    "claim_id": claim.id,
                    "patient_id": claim.patient.get("reference", "").replace("Patient/", ""),
                    "supporting_info": claim.supporting_info,
                    "diagnosis_codes": [d.get("diagnosisCodeableConcept", {}).get("coding", [{}])[0].get("code", "") 
                                     for d in claim.diagnosis],
                    "procedure_codes": [item.get("productOrService", {}).get("coding", [{}])[0].get("code", "") 
                                      for item in claim.items]
                }
                
                try:
                    result = await self._make_agent_request(
                        AgentType.DOCULINC, 
                        "agents/document", 
                        "enhance", 
                        doc_payload
                    )
                    results.append(result)
                except Exception as e:
                    results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "documentation": results}
    
    async def _process_with_matchlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with MatchLinc agent"""
        results = []
        
        # Process diagnosis-procedure matching
        for claim in data.claims:
            match_payload = {
                "claim_id": claim.id,
                "patient_id": claim.patient.get("reference", "").replace("Patient/", ""),
                "diagnosis_codes": [d.get("diagnosisCodeableConcept", {}).get("coding", [{}])[0].get("code", "") 
                                 for d in claim.diagnosis],
                "procedure_codes": [item.get("productOrService", {}).get("coding", [{}])[0].get("code", "") 
                                  for item in claim.items],
                "claim_type": claim.type.get("coding", [{}])[0].get("code", ""),
                "service_date": claim.created
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.MATCHLINC, 
                    "agents/match", 
                    "validate", 
                    match_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "validations": results}
    
    async def _process_with_reviewerlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with ReviewerLinc agent"""
        results = []
        
        # Process fee schedule reviews
        for claim in data.claims:
            review_payload = {
                "claim_id": claim.id,
                "provider_id": claim.provider.get("reference", "").replace("Organization/", ""),
                "items": [{
                    "procedure_code": item.get("productOrService", {}).get("coding", [{}])[0].get("code", ""),
                    "unit_price": item.get("unitPrice", {}).get("value", 0),
                    "quantity": item.get("quantity", {}).get("value", 1),
                    "net_amount": item.get("net", {}).get("value", 0)
                } for item in claim.items],
                "total_amount": claim.total.get("value", 0) if claim.total else 0,
                "currency": claim.total.get("currency", "SAR") if claim.total else "SAR"
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.REVIEWERLINC, 
                    "agents/review", 
                    "fee_schedule", 
                    review_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "reviews": results}
    
    async def _process_with_claimtrackerlinc(self, data: NphiesExtractedData) -> Dict[str, Any]:
        """Process with ClaimTrackerLinc agent"""
        results = []
        
        # Track claims for duplicates
        for claim in data.claims:
            tracker_payload = {
                "claim_id": claim.id,
                "patient_id": claim.patient.get("reference", "").replace("Patient/", ""),
                "provider_id": claim.provider.get("reference", "").replace("Organization/", ""),
                "service_date": claim.created,
                "procedure_codes": [item.get("productOrService", {}).get("coding", [{}])[0].get("code", "") 
                                  for item in claim.items],
                "total_amount": claim.total.get("value", 0) if claim.total else 0,
                "claim_type": claim.type.get("coding", [{}])[0].get("code", ""),
                "claim_use": claim.use
            }
            
            try:
                result = await self._make_agent_request(
                    AgentType.CLAIMTRACKERLINC, 
                    "agents/tracker", 
                    "check_duplicate", 
                    tracker_payload
                )
                results.append(result)
            except Exception as e:
                results.append({"status": "error", "claim_id": claim.id, "error": str(e)})
        
        return {"status": "processed", "tracking": results}

class NphiesResponseBuilder:
    """Builds NPHIES-compliant response messages"""
    
    def __init__(self):
        self.response_templates = {
            NphiesMessageType.ELIGIBILITY_REQUEST: self._build_eligibility_response,
            NphiesMessageType.PRIORAUTH_REQUEST: self._build_priorauth_response,
            NphiesMessageType.CLAIM_REQUEST: self._build_claim_response,
            NphiesMessageType.COMMUNICATION_REQUEST: self._build_communication_response
        }
    
    def build_response(self, message_type: NphiesMessageType, agent_results: Dict[str, Any], 
                      original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build NPHIES response based on agent results"""
        if message_type in self.response_templates:
            return self.response_templates[message_type](agent_results, original_data)
        else:
            return self._build_generic_response(agent_results, original_data)
    
    def _build_eligibility_response(self, agent_results: Dict[str, Any], 
                                  original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build eligibility response"""
        # This would build a proper NPHIES eligibility response bundle
        return {
            "resourceType": "Bundle",
            "id": f"eligibility-response-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "message",
            "timestamp": datetime.now().isoformat(),
            "meta": {
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0"]
            },
            "entry": [
                {
                    "fullUrl": f"urn:uuid:message-header-{datetime.now().timestamp()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "eligibility-response"
                        },
                        "response": {
                            "code": "ok" if agent_results.get("authlinc", {}).get("status") == "success" else "transient-error"
                        }
                    }
                }
            ]
        }
    
    def _build_priorauth_response(self, agent_results: Dict[str, Any], 
                                 original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build prior authorization response"""
        return {
            "resourceType": "Bundle",
            "id": f"priorauth-response-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "message",
            "timestamp": datetime.now().isoformat(),
            "meta": {
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0"]
            },
            "entry": [
                {
                    "fullUrl": f"urn:uuid:message-header-{datetime.now().timestamp()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "priorauth-response"
                        }
                    }
                }
            ]
        }
    
    def _build_claim_response(self, agent_results: Dict[str, Any], 
                             original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build claim response"""
        return {
            "resourceType": "Bundle",
            "id": f"claim-response-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "message", 
            "timestamp": datetime.now().isoformat(),
            "meta": {
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0"]
            },
            "entry": [
                {
                    "fullUrl": f"urn:uuid:message-header-{datetime.now().timestamp()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "claim-response"
                        }
                    }
                }
            ]
        }
    
    def _build_communication_response(self, agent_results: Dict[str, Any], 
                                    original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build communication response"""
        return {
            "resourceType": "Bundle",
            "id": f"communication-response-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "message",
            "timestamp": datetime.now().isoformat(),
            "meta": {
                "profile": ["http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0"]
            },
            "entry": [
                {
                    "fullUrl": f"urn:uuid:message-header-{datetime.now().timestamp()}",
                    "resource": {
                        "resourceType": "MessageHeader",
                        "eventCoding": {
                            "system": "http://nphies.sa/terminology/CodeSystem/ksa-message-events",
                            "code": "communication-response"
                        }
                    }
                }
            ]
        }
    
    def _build_generic_response(self, agent_results: Dict[str, Any], 
                               original_data: NphiesExtractedData) -> Dict[str, Any]:
        """Build generic response"""
        return {
            "resourceType": "Bundle",
            "id": f"response-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": "message",
            "timestamp": datetime.now().isoformat(),
            "entry": []
        }
