#!/bin/bash
# Frontend Integration Script

# Set variables
LINCDESIGN_DIR="/Users/fadil369/Downloads/lincdesign"
BRAINSAIT_DIR="/Users/fadil369/Desktop/BrainSAIT-Unified"
FRONTEND_DIR="/Users/fadil369/Desktop/BrainSAIT-Unified/frontend"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== BrainSAIT Frontend Integration Script ===${NC}"

# Check if directories exist
if [ ! -d "$LINCDESIGN_DIR" ]; then
  echo -e "${RED}Error: LincDesign directory not found at $LINCDESIGN_DIR${NC}"
  exit 1
fi

if [ ! -d "$BRAINSAIT_DIR" ]; then
  echo -e "${RED}Error: BrainSAIT-Unified directory not found at $BRAINSAIT_DIR${NC}"
  exit 1
fi

# Install dependencies for lincdesign frontend
echo -e "${YELLOW}Installing dependencies for lincdesign frontend...${NC}"
cd "$LINCDESIGN_DIR"
npm install

# Build the lincdesign frontend
echo -e "${YELLOW}Building the lincdesign frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to build the lincdesign frontend${NC}"
  exit 1
fi

# Copy the built frontend to BrainSAIT-Unified
echo -e "${YELLOW}Copying the built frontend to BrainSAIT-Unified...${NC}"
rm -rf "$FRONTEND_DIR/dist"
mkdir -p "$FRONTEND_DIR/dist"
cp -r "$LINCDESIGN_DIR/dist/"* "$FRONTEND_DIR/dist/"

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to copy the built frontend${NC}"
  exit 1
fi

# Copy the src directory to have access to the source code
echo -e "${YELLOW}Copying the source code for reference and development...${NC}"
rm -rf "$FRONTEND_DIR/src"
mkdir -p "$FRONTEND_DIR/src"
cp -r "$LINCDESIGN_DIR/src/"* "$FRONTEND_DIR/src/"

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to copy the source code${NC}"
  exit 1
fi

# Create the services directory if it doesn't exist
mkdir -p "$FRONTEND_DIR/src/services"

# Copy ESLint configuration
echo -e "${YELLOW}Copying ESLint configuration...${NC}"
cp "$BRAINSAIT_DIR/frontend/eslint.config.js" "$FRONTEND_DIR/"

echo -e "${GREEN}Frontend integration complete!${NC}"
echo -e "${YELLOW}Please rebuild and restart the frontend container:${NC}"
echo -e "  cd $BRAINSAIT_DIR"
echo -e "  docker-compose build frontend"
echo -e "  docker-compose up -d frontend"

exit 0
