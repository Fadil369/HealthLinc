#!/bin/bash
# Health check script for HealthLinc services

echo "Running health checks on HealthLinc services..."

# Function to check service health
check_service() {
  SERVICE_NAME=$1
  HEALTH_URL=$2
  
  echo -n "Checking $SERVICE_NAME health... "
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
  
  if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ HEALTHY ($HEALTH_STATUS)"
    return 0
  else
    echo "❌ UNHEALTHY ($HEALTH_STATUS)"
    return 1
  fi
}

# Check each service
declare -a FAILED_SERVICES=()

check_service "FHIR Gateway" "http://localhost:8000/health" || FAILED_SERVICES+=("FHIR Gateway")
check_service "ClaimLinc" "http://localhost:3001/health" || FAILED_SERVICES+=("ClaimLinc")
check_service "RecordLinc" "http://localhost:3002/health" || FAILED_SERVICES+=("RecordLinc")
check_service "AuthLinc" "http://localhost:3003/health" || FAILED_SERVICES+=("AuthLinc")
check_service "NotifyLinc" "http://localhost:3004/health" || FAILED_SERVICES+=("NotifyLinc")
check_service "Patient Portal" "http://localhost:3000/api/health" || FAILED_SERVICES+=("Patient Portal")
check_service "Clinician Portal" "http://localhost:4000/api/health" || FAILED_SERVICES+=("Clinician Portal")

# Report results
echo ""
if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
  echo "🎉 All services are healthy!"
  exit 0
else
  echo "❌ Some services are unhealthy: ${FAILED_SERVICES[*]}"
  exit 1
fi
