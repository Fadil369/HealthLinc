"""
NPHIES Data Extraction and Analysis Tools

This module provides tools for analyzing NPHIES JSON samples, extracting patterns,
and generating insights for integration with HealthLinc.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List, Set, Optional, Tuple
from collections import defaultdict, Counter
import pandas as pd
from datetime import datetime

class NphiesDataAnalyzer:
    """Analyzes NPHIES JSON samples to extract patterns and insights"""
    
    def __init__(self, samples_directory: str):
        self.samples_directory = Path(samples_directory)
        self.analyzed_files = []
        self.resource_types = Counter()
        self.message_types = Counter()
        self.code_systems = Counter()
        self.extensions = Counter()
        self.profiles = Counter()
        self.identifiers = Counter()
        self.organizations = {}
        self.procedure_codes = Counter()
        self.diagnosis_codes = Counter()
        self.coverage_types = Counter()
        
    def analyze_all_samples(self) -> Dict[str, Any]:
        """Analyze all JSON samples in the directory"""
        results = {
            "analysis_timestamp": datetime.now().isoformat(),
            "total_files_processed": 0,
            "files_with_errors": [],
            "summary": {},
            "detailed_findings": {}
        }
        
        # Recursively find all JSON files
        json_files = list(self.samples_directory.rglob("*.json"))
        results["total_files_found"] = len(json_files)
        
        for json_file in json_files:
            try:
                self._analyze_file(json_file)
                results["total_files_processed"] += 1
            except Exception as e:
                results["files_with_errors"].append({
                    "file": str(json_file),
                    "error": str(e)
                })
        
        # Generate summary
        results["summary"] = self._generate_summary()
        results["detailed_findings"] = self._generate_detailed_findings()
        
        return results
    
    def _analyze_file(self, file_path: Path) -> None:
        """Analyze a single JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Basic file info
            file_info = {
                "path": str(file_path),
                "size_bytes": file_path.stat().st_size,
                "analyzed_at": datetime.now().isoformat()
            }
            
            # Analyze the JSON structure
            if isinstance(data, dict):
                self._analyze_resource(data, file_info)
            
            self.analyzed_files.append(file_info)
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Analysis error: {str(e)}")
    
    def _analyze_resource(self, resource: Dict[str, Any], file_info: Dict[str, Any]) -> None:
        """Analyze a FHIR resource"""
        resource_type = resource.get("resourceType", "Unknown")
        self.resource_types[resource_type] += 1
        
        # Analyze Bundle specifically
        if resource_type == "Bundle":
            self._analyze_bundle(resource, file_info)
        
        # Analyze meta profiles
        meta = resource.get("meta", {})
        if "profile" in meta:
            for profile in meta["profile"]:
                self.profiles[profile] += 1
        
        # Analyze identifiers
        if "identifier" in resource:
            for identifier in resource["identifier"]:
                system = identifier.get("system", "unknown")
                self.identifiers[system] += 1
        
        # Analyze extensions
        if "extension" in resource:
            for extension in resource["extension"]:
                url = extension.get("url", "unknown")
                self.extensions[url] += 1
        
        # Resource-specific analysis
        if resource_type == "Patient":
            self._analyze_patient(resource)
        elif resource_type == "Organization":
            self._analyze_organization(resource)
        elif resource_type == "Claim":
            self._analyze_claim(resource)
        elif resource_type == "Coverage":
            self._analyze_coverage(resource)
        elif resource_type == "CoverageEligibilityRequest":
            self._analyze_eligibility_request(resource)
    
    def _analyze_bundle(self, bundle: Dict[str, Any], file_info: Dict[str, Any]) -> None:
        """Analyze FHIR Bundle"""
        bundle_type = bundle.get("type", "unknown")
        
        # Look for MessageHeader to determine message type
        for entry in bundle.get("entry", []):
            resource = entry.get("resource", {})
            if resource.get("resourceType") == "MessageHeader":
                event_coding = resource.get("eventCoding", {})
                message_code = event_coding.get("code", "unknown")
                self.message_types[message_code] += 1
                
                # Extract sender/receiver information
                sender = resource.get("sender", {})
                if "identifier" in sender:
                    sender_id = sender["identifier"].get("value", "unknown")
                    file_info["sender"] = sender_id
        
        # Analyze all resources in bundle
        for entry in bundle.get("entry", []):
            resource = entry.get("resource", {})
            if resource:
                self._analyze_resource(resource, file_info)
    
    def _analyze_patient(self, patient: Dict[str, Any]) -> None:
        """Analyze Patient resource"""
        # Analyze identifiers
        for identifier in patient.get("identifier", []):
            system = identifier.get("system", "")
            if "nationalid" in system:
                self.identifiers["saudi_national_id"] += 1
            elif "iqama" in system:
                self.identifiers["iqama"] += 1
            elif "passport" in system:
                self.identifiers["passport"] += 1
        
        # Analyze extensions for nationality and occupation
        for extension in patient.get("extension", []):
            url = extension.get("url", "")
            if "nationality" in url:
                nationality_code = extension.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
                if nationality_code:
                    self.identifiers[f"nationality_{nationality_code}"] += 1
            elif "occupation" in url:
                occupation_code = extension.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
                if occupation_code:
                    self.identifiers[f"occupation_{occupation_code}"] += 1
    
    def _analyze_organization(self, organization: Dict[str, Any]) -> None:
        """Analyze Organization resource"""
        org_id = organization.get("id")
        org_name = organization.get("name", "Unknown")
        
        # Store organization info
        self.organizations[org_id] = {
            "name": org_name,
            "active": organization.get("active", True),
            "type": []
        }
        
        # Analyze organization types
        for org_type in organization.get("type", []):
            for coding in org_type.get("coding", []):
                code = coding.get("code")
                system = coding.get("system", "")
                self.organizations[org_id]["type"].append(code)
                
                if "organization-type" in system:
                    self.identifiers[f"org_type_{code}"] += 1
        
        # Analyze provider type extension
        for extension in organization.get("extension", []):
            if "provider-type" in extension.get("url", ""):
                provider_type = extension.get("valueCodeableConcept", {}).get("coding", [{}])[0].get("code")
                if provider_type:
                    self.identifiers[f"provider_type_{provider_type}"] += 1
    
    def _analyze_claim(self, claim: Dict[str, Any]) -> None:
        """Analyze Claim resource"""
        # Analyze claim type and subtype
        claim_type = claim.get("type", {}).get("coding", [{}])[0].get("code")
        if claim_type:
            self.identifiers[f"claim_type_{claim_type}"] += 1
        
        sub_type = claim.get("subType", {}).get("coding", [{}])[0].get("code")
        if sub_type:
            self.identifiers[f"claim_subtype_{sub_type}"] += 1
        
        # Analyze use (claim, preauthorization, predetermination)
        use = claim.get("use")
        if use:
            self.identifiers[f"claim_use_{use}"] += 1
        
        # Analyze diagnosis codes
        for diagnosis in claim.get("diagnosis", []):
            diagnosis_coding = diagnosis.get("diagnosisCodeableConcept", {}).get("coding", [])
            for coding in diagnosis_coding:
                code = coding.get("code")
                system = coding.get("system", "")
                if code:
                    self.diagnosis_codes[code] += 1
                    if "icd-10" in system.lower():
                        self.code_systems["ICD-10"] += 1
        
        # Analyze procedure codes
        for item in claim.get("item", []):
            product_service = item.get("productOrService", {}).get("coding", [])
            for coding in product_service:
                code = coding.get("code")
                system = coding.get("system", "")
                if code:
                    self.procedure_codes[code] += 1
                    if "procedures" in system:
                        self.code_systems["NPHIES_Procedures"] += 1
                    elif "moh-category" in system:
                        self.code_systems["MOH_Category"] += 1
                    elif "scientific-codes" in system:
                        self.code_systems["Scientific_Codes"] += 1
        
        # Analyze supporting information categories
        for info in claim.get("supportingInfo", []):
            category_coding = info.get("category", {}).get("coding", [])
            for coding in category_coding:
                code = coding.get("code")
                if code:
                    self.identifiers[f"supporting_info_{code}"] += 1
    
    def _analyze_coverage(self, coverage: Dict[str, Any]) -> None:
        """Analyze Coverage resource"""
        coverage_type = coverage.get("type", {}).get("coding", [{}])[0].get("code")
        if coverage_type:
            self.coverage_types[coverage_type] += 1
        
        # Analyze relationship
        relationship = coverage.get("relationship", {}).get("coding", [{}])[0].get("code")
        if relationship:
            self.identifiers[f"relationship_{relationship}"] += 1
    
    def _analyze_eligibility_request(self, eligibility: Dict[str, Any]) -> None:
        """Analyze CoverageEligibilityRequest resource"""
        # Analyze purpose
        purposes = eligibility.get("purpose", [])
        for purpose in purposes:
            self.identifiers[f"eligibility_purpose_{purpose}"] += 1
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate analysis summary"""
        return {
            "resource_types": dict(self.resource_types.most_common()),
            "message_types": dict(self.message_types.most_common()),
            "top_profiles": dict(self.profiles.most_common(10)),
            "top_extensions": dict(self.extensions.most_common(10)),
            "top_code_systems": dict(self.code_systems.most_common()),
            "top_procedure_codes": dict(self.procedure_codes.most_common(20)),
            "top_diagnosis_codes": dict(self.diagnosis_codes.most_common(20)),
            "coverage_types": dict(self.coverage_types.most_common()),
            "organizations_count": len(self.organizations),
            "total_identifiers": len(self.identifiers)
        }
    
    def _generate_detailed_findings(self) -> Dict[str, Any]:
        """Generate detailed findings"""
        return {
            "identifier_systems": dict(Counter({k: v for k, v in self.identifiers.items() 
                                              if "http" in k}).most_common(20)),
            "nphies_extensions": [ext for ext in self.extensions.keys() 
                                if "nphies.sa" in ext],
            "organizations": self.organizations,
            "claim_patterns": {
                "use_patterns": {k: v for k, v in self.identifiers.items() 
                               if k.startswith("claim_use_")},
                "type_patterns": {k: v for k, v in self.identifiers.items() 
                                if k.startswith("claim_type_")},
                "subtype_patterns": {k: v for k, v in self.identifiers.items() 
                                   if k.startswith("claim_subtype_")}
            },
            "patient_patterns": {
                "nationality_patterns": {k: v for k, v in self.identifiers.items() 
                                       if k.startswith("nationality_")},
                "occupation_patterns": {k: v for k, v in self.identifiers.items() 
                                      if k.startswith("occupation_")}
            },
            "provider_patterns": {
                "org_types": {k: v for k, v in self.identifiers.items() 
                            if k.startswith("org_type_")},
                "provider_types": {k: v for k, v in self.identifiers.items() 
                                 if k.startswith("provider_type_")}
            }
        }
    
    def generate_integration_mapping(self) -> Dict[str, Any]:
        """Generate mapping for HealthLinc integration"""
        return {
            "required_fields": {
                "patient_identifiers": ["national_id", "iqama", "medical_record_number"],
                "organization_identifiers": ["provider_license", "payer_license"],
                "claim_essentials": ["status", "type", "use", "patient", "provider", "insurer", "total"],
                "diagnosis_codes": ["ICD-10-AM", "ICD-10"],
                "procedure_codes": ["NPHIES_Procedures", "MOH_Category", "Scientific_Codes"]
            },
            "message_routing": {
                "eligibility-request": ["authlinc", "recordlinc"],
                "priorauth-request": ["authlinc", "doculinc", "matchlinc"],
                "claim-request": ["claimlinc", "claimtrackerlinc", "matchlinc"],
                "communication-request": ["notifylinc", "doculinc"],
                "prescriber-request": ["matchlinc", "reviewerlinc"]
            },
            "code_system_mapping": dict(self.code_systems),
            "extension_priorities": dict(self.extensions.most_common(10))
        }
    
    def export_analysis(self, output_file: str) -> None:
        """Export analysis results to JSON file"""
        results = {
            "analysis_metadata": {
                "timestamp": datetime.now().isoformat(),
                "samples_directory": str(self.samples_directory),
                "files_analyzed": len(self.analyzed_files)
            },
            "summary": self._generate_summary(),
            "detailed_findings": self._generate_detailed_findings(),
            "integration_mapping": self.generate_integration_mapping(),
            "analyzed_files": self.analyzed_files
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

def extract_essential_data_patterns(samples_directory: str) -> Dict[str, Any]:
    """Extract essential data patterns from NPHIES samples"""
    analyzer = NphiesDataAnalyzer(samples_directory)
    results = analyzer.analyze_all_samples()
    
    # Generate specific patterns for HealthLinc integration
    essential_patterns = {
        "message_workflow_patterns": {
            "eligibility_flow": ["eligibility-request", "eligibility-response"],
            "preauth_flow": ["priorauth-request", "priorauth-response", "communication-request"],
            "claim_flow": ["claim-request", "claim-response", "communication-request", "payment-notice"],
            "prescription_flow": ["prescriber-request", "prescriber-response"]
        },
        "data_validation_rules": {
            "saudi_national_id": {"pattern": r"^[12]\d{9}$", "required": True},
            "iqama_number": {"pattern": r"^[^12]\d{9}$", "required": True},
            "provider_license": {"pattern": r"^(N-F-|PR-)", "required": True},
            "payer_license": {"pattern": r"^(N-I-|INS-)", "required": True}
        },
        "agent_routing_matrix": analyzer.generate_integration_mapping()["message_routing"],
        "code_system_priorities": analyzer.generate_integration_mapping()["code_system_mapping"]
    }
    
    return {
        "analysis_results": results,
        "essential_patterns": essential_patterns,
        "integration_ready": True
    }

if __name__ == "__main__":
    # Example usage
    samples_dir = r"C:\Users\rcmrejection3\HealthLinc\JsonSampleCases"
    
    print("Analyzing NPHIES samples...")
    patterns = extract_essential_data_patterns(samples_dir)
    
    # Export results
    output_file = "nphies_analysis_results.json"
    analyzer = NphiesDataAnalyzer(samples_dir)
    analyzer.analyze_all_samples()
    analyzer.export_analysis(output_file)
    
    print(f"Analysis complete. Results saved to {output_file}")
    print(f"Found {patterns['analysis_results']['total_files_processed']} valid JSON files")
    print(f"Message types: {list(patterns['analysis_results']['summary']['message_types'].keys())}")
    print(f"Resource types: {list(patterns['analysis_results']['summary']['resource_types'].keys())}")
