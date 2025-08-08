#!/usr/bin/env python3
"""
Optimized test database seeding for HealthLinc insurance datasets.
Provides fast database setup with realistic healthcare data for testing.
"""

import asyncio
import json
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import sqlite3
import redis
from faker import Faker

# Initialize Faker with healthcare-specific locales
fake = Faker(['en_US', 'ar_SA'])

@dataclass
class PatientRecord:
    """Patient record for testing."""
    id: str
    national_id: str
    name: str
    name_arabic: str
    date_of_birth: str
    gender: str
    phone: str
    email: str
    insurance_card: str
    insurance_provider: str
    city: str
    province: str

@dataclass
class ClaimRecord:
    """Insurance claim record for testing."""
    id: str
    patient_id: str
    provider_id: str
    claim_date: str
    total_amount: float
    currency: str
    status: str
    services: List[Dict[str, Any]]
    diagnosis: List[Dict[str, str]]
    nphies_reference: str

class HealthcareDataGenerator:
    """Generate realistic healthcare test data."""
    
    SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Makkah', 'Dammam', 'Khobar', 'Tabuk', 'Abha']
    SAUDI_PROVINCES = ['Riyadh', 'Makkah', 'Eastern', 'Asir', 'Jazan', 'Tabuk', 'Northern']
    INSURANCE_PROVIDERS = ['NPHIES', 'Cooperative Insurance', 'Bupa Arabia', 'SAICO', 'Medgulf']
    CLAIM_STATUSES = ['submitted', 'processing', 'approved', 'rejected', 'pending']
    
    MEDICAL_SERVICES = [
        {'code': '99213', 'description': 'Office/outpatient visit, established patient', 'base_cost': 150},
        {'code': '85025', 'description': 'Complete blood count', 'base_cost': 50},
        {'code': '80053', 'description': 'Comprehensive metabolic panel', 'base_cost': 75},
        {'code': '36415', 'description': 'Venipuncture', 'base_cost': 25},
        {'code': '93000', 'description': 'Electrocardiogram', 'base_cost': 100},
        {'code': '71020', 'description': 'Chest X-ray', 'base_cost': 120},
        {'code': '73060', 'description': 'Knee X-ray', 'base_cost': 80},
        {'code': '99285', 'description': 'Emergency department visit', 'base_cost': 300},
    ]
    
    DIAGNOSIS_CODES = [
        {'code': 'Z00.00', 'description': 'Encounter for general adult medical examination'},
        {'code': 'I10', 'description': 'Essential hypertension'},
        {'code': 'E11.9', 'description': 'Type 2 diabetes mellitus without complications'},
        {'code': 'M79.3', 'description': 'Panniculitis, unspecified'},
        {'code': 'J06.9', 'description': 'Acute upper respiratory infection, unspecified'},
        {'code': 'K59.00', 'description': 'Constipation, unspecified'},
        {'code': 'R50.9', 'description': 'Fever, unspecified'},
        {'code': 'M25.551', 'description': 'Pain in right hip'},
    ]
    
    @classmethod
    def generate_patient(cls, patient_id: Optional[str] = None) -> PatientRecord:
        """Generate a single patient record."""
        if not patient_id:
            patient_id = f"PAT-{fake.random_int(10000, 99999)}"
        
        return PatientRecord(
            id=patient_id,
            national_id=fake.numerify('##########'),  # 10-digit Saudi national ID
            name=fake.name(),
            name_arabic=fake.name(),  # In real implementation, would use Arabic names
            date_of_birth=fake.date_of_birth(minimum_age=1, maximum_age=100).isoformat(),
            gender=fake.random_element(elements=('male', 'female')),
            phone=f"+966{fake.numerify('#########')}",  # Saudi phone format
            email=fake.email(),
            insurance_card=f"INS-{fake.numerify('############')}",
            insurance_provider=fake.random_element(elements=cls.INSURANCE_PROVIDERS),
            city=fake.random_element(elements=cls.SAUDI_CITIES),
            province=fake.random_element(elements=cls.SAUDI_PROVINCES)
        )
    
    @classmethod
    def generate_claim(cls, patient_id: str, claim_id: Optional[str] = None) -> ClaimRecord:
        """Generate a single claim record."""
        if not claim_id:
            claim_id = f"CLM-{datetime.now().year}-{fake.random_int(10000, 99999)}"
        
        # Generate 1-3 services per claim
        num_services = fake.random_int(1, 3)
        services = []
        total_amount = 0
        
        for _ in range(num_services):
            service = fake.random_element(elements=cls.MEDICAL_SERVICES)
            quantity = fake.random_int(1, 2)
            unit_price = service['base_cost'] * fake.random.uniform(0.8, 1.5)  # ±50% variation
            service_total = quantity * unit_price
            total_amount += service_total
            
            services.append({
                'code': service['code'],
                'description': service['description'],
                'quantity': quantity,
                'unit_price': round(unit_price, 2),
                'total_price': round(service_total, 2)
            })
        
        # Generate 1-2 diagnosis codes
        num_diagnoses = fake.random_int(1, 2)
        diagnoses = fake.random_elements(elements=cls.DIAGNOSIS_CODES, length=num_diagnoses, unique=True)
        
        return ClaimRecord(
            id=claim_id,
            patient_id=patient_id,
            provider_id=f"PRV-{fake.random_int(1000, 9999)}",
            claim_date=fake.date_time_between(start_date='-90d', end_date='now').isoformat(),
            total_amount=round(total_amount, 2),
            currency='SAR',
            status=fake.random_element(elements=cls.CLAIM_STATUSES),
            services=services,
            diagnosis=[{'code': d['code'], 'description': d['description']} for d in diagnoses],
            nphies_reference=f"NPHIES-{fake.uuid4()}"
        )

class OptimizedTestSeeder:
    """Optimized database seeder for test environments."""
    
    def __init__(self, db_path: str = ":memory:", redis_url: str = "redis://localhost:6379/1"):
        self.db_path = db_path
        self.redis_url = redis_url
        self.redis_client = None
        
    def setup_database(self):
        """Create database schema optimized for testing."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create patients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                national_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                name_arabic TEXT,
                date_of_birth TEXT NOT NULL,
                gender TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                insurance_card TEXT,
                insurance_provider TEXT,
                city TEXT,
                province TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create claims table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS claims (
                id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                claim_date TEXT NOT NULL,
                total_amount REAL NOT NULL,
                currency TEXT DEFAULT 'SAR',
                status TEXT NOT NULL,
                services TEXT,  -- JSON
                diagnosis TEXT, -- JSON
                nphies_reference TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients (id)
            )
        """)
        
        # Create indexes for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients (national_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_insurance ON patients (insurance_card)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims (patient_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_claims_status ON claims (status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_claims_date ON claims (claim_date)")
        
        conn.commit()
        conn.close()
        
        # Setup Redis connection
        try:
            self.redis_client = redis.from_url(self.redis_url)
            self.redis_client.ping()
            print("✅ Redis connection established")
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}")
            self.redis_client = None
    
    def seed_patients_batch(self, count: int, batch_size: int = 1000) -> List[PatientRecord]:
        """Seed patients in optimized batches."""
        print(f"🏥 Seeding {count} patients in batches of {batch_size}...")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        all_patients = []
        
        for i in range(0, count, batch_size):
            batch_count = min(batch_size, count - i)
            batch_patients = []
            
            # Generate batch data
            for j in range(batch_count):
                patient = HealthcareDataGenerator.generate_patient()
                batch_patients.append(patient)
                all_patients.append(patient)
            
            # Insert batch using executemany for performance
            cursor.executemany("""
                INSERT OR REPLACE INTO patients 
                (id, national_id, name, name_arabic, date_of_birth, gender, phone, email, 
                 insurance_card, insurance_provider, city, province)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                (p.id, p.national_id, p.name, p.name_arabic, p.date_of_birth, p.gender,
                 p.phone, p.email, p.insurance_card, p.insurance_provider, p.city, p.province)
                for p in batch_patients
            ])
            
            conn.commit()
            print(f"  ✅ Inserted batch {i//batch_size + 1}: {batch_count} patients")
        
        conn.close()
        
        # Cache patient IDs in Redis for fast lookup
        if self.redis_client:
            patient_ids = [p.id for p in all_patients]
            self.redis_client.sadd("test:patient_ids", *patient_ids)
            self.redis_client.expire("test:patient_ids", 3600)  # 1 hour expiry
            print(f"  ✅ Cached {len(patient_ids)} patient IDs in Redis")
        
        return all_patients
    
    def seed_claims_parallel(self, patient_ids: List[str], claims_per_patient: int = 3, max_workers: int = 4) -> List[ClaimRecord]:
        """Seed claims using parallel processing."""
        print(f"🏥 Seeding claims for {len(patient_ids)} patients (avg {claims_per_patient} per patient)...")
        
        all_claims = []
        
        def generate_patient_claims(patient_id: str) -> List[ClaimRecord]:
            """Generate claims for a single patient."""
            claims = []
            num_claims = fake.random_int(1, claims_per_patient * 2)  # Vary claims per patient
            
            for _ in range(num_claims):
                claim = HealthcareDataGenerator.generate_claim(patient_id)
                claims.append(claim)
            
            return claims
        
        # Use ThreadPoolExecutor for parallel claim generation
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_patient = {
                executor.submit(generate_patient_claims, patient_id): patient_id
                for patient_id in patient_ids
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_patient):
                patient_id = future_to_patient[future]
                try:
                    patient_claims = future.result()
                    all_claims.extend(patient_claims)
                except Exception as exc:
                    print(f"  ❌ Patient {patient_id} generated an exception: {exc}")
        
        # Insert all claims in batches
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        batch_size = 1000
        for i in range(0, len(all_claims), batch_size):
            batch = all_claims[i:i + batch_size]
            cursor.executemany("""
                INSERT OR REPLACE INTO claims 
                (id, patient_id, provider_id, claim_date, total_amount, currency, status, 
                 services, diagnosis, nphies_reference)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                (c.id, c.patient_id, c.provider_id, c.claim_date, c.total_amount, c.currency,
                 c.status, json.dumps(c.services), json.dumps(c.diagnosis), c.nphies_reference)
                for c in batch
            ])
            conn.commit()
            print(f"  ✅ Inserted claims batch {i//batch_size + 1}: {len(batch)} claims")
        
        conn.close()
        
        # Cache claim statistics in Redis
        if self.redis_client:
            claim_stats = {
                'total_claims': len(all_claims),
                'total_amount': sum(c.total_amount for c in all_claims),
                'status_distribution': {}
            }
            
            for status in ['submitted', 'processing', 'approved', 'rejected', 'pending']:
                count = sum(1 for c in all_claims if c.status == status)
                claim_stats['status_distribution'][status] = count
            
            self.redis_client.setex("test:claim_stats", 3600, json.dumps(claim_stats))
            print(f"  ✅ Cached claim statistics in Redis")
        
        return all_claims
    
    def seed_database(self, patient_count: int = 1000, claims_per_patient: int = 3) -> Dict[str, Any]:
        """Main seeding function with performance optimization."""
        start_time = time.time()
        
        print(f"🚀 Starting optimized database seeding...")
        print(f"   Patients: {patient_count}")
        print(f"   Claims per patient (avg): {claims_per_patient}")
        
        # Setup database schema
        self.setup_database()
        
        # Seed patients
        patients = self.seed_patients_batch(patient_count)
        patient_ids = [p.id for p in patients]
        
        # Seed claims in parallel
        claims = self.seed_claims_parallel(patient_ids, claims_per_patient)
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Calculate statistics
        stats = {
            'patients_created': len(patients),
            'claims_created': len(claims),
            'total_claim_amount': sum(c.total_amount for c in claims),
            'seeding_duration_seconds': round(duration, 2),
            'records_per_second': round((len(patients) + len(claims)) / duration, 2)
        }
        
        print(f"\n📊 Seeding completed successfully!")
        print(f"   Duration: {duration:.2f} seconds")
        print(f"   Records/second: {stats['records_per_second']}")
        print(f"   Total patients: {stats['patients_created']}")
        print(f"   Total claims: {stats['claims_created']}")
        print(f"   Total claim amount: {stats['total_claim_amount']:,.2f} SAR")
        
        return stats

def main():
    """Main function for standalone execution."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Optimized HealthLinc test database seeder')
    parser.add_argument('--patients', type=int, default=1000, help='Number of patients to create')
    parser.add_argument('--claims-per-patient', type=int, default=3, help='Average claims per patient')
    parser.add_argument('--db-path', type=str, default='test_healthlinc.db', help='Database file path')
    parser.add_argument('--redis-url', type=str, default='redis://localhost:6379/1', help='Redis URL')
    
    args = parser.parse_args()
    
    seeder = OptimizedTestSeeder(db_path=args.db_path, redis_url=args.redis_url)
    stats = seeder.seed_database(args.patients, args.claims_per_patient)
    
    print(f"\n✅ Database seeded: {args.db_path}")
    print(f"📊 Statistics: {json.dumps(stats, indent=2)}")

if __name__ == "__main__":
    main()