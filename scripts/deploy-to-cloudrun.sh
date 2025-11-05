#!/bin/bash
# Deploy Docker image from Artifact Registry to Cloud Run

set -e

# Configuration
PROJECT_ID="${1:-clarityai-qa}"
REGION="${2:-us-central1}"
VERSION="${3:-latest}"
SERVICE_NAME="clarityai-frontend"
REPOSITORY="clarityai"
IMAGE_NAME="frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ClarityAI Cloud Run Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Version: $VERSION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Set the project
echo -e "${BLUE}Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable Cloud Run API
echo -e "${BLUE}Enabling Cloud Run API...${NC}"
gcloud services enable run.googleapis.com --project="$PROJECT_ID"

# Construct image URL
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${VERSION}"

echo -e "${BLUE}Deploying to Cloud Run...${NC}"
echo "Image: $IMAGE_URL"
echo ""

# Deploy to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_URL" \
    --platform=managed \
    --region="$REGION" \
    --allow-unauthenticated \
    --port=80 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300 \
    --project="$PROJECT_ID"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform=managed \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format='value(status.url)')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service URL: $SERVICE_URL"
echo ""
echo "To view logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID"
echo ""
echo "To update the service:"
echo "  ./scripts/build-and-push-docker.sh $PROJECT_ID $REGION <new-version>"
echo "  ./scripts/deploy-to-cloudrun.sh $PROJECT_ID $REGION <new-version>"
echo ""
