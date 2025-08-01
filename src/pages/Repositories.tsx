import { DashboardLayout } from "@/components/DashboardLayout";

const Repositories = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
          <p className="text-muted-foreground mt-2">
            Manage your connected repositories
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Repository management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Repositories;