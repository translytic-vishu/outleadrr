import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AppDashboard from "@/pages/app-dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AppPage from "@/pages/app";
import Campaigns from "@/pages/campaigns";
import Inbox from "@/pages/inbox";
import Templates from "@/pages/templates";
import Leads from "@/pages/leads";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";

/* Redirect logged-in users from "/" to "/dashboard" */
function HomeRoute() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ email: string }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiRequest("GET", "/api/auth/me").then(r => r.ok ? r.json() : Promise.reject()),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && data?.email) {
      setLocation("/dashboard");
    }
  }, [data, isLoading, setLocation]);

  if (isLoading) return null;
  if (data?.email) return null;
  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={AppDashboard} />
      <Route path="/app" component={AppPage} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/templates" component={Templates} />
      <Route path="/leads" component={Leads} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
