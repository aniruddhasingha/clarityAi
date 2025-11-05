# 🚀 ClarityAI - Google Cloud Platform Deployment Guide

**For Beginners: Step-by-Step Guide to Deploy Your First Application**

This guide will help you deploy ClarityAI to Google Cloud Platform (GCP) starting with a QA environment, then scaling to UAT and Production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Account Setup](#gcp-account-setup)
3. [Project Structure](#project-structure)
4. [Phase 1: Deploy Frontend (QA)](#phase-1-deploy-frontend-qa)
5. [Phase 2: Add Backend Services](#phase-2-add-backend-services)
6. [Phase 3: Environment Management (QA → UAT → Prod)](#phase-3-environment-management)
7. [Phase 4: CI/CD Pipeline](#phase-4-cicd-pipeline)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### What You Need Before Starting

1. **Google Account**
   - Gmail or Google Workspace account
   - Credit/debit card for GCP billing (free tier available)

2. **Local Development Setup**
   - Node.js 18+ installed
   - Git installed
   - Code editor (VS Code recommended)
   - Terminal/Command Prompt access

3. **Basic Knowledge** (we'll explain as we go!)
   - Basic command line usage
   - Understanding of environment variables
   - Git basics (commit, push)

4. **Your ClarityAI Application**
   - Code on your local machine
   - Git repository (GitHub recommended)

---

## 🌐 GCP Account Setup

### Step 1: Create Google Cloud Account

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Sign up for Free Trial**
   - Google offers $300 free credit for 90 days
   - No charges until you upgrade to paid account
   - Click "Get Started for Free"

3. **Complete Billing Setup**
   - Add credit/debit card (required, but won't be charged during trial)
   - Fill in billing information
   - Accept terms of service

### Step 2: Install Google Cloud SDK (gcloud CLI)

**For macOS:**
```bash
# Using Homebrew
brew install google-cloud-sdk

# Or download installer from:
# https://cloud.google.com/sdk/docs/install
```

**For Windows:**
```bash
# Download and run installer from:
# https://cloud.google.com/sdk/docs/install#windows
```

**For Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Verify Installation:**
```bash
gcloud --version
```

### Step 3: Initialize gcloud CLI

```bash
# Login to your Google account
gcloud init

# Follow the prompts:
# 1. Login with your Google account
# 2. Select or create a project
# 3. Choose default region (us-central1 recommended)
```

### Step 4: Create Your First GCP Project

```bash
# Create a project for QA environment
gcloud projects create clarityai-qa \
  --name="ClarityAI QA Environment"

# Set it as your default project
gcloud config set project clarityai-qa

# Enable billing (required for most services)
# Note: Do this in the GCP Console under Billing
```

---

## 📁 Project Structure

### Recommended GCP Project Structure

```
Google Cloud Organization (Optional)
│
├── clarityai-qa           # QA Environment (Start Here!)
│   ├── Frontend (Cloud Storage + Cloud CDN)
│   ├── Backend (Cloud Run) - Phase 2
│   └── Database (Cloud SQL) - Phase 2
│
├── clarityai-uat          # UAT Environment (Later)
│   └── (Same structure as QA)
│
└── clarityai-prod         # Production Environment (Later)
    └── (Same structure as QA)
```

---

## 🎨 Phase 1: Deploy Frontend (QA)

### Overview

We'll deploy the React frontend as a static website using:
- **Cloud Storage**: To host static files
- **Cloud CDN**: For fast global delivery (optional, but recommended)
- **Cloud Load Balancer**: For HTTPS support

### Step 1.1: Build Your Frontend

```bash
# Navigate to your project directory
cd /path/to/clarityAi

# Install dependencies
npm install

# Create production build
npm run build

# This creates a 'dist' folder with optimized files
```

**What happens during build:**
```
dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript
│   ├── index-[hash].css    # Bundled CSS
│   └── [images]            # Optimized images
└── favicon.ico
```

### Step 1.2: Create Cloud Storage Bucket

```bash
# Enable Cloud Storage API
gcloud services enable storage-api.googleapis.com

# Create a bucket for your frontend
# Bucket name must be globally unique
gcloud storage buckets create gs://clarityai-qa-frontend \
  --project=clarityai-qa \
  --location=us-central1 \
  --uniform-bucket-level-access

# Make bucket public (for website hosting)
gcloud storage buckets add-iam-policy-binding gs://clarityai-qa-frontend \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

### Step 1.3: Configure Bucket for Website Hosting

```bash
# Set main page and error page
gcloud storage buckets update gs://clarityai-qa-frontend \
  --web-main-page-suffix=index.html \
  --web-error-page=index.html
```

### Step 1.4: Upload Your Build Files

```bash
# Upload all files from dist folder
gcloud storage cp -r dist/* gs://clarityai-qa-frontend

# Set cache control for assets (optional but recommended)
gcloud storage objects update gs://clarityai-qa-frontend/assets/** \
  --cache-control="public, max-age=31536000"

# Keep index.html with short cache
gcloud storage objects update gs://clarityai-qa-frontend/index.html \
  --cache-control="public, max-age=0, must-revalidate"
```

### Step 1.5: Test Your Deployment

```bash
# Get the public URL
echo "https://storage.googleapis.com/clarityai-qa-frontend/index.html"

# Open in browser and test!
```

**Your frontend is now live! 🎉**

### Step 1.6: (Optional) Add Custom Domain & HTTPS

**If you have a domain (e.g., qa.clarityai.com):**

1. **Create Load Balancer**
```bash
# Enable Compute Engine API
gcloud services enable compute.googleapis.com

# Create a backend bucket
gcloud compute backend-buckets create clarityai-qa-backend \
  --gcs-bucket-name=clarityai-qa-frontend \
  --enable-cdn

# Reserve a static IP
gcloud compute addresses create clarityai-qa-ip \
  --global

# Get the IP address
gcloud compute addresses describe clarityai-qa-ip --global
```

2. **Create URL Map and HTTP Proxy**
```bash
# Create URL map
gcloud compute url-maps create clarityai-qa-url-map \
  --default-backend-bucket=clarityai-qa-backend

# Create HTTP proxy
gcloud compute target-http-proxies create clarityai-qa-http-proxy \
  --url-map=clarityai-qa-url-map

# Create forwarding rule
gcloud compute forwarding-rules create clarityai-qa-http-rule \
  --global \
  --target-http-proxy=clarityai-qa-http-proxy \
  --ports=80 \
  --address=clarityai-qa-ip
```

3. **Add SSL Certificate (for HTTPS)**
```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create clarityai-qa-cert \
  --domains=qa.clarityai.com

# Create HTTPS proxy
gcloud compute target-https-proxies create clarityai-qa-https-proxy \
  --ssl-certificates=clarityai-qa-cert \
  --url-map=clarityai-qa-url-map

# Create HTTPS forwarding rule
gcloud compute forwarding-rules create clarityai-qa-https-rule \
  --global \
  --target-https-proxy=clarityai-qa-https-proxy \
  --ports=443 \
  --address=clarityai-qa-ip
```

4. **Configure DNS**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add an A record:
     - Name: `qa`
     - Type: `A`
     - Value: `[IP from step 1]`
     - TTL: `3600`

5. **Wait for SSL provisioning** (15-30 minutes)

---

## 🔧 Phase 2: Add Backend Services

### Overview

Deploy backend API using Cloud Run (serverless, auto-scaling).

### Step 2.1: Prepare Backend Code

**Create a simple Node.js backend (Example):**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Your API endpoints
app.get('/api/repositories', (req, res) => {
  // Your logic here
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Create Dockerfile:**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

**Create .dockerignore:**

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
dist
```

### Step 2.2: Build and Push Docker Image

```bash
# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create clarityai-qa \
  --repository-format=docker \
  --location=us-central1 \
  --description="ClarityAI QA Docker images"

# Configure Docker to use gcloud credentials
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push image using Cloud Build
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest \
  ./backend
```

### Step 2.3: Deploy to Cloud Run

```bash
# Deploy backend to Cloud Run
gcloud run deploy clarityai-qa-backend \
  --image us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=qa" \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10

# Get the service URL
gcloud run services describe clarityai-qa-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

### Step 2.4: Update Frontend to Use Backend

**Update your `.env` file:**

```bash
# .env.qa
VITE_API_URL=https://clarityai-qa-backend-xxxxxxx-uc.a.run.app/api
VITE_DEMO_MODE=false
```

**Rebuild and redeploy frontend:**

```bash
# Build with QA environment
npm run build

# Upload to Cloud Storage
gcloud storage cp -r dist/* gs://clarityai-qa-frontend
```

### Step 2.5: Add Database (Cloud SQL)

```bash
# Enable Cloud SQL API
gcloud services enable sqladmin.googleapis.com

# Create PostgreSQL instance
gcloud sql instances create clarityai-qa-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=[SECURE_PASSWORD]

# Create database
gcloud sql databases create clarityai \
  --instance=clarityai-qa-db

# Get connection name (for Cloud Run)
gcloud sql instances describe clarityai-qa-db \
  --format='value(connectionName)'
```

**Update Cloud Run to connect to database:**

```bash
gcloud run services update clarityai-qa-backend \
  --add-cloudsql-instances=clarityai-qa:us-central1:clarityai-qa-db \
  --set-env-vars "DATABASE_URL=postgresql://user:pass@/clarityai?host=/cloudsql/[CONNECTION_NAME]"
```

---

## 🌍 Phase 3: Environment Management (QA → UAT → Prod)

### Overview

Create separate projects for each environment with the same architecture.

### Step 3.1: Create Additional Projects

```bash
# Create UAT project
gcloud projects create clarityai-uat \
  --name="ClarityAI UAT Environment"

# Create Production project
gcloud projects create clarityai-prod \
  --name="ClarityAI Production Environment"
```

### Step 3.2: Environment Configuration

**Create environment-specific configuration files:**

```
config/
├── .env.qa
├── .env.uat
└── .env.prod
```

**Example `.env.qa`:**
```bash
VITE_API_URL=https://clarityai-qa-backend-xxx.run.app/api
VITE_DEMO_MODE=false
VITE_GITHUB_CLIENT_ID=qa_github_client_id
VITE_APP_URL=https://qa.clarityai.com
```

**Example `.env.uat`:**
```bash
VITE_API_URL=https://clarityai-uat-backend-xxx.run.app/api
VITE_DEMO_MODE=false
VITE_GITHUB_CLIENT_ID=uat_github_client_id
VITE_APP_URL=https://uat.clarityai.com
```

**Example `.env.prod`:**
```bash
VITE_API_URL=https://api.clarityai.com/api
VITE_DEMO_MODE=false
VITE_GITHUB_CLIENT_ID=prod_github_client_id
VITE_APP_URL=https://clarityai.com
```

### Step 3.3: Deployment Scripts

**Create deployment script for each environment:**

```bash
# scripts/deploy-qa.sh
#!/bin/bash
set -e

echo "🚀 Deploying to QA Environment..."

# Set project
gcloud config set project clarityai-qa

# Build frontend
cp config/.env.qa .env
npm run build

# Deploy to Cloud Storage
gcloud storage cp -r dist/* gs://clarityai-qa-frontend

# Deploy backend
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest
gcloud run deploy clarityai-qa-backend \
  --image us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest \
  --region us-central1

echo "✅ QA Deployment Complete!"
echo "🌐 Frontend: https://qa.clarityai.com"
echo "🔧 Backend: https://clarityai-qa-backend-xxx.run.app"
```

**Make script executable:**
```bash
chmod +x scripts/deploy-qa.sh
chmod +x scripts/deploy-uat.sh
chmod +x scripts/deploy-prod.sh
```

---

## 🤖 Phase 4: CI/CD Pipeline

### Overview

Automate deployments using GitHub Actions (or Cloud Build).

### Step 4.1: GitHub Actions Setup

**Create `.github/workflows/deploy-qa.yml`:**

```yaml
name: Deploy to QA

on:
  push:
    branches:
      - develop  # Deploy QA when pushing to develop branch

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        env:
          VITE_API_URL: ${{ secrets.QA_API_URL }}
          VITE_GITHUB_CLIENT_ID: ${{ secrets.QA_GITHUB_CLIENT_ID }}
        run: npm run build

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_QA_CREDENTIALS }}

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Deploy to Cloud Storage
        run: |
          gcloud storage cp -r dist/* gs://clarityai-qa-frontend

      - name: Deploy backend to Cloud Run
        run: |
          cd backend
          gcloud builds submit --tag us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest
          gcloud run deploy clarityai-qa-backend \
            --image us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest \
            --region us-central1

      - name: Notify deployment
        run: echo "✅ QA deployment successful!"
```

### Step 4.2: Setup GitHub Secrets

1. **Create Service Account in GCP:**
```bash
# Create service account
gcloud iam service-accounts create github-actions-qa \
  --display-name="GitHub Actions QA Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:github-actions-qa@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:github-actions-qa@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:github-actions-qa@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions-qa@clarityai-qa.iam.gserviceaccount.com
```

2. **Add secrets to GitHub:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `GCP_QA_CREDENTIALS`: Content of `key.json`
     - `QA_API_URL`: Your QA API URL
     - `QA_GITHUB_CLIENT_ID`: GitHub OAuth client ID for QA

### Step 4.3: Create Similar Workflows for UAT and Prod

```yaml
# .github/workflows/deploy-uat.yml
# Similar to QA, but triggered on:
on:
  push:
    branches:
      - main  # Deploy UAT when pushing to main

# .github/workflows/deploy-prod.yml
# Triggered manually or on tag creation
on:
  workflow_dispatch:  # Manual trigger
  push:
    tags:
      - 'v*'  # Deploy on version tags
```

---

## 📊 Monitoring & Maintenance

### Step 5.1: Setup Cloud Monitoring

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud alpha monitoring uptime create clarityai-qa-uptime \
  --display-name="ClarityAI QA Health Check" \
  --http-check-path="/api/health" \
  --period=60 \
  --timeout=10 \
  --resource-type=uptime-url \
  --resource-labels=host=clarityai-qa-backend-xxx.run.app
```

### Step 5.2: Setup Logging

**View Cloud Run logs:**
```bash
# Stream logs
gcloud run services logs tail clarityai-qa-backend --region us-central1

# View recent logs
gcloud run services logs read clarityai-qa-backend --region us-central1 --limit 50
```

**Access logs in Cloud Console:**
```
https://console.cloud.google.com/logs
```

### Step 5.3: Setup Alerts

1. Go to Cloud Console → Monitoring → Alerting
2. Create alerts for:
   - High error rate (>5% errors)
   - Slow response time (>2 seconds)
   - Service down (uptime check fails)
   - High CPU/Memory usage

### Step 5.4: Setup Error Tracking

**Install Sentry (Recommended):**

```bash
npm install @sentry/react @sentry/vite-plugin
```

**Configure in your app:**

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE, // qa, uat, or prod
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

---

## 💰 Cost Optimization

### Estimated Monthly Costs (QA Environment)

```
Frontend (Cloud Storage + CDN):
  - Storage (5GB): ~$0.10/month
  - Bandwidth (10GB): ~$1.20/month
  - Total: ~$1.30/month

Backend (Cloud Run):
  - CPU time: ~$5-10/month (low traffic)
  - Requests: Free tier covers most QA usage
  - Total: ~$5-10/month

Database (Cloud SQL):
  - db-f1-micro: ~$7/month
  - Storage (10GB): ~$1.70/month
  - Total: ~$9/month

**Total QA Environment: ~$15-20/month**
```

### Cost-Saving Tips

1. **Use smaller instance sizes for QA/UAT**
```bash
# For QA, use minimal resources
--tier=db-f1-micro              # Smallest DB
--memory=512Mi                  # Minimal Cloud Run memory
--min-instances=0               # Scale to zero when not used
```

2. **Delete unused resources**
```bash
# List all resources
gcloud compute instances list
gcloud storage buckets list
gcloud sql instances list

# Delete old deployments
gcloud run services delete old-service
```

3. **Set up budget alerts**
```bash
# In Cloud Console → Billing → Budgets & alerts
# Create budget: $50/month with alerts at 50%, 90%, 100%
```

4. **Use committed use discounts for production**
   - Save up to 57% with 1-year or 3-year commitments

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Permission denied" errors

**Solution:**
```bash
# Check your authentication
gcloud auth list

# Re-authenticate if needed
gcloud auth login

# Check project permissions
gcloud projects get-iam-policy clarityai-qa
```

#### Issue 2: Frontend shows 404 errors

**Solution:**
```bash
# Ensure index.html is set as main page
gcloud storage buckets update gs://clarityai-qa-frontend \
  --web-main-page-suffix=index.html \
  --web-error-page=index.html

# Check bucket permissions
gcloud storage buckets get-iam-policy gs://clarityai-qa-frontend
```

#### Issue 3: Backend fails to connect to database

**Solution:**
```bash
# Verify Cloud SQL connection
gcloud sql instances describe clarityai-qa-db

# Check Cloud Run service account has Cloud SQL Client role
gcloud run services get-iam-policy clarityai-qa-backend --region us-central1

# Add if missing
gcloud projects add-iam-policy-binding clarityai-qa \
  --member="serviceAccount:[SERVICE-ACCOUNT]@clarityai-qa.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

#### Issue 4: SSL certificate not provisioning

**Solution:**
```bash
# Check certificate status
gcloud compute ssl-certificates describe clarityai-qa-cert

# Verify DNS is pointing to correct IP
nslookup qa.clarityai.com

# Wait 15-30 minutes for provisioning
```

#### Issue 5: High costs

**Solution:**
```bash
# Check Cloud Run metrics
gcloud run services describe clarityai-qa-backend --region us-central1

# Reduce max instances if too high
gcloud run services update clarityai-qa-backend \
  --max-instances=5 \
  --region us-central1

# Enable scale-to-zero
gcloud run services update clarityai-qa-backend \
  --min-instances=0 \
  --region us-central1
```

---

## 📚 Quick Reference Commands

### Deployment Commands

```bash
# Deploy frontend to QA
gcloud storage cp -r dist/* gs://clarityai-qa-frontend

# Deploy backend to QA
gcloud run deploy clarityai-qa-backend \
  --image us-central1-docker.pkg.dev/clarityai-qa/clarityai-qa/backend:latest \
  --region us-central1

# View logs
gcloud run services logs tail clarityai-qa-backend --region us-central1

# List all services
gcloud run services list

# Get service URL
gcloud run services describe clarityai-qa-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

### Useful GCP Commands

```bash
# Switch project
gcloud config set project clarityai-qa

# List projects
gcloud projects list

# Enable APIs
gcloud services enable [API-NAME]

# List enabled APIs
gcloud services list --enabled

# Check quotas
gcloud compute project-info describe --project=clarityai-qa
```

---

## ✅ Deployment Checklist

### QA Environment Setup

- [ ] Create GCP project `clarityai-qa`
- [ ] Enable billing
- [ ] Install gcloud CLI
- [ ] Create Cloud Storage bucket
- [ ] Deploy frontend to Cloud Storage
- [ ] Test frontend URL
- [ ] Create Artifact Registry repository
- [ ] Build and push backend Docker image
- [ ] Deploy backend to Cloud Run
- [ ] Create Cloud SQL database
- [ ] Update environment variables
- [ ] Setup monitoring and alerts
- [ ] Document all URLs and credentials
- [ ] Test end-to-end functionality

### UAT Environment Setup

- [ ] Create GCP project `clarityai-uat`
- [ ] Repeat QA steps for UAT
- [ ] Configure UAT-specific OAuth apps
- [ ] Test production-like scenarios

### Production Environment Setup

- [ ] Create GCP project `clarityai-prod`
- [ ] Repeat setup with production configurations
- [ ] Setup custom domain
- [ ] Enable HTTPS/SSL
- [ ] Configure monitoring and alerts
- [ ] Setup backup and disaster recovery
- [ ] Perform load testing
- [ ] Create runbook documentation

---

## 🎓 Next Steps

### After QA Deployment

1. **Test thoroughly in QA**
   - All features working
   - OAuth flows functional
   - Webhook endpoints receiving events
   - Database connections stable

2. **Setup UAT environment**
   - Mirror QA setup
   - Use UAT-specific credentials
   - Invite stakeholders for testing

3. **Plan Production deployment**
   - Register custom domain
   - Configure production OAuth apps
   - Setup monitoring and alerting
   - Create backup strategy

4. **Implement CI/CD**
   - GitHub Actions for automated deployments
   - Automated testing
   - Rollback procedures

5. **Optimize for production**
   - Enable CDN
   - Setup auto-scaling
   - Implement caching
   - Performance testing

---

## 📖 Additional Resources

### Official Documentation

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Cloud Storage for Static Websites](https://cloud.google.com/storage/docs/hosting-static-website)
- [Cloud SQL Docs](https://cloud.google.com/sql/docs)
- [Cloud Build Docs](https://cloud.google.com/build/docs)

### Video Tutorials

- [GCP Fundamentals](https://www.youtube.com/playlist?list=PLIivdWyY5sqKh1gDR0WpP9iIOY00IE0xL)
- [Deploy React to GCP](https://www.youtube.com/results?search_query=deploy+react+to+google+cloud)

### Community Support

- [Stack Overflow - Google Cloud](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [GCP Community](https://www.googlecloudcommunity.com/)

---

## 💬 Support

If you get stuck at any step:

1. Check the troubleshooting section
2. Search the error in Google Cloud documentation
3. Ask on Stack Overflow with tag `google-cloud-platform`
4. Refer to the official GCP docs

---

**Good luck with your deployment! 🚀**

*Remember: Start small with QA, test thoroughly, then scale to UAT and Production.*
