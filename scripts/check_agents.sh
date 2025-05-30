#!/bin/bash
# Enhanced test script to check agent status for all features

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== BrainSAIT Agent Validation Script =====${NC}"

# Login and get token
echo -e "${YELLOW}Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username": "test@brainsait.com", "password": "password123"}' http://localhost:8000/auth/login)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Login failed. Using dummy token for testing...${NC}"
  TOKEN="dummy_token_for_testing"
fi

echo -e "${GREEN}===== Agent Status Check =====${NC}"
echo "Getting agent status..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/agents/status
echo

echo -e "${GREEN}===== Health Check for All Services =====${NC}"
echo -e "${YELLOW}1. Checking gateway health...${NC}"
curl -s http://localhost:8000/health
echo

echo -e "${YELLOW}2. Checking auth service health...${NC}"
curl -s http://localhost:8000/auth/health
echo

echo -e "${YELLOW}3. Checking agent service health...${NC}"
curl -s http://localhost:8004/health
echo

echo -e "${GREEN}===== Testing AI Agent Endpoints =====${NC}"

echo -e "${YELLOW}4. Checking DocuLinc AI endpoint...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patient_id": "P12345", "medical_record": {"diagnoses": ["hypertension"]}, "note_text": "Patient reports headaches."}' \
  http://localhost:8000/agents/doculinc
echo

echo -e "${YELLOW}5. Checking Scheduling Intelligence endpoint...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"date": "2025-05-28", "provider_ids": ["P123", "P456"]}' \
  http://localhost:8000/agents/scheduling
echo

echo -e "${YELLOW}6. Checking RCM Optimization endpoint...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"claims": [{"id": "C12345", "amount": 1200, "diagnosis_code": "E11.9"}, {"id": "C67890", "amount": 850}]}' \
  http://localhost:8000/agents/rcm
echo

echo -e "${YELLOW}7. Checking Compliance Monitoring endpoint...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"actions": [{"type": "claim_submission", "data": {"claim_id": "C12345"}}], "regulations": ["HIPAA"]}' \
  http://localhost:8000/agents/compliance
echo

echo -e "${YELLOW}8. Checking Telehealth Concierge endpoint...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"session": {"id": "S12345", "patient_id": "P12345"}, "transcript": "Doctor: How are you feeling today?", "language": "en"}' \
  http://localhost:8000/agents/telehealth
echo

echo -e "${GREEN}===== Validation Complete =====${NC}"
