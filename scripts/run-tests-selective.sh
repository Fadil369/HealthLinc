#!/bin/bash
# Intelligent test selection script for HealthLinc
# Runs only tests affected by code changes to reduce CI time

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_BRANCH="${1:-origin/main}"
CURRENT_BRANCH="${2:-HEAD}"
TEST_CACHE_DIR=".test-cache"
FORCE_ALL_TESTS="${FORCE_ALL_TESTS:-false}"

echo -e "${BLUE}🔍 HealthLinc Intelligent Test Selection${NC}"
echo -e "${BLUE}Base branch: $BASE_BRANCH${NC}"
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"

# Create cache directory
mkdir -p "$TEST_CACHE_DIR"

# Function to get changed files
get_changed_files() {
    git diff --name-only "$BASE_BRANCH"..."$CURRENT_BRANCH" 2>/dev/null || {
        echo -e "${YELLOW}Warning: Could not compare branches, running all tests${NC}"
        echo "all"
        return
    }
}

# Function to determine affected test categories
determine_test_categories() {
    local changed_files="$1"
    local categories=()

    if [[ "$changed_files" == "all" ]] || [[ "$FORCE_ALL_TESTS" == "true" ]]; then
        categories=("frontend" "backend" "integration" "performance")
    else
        # Frontend changes
        if echo "$changed_files" | grep -q "^frontend/\|^package\.json\|^package-lock\.json"; then
            categories+=("frontend")
        fi

        # Backend Python services
        if echo "$changed_files" | grep -q "^backend/.*\.py\|requirements\.txt"; then
            categories+=("backend")
        fi

        # Cloudflare Workers
        if echo "$changed_files" | grep -q "^src/\|wrangler\.toml\|webpack\.worker\.js"; then
            categories+=("worker")
        fi

        # CI/CD changes - run all tests
        if echo "$changed_files" | grep -q "^\.github/workflows/\|Dockerfile\|docker-compose\.yml"; then
            categories=("frontend" "backend" "integration" "performance")
        fi

        # Database/schema changes - run integration tests
        if echo "$changed_files" | grep -q "migrations/\|schema/\|database/"; then
            categories+=("integration" "database")
        fi

        # Healthcare compliance code - run compliance tests
        if echo "$changed_files" | grep -q "nphies\|claim\|auth\|compliance"; then
            categories+=("compliance")
        fi
    fi

    # Always run critical healthcare tests for main branch
    if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "origin/main" ]]; then
        categories+=("compliance" "performance")
    fi

    # Remove duplicates
    printf '%s\n' "${categories[@]}" | sort -u
}

# Function to run frontend tests
run_frontend_tests() {
    echo -e "${GREEN}🧪 Running Frontend Tests${NC}"
    
    cd frontend
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package-lock.json" -nt "node_modules/.installed" ]]; then
        echo "Installing frontend dependencies..."
        npm ci
        touch node_modules/.installed
    fi

    # Run linting
    echo "Running ESLint..."
    npm run lint

    # Run type checking
    echo "Running TypeScript type checking..."
    npx tsc --noEmit

    # Run tests with parallel execution
    echo "Running tests with coverage..."
    npm run test:run -- --reporter=verbose --coverage

    cd ..
}

# Function to run backend tests
run_backend_tests() {
    echo -e "${GREEN}🧪 Running Backend Tests${NC}"
    
    # Install dependencies if needed
    if [[ ! -f "$TEST_CACHE_DIR/backend-deps-installed" ]] || [[ "backend/test-requirements.txt" -nt "$TEST_CACHE_DIR/backend-deps-installed" ]]; then
        echo "Installing backend test dependencies..."
        pip install -r backend/test-requirements.txt
        touch "$TEST_CACHE_DIR/backend-deps-installed"
    fi

    # Run linting
    echo "Running flake8 linting..."
    flake8 backend/ --count --select=E9,F63,F7,F82 --show-source --statistics

    # Run type checking
    echo "Running mypy type checking..."
    mypy backend/ --ignore-missing-imports || true

    # Run tests with parallel execution
    echo "Running backend tests with pytest-xdist..."
    cd backend
    pytest tests/ -v \
        --cov=. \
        --cov-report=term-missing \
        --cov-report=xml:coverage.xml \
        --junit-xml=test-results.xml \
        -n auto \
        --dist=worksteal \
        -m "not slow"
    cd ..
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${GREEN}🧪 Running Integration Tests${NC}"
    
    # Start required services
    echo "Starting test services with Docker Compose..."
    docker-compose -f docker-compose.test.yml up -d redis postgres

    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 10

    # Run integration tests
    cd backend
    pytest tests/ -v \
        -m "integration" \
        --junit-xml=integration-test-results.xml \
        -n auto \
        --dist=worksteal
    cd ..

    # Cleanup
    docker-compose -f docker-compose.test.yml down
}

# Function to run performance tests
run_performance_tests() {
    echo -e "${GREEN}🧪 Running Performance Tests${NC}"
    
    cd backend
    pytest tests/test_performance.py -v \
        --benchmark-only \
        --benchmark-json=benchmark-results.json \
        --benchmark-min-rounds=3
    cd ..

    # Store benchmark results in cache for comparison
    if [[ -f "backend/benchmark-results.json" ]]; then
        cp backend/benchmark-results.json "$TEST_CACHE_DIR/latest-benchmarks.json"
        echo -e "${GREEN}✅ Performance benchmarks completed${NC}"
    fi
}

# Function to run compliance tests
run_compliance_tests() {
    echo -e "${GREEN}🧪 Running Healthcare Compliance Tests${NC}"
    
    cd backend
    pytest tests/ -v \
        -m "compliance or nphies" \
        --junit-xml=compliance-test-results.xml \
        --strict-markers
    cd ..
}

# Function to run worker tests
run_worker_tests() {
    echo -e "${GREEN}🧪 Running Cloudflare Worker Tests${NC}"
    
    # Build worker
    npm run build:worker

    # Run worker tests
    node test/api-test.js
}

# Function to cache test results
cache_test_results() {
    local category="$1"
    echo "Caching test results for $category..."
    
    # Store timestamp and git hash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|$(git rev-parse HEAD)" > "$TEST_CACHE_DIR/${category}-last-run"
}

# Function to check if tests can be skipped
can_skip_tests() {
    local category="$1"
    local cache_file="$TEST_CACHE_DIR/${category}-last-run"
    
    if [[ ! -f "$cache_file" ]]; then
        return 1
    fi
    
    local last_hash
    last_hash=$(cut -d'|' -f2 "$cache_file")
    local current_hash
    current_hash=$(git rev-parse HEAD)
    
    if [[ "$last_hash" == "$current_hash" ]]; then
        echo -e "${YELLOW}⏭️  Skipping $category tests (no changes since last run)${NC}"
        return 0
    fi
    
    return 1
}

# Main execution
main() {
    local start_time
    start_time=$(date +%s)
    
    # Get changed files
    local changed_files
    changed_files=$(get_changed_files)
    
    echo -e "${BLUE}Changed files:${NC}"
    if [[ "$changed_files" == "all" ]]; then
        echo "Running all tests (could not determine changes)"
    else
        echo "$changed_files" | sed 's/^/  /'
    fi
    echo

    # Determine test categories
    local categories
    readarray -t categories < <(determine_test_categories "$changed_files")
    
    echo -e "${BLUE}Test categories to run:${NC}"
    printf '  %s\n' "${categories[@]}"
    echo

    # Run tests for each category
    local failed_categories=()
    
    for category in "${categories[@]}"; do
        if can_skip_tests "$category"; then
            continue
        fi
        
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        case "$category" in
            "frontend")
                if run_frontend_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            "backend")
                if run_backend_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            "integration")
                if run_integration_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            "performance")
                if run_performance_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            "compliance")
                if run_compliance_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            "worker")
                if run_worker_tests; then
                    cache_test_results "$category"
                else
                    failed_categories+=("$category")
                fi
                ;;
            *)
                echo -e "${YELLOW}Unknown test category: $category${NC}"
                ;;
        esac
    done

    # Summary
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 Test Execution Summary${NC}"
    echo -e "${BLUE}Total execution time: ${duration}s${NC}"
    
    if [[ ${#failed_categories[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Failed test categories:${NC}"
        printf '  %s\n' "${failed_categories[@]}"
        exit 1
    fi
}

# Run main function
main "$@"