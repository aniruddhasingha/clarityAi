# Webhook Setup Guide

This document explains how webhooks work in ClarityAI and how to set them up for production use.

## Current Status

The application currently runs in **Demo Mode** with simulated webhook management. This means:
- Webhooks are simulated locally and stored in localStorage
- No actual webhooks are created on GitHub/Bitbucket
- Webhook events are not received or processed
- Perfect for development and testing the webhook UI/UX

## What Are Webhooks?

Webhooks allow GitHub and Bitbucket to notify ClarityAI when events occur in your repositories (like new pull requests or comments). This enables automatic AI code reviews without manual intervention.

## Supported Events

### GitHub Events
- `pull_request` - When a PR is opened, updated, or closed
- `pull_request_review` - When a review is submitted
- `pull_request_review_comment` - When a review comment is added

### Bitbucket Events
- `pullrequest:created` - When a PR is created
- `pullrequest:updated` - When a PR is updated
- `pullrequest:comment_created` - When a comment is added

## Architecture

### Files

- `src/services/webhooks.ts` - Webhook management service
- `src/pages/Repositories.tsx` - Webhook UI integration

### Webhook Lifecycle

1. **Create**: When repository monitoring is enabled
   - Generate secure webhook secret
   - Create webhook on GitHub/Bitbucket via API
   - Store webhook ID and secret in database
   - Set status to "active"

2. **Receive Event**: When webhook is triggered
   - GitHub/Bitbucket sends POST request to webhook endpoint
   - Backend validates webhook signature
   - Event is parsed and queued for processing
   - AI review is triggered for PR events

3. **Process Event**: Asynchronous event processing
   - Fetch PR details and file changes
   - Run AI code review
   - Post review comments back to PR
   - Update PR status in database

4. **Delete**: When repository monitoring is disabled
   - Delete webhook from GitHub/Bitbucket
   - Remove webhook from database
   - Clean up associated data

## Production Setup

### 1. Backend Webhook Endpoints

Create these endpoints in your backend:

#### `POST /api/webhooks/create`
```typescript
// Creates webhook on GitHub/Bitbucket
// Stores webhook ID and secret in database
// Returns: { success: boolean, webhookId: string }

async function createWebhook(req, res) {
  const { repositoryId, repositoryName, provider } = req.body;

  // Get OAuth token for user
  const token = await getOAuthToken(req.user.id, provider);

  // Create webhook on provider
  const webhook = await createProviderWebhook(provider, repositoryName, token, {
    url: `${process.env.BACKEND_URL}/api/webhooks/${provider}`,
    secret: generateWebhookSecret(),
    events: getEventTypes(provider)
  });

  // Store in database
  await db.webhooks.create({
    id: webhook.id,
    repositoryId,
    provider,
    secret: encrypt(webhook.secret),
    status: 'active',
    userId: req.user.id
  });

  res.json({ success: true, webhookId: webhook.id });
}
```

#### `POST /api/webhooks/github`
```typescript
// Receives webhook events from GitHub
// Validates signature and processes event

async function handleGitHubWebhook(req, res) {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const body = req.body;

  // Validate signature
  const webhook = await db.webhooks.findByRepository(body.repository.id);
  if (!validateGitHubSignature(body, webhook.secret, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // Queue event for processing
  await eventQueue.add('github-webhook', {
    event,
    payload: body,
    webhookId: webhook.id
  });

  res.status(200).send('Event queued');
}
```

#### `POST /api/webhooks/bitbucket`
```typescript
// Receives webhook events from Bitbucket
// Similar to GitHub handler but with Bitbucket signature validation

async function handleBitbucketWebhook(req, res) {
  const event = req.headers['x-event-key'];
  const body = req.body;

  // Validate Bitbucket signature
  // ... similar to GitHub

  res.status(200).send('Event queued');
}
```

#### `DELETE /api/webhooks/:webhookId`
```typescript
// Deletes webhook from provider and database

async function deleteWebhook(req, res) {
  const { webhookId } = req.params;
  const webhook = await db.webhooks.findById(webhookId);

  // Delete from provider
  await deleteProviderWebhook(webhook.provider, webhook.id, token);

  // Delete from database
  await db.webhooks.delete(webhookId);

  res.json({ success: true });
}
```

#### `POST /api/webhooks/:webhookId/test`
```typescript
// Tests webhook by triggering a ping event

async function testWebhook(req, res) {
  const { webhookId } = req.params;
  const webhook = await db.webhooks.findById(webhookId);

  // Trigger test event on provider
  await testProviderWebhook(webhook.provider, webhook.id, token);

  res.json({ success: true });
}
```

### 2. Webhook Signature Validation

#### GitHub Signature Validation
```typescript
import crypto from 'crypto';

function validateGitHubSignature(
  payload: any,
  secret: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

#### Bitbucket Signature Validation
```typescript
function validateBitbucketSignature(
  payload: any,
  secret: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### 3. Event Processing

Create a background job processor for webhook events:

```typescript
// Event processor using Bull queue or similar

eventQueue.process('github-webhook', async (job) => {
  const { event, payload, webhookId } = job.data;

  if (event === 'pull_request' && payload.action === 'opened') {
    // New PR opened - trigger AI review
    await triggerAIReview(payload.pull_request);
  }

  if (event === 'pull_request_review_comment') {
    // Review comment added - may need to re-review
    await handleReviewComment(payload.comment);
  }

  // Update webhook last triggered timestamp
  await db.webhooks.update(webhookId, {
    lastTriggered: new Date()
  });
});

async function triggerAIReview(pullRequest: any) {
  // 1. Fetch PR files and changes
  const files = await fetchPRFiles(pullRequest);

  // 2. Run AI analysis
  const review = await runAICodeReview(files, pullRequest);

  // 3. Post review comments
  await postReviewComments(pullRequest, review.comments);

  // 4. Update PR status
  await updatePRStatus(pullRequest.id, 'reviewed');
}
```

### 4. Database Schema

```sql
CREATE TABLE webhooks (
  id VARCHAR(255) PRIMARY KEY,
  repository_id INTEGER NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL,
  secret_encrypted TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  events JSON NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_triggered TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR(255) NOT NULL,
  event VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  status VARCHAR(50) NOT NULL,
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id)
);
```

### 5. Environment Variables

```bash
# Backend URL (for webhook endpoint)
BACKEND_URL=https://api.your-domain.com

# Webhook secrets encryption key
WEBHOOK_ENCRYPTION_KEY=your_encryption_key_here

# Queue configuration (for Redis/Bull)
REDIS_URL=redis://localhost:6379
```

### 6. Frontend Updates

In `src/services/webhooks.ts`, update these functions to call your backend:

```typescript
export async function createWebhook(
  repositoryId: number,
  repositoryName: string,
  provider: "github" | "bitbucket"
) {
  const response = await fetch('/api/webhooks/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ repositoryId, repositoryName, provider })
  });

  return await response.json();
}

export async function deleteWebhook(webhookId: string) {
  const response = await fetch(`/api/webhooks/${webhookId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  return await response.json();
}
```

## Security Best Practices

### ✅ Always validate webhook signatures
- Never process webhook events without signature validation
- Use timing-safe comparison to prevent timing attacks

### ✅ Use HTTPS for webhook endpoints
- Webhooks should only be sent to HTTPS endpoints
- GitHub/Bitbucket will reject HTTP endpoints

### ✅ Store webhook secrets encrypted
- Encrypt webhook secrets before storing in database
- Use strong encryption (AES-256 or better)

### ✅ Rate limiting
- Implement rate limiting on webhook endpoints
- Prevent abuse and DoS attacks

### ✅ Event deduplication
- GitHub may send duplicate events
- Use event IDs to deduplicate

### ✅ Async processing
- Don't process events synchronously
- Use a queue (Bull, RabbitMQ, etc.) for async processing
- Return 200 OK quickly to prevent timeouts

### ✅ Monitoring and logging
- Log all webhook deliveries
- Monitor webhook health and success rates
- Alert on repeated failures

## Testing

### Demo Mode (Current)
```bash
npm run dev
# Navigate to Repositories
# Toggle monitoring on/off
# Webhook creation is simulated
# Check browser console for logs
```

### Local Development with ngrok
```bash
# Start backend
npm run dev:backend

# Expose local backend to internet
ngrok http 3000

# Update webhook URL in provider settings
# Use ngrok URL: https://xxxxx.ngrok.io/api/webhooks/github

# Trigger webhook by opening a PR on GitHub
# Check backend logs for webhook events
```

### Production Testing
```bash
# Use test repository
# Create test PR
# Verify webhook is triggered
# Check AI review is posted
# Verify status updates correctly
```

## Troubleshooting

### Issue: Webhooks not being received
**Solution**:
- Check webhook endpoint is publicly accessible
- Verify HTTPS certificate is valid
- Check provider webhook delivery logs

### Issue: Signature validation failing
**Solution**:
- Verify secret matches what's stored in database
- Check payload is being hashed correctly
- Ensure using correct hash algorithm (sha256)

### Issue: Events being processed multiple times
**Solution**:
- Implement event deduplication
- Use event IDs to track processed events
- Add database constraint on event ID

### Issue: Webhook deleted on provider but still in database
**Solution**:
- Add periodic sync to check webhook status
- Clean up orphaned webhooks
- Handle provider API errors gracefully

## GitHub Webhook Setup (Manual)

If you need to set up webhooks manually on GitHub:

1. Go to repository Settings → Webhooks
2. Click "Add webhook"
3. Fill in:
   - **Payload URL**: `https://your-backend.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Generate secure random string
   - **Events**: Select "Let me select individual events"
     - ✅ Pull requests
     - ✅ Pull request reviews
     - ✅ Pull request review comments
4. Click "Add webhook"

## Bitbucket Webhook Setup (Manual)

1. Go to repository Settings → Webhooks
2. Click "Add webhook"
3. Fill in:
   - **Title**: ClarityAI Webhook
   - **URL**: `https://your-backend.com/api/webhooks/bitbucket`
   - **Status**: Active
   - **Triggers**:
     - ✅ Pull Request Created
     - ✅ Pull Request Updated
     - ✅ Pull Request Comment Created
4. Click "Save"

## Migration Path

To move from demo to production:

1. ✅ Set up backend webhook endpoints
2. ✅ Implement signature validation
3. ✅ Create event processing queue
4. ✅ Add database tables for webhooks
5. ✅ Update frontend to call backend APIs
6. ✅ Test webhook creation and deletion
7. ✅ Test event receiving and processing
8. ✅ Deploy and verify in production
9. ✅ Remove demo/simulation code

## Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Bitbucket Webhooks Documentation](https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/)
- [Webhook Security Best Practices](https://webhooks.fyi/)
