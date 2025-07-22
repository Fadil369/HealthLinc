"""
Configuration settings for NPHIES Integration Service
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Application settings
    app_name: str = "NPHIES Integration Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    reload: bool = False
    
    # NPHIES API settings
    nphies_base_url: str = "https://nphies.sa/api"
    nphies_timeout: int = 30
    nphies_max_retries: int = 3
    
    # HealthLinc Agent settings
    healthlinc_base_url: str = "http://localhost:8000"
    agent_timeout: int = 60
    agent_max_retries: int = 2
    
    # Agent endpoints
    authlinc_endpoint: str = "/api/v1/authlinc"
    claimlinc_endpoint: str = "/api/v1/claimlinc"
    claimtrackerlinc_endpoint: str = "/api/v1/claimtrackerlinc"
    doculinc_endpoint: str = "/api/v1/doculinc"
    matchlinc_endpoint: str = "/api/v1/matchlinc"
    notifylinc_endpoint: str = "/api/v1/notifylinc"
    recordlinc_endpoint: str = "/api/v1/recordlinc"
    reviewerlinc_endpoint: str = "/api/v1/reviewerlinc"
    
    # Redis settings (for background tasks)
    redis_url: str = "redis://localhost:6379"
    redis_password: Optional[str] = None
    redis_db: int = 0
    
    # Database settings (for caching and logging)
    database_url: str = "sqlite:///./nphies_integration.db"
    database_echo: bool = False
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "json"
    log_file: Optional[str] = None
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production"
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    
    # CORS settings
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://healthlinc.sa"
    ]
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # seconds
    
    # Processing settings
    max_concurrent_requests: int = 10
    batch_size: int = 100
    processing_timeout: int = 300  # 5 minutes
    
    # File storage settings
    upload_directory: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10 MB
    allowed_file_types: list = [".json", ".xml"]
    
    # Monitoring settings
    metrics_enabled: bool = True
    health_check_interval: int = 30
    
    # NPHIES specific settings
    nphies_organization_id: str = "your-organization-id"
    nphies_client_id: str = "your-client-id"
    nphies_client_secret: str = "your-client-secret"
    
    # FHIR settings
    fhir_version: str = "R4"
    validate_fhir: bool = True
    strict_validation: bool = False
    
    # Cache settings
    cache_ttl: int = 3600  # 1 hour
    cache_enabled: bool = True
    
    class Config:
        env_file = ".env"
        env_prefix = "NPHIES_"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_agent_endpoints() -> dict:
    """Get all agent endpoints configuration"""
    return {
        "authlinc": f"{settings.healthlinc_base_url}{settings.authlinc_endpoint}",
        "claimlinc": f"{settings.healthlinc_base_url}{settings.claimlinc_endpoint}",
        "claimtrackerlinc": f"{settings.healthlinc_base_url}{settings.claimtrackerlinc_endpoint}",
        "doculinc": f"{settings.healthlinc_base_url}{settings.doculinc_endpoint}",
        "matchlinc": f"{settings.healthlinc_base_url}{settings.matchlinc_endpoint}",
        "notifylinc": f"{settings.healthlinc_base_url}{settings.notifylinc_endpoint}",
        "recordlinc": f"{settings.healthlinc_base_url}{settings.recordlinc_endpoint}",
        "reviewerlinc": f"{settings.healthlinc_base_url}{settings.reviewerlinc_endpoint}"
    }


def get_message_type_routing() -> dict:
    """Get message type to agent routing configuration"""
    return {
        "eligibility-request": ["authlinc", "recordlinc"],
        "eligibility-response": ["authlinc", "notifylinc"],
        "priorauth-request": ["authlinc", "doculinc", "matchlinc"],
        "priorauth-response": ["authlinc", "notifylinc", "doculinc"],
        "claim-request": ["claimlinc", "claimtrackerlinc", "matchlinc"],
        "claim-response": ["claimlinc", "notifylinc", "claimtrackerlinc"],
        "communication-request": ["notifylinc", "doculinc"],
        "communication-response": ["notifylinc"],
        "prescriber-request": ["matchlinc", "reviewerlinc"],
        "prescriber-response": ["reviewerlinc", "notifylinc"],
        "payment-notice": ["claimlinc", "claimtrackerlinc", "notifylinc"],
        "payment-reconciliation": ["claimlinc", "claimtrackerlinc"]
    }


def get_resource_type_routing() -> dict:
    """Get FHIR resource type to agent routing configuration"""
    return {
        "Patient": ["recordlinc", "matchlinc"],
        "Organization": ["matchlinc", "recordlinc"],
        "Practitioner": ["matchlinc", "reviewerlinc"],
        "Claim": ["claimlinc", "claimtrackerlinc"],
        "Coverage": ["authlinc", "recordlinc"],
        "CoverageEligibilityRequest": ["authlinc"],
        "CoverageEligibilityResponse": ["authlinc", "notifylinc"],
        "ClaimResponse": ["claimlinc", "notifylinc"],
        "CommunicationRequest": ["notifylinc", "doculinc"],
        "Communication": ["notifylinc"],
        "PaymentNotice": ["claimlinc", "notifylinc"],
        "PaymentReconciliation": ["claimlinc"]
    }


# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings"""
    debug: bool = True
    reload: bool = True
    log_level: str = "DEBUG"
    database_echo: bool = True
    cors_origins: list = ["*"]


class ProductionSettings(Settings):
    """Production environment settings"""
    debug: bool = False
    reload: bool = False
    log_level: str = "INFO"
    database_echo: bool = False
    strict_validation: bool = True


class TestingSettings(Settings):
    """Testing environment settings"""
    debug: bool = True
    database_url: str = "sqlite:///./test_nphies_integration.db"
    redis_url: str = "redis://localhost:6379/1"
    log_level: str = "DEBUG"


def get_settings(environment: str = None) -> Settings:
    """Get environment-specific settings"""
    env = environment or os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()
