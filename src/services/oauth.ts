/**
 * OAuth Service
 * Handles OAuth authentication flow for GitHub, Bitbucket, and Jira
 *
 * NOTE: This is a frontend-only implementation. In production, you should:
 * 1. Never store OAuth client secrets in frontend code
 * 2. Handle OAuth callback on the backend
 * 3. Store access tokens securely on the backend
 * 4. Use backend endpoints to proxy API requests
 */

export type OAuthProvider = "github" | "bitbucket" | "jira";

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: OAuthProvider;
}

// OAuth configuration for each provider
// NOTE: In production, these should be environment variables and handled on backend
const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    clientId: process.env.GITHUB_CLIENT_ID || "demo-client-id",
    scopes: ["repo", "read:user", "write:repo_hook"],
    redirectUri: `${window.location.origin}/oauth/callback/github`
  },
  bitbucket: {
    authUrl: "https://bitbucket.org/site/oauth2/authorize",
    tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
    clientId: process.env.BITBUCKET_CLIENT_ID || "demo-client-id",
    scopes: ["repository", "pullrequest", "webhook"],
    redirectUri: `${window.location.origin}/oauth/callback/bitbucket`
  },
  jira: {
    authUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    clientId: process.env.JIRA_CLIENT_ID || "demo-client-id",
    scopes: ["read:jira-work", "read:jira-user"],
    redirectUri: `${window.location.origin}/oauth/callback/jira`
  }
};

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Store OAuth state for CSRF validation
 */
function storeState(state: string): void {
  sessionStorage.setItem("oauth_state", state);
}

/**
 * Validate OAuth state for CSRF protection
 */
function validateState(state: string): boolean {
  const storedState = sessionStorage.getItem("oauth_state");
  sessionStorage.removeItem("oauth_state");
  return state === storedState;
}

/**
 * Store OAuth token in localStorage
 */
function storeToken(provider: OAuthProvider, token: OAuthToken): void {
  localStorage.setItem(`oauth_token_${provider}`, JSON.stringify(token));
}

/**
 * Get OAuth token from localStorage
 */
export function getToken(provider: OAuthProvider): OAuthToken | null {
  const tokenStr = localStorage.getItem(`oauth_token_${provider}`);
  if (!tokenStr) return null;

  try {
    const token = JSON.parse(tokenStr) as OAuthToken;

    // Check if token is expired
    if (token.expiresAt && Date.now() > token.expiresAt) {
      removeToken(provider);
      return null;
    }

    return token;
  } catch (error) {
    console.error(`Failed to parse token for ${provider}:`, error);
    return null;
  }
}

/**
 * Remove OAuth token from localStorage
 */
function removeToken(provider: OAuthProvider): void {
  localStorage.setItem(`oauth_token_${provider}`, "");
}

/**
 * Check if user is connected to a provider
 */
export function isConnected(provider: OAuthProvider): boolean {
  return getToken(provider) !== null;
}

/**
 * Initiate OAuth flow for a provider
 * Opens OAuth authorization page in a new window or redirects current page
 */
export function initiateOAuth(provider: OAuthProvider, usePopup: boolean = true): void {
  const config = OAUTH_CONFIGS[provider];
  const state = generateState();
  storeState(state);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state: state,
    response_type: "code"
  });

  // Add provider-specific parameters
  if (provider === "jira") {
    params.append("audience", "api.atlassian.com");
    params.append("prompt", "consent");
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;

  if (usePopup) {
    // Open in popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      `${provider}_oauth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
  } else {
    // Redirect current page
    window.location.href = authUrl;
  }
}

/**
 * Handle OAuth callback
 * This should be called on the OAuth callback page
 *
 * NOTE: In production, the backend should handle this to securely exchange
 * the authorization code for an access token
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  // Validate state for CSRF protection
  if (!validateState(state)) {
    return { success: false, error: "Invalid state parameter (CSRF protection)" };
  }

  try {
    // In production, this should be a backend API call
    // For demo purposes, we'll simulate a successful token exchange
    const simulatedToken: OAuthToken = {
      accessToken: `demo_${provider}_token_${Date.now()}`,
      refreshToken: `demo_${provider}_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
      provider: provider
    };

    storeToken(provider, simulatedToken);

    // In production, you would exchange the code for a token:
    // const response = await fetch('/api/oauth/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ provider, code })
    // });
    // const token = await response.json();
    // storeToken(provider, token);

    return { success: true };
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Disconnect from OAuth provider
 * Removes stored token and optionally revokes it on the provider's side
 */
export async function disconnectOAuth(provider: OAuthProvider): Promise<void> {
  const token = getToken(provider);

  if (token) {
    // In production, you should revoke the token on the provider's side
    // Example for GitHub:
    // await fetch(`https://api.github.com/applications/${clientId}/token`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ access_token: token.accessToken })
    // });

    removeToken(provider);
  }
}

/**
 * Simulated OAuth connection (for demo purposes)
 * In production, remove this and use actual OAuth flow
 */
export function simulateOAuthConnect(provider: OAuthProvider): void {
  const simulatedToken: OAuthToken = {
    accessToken: `demo_${provider}_token_${Date.now()}`,
    refreshToken: `demo_${provider}_refresh_${Date.now()}`,
    expiresAt: Date.now() + 3600 * 1000, // 1 hour
    provider: provider
  };

  storeToken(provider, simulatedToken);
}

/**
 * Get user info from provider using access token
 * NOTE: In production, this should be done via backend to keep tokens secure
 */
export async function getUserInfo(provider: OAuthProvider): Promise<any> {
  const token = getToken(provider);
  if (!token) {
    throw new Error(`Not connected to ${provider}`);
  }

  // In production, you would call the provider's API:
  // const response = await fetch(API_ENDPOINTS[provider].userInfo, {
  //   headers: {
  //     'Authorization': `Bearer ${token.accessToken}`
  //   }
  // });
  // return await response.json();

  // For demo, return mock data
  return {
    provider,
    connected: true,
    tokenExpiresAt: new Date(token.expiresAt).toISOString()
  };
}
