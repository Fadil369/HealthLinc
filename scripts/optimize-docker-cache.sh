#!/bin/bash
# Intelligent Docker layer caching script for HealthLinc CI/CD
# Optimizes build times by managing cache layers efficiently

set -e

# Configuration
REGISTRY="${REGISTRY:-ghcr.io/fadil369/healthlinc}"
CACHE_SCOPE="${CACHE_SCOPE:-main}"
BUILDKIT_INLINE_CACHE="${BUILDKIT_INLINE_CACHE:-1}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 HealthLinc Docker Layer Caching Optimization${NC}"

# Function to build with optimized caching
build_with_cache() {
    local service="$1"
    local context="$2"
    local dockerfile="${3:-Dockerfile}"
    
    echo -e "${BLUE}Building $service with optimized caching...${NC}"
    
    # Generate cache tags
    local cache_tag="${REGISTRY}-${service}:cache-${CACHE_SCOPE}"
    local build_tag="${REGISTRY}-${service}:${GITHUB_SHA:-latest}"
    
    # Build arguments for cache optimization
    local build_args=(
        "--build-arg" "BUILDKIT_INLINE_CACHE=${BUILDKIT_INLINE_CACHE}"
        "--build-arg" "NODE_ENV=production"
        "--cache-from" "type=registry,ref=${cache_tag}"
        "--cache-to" "type=registry,ref=${cache_tag},mode=max"
        "--tag" "$build_tag"
        "--file" "$context/$dockerfile"
        "$context"
    )
    
    # Multi-platform build for better compatibility
    if [[ "${MULTI_PLATFORM:-false}" == "true" ]]; then
        build_args+=("--platform" "linux/amd64,linux/arm64")
    fi
    
    # Execute build
    docker buildx build "${build_args[@]}"
    
    echo -e "${GREEN}✅ Built $service successfully${NC}"
}

# Function to optimize base images
optimize_base_images() {
    echo -e "${BLUE}📦 Optimizing base images...${NC}"
    
    # Pull latest base images for better caching
    docker pull node:18-alpine || true
    docker pull python:3.11-slim || true
    docker pull nginx:alpine || true
    docker pull redis:7-alpine || true
    docker pull postgres:15-alpine || true
    
    echo -e "${GREEN}✅ Base images optimized${NC}"
}

# Function to clean up old cache layers
cleanup_cache() {
    echo -e "${BLUE}🧹 Cleaning up old cache layers...${NC}"
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused build cache (keep last 7 days)
    docker buildx prune --filter "until=168h" -f
    
    echo -e "${GREEN}✅ Cache cleanup completed${NC}"
}

# Function to analyze cache hit rates
analyze_cache_performance() {
    echo -e "${BLUE}📊 Analyzing cache performance...${NC}"
    
    # Get build cache info
    docker buildx du
    
    # Calculate cache statistics
    local cache_size
    cache_size=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" | grep "Build Cache" | awk '{print $3}')
    
    echo -e "${BLUE}Cache size: ${cache_size}${NC}"
    echo -e "${GREEN}✅ Cache analysis completed${NC}"
}

# Main execution based on arguments
case "${1:-build}" in
    "build")
        optimize_base_images
        
        # Build services with specific optimization strategies
        if [[ -z "$2" ]]; then
            # Build all services
            build_with_cache "fhir-gateway" "backend/fhir-gateway"
            build_with_cache "auth" "backend/auth"
            build_with_cache "claimlinc" "backend/claimlinc"
            build_with_cache "payments" "backend/payments"
            build_with_cache "frontend" "frontend"
        else
            # Build specific service
            case "$2" in
                "frontend")
                    build_with_cache "frontend" "frontend"
                    ;;
                "auth"|"claimlinc"|"payments"|"fhir-gateway")
                    build_with_cache "$2" "backend/$2"
                    ;;
                *)
                    echo -e "${YELLOW}Unknown service: $2${NC}"
                    exit 1
                    ;;
            esac
        fi
        ;;
    "cleanup")
        cleanup_cache
        ;;
    "analyze")
        analyze_cache_performance
        ;;
    "optimize")
        optimize_base_images
        cleanup_cache
        analyze_cache_performance
        ;;
    *)
        echo "Usage: $0 {build|cleanup|analyze|optimize} [service]"
        echo "Services: frontend, auth, claimlinc, payments, fhir-gateway"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Docker optimization completed!${NC}"