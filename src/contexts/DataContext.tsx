import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface Author {
  name: string;
  username: string;
  avatar: string;
}

export interface PullRequest {
  id: number;
  title: string;
  number: number;
  repository: string;
  author: Author;
  branch: string;
  status: "pending" | "in_review" | "approved" | "needs_changes";
  jiraTicket: string;
  createdAt: string;
  reviewProgress: number;
  aiReviewStatus: "pending" | "in_progress" | "completed" | "failed";
  aiComments: number;
  humanComments: number;
  changedFiles: number;
  additions: number;
  deletions: number;
  provider: "github" | "bitbucket";
}

export interface Repository {
  id: number;
  name: string;
  description: string;
  provider: "github" | "bitbucket";
  lastReview: string;
  monitoring: boolean;
  webhookStatus: "active" | "inactive" | "pending";
  pullRequests: number;
  reviewsToday: number;
}

interface DataContextType {
  pullRequests: PullRequest[];
  repositories: Repository[];
  addPullRequest: (pr: PullRequest) => void;
  updatePullRequest: (id: number, updates: Partial<PullRequest>) => void;
  deletePullRequest: (id: number) => void;
  addRepository: (repo: Repository) => void;
  updateRepository: (id: number, updates: Partial<Repository>) => void;
  deleteRepository: (id: number) => void;
  toggleRepositoryMonitoring: (id: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock data
const initialPullRequests: PullRequest[] = [
  {
    id: 1,
    title: "Implement user authentication system",
    number: 42,
    repository: "acme-corp/website",
    author: {
      name: "John Doe",
      username: "johndoe",
      avatar: "/placeholder.svg"
    },
    branch: "feature/auth-system",
    status: "in_review",
    jiraTicket: "ACME-123",
    createdAt: "2 hours ago",
    reviewProgress: 75,
    aiReviewStatus: "completed",
    aiComments: 8,
    humanComments: 3,
    changedFiles: 12,
    additions: 245,
    deletions: 67,
    provider: "github"
  },
  {
    id: 2,
    title: "Fix mobile responsive design issues",
    number: 38,
    repository: "acme-corp/website",
    author: {
      name: "Jane Smith",
      username: "janesmith",
      avatar: "/placeholder.svg"
    },
    branch: "fix/mobile-responsive",
    status: "pending",
    jiraTicket: "ACME-119",
    createdAt: "4 hours ago",
    reviewProgress: 25,
    aiReviewStatus: "in_progress",
    aiComments: 0,
    humanComments: 0,
    changedFiles: 6,
    additions: 89,
    deletions: 23,
    provider: "github"
  },
  {
    id: 3,
    title: "Add API rate limiting middleware",
    number: 15,
    repository: "acme-corp/api",
    author: {
      name: "Mike Johnson",
      username: "mikej",
      avatar: "/placeholder.svg"
    },
    branch: "feature/rate-limiting",
    status: "approved",
    jiraTicket: "ACME-145",
    createdAt: "1 day ago",
    reviewProgress: 100,
    aiReviewStatus: "completed",
    aiComments: 5,
    humanComments: 2,
    changedFiles: 4,
    additions: 156,
    deletions: 12,
    provider: "github"
  },
  {
    id: 4,
    title: "Update dependencies and fix vulnerabilities",
    number: 7,
    repository: "acme-corp/mobile-app",
    author: {
      name: "Sarah Wilson",
      username: "sarahw",
      avatar: "/placeholder.svg"
    },
    branch: "security/dependency-updates",
    status: "needs_changes",
    jiraTicket: "ACME-201",
    createdAt: "3 days ago",
    reviewProgress: 90,
    aiReviewStatus: "completed",
    aiComments: 12,
    humanComments: 5,
    changedFiles: 18,
    additions: 67,
    deletions: 234,
    provider: "bitbucket"
  }
];

const initialRepositories: Repository[] = [
  {
    id: 1,
    name: "acme-corp/website",
    description: "Main company website built with React",
    provider: "github",
    lastReview: "2 hours ago",
    monitoring: true,
    webhookStatus: "active",
    pullRequests: 3,
    reviewsToday: 5
  },
  {
    id: 2,
    name: "acme-corp/api",
    description: "REST API backend service",
    provider: "github",
    lastReview: "1 day ago",
    monitoring: true,
    webhookStatus: "active",
    pullRequests: 1,
    reviewsToday: 2
  },
  {
    id: 3,
    name: "acme-corp/mobile-app",
    description: "React Native mobile application",
    provider: "bitbucket",
    lastReview: "3 days ago",
    monitoring: false,
    webhookStatus: "inactive",
    pullRequests: 0,
    reviewsToday: 0
  }
];

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPRs = localStorage.getItem("pullRequests");
    const savedRepos = localStorage.getItem("repositories");

    if (savedPRs) {
      try {
        setPullRequests(JSON.parse(savedPRs));
      } catch (error) {
        console.error("Failed to load pull requests:", error);
        setPullRequests(initialPullRequests);
      }
    } else {
      setPullRequests(initialPullRequests);
    }

    if (savedRepos) {
      try {
        setRepositories(JSON.parse(savedRepos));
      } catch (error) {
        console.error("Failed to load repositories:", error);
        setRepositories(initialRepositories);
      }
    } else {
      setRepositories(initialRepositories);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (pullRequests.length > 0) {
      localStorage.setItem("pullRequests", JSON.stringify(pullRequests));
    }
  }, [pullRequests]);

  useEffect(() => {
    if (repositories.length > 0) {
      localStorage.setItem("repositories", JSON.stringify(repositories));
    }
  }, [repositories]);

  // Pull Request methods
  const addPullRequest = (pr: PullRequest) => {
    setPullRequests(prev => [...prev, pr]);
  };

  const updatePullRequest = (id: number, updates: Partial<PullRequest>) => {
    setPullRequests(prev =>
      prev.map(pr => (pr.id === id ? { ...pr, ...updates } : pr))
    );
  };

  const deletePullRequest = (id: number) => {
    setPullRequests(prev => prev.filter(pr => pr.id !== id));
  };

  // Repository methods
  const addRepository = (repo: Repository) => {
    setRepositories(prev => [...prev, repo]);
  };

  const updateRepository = (id: number, updates: Partial<Repository>) => {
    setRepositories(prev =>
      prev.map(repo => (repo.id === id ? { ...repo, ...updates } : repo))
    );
  };

  const deleteRepository = (id: number) => {
    setRepositories(prev => prev.filter(repo => repo.id !== id));
  };

  const toggleRepositoryMonitoring = (id: number) => {
    setRepositories(prev =>
      prev.map(repo =>
        repo.id === id
          ? {
              ...repo,
              monitoring: !repo.monitoring,
              webhookStatus: !repo.monitoring ? "active" : "inactive"
            }
          : repo
      )
    );
  };

  const value = {
    pullRequests,
    repositories,
    addPullRequest,
    updatePullRequest,
    deletePullRequest,
    addRepository,
    updateRepository,
    deleteRepository,
    toggleRepositoryMonitoring
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
