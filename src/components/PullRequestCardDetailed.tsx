import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, GitPullRequest, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PullRequestCardDetailedProps {
  pullRequest: {
    id: number;
    title: string;
    repository: string;
    author: string;
    authorAvatar: string;
    status: "open" | "merged" | "closed";
    createdAt: string;
    filesChanged: number;
    comments: number;
    aiReviewStatus: "pending" | "in-progress" | "completed";
    humanReviews: number;
  };
}

export function PullRequestCardDetailed({ pullRequest }: PullRequestCardDetailedProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "merged":
        return "secondary";
      case "closed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getAIReviewStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleClick = () => {
    navigate(`/pull-requests/${pullRequest.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-none tracking-tight">
              {pullRequest.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              #{pullRequest.id} • {pullRequest.repository}
            </p>
          </div>
          <Badge variant={getStatusColor(pullRequest.status)}>
            {pullRequest.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={pullRequest.authorAvatar} />
                <AvatarFallback>{pullRequest.author[0]}</AvatarFallback>
              </Avatar>
              <span>{pullRequest.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{pullRequest.createdAt}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{pullRequest.filesChanged} files</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{pullRequest.comments} comments</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getAIReviewStatusColor(pullRequest.aiReviewStatus)}>
              AI: {pullRequest.aiReviewStatus}
            </Badge>
            {pullRequest.humanReviews > 0 && (
              <Badge variant="outline">
                {pullRequest.humanReviews} human review{pullRequest.humanReviews !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}