import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import AdminUsers from "@/pages/admin-users";
import Templates from "@/pages/templates";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Clients} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/billing" component={Billing} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/templates" component={Templates} />
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
