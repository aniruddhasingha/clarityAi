import { DashboardLayout } from "@/components/DashboardLayout";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your CodePilot preferences
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Settings panel coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;