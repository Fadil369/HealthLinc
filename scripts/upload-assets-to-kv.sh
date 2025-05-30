#!/bin/bash
set -e

# Script to upload static assets to Cloudflare KV
# This script is designed to be run after a production build
# and before deploying to Cloudflare Workers

echo "Starting static asset upload to KV..."

# Check for wrangler CLI
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Set the namespace ID (replace with your KV namespace ID)
if [ -z "$1" ]; then
    echo "Usage: $0 <kv_namespace_id> [environment]"
    exit 1
fi

KV_NAMESPACE_ID=$1
ENVIRONMENT=${2:-production}
DIST_DIR="./dist"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: $DIST_DIR directory does not exist. Run 'npm run build' first."
    exit 1
fi

# Process each file in the dist directory recursively
upload_directory() {
    local dir=$1
    local base_dir=${dir#./dist/}
    
    for file in "$dir"/*; do
        if [ -d "$file" ]; then
            # Recursively process directories
            upload_directory "$file"
        else
            # Get relative path from dist
            local rel_path=${file#./dist/}
            local key="static:/$rel_path"
            
            # Get content type based on file extension
            local content_type="application/octet-stream"
            case "${file##*.}" in
                html) content_type="text/html; charset=utf-8" ;;
                css) content_type="text/css" ;;
                js) content_type="application/javascript" ;;
                json) content_type="application/json" ;;
                png) content_type="image/png" ;;
                jpg|jpeg) content_type="image/jpeg" ;;
                gif) content_type="image/gif" ;;
                svg) content_type="image/svg+xml" ;;
                ico) content_type="image/x-icon" ;;
                woff) content_type="font/woff" ;;
                woff2) content_type="font/woff2" ;;
                ttf) content_type="font/ttf" ;;
                eot) content_type="application/vnd.ms-fontobject" ;;
                txt) content_type="text/plain" ;;
            esac
            
            echo "Uploading $rel_path as $key (${content_type})"
            wrangler kv:key put --binding=BRAINSAIT_KV "$key" --path="$file" --env="$ENVIRONMENT" --namespace-id="$KV_NAMESPACE_ID" --preview=false --contentType="${content_type}"
        fi
    done
}

echo "Uploading files from $DIST_DIR to KV namespace $KV_NAMESPACE_ID (environment: $ENVIRONMENT)..."
upload_directory "$DIST_DIR"

echo "Upload complete. Static assets are now available in the KV store."
