#!/bin/bash
# NPHIES Integration Test Runner Script
# Runs tests against the NPHIES Integration for BrainSAIT Healthcare Ecosystem

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
DEFAULT_URL="http://localhost:8000"
AUTH_TOKEN=""
TEST_TYPE="all"

# Print usage information
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -u, --url URL         Base URL for ClaimLinc service (default: $DEFAULT_URL)"
  echo "  -t, --token TOKEN     Authentication token (required)"
  echo "  -T, --test TEST       Test to run (health|connection|eligibility|claim|status|batch|all)"
  echo "  -h, --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  echo "  $0 --url http://api.example.com --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... --test eligibility"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -u|--url)
      CLAIMLINC_URL="$2"
      shift
      shift
      ;;
    -t|--token)
      AUTH_TOKEN="$2"
      shift
      shift
      ;;
    -T|--test)
      TEST_TYPE="$2"
      shift
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
done

# Validate arguments
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}Error: Authentication token is required${NC}"
  print_usage
  exit 1
fi

if [ -z "$CLAIMLINC_URL" ]; then
  CLAIMLINC_URL=$DEFAULT_URL
  echo -e "${YELLOW}No URL specified, using default: $CLAIMLINC_URL${NC}"
fi

# Validate test type
case $TEST_TYPE in
  health|connection|eligibility|claim|status|batch|all)
    # Valid test type
    ;;
  *)
    echo -e "${RED}Error: Invalid test type: $TEST_TYPE${NC}"
    print_usage
    exit 1
    ;;
esac

# Set environment variables for the test script
export AUTH_TOKEN=$AUTH_TOKEN
export CLAIMLINC_URL=$CLAIMLINC_URL

# Run the test script
echo -e "${BLUE}Running NPHIES Integration tests...${NC}"
echo -e "${BLUE}URL: $CLAIMLINC_URL${NC}"
echo -e "${BLUE}Test: $TEST_TYPE${NC}"
echo ""

python3 tests/test_nphies.py --url "$CLAIMLINC_URL" --token "$AUTH_TOKEN" --test "$TEST_TYPE"

# Capture the exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}Some tests failed. See log for details.${NC}"
fi

exit $EXIT_CODE