import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PullRequestCardProps {
  repository: string;
  title: string;
  author: {
    name: string;
    avatar: string;
  };
  status: "reviewed" | "in-progress";
  createdAt: string;
}

export function PullRequestCard({
  repository,
  title,
  author,
  status,
  createdAt,
}: PullRequestCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "reviewed":
        return "success";
      case "in-progress":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "reviewed":
        return "Reviewed";
      case "in-progress":
        return "In Progress";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="bg-gradient-card border-border hover:shadow-card transition-all duration-200 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {repository}
              </span>
              <Badge 
                variant={getStatusVariant(status)}
                className="text-xs"
              >
                {getStatusText(status)}
              </Badge>
            </div>
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {createdAt}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback className="text-xs">
                {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}