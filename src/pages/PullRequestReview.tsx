import { useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GitPullRequest, 
  MessageSquare, 
  Check, 
  X, 
  AlertCircle,
  Bot,
  User,
  Plus,
  Minus,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface CodeComment {
  id: string;
  line: number;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  type: 'human' | 'ai';
  resolved?: boolean;
}

interface FileDiff {
  filename: string;
  additions: number;
  deletions: number;
  changes: Array<{
    line: number;
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    comments?: CodeComment[];
  }>;
}

export default function PullRequestReview() {
  const { id } = useParams();
  const [newComment, setNewComment] = useState("");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock data - in real app, this would come from API
  const pullRequest = {
    id: parseInt(id || "1"),
    title: "Add user authentication flow",
    description: "Implements OAuth login with Google and GitHub providers, including session management and protected routes.",
    author: "sarah-dev",
    authorAvatar: "/placeholder.svg",
    status: "open" as const,
    repository: "acme-corp/website",
    sourceBranch: "feature/auth-flow",
    targetBranch: "main",
    createdAt: "2024-01-15T10:30:00Z",
    filesChanged: 8,
    additions: 234,
    deletions: 67,
    aiReviewStatus: "completed" as const,
    aiScore: 85,
    humanReviews: 2
  };

  const fileDiffs: FileDiff[] = [
    {
      filename: "src/components/LoginForm.tsx",
      additions: 45,
      deletions: 12,
      changes: [
        { line: 1, type: "unchanged", content: "import React, { useState } from 'react';" },
        { line: 2, type: "added", content: "+ import { useAuth } from '@/hooks/useAuth';" },
        { line: 3, type: "added", content: "+ import { Button } from '@/components/ui/button';" },
        { line: 4, type: "unchanged", content: "" },
        { line: 5, type: "removed", content: "- export const LoginForm = () => {" },
        { line: 6, type: "added", content: "+ export const LoginForm: React.FC = () => {", comments: [
          {
            id: "c1",
            line: 6,
            author: "AI Reviewer",
            content: "Good: Added proper TypeScript typing for the component.",
            timestamp: "2024-01-15T11:00:00Z",
            type: "ai"
          }
        ]},
        { line: 7, type: "unchanged", content: "  const [email, setEmail] = useState('');" },
        { line: 8, type: "added", content: "+ const { login, isLoading } = useAuth();" },
        { line: 9, type: "unchanged", content: "" },
        { line: 10, type: "added", content: "+ const handleSubmit = async (e: React.FormEvent) => {", comments: [
          {
            id: "c2",
            line: 10,
            author: "john-reviewer",
            avatar: "/placeholder.svg",
            content: "Consider adding error handling for the form submission.",
            timestamp: "2024-01-15T11:15:00Z",
            type: "human"
          }
        ]},
        { line: 11, type: "added", content: "+   e.preventDefault();" },
        { line: 12, type: "added", content: "+   await login(email, password);" },
        { line: 13, type: "added", content: "+ };" }
      ]
    },
    {
      filename: "src/hooks/useAuth.ts",
      additions: 67,
      deletions: 0,
      changes: [
        { line: 1, type: "added", content: "+ import { useState, useEffect } from 'react';" },
        { line: 2, type: "added", content: "+ import { supabase } from '@/lib/supabase';" },
        { line: 3, type: "added", content: "+" },
        { line: 4, type: "added", content: "+ export const useAuth = () => {" },
        { line: 5, type: "added", content: "+   const [user, setUser] = useState(null);" },
        { line: 6, type: "added", content: "+   const [isLoading, setIsLoading] = useState(false);" }
      ]
    }
  ];

  const aiReview = {
    summary: "Overall good implementation with proper TypeScript usage and React best practices. Consider adding error handling and loading states.",
    issues: [
      { severity: "medium", message: "Missing error handling in form submission" },
      { severity: "low", message: "Consider memoizing expensive calculations in useAuth hook" }
    ],
    positives: [
      "Proper TypeScript typing throughout",
      "Clean component structure",
      "Good separation of concerns with custom hook"
    ]
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedLine || !selectedFile) return;
    
    // In real app, this would make an API call
    console.log("Adding comment:", { line: selectedLine, file: selectedFile, content: newComment });
    setNewComment("");
    setSelectedLine(null);
    setSelectedFile(null);
  };

  const handleApprove = () => {
    console.log("Approving PR");
  };

  const handleRequestChanges = () => {
    console.log("Requesting changes");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* PR Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <GitPullRequest className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{pullRequest.title}</h1>
              <Badge variant={pullRequest.status === "open" ? "default" : "secondary"}>
                {pullRequest.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{pullRequest.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>#{pullRequest.id}</span>
              <span>by {pullRequest.author}</span>
              <span>{pullRequest.sourceBranch} → {pullRequest.targetBranch}</span>
              <span>+{pullRequest.additions} -{pullRequest.deletions}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRequestChanges}>
              <X className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList>
            <TabsTrigger value="files">Files Changed ({pullRequest.filesChanged})</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="ai-review">AI Review</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            {fileDiffs.map((file, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-mono text-sm">{file.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">+{file.additions}</span>
                      <span className="text-red-600">-{file.deletions}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-96">
                    <div className="font-mono text-xs">
                      {file.changes.map((change, changeIndex) => (
                        <div key={changeIndex}>
                          <div 
                            className={`flex items-start gap-2 px-4 py-1 hover:bg-muted/50 cursor-pointer ${
                              change.type === 'added' ? 'bg-green-50 dark:bg-green-950/20' :
                              change.type === 'removed' ? 'bg-red-50 dark:bg-red-950/20' : ''
                            }`}
                            onClick={() => {
                              setSelectedLine(change.line);
                              setSelectedFile(file.filename);
                            }}
                          >
                            <span className="w-10 text-right text-muted-foreground">
                              {change.line}
                            </span>
                            <span className="w-4">
                              {change.type === 'added' && <Plus className="h-3 w-3 text-green-600" />}
                              {change.type === 'removed' && <Minus className="h-3 w-3 text-red-600" />}
                            </span>
                            <span className="flex-1">{change.content}</span>
                            {change.comments && change.comments.length > 0 && (
                              <MessageSquare className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                          
                          {/* Comments for this line */}
                          {change.comments?.map((comment) => (
                            <div key={comment.id} className="ml-16 px-4 py-2 bg-muted/30 border-l-2 border-blue-500">
                              <div className="flex items-start gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={comment.avatar} />
                                  <AvatarFallback>
                                    {comment.type === 'ai' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{comment.author}</span>
                                    <Badge variant={comment.type === 'ai' ? 'secondary' : 'outline'} className="text-xs">
                                      {comment.type === 'ai' ? 'AI' : 'Human'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(comment.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add comment form */}
                          {selectedLine === change.line && selectedFile === file.filename && (
                            <div className="ml-16 px-4 py-2 bg-muted/20 border-l-2 border-primary">
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleAddComment}>
                                    Add Comment
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedLine(null);
                                    setSelectedFile(null);
                                    setNewComment("");
                                  }}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="conversation">
            <Card>
              <CardHeader>
                <CardTitle>Discussion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>SD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">sarah-dev</span>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm">Ready for review! This implements the authentication flow we discussed in the planning meeting.</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">AI Reviewer</span>
                        <Badge variant="secondary">AI</Badge>
                        <span className="text-sm text-muted-foreground">1 hour ago</span>
                      </div>
                      <p className="text-sm">Automated review completed. Overall score: 85/100. Found 2 medium-priority issues that should be addressed.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-review">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Review Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">{aiReview.summary.includes("good") ? "85" : "65"}/100</div>
                    <div className="flex-1">
                      <p className="text-sm">{aiReview.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Issues Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiReview.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Badge variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "secondary" : "outline"}>
                            {issue.severity}
                          </Badge>
                          <p className="text-sm flex-1">{issue.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <ThumbsUp className="h-4 w-4" />
                      Positives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {aiReview.positives.map((positive, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          <p className="text-sm">{positive}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}