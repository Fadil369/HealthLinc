# NPHIES Integration Module

## Overview
This module provides comprehensive integration between NPHIES (National Platform for Health Information Exchange in Saudi Arabia) and HealthLinc's agent-based architecture.

## Features

### 1. Data Extraction and Analysis
- **`analyzer.py`**: Comprehensive analysis tool for NPHIES JSON samples
  - Extracts resource types, message patterns, code systems
  - Identifies organization structures, procedure codes, diagnosis codes
  - Generates integration mapping for HealthLinc agents
  - Exports detailed analysis reports

### 2. FHIR Resource Models
- **`models.py`**: Pydantic models for NPHIES FHIR resources
  - Complete validation for Patient, Claim, Coverage, Organization resources
  - NPHIES-specific extensions and code systems
  - Data transformation utilities for HealthLinc compatibility

### 3. Integration Service
- **`main.py`**: FastAPI service for NPHIES integration
  - RESTful endpoints for data extraction and processing
  - Background task processing for agent routing
  - Real-time transformation from NPHIES to HealthLinc format

### 4. Agent Routing
- **`agents.py`**: Intelligent routing to HealthLinc agents
  - Message type-based routing (eligibility → AuthLinc, claims → ClaimLinc, etc.)
  - Response building for NPHIES-compliant outputs
  - Error handling and retry mechanisms

## Architecture

```
NPHIES Portal
     ↓
     │ FHIR Bundle (JSON)
     ↓
┌────────────────────────┐
│  NPHIES Integration    │
│  Service (main.py)     │
│  ┌──────────────────┐  │
│  │ Data Extractor   │  │
│  │ (analyzer.py)    │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ FHIR Validator   │  │
│  │ (models.py)      │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ Agent Router     │  │
│  │ (agents.py)      │  │
│  └──────────────────┘  │
└────────────────────────┘
     ↓
     │ Structured Payloads
     ↓
┌────────────────────────┐
│   HealthLinc Agents    │
│ ┌──────┐ ┌───────────┐ │
│ │AuthL │ │ClaimLinc  │ │
│ │inc   │ │           │ │
│ └──────┘ └───────────┘ │
│ ┌──────┐ ┌───────────┐ │
│ │DocuL │ │MatchLinc  │ │
│ │inc   │ │           │ │
│ └──────┘ └───────────┘ │
│ ┌──────┐ ┌───────────┐ │
│ │NotifyL│ │RecordLinc │ │
│ │inc    │ │           │ │
│ └──────┘ └───────────┘ │
│ ┌──────┐ ┌───────────┐ │
│ │Claim │ │ReviewerL  │ │
│ │Tracker│ │inc        │ │
│ │Linc  │ │           │ │
│ └──────┘ └───────────┘ │
└────────────────────────┘
```

## Message Flow Patterns

### 1. Eligibility Verification Flow
```
Patient Eligibility Request → AuthLinc + RecordLinc
                           ↓
Response with coverage details and patient record validation
```

### 2. Prior Authorization Flow
```
Prior Auth Request → AuthLinc + DocuLinc + MatchLinc
                  ↓
Clinical review + documentation + provider matching
                  ↓
Authorization decision with supporting documentation
```

### 3. Claims Processing Flow
```
Claim Submission → ClaimLinc + ClaimTrackerLinc + MatchLinc
                ↓
Adjudication + tracking + provider validation
                ↓
Claim decision with payment details
```

### 4. Communication Flow
```
Communication Request → NotifyLinc + DocuLinc
                    ↓
Member notification + document management
                    ↓
Acknowledgment and tracking
```

## Installation and Setup

### Prerequisites
```bash
# Python 3.11+
# pip install requirements
pip install fastapi uvicorn pydantic python-multipart httpx pandas
```

### Configuration
```python
# Environment variables
NPHIES_BASE_URL=https://nphies.sa/api
HEALTHLINC_AGENT_BASE_URL=http://localhost:8000
LOG_LEVEL=INFO
```

### Running the Service
```bash
# Development
cd backend/nphies-integration
uvicorn main:app --reload --port 8001

# Production
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Docker Deployment
```bash
# Build image
docker build -t nphies-integration .

# Run container
docker run -p 8001:8001 -e NPHIES_BASE_URL=https://nphies.sa/api nphies-integration
```

## API Endpoints

### Analysis Endpoints
- `POST /nphies/analyze` - Analyze NPHIES sample data
- `GET /nphies/patterns` - Get extracted data patterns
- `GET /nphies/mapping` - Get agent routing mapping

### Processing Endpoints
- `POST /nphies/extract` - Extract data from NPHIES Bundle
- `POST /nphies/transform` - Transform to HealthLinc format
- `POST /nphies/process` - Full extraction, transformation, and routing

### Health Check
- `GET /health` - Service health status
- `GET /metrics` - Processing metrics and statistics

## Data Models

### Key NPHIES Resources Supported
- **Patient**: Saudi national ID, Iqama, passport, nationality, occupation
- **Organization**: Providers, payers, licensing information
- **Claim**: All claim types (institutional, professional, pharmacy, vision, dental)
- **Coverage**: Insurance coverage details and relationships
- **CoverageEligibilityRequest**: Eligibility verification requests
- **CommunicationRequest**: Member and provider communications

### HealthLinc Agent Payloads
Each agent receives structured payloads optimized for their domain:

```python
# AuthLinc Payload
{
    "request_type": "prior_authorization",
    "patient_info": {...},
    "service_details": {...},
    "clinical_data": {...}
}

# ClaimLinc Payload
{
    "claim_type": "institutional",
    "patient_demographics": {...},
    "provider_info": {...},
    "services": [...],
    "diagnosis_codes": [...],
    "total_amount": "..."
}
```

## Code System Mappings

### NPHIES → HealthLinc Code Systems
- **ICD-10-AM** → Standard diagnosis codes
- **NPHIES Procedures** → Service procedure codes
- **MOH Categories** → Ministry of Health service categories
- **Scientific Codes** → Laboratory and diagnostic codes

### Extension Mappings
- **Nationality Extension** → Patient nationality classification
- **Occupation Extension** → Patient occupation coding
- **Provider Type Extension** → Healthcare provider categorization
- **Coverage Type Extension** → Insurance coverage classification

## Error Handling

### Validation Errors
- Invalid FHIR Bundle structure
- Missing required fields
- Incorrect code system values
- Malformed identifiers

### Processing Errors
- Agent routing failures
- Transformation errors
- Network connectivity issues
- Timeout handling

### Recovery Mechanisms
- Automatic retry for transient failures
- Dead letter queue for failed messages
- Error logging and monitoring
- Graceful degradation

## Monitoring and Logging

### Metrics Tracked
- Messages processed per hour
- Agent routing success rates
- Transformation accuracy
- Response times

### Log Levels
- **INFO**: Successful processing events
- **WARN**: Validation warnings, retries
- **ERROR**: Processing failures, system errors
- **DEBUG**: Detailed message tracing

## Testing

### Unit Tests
```bash
pytest tests/unit/
```

### Integration Tests
```bash
pytest tests/integration/
```

### Load Testing
```bash
locust -f tests/load/locustfile.py --host=http://localhost:8001
```

## Security Considerations

### Authentication
- OAuth 2.0 integration with NPHIES
- JWT token validation
- API key management for HealthLinc agents

### Data Protection
- Encryption at rest and in transit
- PHI data handling compliance
- Audit logging for all data access

### Network Security
- HTTPS enforcement
- Rate limiting and throttling
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Bundle Parsing Failures**
   - Check FHIR Bundle structure
   - Validate required resourceType fields
   - Verify entry references

2. **Agent Routing Errors**
   - Confirm agent endpoint availability
   - Check message type mapping
   - Validate payload structure

3. **Code System Mismatches**
   - Review NPHIES code system URLs
   - Update mapping configurations
   - Verify code value formats

### Debugging Tools
- **Message Inspector**: `/debug/inspect/{message_id}`
- **Routing Tracer**: `/debug/trace/{request_id}`
- **Validation Reporter**: `/debug/validate/{bundle_id}`

## Contributing

### Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

### Code Standards
- Follow PEP 8 for Python code
- Use type hints for all functions
- Write docstrings for public methods
- Maintain 90%+ test coverage

## Changelog

### v1.0.0 (Current)
- Initial implementation of NPHIES integration
- Complete FHIR resource model support
- Agent routing with error handling
- Comprehensive data analysis tools

### Roadmap

#### v1.1.0
- Real-time message streaming
- Enhanced monitoring dashboard
- Performance optimizations
- Additional code system support

#### v1.2.0
- Bidirectional synchronization
- Advanced clinical decision support
- Machine learning-powered routing
- Multi-tenancy support

## Support

For technical support and questions:
- Create GitHub issues for bugs and feature requests
- Review documentation and API reference
- Contact the HealthLinc development team

## License

This module is part of the HealthLinc platform and is subject to the platform's licensing terms.
