import { DashboardLayout } from "@/components/DashboardLayout";
import { PullRequestCard } from "@/components/PullRequestCard";

// Mock data for recent pull requests
const recentPullRequests = [
  {
    id: 1,
    repository: "frontend/web-app",
    title: "Add user authentication flow and dashboard navigation",
    author: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
    },
    status: "reviewed" as const,
    createdAt: "2 hours ago"
  },
  {
    id: 2,
    repository: "backend/api-service",
    title: "Implement rate limiting for API endpoints",
    author: {
      name: "Mike Johnson", 
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike"
    },
    status: "in-progress" as const,
    createdAt: "4 hours ago"
  },
  {
    id: 3,
    repository: "mobile/react-native",
    title: "Fix crash on iOS when navigating between screens",
    author: {
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
    },
    status: "reviewed" as const,
    createdAt: "6 hours ago"
  },
  {
    id: 4,
    repository: "infrastructure/k8s",
    title: "Update deployment configs for production environment",
    author: {
      name: "Emma Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma"
    },
    status: "in-progress" as const,
    createdAt: "8 hours ago"
  },
  {
    id: 5,
    repository: "frontend/component-lib",
    title: "Create reusable Table component with sorting and filtering",
    author: {
      name: "David Park",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david"
    },
    status: "reviewed" as const,
    createdAt: "1 day ago"
  }
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recent Activity</h1>
          <p className="text-muted-foreground mt-2">
            Latest pull requests reviewed by ClarityAI
          </p>
        </div>
        
        <div className="grid gap-4">
          {recentPullRequests.map((pr) => (
            <PullRequestCard
              key={pr.id}
              repository={pr.repository}
              title={pr.title}
              author={pr.author}
              status={pr.status}
              createdAt={pr.createdAt}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
