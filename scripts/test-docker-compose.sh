#!/bin/bash
# Quick test with docker-compose

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Docker Compose Quick Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ docker-compose is not installed${NC}"
    echo ""
    echo "Docker Compose is usually included with Docker Desktop."
    echo "If not, install it from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose is installed${NC}"
echo ""

# Stop any existing containers
echo -e "${BLUE}Stopping any existing containers...${NC}"
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
echo ""

# Build and start
echo -e "${BLUE}Building and starting services...${NC}"
echo "This may take 2-5 minutes on first build..."
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose up --build --detach
else
    docker compose up --build --detach
fi

echo ""
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for health check
echo -e "${BLUE}Waiting for application to be ready...${NC}"
sleep 5

RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8080/health &> /dev/null; then
        echo -e "${GREEN}✓ Application is ready${NC}"
        break
    fi

    echo -n "."
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo ""
        echo -e "${RED}✗ Application startup timeout${NC}"
        echo ""
        echo "Logs:"
        if command -v docker-compose &> /dev/null; then
            docker-compose logs
        else
            docker compose logs
        fi
        exit 1
    fi
done

echo ""
echo ""

# Success
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Docker Compose Test Passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Your application is running at:${NC}"
echo -e "${BLUE}  http://localhost:8080${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Rebuild:       docker-compose up --build"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "  docker-compose down"
echo ""
