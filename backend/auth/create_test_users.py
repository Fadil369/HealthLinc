#!/usr/bin/env python3
"""
Script to create test users for BrainSAIT Authentication Service
"""
import sys
import os
import uuid
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import User, Base

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_test_users():
    """Create test users in the database"""
    
    # Database setup
    DATABASE_URL = "sqlite:///./brainsait.db"
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Test users to create
        test_users = [
            {
                "email": "admin@brainsait.com",
                "password": "Admin123!",
                "first_name": "Admin",
                "last_name": "User",
                "company_name": "BrainSAIT",
                "role": "Administrator"
            },
            {
                "email": "test@example.com",
                "password": "Test123!",
                "first_name": "Test",
                "last_name": "User", 
                "company_name": "Test Company",
                "role": "User"
            },
            {
                "email": "demo@healthcare.com",
                "password": "Demo123!",
                "first_name": "Demo",
                "last_name": "Healthcare",
                "company_name": "Healthcare Clinic",
                "role": "Healthcare Provider"
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
                
            # Create new user
            user_id = str(uuid.uuid4())
            db_user = User(
                id=user_id,
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                company_name=user_data["company_name"],
                role=user_data["role"],
                is_active=True,
                is_verified=True,  # Set to True for test users
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(db_user)
            created_users.append({
                "email": user_data["email"],
                "password": user_data["password"],
                "name": f"{user_data['first_name']} {user_data['last_name']}"
            })
            
        db.commit()
        
        print("\n✅ Test users created successfully!")
        print("\n📋 Test Credentials:")
        print("=" * 60)
        
        for user in created_users:
            print(f"Email: {user['email']}")
            print(f"Password: {user['password']}")
            print(f"Name: {user['name']}")
            print("-" * 60)
            
        if not created_users:
            print("No new users created - all test users already exist")
            
        # Show existing users
        print("\n👥 All users in database:")
        print("=" * 60)
        all_users = db.query(User).all()
        for user in all_users:
            print(f"Email: {user.email}")
            print(f"Name: {user.first_name} {user.last_name}")
            print(f"Company: {user.company_name}")
            print(f"Active: {user.is_active}")
            print(f"Verified: {user.is_verified}")
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
