# Security Policy

## Supported Versions

The following versions of HealthLinc are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of HealthLinc seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do Not** disclose the vulnerability publicly.
2. **Do Not** open a public GitHub issue for the vulnerability.

### How to Report

Please send an email to security@healthlinc.app with a description of:

* The location and potential impact of the vulnerability
* A detailed description of the steps required to reproduce the vulnerability
* Any potential mitigations if known

### What to Expect

* We will acknowledge your email within 48 hours.
* We will provide a more detailed response within 72 hours, indicating the next steps in handling your report.
* After the initial reply, we will endeavor to keep you informed of the progress towards a fix and full announcement.
* We will prioritize vulnerabilities based on severity.

### Security Update Process

* Security patches will be released as quickly as possible once a fix is identified.
* For critical vulnerabilities, we aim to release patches within 7 days.
* All security updates will be documented in the release notes.

### Public Disclosure Timing

* A public disclosure date will be negotiated with the reporter of the vulnerability.
* We prefer to fully disclose the vulnerability once a fix is available.
* If the reporter wishes to disclose the vulnerability earlier, we will work with them to assess the risk.

## Security Best Practices for Users

### Deployment Recommendations

* Keep all services up-to-date with the latest security patches
* Use strong, unique passwords for all administrator accounts
* Implement network segmentation to isolate HealthLinc components
* Enable HTTPS for all public-facing components
* Use secure JWT secrets and rotate them regularly
* Implement proper access controls and audit logging

### Protected Health Information (PHI)

As HealthLinc deals with healthcare data, special attention must be paid to:

* HIPAA compliance requirements
* Data encryption (both in-transit and at-rest)
* Access control logging
* Patient consent tracking
* Data minimization principles

## Security Measures in HealthLinc

HealthLinc has implemented the following security measures:

* Role-based access control
* JWT token-based authentication
* Network isolation through Docker networks
* Input validation on all endpoints
* HTTPS enforcement
* Automatic session timeouts
* Secure storage of credentials
* Regular security audits and dependency updates

## Compliance

HealthLinc is designed with compliance in mind:

* HIPAA (U.S. Healthcare)
* GDPR (European Data Protection)
* PIPEDA (Canadian Privacy Law)
* HITECH Act requirements

## Security Updates

Security updates and advisories will be published:

1. In release notes
2. On the GitHub repository's Security Advisories page
3. Via email to registered administrators (for critical updates)

Thank you for helping us keep HealthLinc secure!
