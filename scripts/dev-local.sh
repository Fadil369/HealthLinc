#!/bin/bash

# Local Development Script for BrainSAIT Unified Platform
# This script starts both the frontend and worker in development mode

set -e

echo "🚀 Starting BrainSAIT Unified Platform in Development Mode..."

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed"
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI is required but not installed"
        echo "   Install with: npm install -g wrangler"
        exit 1
    fi
    
    echo "✅ All requirements satisfied"
}

# Install dependencies if needed
install_deps() {
    echo "📦 Installing dependencies..."
    npm run install:all
    echo "✅ Dependencies installed"
}

# Build the project
build_project() {
    echo "🔨 Building project..."
    npm run build
    echo "✅ Build completed"
}

# Start services in parallel
start_services() {
    echo "🌟 Starting development services..."
    
    # Kill any existing processes on our ports
    echo "🧹 Cleaning up existing processes..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true  # Vite dev server
    lsof -ti:8787 | xargs kill -9 2>/dev/null || true  # Wrangler dev server
    
    # Create log directory
    mkdir -p logs/dev
    
    echo "📱 Starting Frontend (Vite) on http://localhost:5173..."
    cd frontend && npm run dev > ../logs/dev/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait a moment for frontend to start
    sleep 3
    
    echo "⚡ Starting Worker (Wrangler) on http://localhost:8787..."
    wrangler dev --local --port 8787 > logs/dev/worker.log 2>&1 &
    WORKER_PID=$!
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 5
    
    # Check if services are running
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "✅ Frontend started (PID: $FRONTEND_PID)"
    else
        echo "❌ Frontend failed to start"
        cat logs/dev/frontend.log
        exit 1
    fi
    
    if ps -p $WORKER_PID > /dev/null; then
        echo "✅ Worker started (PID: $WORKER_PID)"
    else
        echo "❌ Worker failed to start"
        cat logs/dev/worker.log
        exit 1
    fi
    
    echo ""
    echo "🎉 BrainSAIT Unified Platform is now running!"
    echo ""
    echo "📱 Frontend: http://localhost:5173"
    echo "⚡ API/Worker: http://localhost:8787"
    echo ""
    echo "📊 Health Check: http://localhost:8787/api/health"
    echo "🔗 API Docs: http://localhost:8787/api"
    echo ""
    echo "📝 Logs:"
    echo "   Frontend: logs/dev/frontend.log"
    echo "   Worker: logs/dev/worker.log"
    echo ""
    echo "To stop services: Ctrl+C or kill $FRONTEND_PID $WORKER_PID"
    echo ""
    
    # Store PIDs for cleanup
    echo "$FRONTEND_PID" > logs/dev/frontend.pid
    echo "$WORKER_PID" > logs/dev/worker.pid
    
    # Wait for user interrupt
    trap cleanup EXIT
    wait
}

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    if [ -f logs/dev/frontend.pid ]; then
        FRONTEND_PID=$(cat logs/dev/frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f logs/dev/frontend.pid
        echo "🔴 Frontend stopped"
    fi
    
    if [ -f logs/dev/worker.pid ]; then
        WORKER_PID=$(cat logs/dev/worker.pid)
        kill $WORKER_PID 2>/dev/null || true
        rm -f logs/dev/worker.pid
        echo "🔴 Worker stopped"
    fi
    
    echo "👋 Development server stopped"
}

# Main execution
main() {
    check_requirements
    install_deps
    build_project
    start_services
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
