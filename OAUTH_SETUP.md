# OAuth Integration Guide

This document explains how the OAuth integration works in ClarityAI and how to set it up for production use.

## Current Status

The application currently runs in **Demo Mode** with simulated OAuth flows. This means:
- OAuth connections are simulated locally
- Tokens are stored in localStorage (demo tokens only)
- No actual API calls are made to GitHub, Bitbucket, or Jira
- Perfect for development and testing the UI/UX

## Supported Providers

1. **GitHub** - For repository access and webhook management
2. **Bitbucket** - For repository access and pull request integration
3. **Jira** - For ticket context and project management

## Architecture

### Files

- `src/services/oauth.ts` - OAuth service with all authentication logic
- `src/pages/Settings.tsx` - OAuth connection UI

### Flow

1. User clicks "Connect" button for a provider
2. OAuth service generates state parameter (CSRF protection)
3. User is redirected to provider's authorization page
4. Provider redirects back with authorization code
5. Backend exchanges code for access token (in production)
6. Token is stored securely (in production on backend)

## Production Setup

### 1. Register OAuth Applications

#### GitHub
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: ClarityAI
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/oauth/callback/github`
4. Save the **Client ID** and **Client Secret**

#### Bitbucket
1. Go to https://bitbucket.org/account/settings/app-passwords/
2. Create an app password with these permissions:
   - `repository` - Read/Write
   - `pullrequest` - Read/Write
   - `webhook` - Read/Write
3. Save the **Key** and **Secret**

#### Jira (Atlassian)
1. Go to https://developer.atlassian.com/console/myapps/
2. Create a new OAuth 2.0 integration
3. Configure:
   - **Authorization callback URL**: `https://your-domain.com/oauth/callback/jira`
   - **Scopes**: `read:jira-work`, `read:jira-user`
4. Save the **Client ID** and **Client Secret**

### 2. Environment Variables

Create a `.env` file in the backend:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Bitbucket OAuth
BITBUCKET_CLIENT_ID=your_bitbucket_key
BITBUCKET_CLIENT_SECRET=your_bitbucket_secret

# Jira OAuth
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret

# App config
FRONTEND_URL=https://your-domain.com
SESSION_SECRET=your_random_session_secret
```

### 3. Backend Implementation

Create these backend endpoints:

#### `POST /api/oauth/initiate`
```typescript
// Initiates OAuth flow
// Returns: { authUrl: string, state: string }
```

#### `POST /api/oauth/callback`
```typescript
// Handles OAuth callback
// Exchanges code for token
// Stores token securely in database
// Returns: { success: boolean, user: object }
```

#### `POST /api/oauth/disconnect`
```typescript
// Revokes OAuth token
// Deletes token from database
// Returns: { success: boolean }
```

#### `GET /api/oauth/status`
```typescript
// Checks connection status
// Returns: { connected: boolean, provider: string }
```

### 4. Frontend Updates

In `src/services/oauth.ts`, update these functions:

```typescript
// Replace simulateOAuthConnect with real OAuth initiation
export function initiateOAuth(provider: OAuthProvider): void {
  // Call backend to get auth URL
  fetch('/api/oauth/initiate', {
    method: 'POST',
    body: JSON.stringify({ provider })
  })
    .then(res => res.json())
    .then(({ authUrl }) => {
      window.location.href = authUrl; // Redirect to provider
    });
}

// Update handleOAuthCallback to use backend
export async function handleOAuthCallback(provider: string, code: string, state: string) {
  const response = await fetch('/api/oauth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, code, state })
  });

  return await response.json();
}
```

### 5. Security Best Practices

#### ⚠️ NEVER store these in frontend:
- Client secrets
- Access tokens (except in memory, temporarily)
- Refresh tokens

#### ✅ Always do these on backend:
- Token exchange (code for access token)
- Token storage (in database, encrypted)
- API calls using tokens
- Token refresh
- Token revocation

#### ✅ CSRF Protection:
- Always validate state parameter
- Use secure, random state generation
- Store state in session, not localStorage

#### ✅ Token Security:
- Store tokens in database, encrypted at rest
- Use httpOnly cookies for session management
- Implement token expiration and refresh
- Revoke tokens on logout/disconnect

### 6. API Proxy Layer

Create backend endpoints that proxy requests to provider APIs:

```typescript
// Example: Get GitHub repositories
app.get('/api/github/repos', authenticateUser, async (req, res) => {
  const token = await getOAuthToken(req.user.id, 'github');

  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const repos = await response.json();
  res.json(repos);
});
```

### 7. Webhook Setup

For GitHub/Bitbucket repository monitoring:

1. When repository is connected, create webhook:
```typescript
POST /api/repositories/:id/webhook
// Creates webhook on provider
// Stores webhook ID in database
```

2. Handle webhook events:
```typescript
POST /api/webhooks/:provider
// Receives webhook events
// Triggers AI code review
// Updates PR status
```

## Testing

### Demo Mode (Current)
```bash
npm run dev
# Navigate to Settings
# Click "Connect" on any provider
# Connection is simulated
```

### Production Mode
```bash
# Set up backend with real OAuth credentials
# Update frontend to use backend endpoints
# Test full OAuth flow end-to-end
```

## Troubleshooting

### Issue: "Invalid redirect URI"
**Solution**: Ensure callback URL in provider settings matches exactly what's in code

### Issue: "Token expired"
**Solution**: Implement token refresh logic in backend

### Issue: "CSRF validation failed"
**Solution**: Check that state parameter is being stored and validated correctly

### Issue: "Insufficient permissions"
**Solution**: Request additional OAuth scopes in authorization URL

## Migration Path

To move from demo to production:

1. ✅ Set up OAuth apps on GitHub/Bitbucket/Jira
2. ✅ Create backend API with OAuth endpoints
3. ✅ Update `oauth.ts` to call backend instead of simulating
4. ✅ Add database schema for storing tokens
5. ✅ Implement token encryption
6. ✅ Add API proxy endpoints
7. ✅ Test OAuth flow end-to-end
8. ✅ Remove demo/simulation code

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Bitbucket OAuth Documentation](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/)
- [Jira OAuth Documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
