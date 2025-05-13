# HealthLinc Agent Modules

This document provides an overview of the various agent modules within the HealthLinc Ecosystem, detailing their functionality, configuration, and integration within the system.

## Table of Contents

1. [Agent Architecture](#agent-architecture)
2. [Core Agents](#core-agents)
3. [Specialized Agents](#specialized-agents)
4. [Agent Configuration](#agent-configuration)
5. [Integration Flow](#integration-flow)
6. [Development Guidelines](#development-guidelines)

## Agent Architecture

HealthLinc agents are designed as containerized microservices that provide specific AI-powered functionality within the ecosystem. Each agent follows a common structure:

```
agentname/
├── main.py            # Main application entry point
├── Dockerfile         # Container definition
├── config.yaml        # Agent configuration
├── requirements.txt   # Python dependencies
├── prompts/           # AI prompts for specific tasks
│   └── task_name.txt
├── data/              # Agent-specific data files
└── templates/         # Output templates (if applicable)
```

Agents communicate through RESTful APIs and are orchestrated by the MCP (Model Context Protocol) server.

## Core Agents

### ClaimLinc

Handles claim submission, validation, and processing. Integrates with payer systems and validates claim data against billing rules.

### RecordLinc

Manages patient records and clinical data, providing CRUD operations for patient information and clinical notes.

### AuthLinc

Manages authentication, authorization, and security across the HealthLinc ecosystem.

### NotifyLinc

Handles notification delivery across various channels (email, SMS, in-app) for both clinical and administrative communications.

## Specialized Agents

### DocuLinc

**Purpose**: Enhances clinical documentation to better support medical necessity claims.

**Key Features**:

- Documentation templates for common procedures
- Medical necessity enhancement through AI
- Documentation quality scoring
- Template management
- Structured data capture for standardized reporting

**API Endpoints**:

- `GET /templates` - List available documentation templates
- `GET /templates/:id` - Get specific template
- `POST /enhance` - Enhance clinical documentation
- `POST /analyze` - Analyze documentation for completeness

**Integration Points**:

- FHIR Server for clinical data
- RecordLinc for patient context
- ClaimLinc for billing requirements

### MatchLinc

**Purpose**: Performs diagnosis-procedure matching validation to ensure proper coding and reduce claim denials.

**Key Features**:

- Validates diagnosis and procedure code relationships
- Provides coding guidance based on medical necessity
- Identifies missing or incompatible codes
- Offers suggestions for appropriate coding
- AI-powered code relationship analysis
- Support for training clinical staff on proper coding

**API Endpoints**:

- `POST /validate` - Validate diagnosis-procedure matches
- `GET /coding-rules` - Get coding rules for specific codes
- `POST /suggest` - Get suggestions for better code matching
- `GET /training-resources` - Access training materials

**Integration Points**:

- ClaimLinc for claim data
- DocuLinc for documentation context
- FHIR Server for clinical data

### ReviewerLinc

**Purpose**: Manages fee schedules and ensures pricing alignment with payer contracts.

**Key Features**:

- Fee schedule management
- Contract term tracking
- Reimbursement analysis
- Price optimization suggestions
- Payer contract management
- Rate comparison across payers

**API Endpoints**:

- `GET /contracts` - List payer contracts
- `GET /fee-schedules` - Get fee schedules
- `GET /fee-schedules/:payerId` - Get payer-specific fee schedules
- `POST /compare` - Compare rates across payers or time periods

**Integration Points**:

- ClaimLinc for billing amounts
- FHIR Server for service details
- External payer systems

### ClaimTrackerLinc

**Purpose**: Tracks claims through the revenue cycle and detects potential duplicate submissions.

**Key Features**:

- Claim status tracking
- Duplicate detection before submission
- Claim history and audit trail
- Claim hash generation for integrity
- Aging report generation
- Denial pattern analysis

**API Endpoints**:

- `GET /claims` - Get tracked claims with filters
- `POST /check-duplicate` - Check for potential duplicate claims
- `GET /aging` - Get claim aging report
- `POST /alert` - Create a claim alert

**Integration Points**:

- ClaimLinc for claim submission
- FHIR Server for clinical data
- External payer systems for status updates

## Agent Configuration

Agent configuration is managed through `config.yaml` files with environment variable overrides for sensitive information.

Example configuration structure:

```yaml
# Server configuration
server:
  host: 0.0.0.0
  port: 3001
  debug: false

# Security settings
security:
  jwt_secret: ${JWT_SECRET}
  token_expiry: 3600

# External service connections
services:
  fhir_server:
    url: ${FHIR_SERVER_URL}
    timeout: 30
  auth_service:
    url: ${AUTH_SERVICE_URL}
    timeout: 10

# Agent-specific configurations
# (Varies by agent)
```

## Integration Flow

The HealthLinc agents work together in the following general workflow:

1. User interactions occur through the Patient or Clinician Portal
2. The MCP server routes requests to the appropriate agent(s)
3. Agents process their specialized tasks, communicating with other agents as needed
4. Results are returned through the MCP server to the frontend
5. All operations are logged for compliance and auditing

## Development Guidelines

When developing new agents or extending existing ones:

1. Follow the standard agent structure
2. Include comprehensive configuration options
3. Document all API endpoints
4. Create appropriate prompts for AI-powered features
5. Add unit and integration tests
6. Update this documentation when adding new features

For more details on the development process, see [CONTRIBUTING.md](CONTRIBUTING.md).
