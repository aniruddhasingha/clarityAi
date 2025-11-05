#!/bin/bash

# ClarityAI - GCP Project Setup Script
# This script helps you setup a new GCP project for ClarityAI

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
   ____  _            _ _         _    _____
  / ___|| | __ _ _ __(_) |_ _   _/ \  |_ _|
 | |    | |/ _` | '__| | __| | | / _ \  | |
 | |___ | | (_| | |  | | |_| |_| / ___ \ | |
  \____|_|\__,_|_|  |_|\__|\__, /_/   \_\___|
                           |___/
  Google Cloud Platform Setup
EOF
echo -e "${NC}"

# Get environment from user
echo -e "${BLUE}Which environment are you setting up?${NC}"
echo "1) QA (Development/Testing)"
echo "2) UAT (User Acceptance Testing)"
echo "3) Production"
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        ENV="qa"
        PROJECT_ID="clarityai-qa"
        PROJECT_NAME="ClarityAI QA Environment"
        ;;
    2)
        ENV="uat"
        PROJECT_ID="clarityai-uat"
        PROJECT_NAME="ClarityAI UAT Environment"
        ;;
    3)
        ENV="prod"
        PROJECT_ID="clarityai-prod"
        PROJECT_NAME="ClarityAI Production Environment"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Setting up: $PROJECT_NAME${NC}"
echo -e "${GREEN}Project ID: $PROJECT_ID${NC}\n"

# Check gcloud installation
echo -e "${BLUE}Step 1: Checking gcloud CLI...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not installed${NC}"
    echo "Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✅ gcloud CLI found${NC}"

# Login check
echo -e "\n${BLUE}Step 2: Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}Not logged in. Initiating login...${NC}"
    gcloud auth login
fi
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
echo -e "${GREEN}✅ Authenticated as: $ACCOUNT${NC}"

# Create project
echo -e "\n${BLUE}Step 3: Creating GCP project...${NC}"
if gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}⚠️  Project $PROJECT_ID already exists${NC}"
    read -p "Do you want to continue with existing project? (y/n): " continue_choice
    if [[ ! $continue_choice =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
else
    echo "Creating project: $PROJECT_ID"
    gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"
    echo -e "${GREEN}✅ Project created${NC}"
fi

# Set default project
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Default project set to $PROJECT_ID${NC}"

# Link billing account
echo -e "\n${BLUE}Step 4: Billing setup...${NC}"
echo -e "${YELLOW}⚠️  You need to link a billing account to this project${NC}"
echo "Please do this in the GCP Console:"
echo "https://console.cloud.google.com/billing/projects"
echo ""
read -p "Press Enter after you've linked billing account..."

# Enable required APIs
echo -e "\n${BLUE}Step 5: Enabling required APIs...${NC}"
echo "This may take a few minutes..."

APIS=(
    "storage-api.googleapis.com"
    "compute.googleapis.com"
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "sqladmin.googleapis.com"
    "monitoring.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo -e "Enabling $api..."
    gcloud services enable $api --quiet
done

echo -e "${GREEN}✅ All APIs enabled${NC}"

# Create service account for CI/CD
echo -e "\n${BLUE}Step 6: Creating service account for deployments...${NC}"
SA_NAME="github-actions-$ENV"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists${NC}"
else
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Actions $ENV Deployer"

    # Grant permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/storage.admin" --quiet

    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/run.admin" --quiet

    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/cloudbuild.builds.editor" --quiet

    echo -e "${GREEN}✅ Service account created with permissions${NC}"
fi

# Create key for service account
echo -e "\n${BLUE}Step 7: Creating service account key...${NC}"
KEY_FILE="gcp-$ENV-key.json"

if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Key file already exists: $KEY_FILE${NC}"
    read -p "Overwrite? (y/n): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Skipping key creation..."
    else
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account=$SA_EMAIL
        echo -e "${GREEN}✅ Service account key created: $KEY_FILE${NC}"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SA_EMAIL
    echo -e "${GREEN}✅ Service account key created: $KEY_FILE${NC}"
fi

# Summary
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ GCP Project Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Project Details:${NC}"
echo "  Environment: $ENV"
echo "  Project ID: $PROJECT_ID"
echo "  Region: us-central1"
echo ""
echo -e "${BLUE}Service Account:${NC}"
echo "  Email: $SA_EMAIL"
echo "  Key File: $KEY_FILE"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  1. Keep the key file ($KEY_FILE) secure"
echo "  2. Add it to GitHub Secrets as GCP_${ENV^^}_CREDENTIALS"
echo "  3. Never commit this file to git (it's in .gitignore)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Run: ./scripts/deploy-frontend-$ENV.sh"
echo "  2. Test your application"
echo "  3. Setup custom domain (optional)"
echo "  4. Configure CI/CD (see DEPLOYMENT_GCP.md)"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View project: gcloud projects describe $PROJECT_ID"
echo "  View billing: gcloud beta billing accounts list"
echo "  View APIs: gcloud services list --enabled"
echo ""
