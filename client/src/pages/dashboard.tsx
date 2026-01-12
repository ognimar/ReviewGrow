import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Send, Mail, MessageSquare, Loader2, Star, ExternalLink, Link2, TrendingUp, Heart, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchClients, fetchCampaigns, fetchFunnelStats } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface GoogleStatus {
  connected: boolean;
  business: {
    title: string;
    address: string;
    placeId: string;
    reviewLink: string;
    connectedAt: string;
  } | null;
}

export default function Dashboard() {
  const { user } = useAuth();

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

  const { data: googleStatus } = useQuery<GoogleStatus>({
    queryKey: ['google-status'],
    queryFn: async () => {
      const response = await fetch('/api/google/status', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
  });

  const { data: funnelStats } = useQuery({
    queryKey: ['funnel-stats'],
    queryFn: fetchFunnelStats,
  });

  const hasSubscription = stats?.hasSubscription || false;
  const requestLimit = stats?.requestLimit || 0;
  const requestsUsed = stats?.requestsUsed || 0;
  const requestsRemaining = stats?.requestsRemaining || 0;

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
            <Card data-testid="card-requests-remaining">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests Remaining</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {hasSubscription ? (
                  <>
                    <div className="text-2xl font-bold">{requestsRemaining}</div>
                    <p className="text-xs text-muted-foreground">{requestsUsed} used of {requestLimit}</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-muted-foreground">0</div>
                    <p className="text-xs text-muted-foreground">No active subscription</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card data-testid="card-subscription-status">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {hasSubscription ? (
                  <>
                    <div className="text-2xl font-bold capitalize">{stats?.planId}</div>
                    <p className="text-xs text-muted-foreground">Active plan</p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-amber-600">No plan</div>
                    <Link href="/billing">
                      <p className="text-xs text-primary hover:underline cursor-pointer">Choose a plan →</p>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Funnel Stats */}
        {funnelStats && funnelStats.total > 0 && (
          <Card className="mb-4" data-testid="card-funnel-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Review Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5 mb-4">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold">{funnelStats.new}</div>
                  <div className="text-xs text-muted-foreground">Nowi</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{funnelStats.sent}</div>
                  <div className="text-xs text-muted-foreground">Wysłano</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">{funnelStats.clicked}</div>
                  <div className="text-xs text-muted-foreground">Kliknęli</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50">
                  <div className="text-2xl font-bold text-orange-600">{funnelStats.pendingReview}</div>
                  <div className="text-xs text-muted-foreground">Oczekują</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{funnelStats.responded}</div>
                  <div className="text-xs text-muted-foreground">Odpowiedzieli</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Konwersja</span>
                    <span className="font-medium">{funnelStats.conversionRate}%</span>
                  </div>
                  <Progress value={funnelStats.conversionRate} className="h-2" />
                </div>
              </div>

              {funnelStats.savedCustomers > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <Heart className="h-5 w-5 text-rose-500" />
                  <div>
                    <span className="font-medium text-rose-700">{funnelStats.savedCustomers} uratowanych klientów</span>
                    <p className="text-xs text-rose-600">Zgłosili problem zamiast zostawić negatywną opinię publiczną</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Business Card */}
          <Card data-testid="card-google-business">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Business
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {googleStatus?.connected && googleStatus.business ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500 text-xs">Connected</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{googleStatus.business.title}</p>
                  <a 
                    href={googleStatus.business.reviewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Review Link
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">Not Connected</Badge>
                  <p className="text-xs text-muted-foreground">Connect to collect reviews</p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-connect-google-dashboard">
                      <Link2 className="mr-1 h-3 w-3" />
                      Connect
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${googleStatus?.connected ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                  <div>
                    <p className="font-medium">Connect Google Business</p>
                    <p className="text-sm text-muted-foreground">Get review links for campaigns</p>
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
