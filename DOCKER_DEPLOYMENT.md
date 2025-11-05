# Docker-Based Deployment Guide

This guide covers deploying ClarityAI using Docker containers and Google Artifact Registry - the **modern, production-ready approach** to application deployment.

## 📋 Table of Contents

1. [Why Docker?](#why-docker)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Local Development with Docker](#local-development-with-docker)
5. [Manual Deployment](#manual-deployment)
6. [Automated CI/CD Deployment](#automated-cicd-deployment)
7. [Environment Management](#environment-management)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Why Docker?

### Benefits of Containerization

**🎯 Consistency**
- "Works on my machine" → "Works everywhere"
- Same container runs identically in dev, QA, UAT, and production
- No more environment-specific bugs

**🔒 Isolation**
- Each service runs in its own container
- Dependencies don't conflict
- Clean separation of concerns

**📈 Scalability**
- Scale horizontally by adding more containers
- Auto-scaling based on traffic
- Cloud Run handles this automatically

**🚀 Portability**
- Deploy to any cloud provider (GCP, AWS, Azure)
- Or on-premise with Kubernetes
- Not locked into one platform

**📦 Version Control**
- Docker images are immutable artifacts
- Easy rollbacks to previous versions
- Clear audit trail of what's deployed

### Artifact Registry vs Docker Hub

| Feature | Google Artifact Registry | Docker Hub |
|---------|-------------------------|------------|
| Integration | Native GCP integration | Requires separate auth |
| Security | Private by default | Free tier is public |
| Scanning | Automatic vulnerability scanning | Paid feature |
| Speed | Same region as Cloud Run | Internet transfer |
| Cost | $0.10/GB/month | Free (limited) or $5-7/month |
| IAM | GCP IAM integration | Separate permissions |

**Verdict**: For GCP deployments, Artifact Registry is superior.

---

## Architecture Overview

### Current Setup

```
┌─────────────────────────────────────────────────────┐
│                   Developer                         │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ git push
                  ↓
┌─────────────────────────────────────────────────────┐
│              GitHub Repository                       │
│  (Triggers GitHub Actions on push/release)          │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ webhook trigger
                  ↓
┌─────────────────────────────────────────────────────┐
│            GitHub Actions (CI/CD)                    │
│  1. Run tests & linting                             │
│  2. Build Docker image                              │
│  3. Push to Artifact Registry                       │
│  4. Deploy to Cloud Run                             │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ docker push
                  ↓
┌─────────────────────────────────────────────────────┐
│        Google Artifact Registry                      │
│  us-central1-docker.pkg.dev/PROJECT/clarityai       │
│    - frontend:latest                                │
│    - frontend:v1.0.0                                │
│    - frontend:abc123 (git commit)                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ gcloud run deploy
                  ↓
┌─────────────────────────────────────────────────────┐
│             Google Cloud Run                         │
│  - Auto-scaling containers                          │
│  - Load balancing                                   │
│  - HTTPS endpoints                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS
                  ↓
┌─────────────────────────────────────────────────────┐
│                    Users                             │
└─────────────────────────────────────────────────────┘
```

### Multi-Stage Docker Build

Our Dockerfile uses a **multi-stage build** to create smaller, more secure images:

```dockerfile
# Stage 1: Build (node:20-alpine)
- Install ALL dependencies (dev + prod)
- Build the application
- Result: Large image with build tools

# Stage 2: Production (nginx:alpine)
- Copy only built files from Stage 1
- No source code or build tools
- Result: Small, optimized image (< 50MB)
```

**Benefits**:
- Final image: ~30-50MB (vs 500MB+ without multi-stage)
- Faster deployments
- Lower storage costs
- Smaller attack surface (security)

---

## Prerequisites

### Required Tools

1. **Docker Desktop** (for local development)
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Google Cloud SDK (gcloud)**
   ```bash
   # Mac
   brew install --cask google-cloud-sdk

   # Linux
   curl https://sdk.cloud.google.com | bash

   # Windows
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

3. **Git** (for version control)
   ```bash
   # Mac
   brew install git

   # Linux
   sudo apt install git
   ```

### GCP Setup

```bash
# 1. Authenticate
gcloud auth login

# 2. Set default project
gcloud config set project clarityai-qa

# 3. Enable required APIs
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com
```

---

## Local Development with Docker

### Quick Start

```bash
# 1. Build and run locally
docker-compose up

# Your app is now running at: http://localhost:8080
```

That's it! Docker Compose handles everything:
- Building the Docker image
- Starting the container
- Mapping port 8080 to your machine
- Automatic restarts if it crashes

### Useful Commands

```bash
# Build without running
docker-compose build

# Run in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down

# Rebuild and restart
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

### Testing Your Docker Build

```bash
# Build the production image
docker build -t clarityai-frontend .

# Run it locally
docker run -p 8080:80 clarityai-frontend

# Test in browser
open http://localhost:8080
```

---

## Manual Deployment

### Option 1: Complete Deployment (Recommended)

Single command that does everything:

```bash
./scripts/deploy-docker-complete.sh clarityai-qa us-central1
```

This will:
1. Build Docker image with version tag (git commit hash)
2. Push to Artifact Registry
3. Deploy to Cloud Run
4. Display the service URL

### Option 2: Step-by-Step Deployment

If you prefer more control:

```bash
# Step 1: Build and push Docker image
./scripts/build-and-push-docker.sh clarityai-qa us-central1 v1.0.0

# Step 2: Deploy to Cloud Run
./scripts/deploy-to-cloudrun.sh clarityai-qa us-central1 v1.0.0
```

### Option 3: Manual Commands

If you want to understand each step:

```bash
# 1. Set variables
PROJECT_ID="clarityai-qa"
REGION="us-central1"
VERSION="v1.0.0"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/clarityai/frontend:${VERSION}"

# 2. Build Docker image
docker build --platform linux/amd64 -t $IMAGE .

# 3. Configure Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 4. Push to Artifact Registry
docker push $IMAGE

# 5. Deploy to Cloud Run
gcloud run deploy clarityai-frontend \
  --image=$IMAGE \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --project=$PROJECT_ID
```

---

## Automated CI/CD Deployment

### GitHub Actions Setup

We've created three workflows for automatic deployment:

#### 1. QA Environment (`deploy-qa.yml`)

**Triggers**: Push to `develop` or `claude/develop-*` branches

```yaml
# Automatically deploys when you push code
git push origin develop
```

**What it does**:
- Runs tests and linting
- Builds Docker image (tagged with git commit hash)
- Pushes to Artifact Registry
- Deploys to Cloud Run (clarityai-qa)
- Posts deployment summary in GitHub Actions

#### 2. UAT Environment (`deploy-uat.yml`)

**Triggers**: Push to `main` branch

```yaml
# Merge to main triggers UAT deployment
git checkout main
git merge develop
git push origin main
```

**What it does**:
- Same as QA but deploys to clarityai-uat project
- Higher resource limits (1Gi memory, 20 max instances)

#### 3. Production Environment (`deploy-production.yml`)

**Triggers**:
- GitHub Release created
- Manual workflow dispatch

```bash
# Create a release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create GitHub release (triggers production deployment)
gh release create v1.0.0 --title "v1.0.0" --notes "Production release"
```

**What it does**:
- Requires manual approval (GitHub Environment protection)
- Builds and deploys with release version tag
- Production resources (2Gi memory, min 1 instance, max 100)
- Runs smoke tests after deployment
- More comprehensive deployment summary

### Setting Up CI/CD

#### Step 1: Create GCP Service Account Keys

For each environment (QA, UAT, Prod):

```bash
# QA
./scripts/setup-gcp-project.sh
# Choose option 1 (QA)
# This creates gcp-qa-key.json

# UAT
./scripts/setup-gcp-project.sh
# Choose option 2 (UAT)
# This creates gcp-uat-key.json

# Production
./scripts/setup-gcp-project.sh
# Choose option 3 (Production)
# This creates gcp-prod-key.json
```

#### Step 2: Add Secrets to GitHub

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:

```
GCP_QA_SA_KEY = <contents of gcp-qa-key.json>
GCP_UAT_SA_KEY = <contents of gcp-uat-key.json>
GCP_PROD_SA_KEY = <contents of gcp-prod-key.json>
```

To get the file contents:

```bash
cat gcp-qa-key.json | pbcopy  # Mac
cat gcp-qa-key.json | xclip    # Linux
```

#### Step 3: Test the Pipeline

```bash
# Push to develop branch
git checkout develop
git add .
git commit -m "Test CI/CD pipeline"
git push origin develop

# Watch the deployment
# Go to GitHub → Actions tab
```

You should see:
- ✅ Build job running
- ✅ Tests passing
- ✅ Docker image being built
- ✅ Deployment to Cloud Run
- 🎉 Service URL in the summary

---

## Environment Management

### Environment Progression

```
Developer → QA → UAT → Production
```

### QA Environment

**Purpose**: Testing new features, bug fixes

**Characteristics**:
- Auto-deploys on every push to `develop`
- Lower resources (512Mi memory)
- Scale to zero when idle
- Public access (no authentication)

**Configuration**:
```yaml
PROJECT_ID: clarityai-qa
MEMORY: 512Mi
CPU: 1
MIN_INSTANCES: 0
MAX_INSTANCES: 10
```

**Typical Usage**:
```bash
# Deploy latest code
git push origin develop

# Access
https://clarityai-frontend-xxx-uc.a.run.app
```

### UAT Environment

**Purpose**: User acceptance testing, pre-production validation

**Characteristics**:
- Deploys from `main` branch
- Higher resources (1Gi memory)
- More scalability (max 20 instances)
- Mirrors production configuration

**Configuration**:
```yaml
PROJECT_ID: clarityai-uat
MEMORY: 1Gi
CPU: 1
MIN_INSTANCES: 0
MAX_INSTANCES: 20
```

**Typical Usage**:
```bash
# Merge tested code from develop
git checkout main
git merge develop
git push origin main

# Share with stakeholders
https://clarityai-frontend-xxx-uc.a.run.app
```

### Production Environment

**Purpose**: Live application for real users

**Characteristics**:
- Manual deployment via GitHub releases
- Maximum resources (2Gi memory)
- Always-on (min 1 instance)
- High scalability (max 100 instances)
- Requires approval

**Configuration**:
```yaml
PROJECT_ID: clarityai-prod
MEMORY: 2Gi
CPU: 2
MIN_INSTANCES: 1  # Always warm
MAX_INSTANCES: 100
```

**Typical Usage**:
```bash
# Create release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
gh release create v1.0.0

# Approve deployment in GitHub
# Production URL: https://app.clarityai.com
```

---

## Monitoring & Maintenance

### Viewing Logs

```bash
# Real-time logs
gcloud run services logs read clarityai-frontend \
  --project=clarityai-qa \
  --region=us-central1 \
  --follow

# Last 100 logs
gcloud run services logs read clarityai-frontend \
  --project=clarityai-qa \
  --region=us-central1 \
  --limit=100

# Filter by error
gcloud run services logs read clarityai-frontend \
  --project=clarityai-qa \
  --region=us-central1 \
  --filter="severity=ERROR"
```

### Viewing Metrics

```bash
# Open Cloud Run console
open "https://console.cloud.google.com/run?project=clarityai-qa"

# Key metrics to watch:
# - Request count
# - Request latency (p50, p95, p99)
# - Error rate
# - Container instance count
# - Memory utilization
# - CPU utilization
```

### Health Checks

The Docker image includes a `/health` endpoint:

```bash
# Check if service is healthy
curl https://YOUR-SERVICE-URL/health

# Expected response: "healthy"
```

### Rollback

If a deployment goes wrong:

```bash
# Option 1: Deploy previous version
./scripts/deploy-to-cloudrun.sh clarityai-qa us-central1 v1.0.0

# Option 2: Use Cloud Console
# Go to Cloud Run → Select service → Revisions → Select previous → "Manage Traffic" → 100% to old revision
```

### Cost Monitoring

```bash
# View current costs
gcloud billing accounts list
gcloud billing projects describe clarityai-qa

# Set budget alerts in Cloud Console:
# Billing → Budgets & Alerts → Create Budget
```

**Expected Costs** (per month):

| Environment | Storage | Requests | Total |
|-------------|---------|----------|-------|
| QA | $1-2 | $0-5 | **$1-7** |
| UAT | $2-3 | $5-10 | **$7-13** |
| Production | $5-10 | $20-50 | **$25-60** |

---

## Troubleshooting

### Build Issues

#### "Docker daemon not running"

```bash
# Mac/Windows
# Start Docker Desktop application

# Linux
sudo systemctl start docker
```

#### "npm install fails in Docker"

```bash
# Clear npm cache
npm cache clean --force

# Rebuild without cache
docker build --no-cache -t clarityai-frontend .
```

#### "Build fails with 'platform not supported'"

```bash
# Force linux/amd64 platform (for M1/M2 Macs)
docker build --platform linux/amd64 -t clarityai-frontend .
```

### Push Issues

#### "Access denied to Artifact Registry"

```bash
# Re-authenticate
gcloud auth login
gcloud auth configure-docker us-central1-docker.pkg.dev

# Check permissions
gcloud projects get-iam-policy clarityai-qa \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*"
```

#### "Repository not found"

```bash
# Create the repository
gcloud artifacts repositories create clarityai \
  --repository-format=docker \
  --location=us-central1 \
  --project=clarityai-qa
```

### Deployment Issues

#### "Cloud Run service not responding"

```bash
# Check logs for errors
gcloud run services logs read clarityai-frontend \
  --project=clarityai-qa \
  --region=us-central1 \
  --limit=50

# Common issues:
# - Port mismatch (should be 80)
# - Health check failing
# - Container crashing on startup
```

#### "502 Bad Gateway"

Usually means container is crashing. Check:

```bash
# 1. View recent logs
gcloud run services logs read clarityai-frontend \
  --project=clarityai-qa \
  --region=us-central1 \
  --filter="severity>=ERROR"

# 2. Test locally
docker run -p 8080:80 clarityai-frontend

# 3. Check health endpoint
curl http://localhost:8080/health
```

#### "Permission denied"

```bash
# Ensure service account has correct roles
gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:github-actions-qa@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:github-actions-qa@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### GitHub Actions Issues

#### "Workflow not triggering"

1. Check branch name matches workflow trigger
2. Ensure GitHub Actions is enabled (Settings → Actions)
3. Check workflow file syntax (YAML indentation)

#### "Secret not found"

1. Go to GitHub → Settings → Secrets
2. Verify secret name matches workflow
3. Check secret value is valid JSON (for GCP keys)

#### "Build succeeds but deployment fails"

```bash
# Check service account permissions
gcloud projects get-iam-policy clarityai-qa \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-qa*"

# Should have:
# - roles/run.admin
# - roles/artifactregistry.writer
# - roles/iam.serviceAccountUser
```

---

## Next Steps

### 1. Deploy to QA

```bash
# Complete deployment
./scripts/deploy-docker-complete.sh clarityai-qa us-central1

# Or use CI/CD
git push origin develop
```

### 2. Set Up Custom Domain (Optional)

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
  --service=clarityai-frontend \
  --domain=app.clarityai.com \
  --region=us-central1 \
  --project=clarityai-prod

# Follow instructions to update DNS
```

### 3. Add Backend (When Ready)

1. Create backend application
2. Update `Dockerfile.backend`
3. Uncomment backend service in `docker-compose.yml`
4. Deploy backend to Cloud Run
5. Update frontend environment variables

### 4. Production Deployment

```bash
# Create release
git tag -a v1.0.0 -m "First production release"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0" --notes "Initial production release"

# Monitor deployment in GitHub Actions
# Test production: https://your-production-url
```

---

## Summary

You now have a **production-grade, Docker-based deployment pipeline**:

✅ **Containerized application** (Dockerfile)
✅ **Local development environment** (docker-compose.yml)
✅ **Artifact Registry** for secure image storage
✅ **Cloud Run** for serverless hosting
✅ **CI/CD pipeline** with GitHub Actions
✅ **Three environments** (QA, UAT, Production)
✅ **Automated deployments** on git push
✅ **Monitoring and logging** built-in
✅ **Easy rollbacks** with version tags

This is the **modern, professional way** to deploy applications! 🚀
