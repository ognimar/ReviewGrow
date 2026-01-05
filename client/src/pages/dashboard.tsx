import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Send, Mail, MessageSquare, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchClients, fetchCampaigns } from "@/lib/api";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  });

  const smsQuota = 500;
  const emailQuota = 2000;
  const smsUsed = smsQuota - (stats?.smsLeft || 0);
  const emailsUsed = emailQuota - (stats?.emailsLeft || 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900" data-testid="text-page-title">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your campaigns and client engagement.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/campaigns">
              <Button data-testid="button-new-campaign">
                <Send className="mr-2 h-4 w-4" /> New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-total-clients">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
                <p className="text-xs text-muted-foreground">In your contact list</p>
              </CardContent>
            </Card>
            <Card data-testid="card-campaigns">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">Total campaigns created</p>
              </CardContent>
            </Card>
            <Card data-testid="card-sms-remaining">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SMS Remaining</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.smsLeft || 0}</div>
                <p className="text-xs text-muted-foreground">{smsUsed} used of {smsQuota}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-emails-remaining">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Remaining</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.emailsLeft || 0}</div>
                <p className="text-xs text-muted-foreground">{emailsUsed} used of {emailQuota}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/clients">
                <Button variant="outline" className="w-full justify-start" data-testid="button-import-clients">
                  <Users className="mr-2 h-4 w-4" /> Import Clients
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" className="w-full justify-start" data-testid="button-create-template">
                  <MessageSquare className="mr-2 h-4 w-4" /> Create Template
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="w-full justify-start" data-testid="button-start-campaign">
                  <Send className="mr-2 h-4 w-4" /> Start Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${clients.length > 0 ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  <div>
                    <p className="font-medium">Import your clients</p>
                    <p className="text-sm text-muted-foreground">Upload a CSV with name, phone, and email</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Create a template</p>
                    <p className="text-sm text-muted-foreground">Design personalized images with dynamic text</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Launch your campaign</p>
                    <p className="text-sm text-muted-foreground">Send SMS or email to your clients</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
