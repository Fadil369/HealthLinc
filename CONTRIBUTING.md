# Contributing to HealthLinc

Thank you for your interest in contributing to the HealthLinc Ecosystem! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Security](#security)

## Code of Conduct

The HealthLinc project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code.

* Be respectful and inclusive
* Be collaborative
* Be patient and welcoming
* Focus on what is best for the community
* Gracefully accept constructive criticism

## Getting Started

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/HealthLinc.git
   cd HealthLinc
   ```

3. **Set up development environment**
   ```bash
   # Copy sample env files
   cp .env.example .env

   # Start the development environment
   docker compose up -d
   ```

4. **Create a branch for your work**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

We follow a feature branch workflow:

1. **Main Branch**: Production code
2. **Develop Branch**: Integration branch
3. **Feature Branches**: For new features and fixes

```
main
 ↑
develop
 ↑
feature/your-feature
```

## Coding Standards

### Python

* Follow PEP 8 style guide
* Use type hints
* Document functions and classes with docstrings
* Maximum line length: 88 characters (using Black formatter)

### JavaScript/TypeScript

* Use ESLint with our provided config
* Format with Prettier
* Use React hooks for functional components
* Follow the project's component structure

### General

* Write clear, readable code
* Add comments for complex logic
* Keep functions and methods focused on a single responsibility
* Maintain backward compatibility where possible

## Pull Request Process

1. Update the README.md and documentation with details of changes if applicable
2. Make sure all tests pass
3. Ensure code follows the project's coding standards
4. Submit a pull request to the `develop` branch
5. Address any feedback from code reviews
6. Once approved, a maintainer will merge your contribution

## Testing

* Write tests for new features and bug fixes
* Ensure existing tests pass
* For backend:
  ```bash
  cd backend/linc-agents/<agent-name>
  python -m pytest
  ```
* For frontend:
  ```bash
  cd frontend/<portal-name>
  npm test
  ```

## Documentation

* Update documentation for any changed features
* Document new features thoroughly
* Use clear language and examples
* Keep technical documentation up-to-date with code changes

## Security

* Never commit sensitive information (API keys, credentials)
* Report security vulnerabilities privately to the maintainers
* Follow HIPAA and GDPR compliance guidelines for all healthcare data
* Use secure coding practices to prevent common vulnerabilities

---

Thank you for contributing to the HealthLinc Ecosystem!
