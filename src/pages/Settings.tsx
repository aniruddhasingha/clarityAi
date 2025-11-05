import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, User, Bell, Shield, Github, GitBranch, Zap, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { isConnected, simulateOAuthConnect, disconnectOAuth, OAuthProvider } from "@/services/oauth";

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  emailNotifications: boolean;
  reviewReminders: boolean;
  autoApproval: boolean;
}

const Settings = () => {
  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reviewReminders, setReviewReminders] = useState(false);
  const [autoApproval, setAutoApproval] = useState(false);

  // OAuth connection states (derived from OAuth service)
  const [githubConnected, setGithubConnected] = useState(false);
  const [bitbucketConnected, setBitbucketConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);

  // Check OAuth connection status on mount
  useEffect(() => {
    setGithubConnected(isConnected("github"));
    setBitbucketConnected(isConnected("bitbucket"));
    setJiraConnected(isConnected("jira"));

    // Load other settings from localStorage
    const savedSettings = localStorage.getItem("user-settings");
    if (savedSettings) {
      try {
        const settings: UserSettings = JSON.parse(savedSettings);
        setFirstName(settings.firstName || "");
        setLastName(settings.lastName || "");
        setEmail(settings.email || "");
        setEmailNotifications(settings.emailNotifications ?? true);
        setReviewReminders(settings.reviewReminders ?? false);
        setAutoApproval(settings.autoApproval ?? false);
      } catch (error) {
        console.error("Failed to load user settings:", error);
        toast.error("Failed to load saved settings");
      }
    }
  }, []);

  const handleSave = () => {
    try {
      const settings: UserSettings = {
        firstName,
        lastName,
        email,
        emailNotifications,
        reviewReminders,
        autoApproval,
      };

      localStorage.setItem("user-settings", JSON.stringify(settings));
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save user settings:", error);
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleOAuthConnect = async (providerName: string) => {
    const provider = providerName.toLowerCase() as OAuthProvider;

    try {
      // Show info toast about OAuth simulation
      toast.info(`Connecting to ${providerName}...`, {
        description: "Demo mode: Simulating OAuth flow"
      });

      // Simulate OAuth connection
      // In production, replace with: initiateOAuth(provider, true)
      simulateOAuthConnect(provider);

      // Update connection state
      if (provider === "github") {
        setGithubConnected(true);
      } else if (provider === "bitbucket") {
        setBitbucketConnected(true);
      } else if (provider === "jira") {
        setJiraConnected(true);
      }

      toast.success(`Successfully connected to ${providerName}!`);
    } catch (error) {
      console.error(`Failed to connect to ${providerName}:`, error);
      toast.error(`Failed to connect to ${providerName}`);
    }
  };

  const handleOAuthDisconnect = async (providerName: string) => {
    const provider = providerName.toLowerCase() as OAuthProvider;

    try {
      await disconnectOAuth(provider);

      // Update connection state
      if (provider === "github") {
        setGithubConnected(false);
      } else if (provider === "bitbucket") {
        setBitbucketConnected(false);
      } else if (provider === "jira") {
        setJiraConnected(false);
      }

      toast.success(`Disconnected from ${providerName}`);
    } catch (error) {
      console.error(`Failed to disconnect from ${providerName}:`, error);
      toast.error(`Failed to disconnect from ${providerName}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your ClarityAI preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@acme-corp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how you receive notifications about code reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for new reviews and comments
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Review Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about pending code reviews
                </p>
              </div>
              <Switch
                checked={reviewReminders}
                onCheckedChange={setReviewReminders}
              />
            </div>
          </CardContent>
        </Card>

        {/* OAuth Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Connect your development tools for automated code reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GitHub Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Github className="h-8 w-8" />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">GitHub</Label>
                    <Badge variant={githubConnected ? "default" : "secondary"}>
                      {githubConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access your repositories and create PR comments
                  </p>
                </div>
              </div>
              <Button
                variant={githubConnected ? "outline" : "default"}
                onClick={() => githubConnected ? handleOAuthDisconnect("GitHub") : handleOAuthConnect("GitHub")}
              >
                {githubConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>

            {/* Bitbucket Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <GitBranch className="h-8 w-8" />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Bitbucket</Label>
                    <Badge variant={bitbucketConnected ? "default" : "secondary"}>
                      {bitbucketConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access your repositories and create PR comments
                  </p>
                </div>
              </div>
              <Button
                variant={bitbucketConnected ? "outline" : "default"}
                onClick={() => bitbucketConnected ? handleOAuthDisconnect("Bitbucket") : handleOAuthConnect("Bitbucket")}
              >
                {bitbucketConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>

            {/* Jira Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8" />
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Jira</Label>
                    <Badge variant={jiraConnected ? "default" : "secondary"}>
                      {jiraConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access ticket information for context-aware reviews
                  </p>
                </div>
              </div>
              <Button
                variant={jiraConnected ? "outline" : "default"}
                onClick={() => jiraConnected ? handleOAuthDisconnect("Jira") : handleOAuthConnect("Jira")}
              >
                {jiraConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Automation
            </CardTitle>
            <CardDescription>
              Configure security and automation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve Minor Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve PRs with only formatting or minor fixes
                </p>
              </div>
              <Switch
                checked={autoApproval}
                onCheckedChange={setAutoApproval}
              />
            </div>
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
};

export default Settings;