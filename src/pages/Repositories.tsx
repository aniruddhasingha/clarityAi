import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, GitBranch, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const repositories = [
  {
    id: 1,
    name: "acme-corp/website",
    description: "Main company website built with React",
    lastReview: "2 hours ago",
    status: "active",
    pullRequests: 3
  },
  {
    id: 2,
    name: "acme-corp/api",
    description: "REST API backend service",
    lastReview: "1 day ago", 
    status: "active",
    pullRequests: 1
  },
  {
    id: 3,
    name: "acme-corp/mobile-app",
    description: "React Native mobile application",
    lastReview: "3 days ago",
    status: "inactive", 
    pullRequests: 0
  }
];

const Repositories = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
          <p className="text-muted-foreground mt-2">
            Manage your connected repositories and their review settings
          </p>
        </div>
        
        <div className="grid gap-4">
          {repositories.map((repo) => (
            <Card key={repo.id} className="bg-gradient-card border-border hover:shadow-card transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {repo.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={repo.status === "active" ? "default" : "secondary"}>
                    {repo.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last review: {repo.lastReview}
                    </div>
                    <div>
                      {repo.pullRequests} open PR{repo.pullRequests !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Link to={`/repository/${encodeURIComponent(repo.name)}/settings`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
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