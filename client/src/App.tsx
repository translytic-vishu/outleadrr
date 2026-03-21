import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.14, ease: "easeIn" } },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/" component={() => <PageWrapper><HomeRoute /></PageWrapper>} />
        <Route path="/login" component={() => <PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" component={() => <PageWrapper><Signup /></PageWrapper>} />
        <Route path="/dashboard" component={() => <PageWrapper><AppDashboard /></PageWrapper>} />
        <Route path="/app" component={() => <PageWrapper><AppPage /></PageWrapper>} />
        <Route path="/inbox" component={() => <PageWrapper><Inbox /></PageWrapper>} />
        <Route path="/templates" component={() => <PageWrapper><Templates /></PageWrapper>} />
        <Route path="/settings" component={() => <PageWrapper><Settings /></PageWrapper>} />
        <Route path="/campaigns" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
        <Route path="/leads" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
        <Route path="/analytics" component={() => { const [,s]=useLocation(); useEffect(()=>s("/dashboard"),[s]); return null; }} />
        <Route component={() => <PageWrapper><NotFound /></PageWrapper>} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" } }} />
        <Router />
        <OnboardingModal />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
