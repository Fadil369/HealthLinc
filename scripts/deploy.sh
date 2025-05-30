#!/bin/bash
# BrainSAIT Unified Deployment Script

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Color formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}║     BrainSAIT Unified Deployment           ║${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo

# Environment setup
ENV=${1:-development}
echo -e "${YELLOW}Deploying to $ENV environment...${NC}"

# Command functions
deploy_docker() {
  echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
  docker-compose up -d
  echo -e "${GREEN}✓ Docker deployment completed${NC}"
}

deploy_kubernetes() {
  echo -e "${YELLOW}Applying Kubernetes configurations for $ENV...${NC}"
  kubectl apply -f infrastructure/kubernetes/frontend.yaml
  kubectl apply -f infrastructure/kubernetes/backend-services.yaml
  kubectl apply -f infrastructure/kubernetes/monitoring.yaml
  
  echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-frontend
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-gateway
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-auth
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-claimlinc
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-payments
  kubectl wait --for=condition=available --timeout=300s deployment/brainsait-agents
  
  echo -e "${GREEN}✓ Kubernetes deployment completed${NC}"
}

run_tests() {
  echo -e "${YELLOW}Running post-deployment tests...${NC}"
  cd scripts
  ./run_tests.sh
  cd ..
  echo -e "${GREEN}✓ Tests completed${NC}"
}

# Command router
case "$2" in
  "docker")
    deploy_docker
    ;;
  "kubernetes")
    deploy_kubernetes
    ;;
  "test")
    run_tests
    ;;
  *)
    if [ "$ENV" == "production" ]; then
      deploy_kubernetes
    else
      deploy_docker
    fi
    run_tests
    ;;
esac

echo -e "${GREEN}Deployment to $ENV completed successfully!${NC}"
