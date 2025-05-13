# Changelog

All notable changes to the HealthLinc Ecosystem will be documented in this file.

## [1.1.0] - 2025-05-13

### Added
- DocuLinc Agent Module
  - Enhanced clinical documentation to better support medical necessity
  - Documentation templates for common procedures
  - Customizable templates for different specialties
  - API endpoints for template management and documentation enhancement
  - Structured data capture for standardized reporting

- MatchLinc Agent Module
  - Diagnosis-procedure matching validation in billing system
  - Coding guidance based on medical necessity
  - Integration with claim submission process
  - AI-powered code relationship analysis
  - Training resources for proper diagnosis documentation

- ReviewerLinc Module
  - Fee schedule management system
  - Contract term tracking
  - Pricing alignment with payer contracts
  - Rate comparison across payers
  - Contract database with visualization capabilities

- ClaimTrackerLinc Agent
  - Improved claim tracking system
  - Duplicate detection before submission
  - Claim audit trail and history
  - Claim hash generation for integrity verification
  - Aging report capabilities

### Changed
- Updated docker-compose.yml to include new agent modules
- Enhanced documentation structure with new AGENTS.md file
- Updated README.md to reflect new components
- Fixed ClinicianLayout.jsx to use AnalyticsIcon for Analytics menu item

### Documentation
- Added comprehensive AGENTS.md documentation file
- Updated README.md with new system architecture diagram
- Updated CONTRIBUTING.md with agent module development guidelines
