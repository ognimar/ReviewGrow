import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import Billing from "@/pages/billing";
import AdminUsers from "@/pages/admin-users";
import AdminPlans from "@/pages/admin-plans";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import ReviewLanding from "@/pages/review-landing";
import ReviewSuccess from "@/pages/review-success";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, loading } = useAuth();
  
  if (loading) {
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
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/r/:slug" component={ReviewLanding} />
      <Route path="/success" component={ReviewSuccess} />
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={Clients} />}
      </Route>
      <Route path="/campaigns">
        {() => <ProtectedRoute component={Campaigns} />}
      </Route>
      <Route path="/billing">
        {() => <ProtectedRoute component={Billing} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/plans">
        {() => <ProtectedRoute component={AdminPlans} />}
      </Route>
      <Route path="/templates">
        {() => <ProtectedRoute component={Templates} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
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
