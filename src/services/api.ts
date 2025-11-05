/**
 * API Service
 * Central API client for all backend communication
 *
 * This service provides a typed interface for all backend API calls.
 * In demo mode, it returns mock data. In production, it makes real HTTP requests.
 */

import { PullRequest, Repository } from "@/contexts/DataContext";
import { OAuthProvider } from "./oauth";
import { WebhookConfig } from "./webhooks";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false"; // Default to demo mode

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// User Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  reviewReminders: boolean;
  autoApproval: boolean;
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private demoMode: boolean;

  constructor(baseUrl: string, demoMode: boolean) {
    this.baseUrl = baseUrl;
    this.demoMode = demoMode;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (this.demoMode) {
      // In demo mode, return mock data
      return this.mockRequest<T>(endpoint, options);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include", // Include cookies for session management
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Request failed",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Mock request for demo mode
   */
  private async mockRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[DEMO MODE] API call: ${options.method || "GET"} ${endpoint}`);

    return {
      success: true,
      data: {} as T,
      message: "Demo mode - no real API call made",
    };
  }

  // ==================== Authentication ====================

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request("/auth/me");
  }

  // ==================== OAuth ====================

  async initiateOAuth(provider: OAuthProvider): Promise<ApiResponse<{ authUrl: string }>> {
    return this.request(`/oauth/initiate`, {
      method: "POST",
      body: JSON.stringify({ provider }),
    });
  }

  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/oauth/callback`, {
      method: "POST",
      body: JSON.stringify({ provider, code, state }),
    });
  }

  async disconnectOAuth(provider: OAuthProvider): Promise<ApiResponse<void>> {
    return this.request(`/oauth/disconnect`, {
      method: "POST",
      body: JSON.stringify({ provider }),
    });
  }

  async getOAuthStatus(): Promise<
    ApiResponse<{ github: boolean; bitbucket: boolean; jira: boolean }>
  > {
    return this.request("/oauth/status");
  }

  // ==================== Repositories ====================

  async getRepositories(): Promise<ApiResponse<Repository[]>> {
    return this.request("/repositories");
  }

  async getAvailableRepositories(
    provider: "github" | "bitbucket"
  ): Promise<ApiResponse<Repository[]>> {
    return this.request(`/repositories/available?provider=${provider}`);
  }

  async connectRepository(
    repositoryName: string,
    provider: "github" | "bitbucket"
  ): Promise<ApiResponse<Repository>> {
    return this.request("/repositories", {
      method: "POST",
      body: JSON.stringify({ repositoryName, provider }),
    });
  }

  async disconnectRepository(repositoryId: number): Promise<ApiResponse<void>> {
    return this.request(`/repositories/${repositoryId}`, {
      method: "DELETE",
    });
  }

  async updateRepositorySettings(
    repositoryId: number,
    settings: {
      monitoring?: boolean;
      customInstructions?: string;
      jiraProjectKey?: string;
      jiraEnabled?: boolean;
    }
  ): Promise<ApiResponse<Repository>> {
    return this.request(`/repositories/${repositoryId}`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  // ==================== Webhooks ====================

  async createWebhook(
    repositoryId: number,
    repositoryName: string,
    provider: "github" | "bitbucket"
  ): Promise<ApiResponse<WebhookConfig>> {
    return this.request("/webhooks", {
      method: "POST",
      body: JSON.stringify({ repositoryId, repositoryName, provider }),
    });
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.request(`/webhooks/${webhookId}`, {
      method: "DELETE",
    });
  }

  async testWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.request(`/webhooks/${webhookId}/test`, {
      method: "POST",
    });
  }

  async getWebhookDeliveries(
    webhookId: string
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    return this.request(`/webhooks/${webhookId}/deliveries`);
  }

  // ==================== Pull Requests ====================

  async getPullRequests(
    filters?: {
      status?: string;
      repository?: string;
      author?: string;
    }
  ): Promise<ApiResponse<PullRequest[]>> {
    const params = new URLSearchParams(filters as Record<string, string>);
    return this.request(`/pull-requests?${params.toString()}`);
  }

  async getPullRequest(id: number): Promise<ApiResponse<PullRequest>> {
    return this.request(`/pull-requests/${id}`);
  }

  async triggerReview(pullRequestId: number): Promise<ApiResponse<void>> {
    return this.request(`/pull-requests/${pullRequestId}/review`, {
      method: "POST",
    });
  }

  async updatePullRequestStatus(
    pullRequestId: number,
    status: string
  ): Promise<ApiResponse<PullRequest>> {
    return this.request(`/pull-requests/${pullRequestId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // ==================== Reviews ====================

  async getReview(pullRequestId: number): Promise<
    ApiResponse<{
      id: number;
      pullRequestId: number;
      status: string;
      comments: any[];
      createdAt: string;
    }>
  > {
    return this.request(`/reviews/${pullRequestId}`);
  }

  async getReviewComments(reviewId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/reviews/${reviewId}/comments`);
  }

  // ==================== User Settings ====================

  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request("/settings");
  }

  async updateUserSettings(
    settings: Partial<UserSettings>
  ): Promise<ApiResponse<UserSettings>> {
    return this.request("/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  async updateProfile(profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): Promise<ApiResponse<User>> {
    return this.request("/profile", {
      method: "PATCH",
      body: JSON.stringify(profile),
    });
  }

  // ==================== Analytics ====================

  async getAnalytics(period: "day" | "week" | "month"): Promise<
    ApiResponse<{
      reviewsCount: number;
      pullRequestsCount: number;
      commentsCount: number;
      averageReviewTime: number;
    }>
  > {
    return this.request(`/analytics?period=${period}`);
  }

  // ==================== Health Check ====================

  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request("/health");
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL, DEMO_MODE);

// Export convenient methods
export const api = {
  // Auth
  login: (email: string, password: string) => apiClient.login(email, password),
  logout: () => apiClient.logout(),
  getCurrentUser: () => apiClient.getCurrentUser(),

  // OAuth
  initiateOAuth: (provider: OAuthProvider) => apiClient.initiateOAuth(provider),
  handleOAuthCallback: (provider: OAuthProvider, code: string, state: string) =>
    apiClient.handleOAuthCallback(provider, code, state),
  disconnectOAuth: (provider: OAuthProvider) => apiClient.disconnectOAuth(provider),
  getOAuthStatus: () => apiClient.getOAuthStatus(),

  // Repositories
  getRepositories: () => apiClient.getRepositories(),
  getAvailableRepositories: (provider: "github" | "bitbucket") =>
    apiClient.getAvailableRepositories(provider),
  connectRepository: (name: string, provider: "github" | "bitbucket") =>
    apiClient.connectRepository(name, provider),
  disconnectRepository: (id: number) => apiClient.disconnectRepository(id),
  updateRepositorySettings: (id: number, settings: any) =>
    apiClient.updateRepositorySettings(id, settings),

  // Webhooks
  createWebhook: (repoId: number, repoName: string, provider: "github" | "bitbucket") =>
    apiClient.createWebhook(repoId, repoName, provider),
  deleteWebhook: (webhookId: string) => apiClient.deleteWebhook(webhookId),
  testWebhook: (webhookId: string) => apiClient.testWebhook(webhookId),
  getWebhookDeliveries: (webhookId: string) => apiClient.getWebhookDeliveries(webhookId),

  // Pull Requests
  getPullRequests: (filters?: any) => apiClient.getPullRequests(filters),
  getPullRequest: (id: number) => apiClient.getPullRequest(id),
  triggerReview: (prId: number) => apiClient.triggerReview(prId),
  updatePullRequestStatus: (prId: number, status: string) =>
    apiClient.updatePullRequestStatus(prId, status),

  // Reviews
  getReview: (prId: number) => apiClient.getReview(prId),
  getReviewComments: (reviewId: number) => apiClient.getReviewComments(reviewId),

  // Settings
  getUserSettings: () => apiClient.getUserSettings(),
  updateUserSettings: (settings: Partial<UserSettings>) =>
    apiClient.updateUserSettings(settings),
  updateProfile: (profile: any) => apiClient.updateProfile(profile),

  // Analytics
  getAnalytics: (period: "day" | "week" | "month") => apiClient.getAnalytics(period),

  // Health
  healthCheck: () => apiClient.healthCheck(),
};

export default api;
