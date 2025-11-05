#!/bin/bash
# Complete Docker deployment pipeline: Build → Push → Deploy

set -e

# Configuration
PROJECT_ID="${1:-clarityai-qa}"
REGION="${2:-us-central1}"
VERSION="${3:-$(git rev-parse --short HEAD)}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ClarityAI Complete Deployment Pipeline${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Version: $VERSION"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  1. Build Docker image"
echo "  2. Push to Artifact Registry"
echo "  3. Deploy to Cloud Run"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Step 1: Build and push Docker image
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 1/2: Build & Push Docker Image${NC}"
echo -e "${BLUE}========================================${NC}"
./scripts/build-and-push-docker.sh "$PROJECT_ID" "$REGION" "$VERSION"

# Step 2: Deploy to Cloud Run
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 2/2: Deploy to Cloud Run${NC}"
echo -e "${BLUE}========================================${NC}"
./scripts/deploy-to-cloudrun.sh "$PROJECT_ID" "$REGION" "$VERSION"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Pipeline Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
