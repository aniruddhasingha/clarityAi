/**
 * Webhook Service
 * Manages webhook creation, deletion, and monitoring for GitHub and Bitbucket repositories
 *
 * NOTE: This is a frontend-only implementation for demo purposes.
 * In production:
 * 1. All webhook operations should be done via backend API
 * 2. Backend should store webhook IDs and secrets in database
 * 3. Backend should validate webhook signatures
 * 4. Backend should handle webhook events and trigger AI reviews
 */

import { getToken, OAuthProvider } from "./oauth";

export type WebhookStatus = "active" | "inactive" | "pending" | "error";

export interface WebhookConfig {
  id: string;
  repositoryId: number;
  repositoryName: string;
  provider: OAuthProvider;
  events: string[];
  url: string;
  secret: string;
  status: WebhookStatus;
  createdAt: string;
  lastTriggered?: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  timestamp: string;
  processed: boolean;
}

/**
 * Generate a secure webhook secret
 */
function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get all webhooks from localStorage
 */
export function getAllWebhooks(): WebhookConfig[] {
  const webhooksStr = localStorage.getItem("webhooks");
  if (!webhooksStr) return [];

  try {
    return JSON.parse(webhooksStr);
  } catch (error) {
    console.error("Failed to parse webhooks:", error);
    return [];
  }
}

/**
 * Get webhook for a specific repository
 */
export function getWebhookForRepository(repositoryId: number): WebhookConfig | null {
  const webhooks = getAllWebhooks();
  return webhooks.find(wh => wh.repositoryId === repositoryId) || null;
}

/**
 * Store webhooks to localStorage
 */
function storeWebhooks(webhooks: WebhookConfig[]): void {
  localStorage.setItem("webhooks", JSON.stringify(webhooks));
}

/**
 * Create a webhook for a repository
 * In production, this would call the backend API which then creates the webhook
 * on GitHub/Bitbucket using their respective APIs
 */
export async function createWebhook(
  repositoryId: number,
  repositoryName: string,
  provider: "github" | "bitbucket"
): Promise<{ success: boolean; webhook?: WebhookConfig; error?: string }> {
  try {
    // Check if OAuth is connected
    const token = getToken(provider);
    if (!token) {
      return {
        success: false,
        error: `Please connect to ${provider} first`
      };
    }

    // Check if webhook already exists
    const existing = getWebhookForRepository(repositoryId);
    if (existing) {
      return {
        success: false,
        error: "Webhook already exists for this repository"
      };
    }

    // Generate webhook configuration
    const webhookUrl = `${window.location.origin}/api/webhooks/${provider}`;
    const secret = generateWebhookSecret();

    // Define events to subscribe to
    const events = provider === "github"
      ? ["pull_request", "pull_request_review", "pull_request_review_comment"]
      : ["pullrequest:created", "pullrequest:updated", "pullrequest:comment_created"];

    // In production, call backend API:
    // const response = await fetch('/api/webhooks/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     repositoryId,
    //     repositoryName,
    //     provider,
    //     events,
    //     url: webhookUrl,
    //     secret
    //   })
    // });
    // const result = await response.json();

    // For demo, simulate webhook creation
    const webhook: WebhookConfig = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      repositoryId,
      repositoryName,
      provider,
      events,
      url: webhookUrl,
      secret,
      status: "active",
      createdAt: new Date().toISOString()
    };

    // Store webhook
    const webhooks = getAllWebhooks();
    webhooks.push(webhook);
    storeWebhooks(webhooks);

    return { success: true, webhook };
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Delete a webhook
 * In production, this would call the backend API which then deletes the webhook
 * from GitHub/Bitbucket
 */
export async function deleteWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhooks = getAllWebhooks();
    const webhook = webhooks.find(wh => wh.id === webhookId);

    if (!webhook) {
      return { success: false, error: "Webhook not found" };
    }

    // In production, call backend API:
    // const response = await fetch(`/api/webhooks/${webhookId}`, {
    //   method: 'DELETE'
    // });
    // const result = await response.json();

    // For demo, just remove from storage
    const updatedWebhooks = webhooks.filter(wh => wh.id !== webhookId);
    storeWebhooks(updatedWebhooks);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Update webhook status
 */
export function updateWebhookStatus(
  webhookId: string,
  status: WebhookStatus
): void {
  const webhooks = getAllWebhooks();
  const updatedWebhooks = webhooks.map(wh =>
    wh.id === webhookId ? { ...wh, status } : wh
  );
  storeWebhooks(updatedWebhooks);
}

/**
 * Test webhook by sending a ping event
 * In production, this would trigger a test event on the provider
 */
export async function testWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhook = getAllWebhooks().find(wh => wh.id === webhookId);
    if (!webhook) {
      return { success: false, error: "Webhook not found" };
    }

    // In production, call backend API:
    // const response = await fetch(`/api/webhooks/${webhookId}/test`, {
    //   method: 'POST'
    // });
    // const result = await response.json();

    // For demo, simulate successful test
    updateWebhookStatus(webhookId, "active");

    return { success: true };
  } catch (error) {
    console.error("Failed to test webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get webhook delivery logs
 * In production, this would fetch delivery history from the backend
 */
export function getWebhookDeliveries(webhookId: string): WebhookEvent[] {
  // In production, fetch from backend:
  // const response = await fetch(`/api/webhooks/${webhookId}/deliveries`);
  // return await response.json();

  // For demo, return empty array
  return [];
}

/**
 * Handle incoming webhook event
 * In production, this is handled entirely on the backend
 */
export async function handleWebhookEvent(
  provider: OAuthProvider,
  event: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, backend would:
    // 1. Validate webhook signature
    // 2. Parse event payload
    // 3. Trigger AI code review if it's a PR event
    // 4. Update PR status in database
    // 5. Send notifications if configured

    console.log(`Webhook event received: ${provider}/${event}`, payload);

    return { success: true };
  } catch (error) {
    console.error("Failed to handle webhook event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get webhook configuration for a provider
 */
export function getWebhookInfo(provider: "github" | "bitbucket"): {
  endpoint: string;
  events: string[];
  contentType: string;
} {
  const baseUrl = window.location.origin;

  if (provider === "github") {
    return {
      endpoint: `${baseUrl}/api/webhooks/github`,
      events: [
        "pull_request",
        "pull_request_review",
        "pull_request_review_comment"
      ],
      contentType: "application/json"
    };
  } else {
    return {
      endpoint: `${baseUrl}/api/webhooks/bitbucket`,
      events: [
        "pullrequest:created",
        "pullrequest:updated",
        "pullrequest:comment_created"
      ],
      contentType: "application/json"
    };
  }
}

/**
 * Check if repository has active webhook
 */
export function hasActiveWebhook(repositoryId: number): boolean {
  const webhook = getWebhookForRepository(repositoryId);
  return webhook !== null && webhook.status === "active";
}

/**
 * Simulate webhook event (for demo/testing)
 */
export function simulateWebhookEvent(
  repositoryId: number,
  eventType: "pull_request" | "pull_request_review"
): void {
  const webhook = getWebhookForRepository(repositoryId);
  if (!webhook) {
    console.warn("No webhook configured for repository");
    return;
  }

  const event: WebhookEvent = {
    id: `evt_${Date.now()}`,
    webhookId: webhook.id,
    event: eventType,
    payload: {
      action: eventType === "pull_request" ? "opened" : "submitted",
      pull_request: {
        number: Math.floor(Math.random() * 100),
        title: "Test pull request",
        state: "open"
      },
      repository: {
        name: webhook.repositoryName
      }
    },
    timestamp: new Date().toISOString(),
    processed: false
  };

  console.log("Simulated webhook event:", event);

  // Update last triggered timestamp
  const webhooks = getAllWebhooks();
  const updatedWebhooks = webhooks.map(wh =>
    wh.id === webhook.id
      ? { ...wh, lastTriggered: new Date().toISOString() }
      : wh
  );
  storeWebhooks(updatedWebhooks);
}
