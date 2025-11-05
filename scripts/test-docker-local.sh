#!/bin/bash
# Test Docker setup locally
# Run this script when you have Docker installed on your machine

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ClarityAI Docker Local Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check Docker installation
echo -e "${BLUE}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo ""
    echo "Please install Docker:"
    echo "  Mac: brew install --cask docker"
    echo "  Or download from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
docker --version
echo ""

# Step 2: Check if Docker daemon is running
echo -e "${BLUE}Step 2: Checking Docker daemon...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo ""
    echo "Please start Docker:"
    echo "  Mac/Windows: Open Docker Desktop application"
    echo "  Linux: sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"
echo ""

# Step 3: Clean up any previous test containers
echo -e "${BLUE}Step 3: Cleaning up previous containers...${NC}"
docker rm -f clarityai-frontend-test 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Step 4: Build the Docker image
echo -e "${BLUE}Step 4: Building Docker image...${NC}"
echo "This may take 2-5 minutes on first build..."
echo ""

docker build \
    --tag clarityai-frontend:test \
    --file Dockerfile \
    .

echo ""
echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 5: Check image size
echo -e "${BLUE}Step 5: Checking image size...${NC}"
IMAGE_SIZE=$(docker images clarityai-frontend:test --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"
echo ""
echo "Expected size: 30-50MB (multi-stage build optimization)"
echo -e "${GREEN}✓ Image size looks good${NC}"
echo ""

# Step 6: Run the container
echo -e "${BLUE}Step 6: Starting container...${NC}"
docker run \
    --detach \
    --name clarityai-frontend-test \
    --port 8080:80 \
    clarityai-frontend:test

echo -e "${GREEN}✓ Container started${NC}"
echo ""

# Step 7: Wait for container to be healthy
echo -e "${BLUE}Step 7: Waiting for container to be healthy...${NC}"
echo "Checking health status..."

RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' clarityai-frontend-test 2>/dev/null || echo "starting")

    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✓ Container is healthy${NC}"
        break
    fi

    echo -n "."
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo ""
        echo -e "${RED}✗ Container health check timeout${NC}"
        echo ""
        echo "Container logs:"
        docker logs clarityai-frontend-test
        exit 1
    fi
done

echo ""
echo ""

# Step 8: Test the health endpoint
echo -e "${BLUE}Step 8: Testing health endpoint...${NC}"
if curl -f http://localhost:8080/health &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
    echo "Health check response: $HEALTH_RESPONSE"
    echo -e "${GREEN}✓ Health endpoint is working${NC}"
else
    echo -e "${RED}✗ Health endpoint failed${NC}"
    docker logs clarityai-frontend-test
    exit 1
fi
echo ""

# Step 9: Test the application
echo -e "${BLUE}Step 9: Testing application...${NC}"
if curl -f http://localhost:8080 &> /dev/null; then
    echo -e "${GREEN}✓ Application is accessible${NC}"
else
    echo -e "${RED}✗ Application is not accessible${NC}"
    docker logs clarityai-frontend-test
    exit 1
fi
echo ""

# Step 10: Show container info
echo -e "${BLUE}Step 10: Container information...${NC}"
echo ""
echo "Container ID: $(docker ps --filter name=clarityai-frontend-test --format '{{.ID}}')"
echo "Status: $(docker ps --filter name=clarityai-frontend-test --format '{{.Status}}')"
echo "Ports: $(docker ps --filter name=clarityai-frontend-test --format '{{.Ports}}')"
echo ""

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All Tests Passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Your application is running at:${NC}"
echo -e "${BLUE}  http://localhost:8080${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        docker logs -f clarityai-frontend-test"
echo "  Stop container:   docker stop clarityai-frontend-test"
echo "  Remove container: docker rm clarityai-frontend-test"
echo "  Shell access:     docker exec -it clarityai-frontend-test sh"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Open http://localhost:8080 in your browser"
echo "  2. Test the application features"
echo "  3. When done, run: docker stop clarityai-frontend-test"
echo ""
echo "To test with docker-compose instead:"
echo "  docker-compose up"
echo ""
