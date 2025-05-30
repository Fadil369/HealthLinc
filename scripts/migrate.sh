#!/bin/bash
# BrainSAIT Unified Migration Script

set -e

# Color formatting
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Source and destination directories
LINCDESIGN_DIR="/Users/fadil369/Downloads/lincdesign"
NPHIES_DIR="/Users/fadil369/Desktop/NPHIES-INTEGRATION"
DEST_DIR="/Users/fadil369/Desktop/BrainSAIT-Unified"

# Print banner
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}║     BrainSAIT Unified Migration            ║${NC}"
echo -e "${GREEN}║                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo

# 1. Migrate frontend from lincdesign
echo -e "${YELLOW}Migrating frontend components from lincdesign...${NC}"
# Copy src directory
mkdir -p $DEST_DIR/frontend/src
cp -r $LINCDESIGN_DIR/src/* $DEST_DIR/frontend/src/

# Copy configuration files
cp $LINCDESIGN_DIR/index.html $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/vite.config.ts $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/tailwind.config.js $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/postcss.config.js $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/tsconfig.json $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/tsconfig.node.json $DEST_DIR/frontend/
cp $LINCDESIGN_DIR/tsconfig.app.json $DEST_DIR/frontend/

# Copy public directory
mkdir -p $DEST_DIR/frontend/public
cp -r $LINCDESIGN_DIR/public/* $DEST_DIR/frontend/public/

echo -e "${GREEN}✓ Frontend components migrated${NC}"

# 2. Migrate backend from NPHIES-INTEGRATION
echo -e "${YELLOW}Migrating backend components from NPHIES-INTEGRATION...${NC}"

# Copy backend services
mkdir -p $DEST_DIR/backend
cp -r $NPHIES_DIR/backend/* $DEST_DIR/backend/

# Copy infrastructure
mkdir -p $DEST_DIR/infrastructure/docker
mkdir -p $DEST_DIR/infrastructure/kubernetes
mkdir -p $DEST_DIR/infrastructure/terraform

cp -r $NPHIES_DIR/infrastructure/* $DEST_DIR/infrastructure/

# Copy test scripts
mkdir -p $DEST_DIR/scripts
cp $NPHIES_DIR/run_tests.sh $DEST_DIR/scripts/run_tests.sh
cp $NPHIES_DIR/check_agents.sh $DEST_DIR/scripts/check_agents.sh

echo -e "${GREEN}✓ Backend components migrated${NC}"

# 3. Migrate documents
echo -e "${YELLOW}Migrating documentation...${NC}"
cp $LINCDESIGN_DIR/FEATURES.md $DEST_DIR/docs/FEATURES.md
cp $LINCDESIGN_DIR/instruction.md $DEST_DIR/docs/UI_DESIGN_SPEC.md

if [ -d "$LINCDESIGN_DIR/src/docs" ]; then
  mkdir -p $DEST_DIR/docs/frontend
  cp -r $LINCDESIGN_DIR/src/docs/* $DEST_DIR/docs/frontend/
fi

if [ -d "$NPHIES_DIR/docs" ]; then
  mkdir -p $DEST_DIR/docs/api
  cp -r $NPHIES_DIR/docs/* $DEST_DIR/docs/api/
fi

echo -e "${GREEN}✓ Documentation migrated${NC}"

# Make scripts executable
chmod +x $DEST_DIR/scripts/*.sh

echo -e "${GREEN}Migration completed successfully!${NC}"
echo 
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review migrated files for any issues"
echo "2. Create a .env file from .env.example"
echo "3. Build and deploy the application using the scripts"
echo
echo -e "${YELLOW}Example commands:${NC}"
echo "cd $DEST_DIR"
echo "cp .env.example .env  # Edit as needed"
echo "./scripts/build.sh"
echo "./scripts/deploy.sh development docker"
