#!/bin/bash

# ClarityAI - Deploy Frontend to GCP (QA Environment)
# This script deploys the React frontend to Google Cloud Storage

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ClarityAI - Deploying Frontend to QA${NC}"
echo "========================================="

# Configuration
PROJECT_ID="clarityai-qa"
BUCKET_NAME="clarityai-qa-frontend"
REGION="us-central1"

# Step 1: Check if gcloud is installed
echo -e "\n${BLUE}Step 1: Checking prerequisites...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✅ gcloud CLI found${NC}"

# Step 2: Set GCP project
echo -e "\n${BLUE}Step 2: Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Project set to $PROJECT_ID${NC}"

# Step 3: Build frontend
echo -e "\n${BLUE}Step 3: Building frontend...${NC}"
echo "Running: npm install && npm run build"
npm install
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 4: Check if bucket exists
echo -e "\n${BLUE}Step 4: Checking Cloud Storage bucket...${NC}"
if ! gcloud storage buckets describe gs://$BUCKET_NAME &> /dev/null; then
    echo "Bucket doesn't exist. Creating..."

    # Create bucket
    gcloud storage buckets create gs://$BUCKET_NAME \
        --location=$REGION \
        --uniform-bucket-level-access

    # Make bucket public
    gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
        --member=allUsers \
        --role=roles/storage.objectViewer

    # Configure for website hosting
    gcloud storage buckets update gs://$BUCKET_NAME \
        --web-main-page-suffix=index.html \
        --web-error-page=index.html

    echo -e "${GREEN}✅ Bucket created and configured${NC}"
else
    echo -e "${GREEN}✅ Bucket already exists${NC}"
fi

# Step 5: Upload files
echo -e "\n${BLUE}Step 5: Uploading files to Cloud Storage...${NC}"
gcloud storage cp -r dist/* gs://$BUCKET_NAME

# Set cache control for assets
gcloud storage objects update gs://$BUCKET_NAME/assets/** \
    --cache-control="public, max-age=31536000" || true

# Keep index.html with short cache
gcloud storage objects update gs://$BUCKET_NAME/index.html \
    --cache-control="public, max-age=0, must-revalidate"

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Step 6: Display URLs
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📱 Your application is live at:${NC}"
echo "   https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "   1. Test the application in your browser"
echo "   2. (Optional) Setup custom domain and HTTPS"
echo "   3. (Optional) Enable Cloud CDN for better performance"
echo ""
echo -e "${BLUE}📚 For more info, see: DEPLOYMENT_GCP.md${NC}"
echo ""
