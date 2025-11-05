import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, GitBranch, Clock, Plus, Github, Eye, EyeOff, Webhook, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

// Mock data for available repositories from GitHub/Bitbucket
const availableRepositories = [
  {
    id: 4,
    name: "acme-corp/docs",
    description: "Documentation website",
    provider: "github" as const,
    isPrivate: false
  },
  {
    id: 5,
    name: "acme-corp/internal-tools",
    description: "Internal development tools",
    provider: "github" as const,
    isPrivate: true
  },
  {
    id: 6,
    name: "acme-corp/design-system",
    description: "Component library and design tokens",
    provider: "bitbucket" as const,
    isPrivate: false
  }
];

const Repositories = () => {
  const { repositories, toggleRepositoryMonitoring, addRepository, deleteRepository } = useData();
  const [availableRepos] = useState(availableRepositories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleToggleMonitoring = (repoId: number) => {
    toggleRepositoryMonitoring(repoId);
    const repo = repositories.find(r => r.id === repoId);
    if (repo) {
      toast.success(
        repo.monitoring
          ? `Monitoring disabled for ${repo.name}`
          : `Monitoring enabled for ${repo.name}`
      );
    }
  };

  const handleConnectRepository = (availableRepo: typeof availableRepositories[0]) => {
    const newRepo = {
      id: availableRepo.id,
      name: availableRepo.name,
      description: availableRepo.description,
      provider: availableRepo.provider,
      lastReview: "Never",
      monitoring: true,
      webhookStatus: "active" as const,
      pullRequests: 0,
      reviewsToday: 0
    };
    addRepository(newRepo);
    setIsAddDialogOpen(false);
    toast.success(`Connected ${newRepo.name}`);
  };

  const handleDisconnectRepository = (repoId: number) => {
    const repo = repositories.find(r => r.id === repoId);
    if (repo) {
      deleteRepository(repoId);
      toast.success(`Disconnected ${repo.name}`);
    }
  };

  const getStatusBadge = (repo: typeof repositories[0]) => {
    if (!repo.monitoring) return <Badge variant="secondary">Disabled</Badge>;
    if (repo.webhookStatus === "active") return <Badge variant="default">Active</Badge>;
    return <Badge variant="destructive">Inactive</Badge>;
  };

  const getWebhookIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
            <p className="text-muted-foreground mt-2">
              Manage your connected repositories and their review settings
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Connect Repository
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Connect New Repository</DialogTitle>
                <DialogDescription>
                  Select a repository from your connected GitHub or Bitbucket accounts to enable AI code reviews.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableRepos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {repo.provider === "github" ? (
                        <Github className="h-5 w-5" />
                      ) : (
                        <GitBranch className="h-5 w-5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{repo.name}</span>
                          {repo.isPrivate && <Badge variant="outline" className="text-xs">Private</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{repo.description}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleConnectRepository(repo)}
                    >
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <Card key={repo.id} className="bg-gradient-card border-border hover:shadow-card transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {repo.provider === "github" ? (
                      <Github className="h-5 w-5 text-primary" />
                    ) : (
                      <GitBranch className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {repo.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(repo)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last review: {repo.lastReview}
                    </div>
                    <div>
                      {repo.pullRequests} open PR{repo.pullRequests !== 1 ? 's' : ''}
                    </div>
                    <div>
                      {repo.reviewsToday} reviews today
                    </div>
                    <div className="flex items-center gap-1">
                      <Webhook className="h-4 w-4" />
                      Webhook: {getWebhookIcon(repo.webhookStatus)}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Monitoring</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleMonitoring(repo.id)}
                          className="h-8 w-8 p-0"
                        >
                          {repo.monitoring ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectRepository(repo.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Disconnect
                      </Button>
                    </div>
                    
                    <Link to={`/repository/${encodeURIComponent(repo.name)}/settings`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Repositories;