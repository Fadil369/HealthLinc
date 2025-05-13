"""
Database connection module for RecordLinc

This module handles the connection to the MongoDB database for patient records storage.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("recordlinc.database")

# MongoDB connection string from environment variables
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://mongodb:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "healthlinc")
MONGO_USER = os.environ.get("MONGO_USER")
MONGO_PASSWORD = os.environ.get("MONGO_PASSWORD")

# Collections
PATIENTS_COLLECTION = "patients"
OBSERVATIONS_COLLECTION = "observations"
AUDIT_COLLECTION = "audit_logs"

# MongoDB client instance
client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongodb() -> AsyncIOMotorDatabase:
    """
    Creates a connection to MongoDB
    
    Returns:
        AsyncIOMotorDatabase: MongoDB database instance
    """
    global client, db
    
    try:
        # Construct the connection URI with auth if provided
        connection_uri = MONGO_URI
        if MONGO_USER and MONGO_PASSWORD:
            # Split the URI to insert credentials
            if "://" in connection_uri:
                prefix, suffix = connection_uri.split("://", 1)
                connection_uri = f"{prefix}://{MONGO_USER}:{MONGO_PASSWORD}@{suffix}"
        
        # Create client
        client = AsyncIOMotorClient(connection_uri, serverSelectionTimeoutMS=5000)
        
        # Verify connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Get database
        db = client[MONGO_DB_NAME]
        
        # Create indexes for better performance
        await db[PATIENTS_COLLECTION].create_index("identifier", unique=True)
        await db[PATIENTS_COLLECTION].create_index("last_name")
        await db[PATIENTS_COLLECTION].create_index("insurance_id")
        await db[OBSERVATIONS_COLLECTION].create_index("patient_id")
        await db[OBSERVATIONS_COLLECTION].create_index("code")
        
        return db
    
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Could not connect to MongoDB: {str(e)}")
        raise


async def get_database() -> AsyncIOMotorDatabase:
    """
    Returns the database instance, connecting if necessary
    
    Returns:
        AsyncIOMotorDatabase: MongoDB database instance
    """
    if db is None:
        return await connect_to_mongodb()
    return db


async def close_mongodb_connection() -> None:
    """
    Closes the MongoDB connection
    """
    if client:
        client.close()
        logger.info("MongoDB connection closed")


# CRUD Operations for Patient Records

async def insert_patient(patient_data: Dict[str, Any]) -> str:
    """
    Insert a new patient record into the database
    
    Args:
        patient_data: Dictionary containing patient information
        
    Returns:
        str: ID of the inserted patient record
    """
    database = await get_database()
    result = await database[PATIENTS_COLLECTION].insert_one(patient_data)
    return str(result.inserted_id)


async def find_patient_by_id(patient_id: str) -> Optional[Dict[str, Any]]:
    """
    Find a patient by their ID
    
    Args:
        patient_id: Patient identifier
        
    Returns:
        Optional[Dict[str, Any]]: Patient record if found, None otherwise
    """
    database = await get_database()
    return await database[PATIENTS_COLLECTION].find_one({"identifier": patient_id})


async def update_patient(patient_id: str, updates: Dict[str, Any]) -> bool:
    """
    Update a patient record
    
    Args:
        patient_id: Patient identifier
        updates: Dictionary containing fields to update
        
    Returns:
        bool: True if update was successful, False otherwise
    """
    database = await get_database()
    result = await database[PATIENTS_COLLECTION].update_one(
        {"identifier": patient_id},
        {"$set": updates}
    )
    return result.modified_count > 0


async def delete_patient(patient_id: str) -> bool:
    """
    Delete a patient record
    
    Args:
        patient_id: Patient identifier
        
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    database = await get_database()
    result = await database[PATIENTS_COLLECTION].delete_one({"identifier": patient_id})
    return result.deleted_count > 0


async def search_patients(query: Dict[str, Any], limit: int = 20) -> List[Dict[str, Any]]:
    """
    Search for patients based on query parameters
    
    Args:
        query: Search criteria
        limit: Maximum number of results to return
        
    Returns:
        List[Dict[str, Any]]: List of matching patient records
    """
    database = await get_database()
    cursor = database[PATIENTS_COLLECTION].find(query).limit(limit)
    return [doc async for doc in cursor]


# Observation Data Operations

async def insert_observation(observation_data: Dict[str, Any]) -> str:
    """
    Insert a new observation record into the database
    
    Args:
        observation_data: Dictionary containing observation information
        
    Returns:
        str: ID of the inserted observation record
    """
    database = await get_database()
    result = await database[OBSERVATIONS_COLLECTION].insert_one(observation_data)
    return str(result.inserted_id)


async def find_observations_by_patient(patient_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Find observations for a specific patient
    
    Args:
        patient_id: Patient identifier
        limit: Maximum number of observations to return
        
    Returns:
        List[Dict[str, Any]]: List of observation records
    """
    database = await get_database()
    cursor = database[OBSERVATIONS_COLLECTION].find({"patient_id": patient_id}).limit(limit)
    return [doc async for doc in cursor]


# Audit Logging

async def log_audit_event(
    event_type: str,
    user_id: str,
    resource_type: str,
    resource_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log an audit event for compliance and security tracking
    
    Args:
        event_type: Type of event (access, modify, delete, etc.)
        user_id: ID of the user performing the action
        resource_type: Type of resource being acted upon (patient, observation, etc.)
        resource_id: ID of the specific resource
        action: Description of the action performed
        details: Additional details about the event
    """
    database = await get_database()
    
    audit_entry = {
        "timestamp": datetime.now(),
        "event_type": event_type,
        "user_id": user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": action,
        "details": details or {},
        "ip_address": None,  # Should be filled in handler
        "user_agent": None,  # Should be filled in handler
    }
    
    await database[AUDIT_COLLECTION].insert_one(audit_entry)
