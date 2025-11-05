import { DashboardLayout } from "@/components/DashboardLayout";
import { PullRequestCard } from "@/components/PullRequestCard";
import { useData } from "@/contexts/DataContext";

const Index = () => {
  const { pullRequests } = useData();

  // Map PR status to card status format
  const mapStatus = (status: string): "reviewed" | "in-progress" | "pending" => {
    if (status === "approved") return "reviewed";
    if (status === "in_review") return "in-progress";
    return "pending";
  };

  // Show only the most recent 5 pull requests
  const recentPullRequests = pullRequests.slice(0, 5).map(pr => ({
    id: pr.id,
    repository: pr.repository,
    title: pr.title,
    author: {
      name: pr.author.name,
      avatar: pr.author.avatar
    },
    status: mapStatus(pr.status),
    createdAt: pr.createdAt
  }));

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
          {recentPullRequests.length > 0 ? (
            recentPullRequests.map((pr) => (
              <PullRequestCard
                key={pr.id}
                repository={pr.repository}
                title={pr.title}
                author={pr.author}
                status={pr.status}
                createdAt={pr.createdAt}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pull requests yet. Connect a repository to get started!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
