#!/bin/bash
# BrainSAIT Unified Build Script

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
echo -e "${GREEN}║     BrainSAIT Unified Build System         ║${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo

# Command functions
build_frontend() {
  echo -e "${YELLOW}Building frontend...${NC}"
  cd frontend
  npm install
  npm run build
  cd ..
  echo -e "${GREEN}✓ Frontend built successfully${NC}"
}

build_backend() {
  echo -e "${YELLOW}Building backend services...${NC}"
  
  cd backend
  
  services=("gateway" "auth" "claimlinc" "payments" "agents")
  
  for service in "${services[@]}"; do
    echo -e "${YELLOW}Building $service service...${NC}"
    cd $service
    docker build -t brainsait-$service .
    cd ..
    echo -e "${GREEN}✓ $service service built successfully${NC}"
  done
  
  cd ..
}

build_all() {
  build_frontend
  build_backend
}

# Command router
case "$1" in
  "frontend")
    build_frontend
    ;;
  "backend")
    build_backend
    ;;
  *)
    build_all
    ;;
esac

echo -e "${GREEN}Build completed successfully!${NC}"
