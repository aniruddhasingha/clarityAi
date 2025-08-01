import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PullRequests from "./pages/PullRequests";
import PullRequestReview from "./pages/PullRequestReview";
import Repositories from "./pages/Repositories";
import Settings from "./pages/Settings";
import RepositorySettings from "./pages/RepositorySettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pull-requests" element={<PullRequests />} />
          <Route path="/pull-requests/:id" element={<PullRequestReview />} />
          <Route path="/repositories" element={<Repositories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/repository/:repoName/settings" element={<RepositorySettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
