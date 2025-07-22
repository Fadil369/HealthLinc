#!/bin/bash

# Upload Frontend Assets to Cloudflare KV
# This script uploads the built frontend files to KV storage for serving

set -e

# Configuration
KV_NAMESPACE="BRAINSAIT_KV"
ENVIRONMENT="${1:-production}"
MAX_PARALLEL_UPLOADS=10
CHUNK_SIZE=5

echo "🚀 Uploading frontend assets to Cloudflare KV..."
echo "📊 Environment: $ENVIRONMENT"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI not found. Please install it first:"
  echo "npm install -g wrangler"
  exit 1
fi

# Build frontend if not already built
if [ ! -d "frontend/dist" ]; then
  echo "📦 Building frontend first..."
  npm run build:frontend
fi

# Change to frontend directory
cd frontend/dist

echo "📁 Analyzing files to upload..."
total_files=$(find . -type f | wc -l)
echo "Found $total_files files to upload"

# Function to upload file with retry logic
upload_file() {
  local file="$1"
  local key="$2"
  local content_type="$3"
  local max_retries=3
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    if wrangler kv key put --binding="$KV_NAMESPACE" --env="$ENVIRONMENT" "$key" --path="$file" --metadata="{\"contentType\":\"$content_type\"}" --remote 2>/dev/null; then
      echo "✅ Uploaded: $key"
      return 0
    else
      retry_count=$((retry_count + 1))
      echo "⚠️  Retry $retry_count/$max_retries for $key"
      sleep 1
    fi
  done
  
  echo "❌ Failed to upload: $key"
  return 1
}

# Create temporary upload queue
temp_dir=$(mktemp -d)
upload_queue="$temp_dir/upload_queue"
failed_uploads="$temp_dir/failed_uploads"

echo "📋 Preparing upload queue..."

# Build file upload queue with content types
find . -type f | while read file; do
  key="static:${file#./}"
  extension="${file##*.}"
  
  case $extension in
    html) content_type="text/html";;
    css) content_type="text/css";;
    js) content_type="application/javascript";;
    json) content_type="application/json";;
    png) content_type="image/png";;
    jpg|jpeg) content_type="image/jpeg";;
    gif) content_type="image/gif";;
    svg) content_type="image/svg+xml";;
    ico) content_type="image/x-icon";;
    woff) content_type="font/woff";;
    woff2) content_type="font/woff2";;
    ttf) content_type="font/ttf";;
    eot) content_type="application/vnd.ms-fontobject";;
    pdf) content_type="application/pdf";;
    txt) content_type="text/plain";;
    *) content_type="application/octet-stream";;
  esac
  
  echo "$file|$key|$content_type" >> "$upload_queue"
done

# Upload files in batches
echo "⬆️  Starting batch upload..."
total_files=$(wc -l < "$upload_queue")
current_file=0
failed_count=0

while IFS='|' read -r file key content_type; do
  current_file=$((current_file + 1))
  echo "[$current_file/$total_files] Uploading: $key"
  
  if ! upload_file "$file" "$key" "$content_type"; then
    echo "$file|$key|$content_type" >> "$failed_uploads"
    failed_count=$((failed_count + 1))
  fi
  
  # Add small delay to avoid rate limiting
  if [ $((current_file % CHUNK_SIZE)) -eq 0 ]; then
    echo "⏳ Batch completed, pausing briefly..."
    sleep 1
  fi
done < "$upload_queue"

# Handle failed uploads
if [ -f "$failed_uploads" ] && [ -s "$failed_uploads" ]; then
  echo "⚠️  $failed_count files failed to upload. Retrying..."
  
  while IFS='|' read -r file key content_type; do
    echo "🔄 Retrying: $key"
    upload_file "$file" "$key" "$content_type"
  done < "$failed_uploads"
fi

# Cleanup
rm -rf "$temp_dir"

# Upload success summary
successful_uploads=$((total_files - failed_count))
echo ""
echo "📊 Upload Summary:"
echo "   Total files: $total_files"
echo "   Successful: $successful_uploads"
echo "   Failed: $failed_count"

if [ $failed_count -eq 0 ]; then
  echo "✅ All assets uploaded to KV successfully!"
else
  echo "⚠️  Some uploads failed. Check the logs above."
  exit 1
fi

# Set cache headers for static files
echo "🔧 Setting up cache headers..."
wrangler kv key put --binding="$KV_NAMESPACE" "config:cache-control" "public, max-age=31536000, immutable" 2>/dev/null || echo "⚠️  Could not set cache config"

echo "🔗 You can now deploy your Worker with: npm run deploy"
echo "🌍 Your app will be available at your Cloudflare Workers domain"
