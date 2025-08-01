import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  GitPullRequest, 
  Github, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  ExternalLink,
  Zap,
  Target
} from "lucide-react";

// Mock data for pull requests
const pullRequests = [
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

const PullRequests = () => {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "needs_changes":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Changes Requested</Badge>;
      case "in_review":
        return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />In Review</Badge>;
      case "pending":
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAIReviewBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Zap className="h-3 w-3 mr-1" />AI Review Complete</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />AI Reviewing</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />AI Review Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const filteredPRs = pullRequests.filter(pr => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return pr.status === "pending" || pr.status === "in_review";
    if (activeTab === "approved") return pr.status === "approved";
    if (activeTab === "needs_changes") return pr.status === "needs_changes";
    return true;
  });

  const stats = {
    total: pullRequests.length,
    pending: pullRequests.filter(pr => pr.status === "pending" || pr.status === "in_review").length,
    approved: pullRequests.filter(pr => pr.status === "approved").length,
    needsChanges: pullRequests.filter(pr => pr.status === "needs_changes").length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pull Requests</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage AI-powered code reviews across your repositories
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total PRs</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-muted-foreground">Approved</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-muted-foreground">Needs Changes</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stats.needsChanges}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pull Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Pull Requests</CardTitle>
            <CardDescription>
              All pull requests being monitored for AI code reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                <TabsTrigger value="needs_changes">Changes ({stats.needsChanges})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {filteredPRs.map((pr, index) => (
                  <div key={pr.id}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/pull-requests/${pr.id}`}>
                      <div className="flex items-center gap-2 pt-1">
                        {pr.provider === "github" ? (
                          <Github className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <GitBranch className="h-5 w-5 text-muted-foreground" />
                        )}
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base">{pr.title}</h3>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-mono">#{pr.number}</span>
                              <span>{pr.repository}</span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {pr.jiraTicket}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(pr.status)}
                            {getAIReviewBadge(pr.aiReviewStatus)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={pr.author.avatar} />
                              <AvatarFallback className="text-xs">
                                {pr.author.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{pr.author.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {pr.createdAt}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            {pr.branch}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{pr.changedFiles} files</span>
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600">-{pr.deletions}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span className="text-muted-foreground">{pr.aiComments} AI comments</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-muted-foreground">{pr.humanComments} human comments</span>
                            </div>
                          </div>
                        </div>
                        
                        {pr.reviewProgress < 100 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Review Progress</span>
                              <span className="text-muted-foreground">{pr.reviewProgress}%</span>
                            </div>
                            <Progress value={pr.reviewProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                    {index < filteredPRs.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
                
                {filteredPRs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pull requests found for the selected filter.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PullRequests;