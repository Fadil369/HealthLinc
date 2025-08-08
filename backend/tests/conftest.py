"""
Shared testing utilities for HealthLinc backend services.
Provides healthcare-specific test fixtures and performance benchmarking.
"""
import pytest
import time
import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta
from faker import Faker
from dataclasses import dataclass

fake = Faker(['en_US', 'ar_SA'])  # US English and Arabic for Saudi Arabia

@dataclass
class PerformanceBenchmark:
    """Performance benchmark data for healthcare operations."""
    operation: str
    duration_ms: float
    memory_usage_mb: float
    compliance_threshold_ms: float = 5000  # 5 seconds max for healthcare operations
    
    @property
    def is_compliant(self) -> bool:
        return self.duration_ms <= self.compliance_threshold_ms

class HealthcareTestFixtures:
    """Healthcare-specific test data fixtures."""
    
    @staticmethod
    def mock_patient_data() -> Dict[str, Any]:
        """Generate mock patient data compliant with Saudi healthcare standards."""
        return {
            "id": f"PAT-{fake.random_int(1000, 9999)}",
            "national_id": fake.numerify('##########'),  # 10-digit Saudi ID
            "name": fake.name(),
            "name_arabic": fake.name(),
            "date_of_birth": fake.date_of_birth(minimum_age=1, maximum_age=100).isoformat(),
            "gender": fake.random_element(elements=('male', 'female')),
            "phone": f"+966{fake.numerify('#########')}",  # Saudi phone format
            "email": fake.email(),
            "address": {
                "street": fake.street_address(),
                "city": fake.random_element(elements=('Riyadh', 'Jeddah', 'Dammam', 'Makkah')),
                "province": fake.random_element(elements=('Riyadh', 'Makkah', 'Eastern', 'Asir')),
                "postal_code": fake.numerify('#####'),
                "country": "SA"
            },
            "insurance": {
                "card_number": f"INS-{fake.numerify('############')}",
                "provider": fake.random_element(elements=('NPHIES', 'Cooperative', 'Bupa Arabia')),
                "expiry_date": (datetime.now() + timedelta(days=365)).isoformat()
            }
        }
    
    @staticmethod
    def mock_claim_data() -> Dict[str, Any]:
        """Generate mock insurance claim data for NPHIES testing."""
        return {
            "id": f"CLM-{datetime.now().year}-{fake.random_int(1000, 9999)}",
            "patient_id": f"PAT-{fake.random_int(1000, 9999)}",
            "provider_id": f"PRV-{fake.random_int(100, 999)}",
            "claim_date": fake.date_time_between(start_date='-30d', end_date='now').isoformat(),
            "total_amount": round(fake.random.uniform(100, 5000), 2),
            "currency": "SAR",
            "status": fake.random_element(elements=('submitted', 'processing', 'approved', 'rejected')),
            "services": [
                {
                    "code": fake.random_element(elements=('99213', '85025', '80053', '36415')),
                    "description": fake.sentence(nb_words=4),
                    "quantity": fake.random_int(1, 5),
                    "unit_price": round(fake.random.uniform(50, 500), 2),
                    "total_price": 0  # Will be calculated
                }
            ],
            "diagnosis": [
                {
                    "code": f"{fake.random_element(elements=('Z', 'M', 'I', 'J'))}{fake.numerify('##.##')}",
                    "description": fake.sentence(nb_words=6)
                }
            ],
            "nphies_reference": f"NPHIES-{fake.uuid4()}"
        }

@pytest.fixture
def patient_data():
    """Pytest fixture for patient test data."""
    return HealthcareTestFixtures.mock_patient_data()

@pytest.fixture
def claim_data():
    """Pytest fixture for claim test data."""
    return HealthcareTestFixtures.mock_claim_data()

@pytest.fixture
def performance_tracker():
    """Pytest fixture for performance tracking."""
    benchmarks: List[PerformanceBenchmark] = []
    
    def track_performance(operation_name: str, threshold_ms: float = 5000):
        def decorator(func):
            async def async_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                result = await func(*args, **kwargs)
                duration = (time.perf_counter() - start_time) * 1000
                
                benchmark = PerformanceBenchmark(
                    operation=operation_name,
                    duration_ms=duration,
                    memory_usage_mb=0,  # Could add memory tracking
                    compliance_threshold_ms=threshold_ms
                )
                benchmarks.append(benchmark)
                
                # Assert compliance for critical healthcare operations
                if not benchmark.is_compliant:
                    pytest.fail(
                        f"Performance test failed: {operation_name} took {duration:.2f}ms "
                        f"(threshold: {threshold_ms}ms)"
                    )
                
                return result
            
            def sync_wrapper(*args, **kwargs):
                start_time = time.perf_counter()
                result = func(*args, **kwargs)
                duration = (time.perf_counter() - start_time) * 1000
                
                benchmark = PerformanceBenchmark(
                    operation=operation_name,
                    duration_ms=duration,
                    memory_usage_mb=0,
                    compliance_threshold_ms=threshold_ms
                )
                benchmarks.append(benchmark)
                
                if not benchmark.is_compliant:
                    pytest.fail(
                        f"Performance test failed: {operation_name} took {duration:.2f}ms "
                        f"(threshold: {threshold_ms}ms)"
                    )
                
                return result
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        return decorator
    
    class PerformanceTracker:
        track = track_performance
        benchmarks = benchmarks
    
    return PerformanceTracker()

# Markers for different types of tests
pytestmark = [
    pytest.mark.healthcare,
    pytest.mark.nphies,
    pytest.mark.compliance
]