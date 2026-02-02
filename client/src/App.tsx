import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Messaging from "@/pages/messaging";
import Billing from "@/pages/billing";
import AdminUsers from "@/pages/admin-users";
import AdminPlans from "@/pages/admin-plans";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import RequestScheduling from "@/pages/request-scheduling";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import ReviewLanding from "@/pages/review-landing";
import ReviewSuccess from "@/pages/review-success";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import CookiePolicy from "@/pages/cookie-policy";

function ProtectedRoute({ component: Component, requiresGoogle = true }: { component: React.ComponentType<any>; requiresGoogle?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const [location] = useLocation();
  
  const { data: googleStatus, isLoading: googleLoading } = useQuery({
    queryKey: ['google-status', user?.uid],
    queryFn: async () => {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/google/status', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!user && requiresGoogle && !isAdmin,
    staleTime: 30000,
  });
  
  if (loading || (requiresGoogle && !isAdmin && googleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (requiresGoogle && !isAdmin && googleStatus && !googleStatus.googleConnected) {
    return <Redirect to="/onboarding" />;
  }
  
  return <Component />;
}

function OnboardingRoute() {
  const { user, loading, isAdmin } = useAuth();
  
  const { data: googleStatus, isLoading: googleLoading } = useQuery({
    queryKey: ['google-status', user?.uid],
    queryFn: async () => {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/google/status', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!user && !isAdmin,
    staleTime: 30000,
  });
  
  if (loading || googleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (isAdmin || googleStatus?.googleConnected) {
    return <Redirect to="/dashboard" />;
  }
  
  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding">
        {() => <OnboardingRoute />}
      </Route>
      <Route path="/r/:slug" component={ReviewLanding} />
      <Route path="/success" component={ReviewSuccess} />
      <Route path="/polityka-prywatnosci" component={PrivacyPolicy} />
      <Route path="/regulamin" component={Terms} />
      <Route path="/polityka-cookies" component={CookiePolicy} />
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={Clients} />}
      </Route>
      <Route path="/messaging">
        {() => <ProtectedRoute component={Messaging} />}
      </Route>
      <Route path="/billing">
        {() => <ProtectedRoute component={Billing} requiresGoogle={false} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} requiresGoogle={false} />}
      </Route>
      <Route path="/admin/plans">
        {() => <ProtectedRoute component={AdminPlans} requiresGoogle={false} />}
      </Route>
      <Route path="/templates">
        {() => <ProtectedRoute component={Templates} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} requiresGoogle={false} />}
      </Route>
      <Route path="/request-scheduling">
        {() => <ProtectedRoute component={RequestScheduling} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
