#!/bin/bash
# Build and push Docker images to Google Artifact Registry

set -e

# Configuration
PROJECT_ID="${1:-clarityai-qa}"
REGION="${2:-us-central1}"
REPOSITORY="clarityai"
IMAGE_NAME="frontend"
VERSION="${3:-$(git rev-parse --short HEAD)}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ClarityAI Docker Build & Push${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Repository: $REPOSITORY"
echo "Image: $IMAGE_NAME"
echo "Version: $VERSION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install it from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Set the project
echo -e "${BLUE}Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable Artifact Registry API
echo -e "${BLUE}Enabling Artifact Registry API...${NC}"
gcloud services enable artifactregistry.googleapis.com --project="$PROJECT_ID"

# Create Artifact Registry repository if it doesn't exist
echo -e "${BLUE}Creating Artifact Registry repository...${NC}"
gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION" \
    --description="ClarityAI Docker images" \
    --project="$PROJECT_ID" 2>/dev/null || echo "Repository already exists"

# Configure Docker to use gcloud as credential helper
echo -e "${BLUE}Configuring Docker authentication...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build the Docker image
echo -e "${BLUE}Building Docker image...${NC}"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${VERSION}"
IMAGE_LATEST="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"

docker build \
    --platform linux/amd64 \
    -t "$IMAGE_TAG" \
    -t "$IMAGE_LATEST" \
    -f Dockerfile \
    .

echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Push the image to Artifact Registry
echo -e "${BLUE}Pushing image to Artifact Registry...${NC}"
docker push "$IMAGE_TAG"
docker push "$IMAGE_LATEST"

echo -e "${GREEN}✓ Image pushed successfully${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build & Push Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Image tags:"
echo "  - $IMAGE_TAG"
echo "  - $IMAGE_LATEST"
echo ""
echo "To deploy this image to Cloud Run:"
echo "  ./scripts/deploy-to-cloudrun.sh $PROJECT_ID $REGION $VERSION"
echo ""
