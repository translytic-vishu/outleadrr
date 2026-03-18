import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingModal } from "@/components/OnboardingModal";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AppDashboard from "@/pages/app-dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import AppPage from "@/pages/app";
import Inbox from "@/pages/inbox";
import Templates from "@/pages/templates";
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
      <Route path="/inbox" component={Inbox} />
      <Route path="/templates" component={Templates} />
      <Route path="/settings" component={Settings} />
      {/* Legacy routes — redirect to dashboard */}
      <Route path="/campaigns" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
      <Route path="/leads" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
      <Route path="/analytics" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
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
        <OnboardingModal />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
