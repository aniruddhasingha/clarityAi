# Backend API Specification

Complete API specification for ClarityAI backend services.

## Base URL

```
Production: https://api.clarityai.com/api
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a session cookie or JWT token.

### Headers

```
Content-Type: application/json
Cookie: session=<session-token>
```

---

## Authentication Endpoints

### POST /auth/login

Login user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /auth/logout

Logout current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/me

Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## OAuth Endpoints

### POST /oauth/initiate

Initiate OAuth flow for a provider.

**Request:**
```json
{
  "provider": "github" | "bitbucket" | "jira"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://github.com/login/oauth/authorize?...",
    "state": "random-state-string"
  }
}
```

### POST /oauth/callback

Handle OAuth callback after user authorization.

**Request:**
```json
{
  "provider": "github",
  "code": "oauth-authorization-code",
  "state": "random-state-string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "connected": true
  }
}
```

### POST /oauth/disconnect

Disconnect OAuth provider.

**Request:**
```json
{
  "provider": "github"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Disconnected from github"
}
```

### GET /oauth/status

Get OAuth connection status for all providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "github": true,
    "bitbucket": false,
    "jira": true
  }
}
```

---

## Repository Endpoints

### GET /repositories

Get all connected repositories for current user.

**Query Parameters:**
- `provider` (optional): Filter by provider (github, bitbucket)
- `monitoring` (optional): Filter by monitoring status (true, false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "acme-corp/website",
      "description": "Main company website",
      "provider": "github",
      "monitoring": true,
      "webhookStatus": "active",
      "pullRequests": 3,
      "reviewsToday": 5,
      "lastReview": "2024-01-01T12:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /repositories/available

Get available repositories from OAuth providers.

**Query Parameters:**
- `provider` (required): github or bitbucket

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123456,
      "name": "acme-corp/docs",
      "description": "Documentation",
      "provider": "github",
      "isPrivate": false,
      "url": "https://github.com/acme-corp/docs"
    }
  ]
}
```

### POST /repositories

Connect a new repository.

**Request:**
```json
{
  "repositoryName": "acme-corp/website",
  "provider": "github"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "acme-corp/website",
    "provider": "github",
    "monitoring": true,
    "webhookStatus": "pending"
  }
}
```

### DELETE /repositories/:id

Disconnect a repository.

**Response:**
```json
{
  "success": true,
  "message": "Repository disconnected"
}
```

### PATCH /repositories/:id

Update repository settings.

**Request:**
```json
{
  "monitoring": true,
  "customInstructions": "Ensure all functions are pure",
  "jiraProjectKey": "ACME",
  "jiraEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated repository object */ }
}
```

### GET /repositories/:id/settings

Get repository-specific settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "customInstructions": "...",
    "jiraProjectKey": "ACME",
    "jiraEnabled": true
  }
}
```

---

## Webhook Endpoints

### POST /webhooks

Create a webhook for a repository.

**Request:**
```json
{
  "repositoryId": 1,
  "repositoryName": "acme-corp/website",
  "provider": "github"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "wh_abc123",
    "repositoryId": 1,
    "provider": "github",
    "events": ["pull_request", "pull_request_review"],
    "url": "https://api.clarityai.com/api/webhooks/github",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /webhooks/:webhookId

Delete a webhook.

**Response:**
```json
{
  "success": true,
  "message": "Webhook deleted"
}
```

### POST /webhooks/:webhookId/test

Send a test ping to the webhook.

**Response:**
```json
{
  "success": true,
  "message": "Test event sent"
}
```

### GET /webhooks/:webhookId/deliveries

Get webhook delivery history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "del_123",
        "event": "pull_request",
        "status": "success",
        "responseCode": 200,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### POST /webhooks/github

Receive webhook events from GitHub.

**Headers:**
```
X-GitHub-Event: pull_request
X-Hub-Signature-256: sha256=...
```

**Response:**
```
200 OK
```

### POST /webhooks/bitbucket

Receive webhook events from Bitbucket.

**Headers:**
```
X-Event-Key: pullrequest:created
X-Hub-Signature: sha256=...
```

**Response:**
```
200 OK
```

---

## Pull Request Endpoints

### GET /pull-requests

Get all pull requests.

**Query Parameters:**
- `status` (optional): Filter by status
- `repository` (optional): Filter by repository
- `author` (optional): Filter by author
- `page` (optional): Page number
- `pageSize` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": 42,
      "title": "Add user authentication",
      "repository": "acme-corp/website",
      "author": {
        "name": "John Doe",
        "username": "johndoe",
        "avatar": "https://..."
      },
      "status": "in_review",
      "reviewProgress": 75,
      "aiReviewStatus": "completed",
      "aiComments": 8,
      "humanComments": 3,
      "changedFiles": 12,
      "additions": 245,
      "deletions": 67,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### GET /pull-requests/:id

Get specific pull request details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 42,
    "title": "Add user authentication",
    "description": "...",
    "repository": "acme-corp/website",
    "author": { /* ... */ },
    "status": "in_review",
    "files": [
      {
        "path": "src/auth.ts",
        "changes": 50,
        "additions": 45,
        "deletions": 5,
        "diff": "..."
      }
    ],
    "reviews": [ /* ... */ ],
    "comments": [ /* ... */ ]
  }
}
```

### POST /pull-requests/:id/review

Trigger AI review for a pull request.

**Response:**
```json
{
  "success": true,
  "data": {
    "reviewId": 123,
    "status": "in_progress"
  }
}
```

### PATCH /pull-requests/:id/status

Update pull request status.

**Request:**
```json
{
  "status": "approved"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated PR object */ }
}
```

---

## Review Endpoints

### GET /reviews/:pullRequestId

Get AI review for a pull request.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "pullRequestId": 1,
    "status": "completed",
    "summary": "Overall good code quality...",
    "comments": [
      {
        "id": 1,
        "file": "src/auth.ts",
        "line": 42,
        "type": "suggestion",
        "message": "Consider using bcrypt for password hashing",
        "severity": "medium",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "metrics": {
      "score": 85,
      "securityIssues": 2,
      "performanceIssues": 1,
      "styleIssues": 5
    },
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

### GET /reviews/:reviewId/comments

Get all comments from a review.

**Response:**
```json
{
  "success": true,
  "data": [ /* array of comment objects */ ]
}
```

---

## User Settings Endpoints

### GET /settings

Get user settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "reviewReminders": false,
    "autoApproval": false
  }
}
```

### PATCH /settings

Update user settings.

**Request:**
```json
{
  "emailNotifications": false,
  "reviewReminders": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated settings */ }
}
```

### PATCH /profile

Update user profile.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated user object */ }
}
```

---

## Analytics Endpoints

### GET /analytics

Get analytics data.

**Query Parameters:**
- `period` (required): day, week, or month

**Response:**
```json
{
  "success": true,
  "data": {
    "reviewsCount": 45,
    "pullRequestsCount": 23,
    "commentsCount": 156,
    "averageReviewTime": 3600,
    "topReviewers": [ /* ... */ ],
    "topRepositories": [ /* ... */ ]
  }
}
```

---

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional details */ }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Not authenticated
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `INTERNAL_ERROR` (500): Server error
- `OAUTH_ERROR`: OAuth-related errors
- `WEBHOOK_ERROR`: Webhook-related errors
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

---

## Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **Webhook endpoints**: 100 requests per minute
- **OAuth endpoints**: 10 requests per minute

Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640995200
```

---

## Pagination

Paginated endpoints include:

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

---

## WebSocket Events

For real-time updates (optional future enhancement):

### Connection
```
wss://api.clarityai.com/ws?token=<session-token>
```

### Events
- `pr.created`: New PR opened
- `pr.updated`: PR updated
- `review.completed`: AI review finished
- `comment.added`: New comment added

---

## Implementation Notes

1. **Authentication**: Use HTTP-only cookies for session management
2. **CORS**: Configure CORS to allow frontend domain
3. **Database**: PostgreSQL recommended for relational data
4. **Cache**: Redis for session storage and caching
5. **Queue**: Bull/BullMQ for background job processing
6. **Storage**: S3-compatible storage for file uploads
7. **Logging**: Structured logging with request IDs
8. **Monitoring**: Application performance monitoring (APM)
