import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

interface RepositorySettingsData {
  customInstructions: string;
  jiraProjectKey: string;
  jiraEnabled: boolean;
}

export default function RepositorySettings() {
  const { repoName } = useParams<{ repoName: string }>();
  const [customInstructions, setCustomInstructions] = useState("");
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraEnabled, setJiraEnabled] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (repoName) {
      const storageKey = `repo-settings-${repoName}`;
      const savedSettings = localStorage.getItem(storageKey);

      if (savedSettings) {
        try {
          const settings: RepositorySettingsData = JSON.parse(savedSettings);
          setCustomInstructions(settings.customInstructions || "");
          setJiraProjectKey(settings.jiraProjectKey || "");
          setJiraEnabled(settings.jiraEnabled || false);
        } catch (error) {
          console.error("Failed to load repository settings:", error);
          toast.error("Failed to load saved settings");
        }
      }
    }
  }, [repoName]);

  const handleSave = () => {
    if (!repoName) {
      toast.error("Repository name is missing");
      return;
    }

    try {
      const settings: RepositorySettingsData = {
        customInstructions,
        jiraProjectKey,
        jiraEnabled,
      };

      const storageKey = `repo-settings-${repoName}`;
      localStorage.setItem(storageKey, JSON.stringify(settings));

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save repository settings:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Repository Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{repoName || "Repository"}</h1>
            <p className="text-muted-foreground">Repository Settings</p>
          </div>
        </div>

        {/* General Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">General Settings</CardTitle>
            <CardDescription>
              Configure general repository review settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-instructions" className="text-sm font-medium">
                Custom Review Instructions
              </Label>
              <Textarea
                id="custom-instructions"
                placeholder="e.g., Ensure all functions are pure. No console logs in production code."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[120px] resize-y bg-muted/30 border-border focus:border-primary"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be included in every code review for this repository.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Integrations</CardTitle>
            <CardDescription>
              Connect external tools and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Jira Integration Card */}
            <Card className="bg-muted/20 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">J</span>
                  </div>
                  Jira Integration
                </CardTitle>
                <CardDescription>
                  Connect your Jira project to enhance code reviews with ticket context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-project-key" className="text-sm font-medium">
                    Jira Project Key
                  </Label>
                  <Input
                    id="jira-project-key"
                    placeholder="e.g., ACME"
                    value={jiraProjectKey}
                    onChange={(e) => setJiraProjectKey(e.target.value)}
                    className="bg-background border-border focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Jira project key to link tickets with pull requests
                  </p>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="jira-context" className="text-sm font-medium">
                      Enable Jira Context for Reviews
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Include Jira ticket details in code reviews
                    </p>
                  </div>
                  <Switch
                    id="jira-context"
                    checked={jiraEnabled}
                    onCheckedChange={setJiraEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}