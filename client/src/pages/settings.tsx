import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, Unlink, MapPin, Star, ExternalLink, Building2, Bot, Sparkles, Play, MessageSquare, Clock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface AutoReplySettings {
  enabled: boolean;
  minStars: number;
  instructions: string;
}

interface FollowUpMessage {
  enabled: boolean;
  daysAfter: number;
  message: string;
}

interface FollowUpSettings {
  enabled: boolean;
  messages: FollowUpMessage[];
  templateId?: string | null;
}

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

interface GoogleAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GoogleLocation {
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    postalCode?: string;
  };
  metadata?: {
    placeId?: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  message?: string;
  status: string;
  templateId?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<GoogleLocation | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [minStars, setMinStars] = useState(4);
  const [aiInstructions, setAiInstructions] = useState("");
  
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>(
    Array(5).fill(null).map((_, i) => ({
      enabled: false,
      daysAfter: (i + 1) * 3,
      message: '',
    }))
  );
  const [followUpTemplateId, setFollowUpTemplateId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  const sentCampaigns = campaigns?.filter(c => c.status === 'SENT' && c.message) || [];

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    const campaign = sentCampaigns.find(c => c.id === campaignId);
    if (campaign?.message) {
      setFollowUpMessages(prev => prev.map(msg => ({
        ...msg,
        message: campaign.message || '',
      })));
      setFollowUpTemplateId(campaign.templateId || null);
      toast({ title: 'Skopiowano z kampanii', description: `Treść i szablon z "${campaign.name}" zostały załadowane.` });
    }
  };

  useEffect(() => {
    if (location.includes('connected=google')) {
      toast({ title: 'Google account connected! Now select your business location.' });
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
    }
  }, [location]);

  const { data: googleStatus, isLoading } = useQuery<GoogleStatus>({
    queryKey: ['google-status'],
    queryFn: async () => {
      const response = await fetch('/api/google/status', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
  });

  const { data: accounts, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useQuery<{ accounts: GoogleAccount[] }>({
    queryKey: ['google-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/google/accounts', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      return response.json();
    },
    enabled: googleStatus?.connected === true && !googleStatus?.business,
    retry: false,
  });

  const { data: locations, isLoading: locationsLoading } = useQuery<{ locations: GoogleLocation[] }>({
    queryKey: ['google-locations', selectedAccount],
    queryFn: async () => {
      const response = await fetch(`/api/google/locations/${encodeURIComponent(selectedAccount)}`, {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    enabled: !!selectedAccount,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/google/business', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to start auth');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    },
    onError: () => {
      toast({ title: 'Failed to connect Google', variant: 'destructive' });
    },
  });

  const saveLocationMutation = useMutation({
    mutationFn: async (loc: GoogleLocation) => {
      const address = loc.storefrontAddress 
        ? [
            ...(loc.storefrontAddress.addressLines || []),
            loc.storefrontAddress.locality,
            loc.storefrontAddress.postalCode
          ].filter(Boolean).join(', ')
        : 'Address not available';

      const response = await fetch('/api/google/location', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationName: loc.name,
          placeId: loc.metadata?.placeId || '',
          title: loc.title,
          address,
        }),
      });
      if (!response.ok) throw new Error('Failed to save location');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Business location saved!' });
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
    },
    onError: () => {
      toast({ title: 'Failed to save location', variant: 'destructive' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google/disconnect', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Google Business disconnected' });
      setSelectedAccount("");
      setSelectedLocation(null);
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
    },
    onError: () => {
      toast({ title: 'Failed to disconnect', variant: 'destructive' });
    },
  });

  const { data: autoReplySettings, isLoading: autoReplyLoading } = useQuery<AutoReplySettings>({
    queryKey: ['auto-reply-settings'],
    queryFn: async () => {
      const response = await fetch('/api/google/auto-reply/settings', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled: googleStatus?.connected === true && !!googleStatus?.business,
  });

  useEffect(() => {
    if (autoReplySettings) {
      setAutoReplyEnabled(autoReplySettings.enabled);
      setMinStars(autoReplySettings.minStars);
      setAiInstructions(autoReplySettings.instructions);
    }
  }, [autoReplySettings]);

  const { data: followUpSettings, isLoading: followUpLoading } = useQuery<FollowUpSettings>({
    queryKey: ['follow-up-settings'],
    queryFn: async () => {
      const response = await fetch('/api/follow-up/settings', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  useEffect(() => {
    if (followUpSettings) {
      setFollowUpEnabled(followUpSettings.enabled);
      if (followUpSettings.messages?.length) {
        setFollowUpMessages(followUpSettings.messages);
      }
      setFollowUpTemplateId(followUpSettings.templateId || null);
    }
  }, [followUpSettings]);

  const saveFollowUpMutation = useMutation({
    mutationFn: async (settings: FollowUpSettings) => {
      const response = await fetch('/api/follow-up/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Ustawienia follow-up zapisane!' });
      queryClient.invalidateQueries({ queryKey: ['follow-up-settings'] });
    },
    onError: () => {
      toast({ title: 'Nie udało się zapisać ustawień', variant: 'destructive' });
    },
  });

  const processFollowUpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/follow-up/process', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process follow-ups');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sent > 0) {
        toast({ title: `Wysłano ${data.sent} follow-up SMS` });
      } else {
        toast({ title: `Brak klientów do wysłania follow-up (sprawdzono: ${data.eligible})` });
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Nie udało się wysłać follow-up', variant: 'destructive' });
    },
  });

  const updateFollowUpMessage = (index: number, field: keyof FollowUpMessage, value: any) => {
    setFollowUpMessages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const saveAutoReplyMutation = useMutation({
    mutationFn: async (settings: AutoReplySettings) => {
      const response = await fetch('/api/google/auto-reply/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Auto-reply settings saved!' });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-settings'] });
    },
    onError: () => {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    },
  });

  const processReviewsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google/auto-reply/process', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process reviews');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.processed > 0) {
        const successful = data.results.filter((r: any) => r.success).length;
        toast({ title: `Replied to ${successful} of ${data.processed} reviews` });
      } else {
        toast({ title: 'No new reviews to reply to' });
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Failed to process reviews', variant: 'destructive' });
    },
  });

  const formatAddress = (loc: GoogleLocation) => {
    if (!loc.storefrontAddress) return 'No address';
    return [
      ...(loc.storefrontAddress.addressLines || []),
      loc.storefrontAddress.locality,
    ].filter(Boolean).join(', ');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
          <p className="text-muted-foreground">Manage your integrations and account settings.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Business Profile
            </CardTitle>
            <CardDescription>
              Connect your Google Business Profile to collect reviews and display ratings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : googleStatus?.connected && googleStatus.business ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Connected</Badge>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{googleStatus.business.title}</p>
                      <p className="text-sm text-muted-foreground">{googleStatus.business.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm">Review Link for Campaigns</p>
                      <code className="text-xs bg-background px-2 py-1 rounded">{"{{google_link}}"}</code>
                    </div>
                  </div>
                  
                  <a 
                    href={googleStatus.business.reviewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Test Review Link
                  </a>
                </div>

                <Button 
                  variant="destructive" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-google"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            ) : googleStatus?.connected && !googleStatus.business ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-yellow-500">Select Your Business</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Google account connected! Now select your business location to generate review links.
                </p>

                {accountsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading your business accounts...</span>
                  </div>
                ) : accountsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-red-800">
                      {(accountsError as Error).message.includes('Quota exceeded') 
                        ? 'Rate limit reached. Please wait a moment and try again.'
                        : (accountsError as Error).message.includes('API has not been used')
                        ? 'The Google My Business API needs to be enabled. Please enable it in Google Cloud Console and try again.'
                        : (accountsError as Error).message}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchAccounts()}
                      data-testid="button-retry-accounts"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : accounts?.accounts && accounts.accounts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Business Account</label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger data-testid="select-google-account">
                          <SelectValue placeholder="Choose an account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.accounts.map((account) => (
                            <SelectItem key={account.name} value={account.name}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {account.accountName || account.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAccount && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Location</label>
                        {locationsLoading ? (
                          <div className="flex items-center gap-2 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading locations...</span>
                          </div>
                        ) : locations?.locations && locations.locations.length > 0 ? (
                          <div className="space-y-2">
                            {locations.locations.map((loc) => (
                              <div
                                key={loc.name}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedLocation?.name === loc.name 
                                    ? 'border-primary bg-primary/5' 
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => setSelectedLocation(loc)}
                                data-testid={`location-${loc.name}`}
                              >
                                <p className="font-medium">{loc.title}</p>
                                <p className="text-sm text-muted-foreground">{formatAddress(loc)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            No locations found for this account.
                          </p>
                        )}
                      </div>
                    )}

                    {selectedLocation && (
                      <Button 
                        onClick={() => saveLocationMutation.mutate(selectedLocation)}
                        disabled={saveLocationMutation.isPending}
                        data-testid="button-save-location"
                      >
                        {saveLocationMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Use This Location
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      No Google Business accounts found. Make sure your Google account has access to a Google Business Profile.
                    </p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-google"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="mr-2 h-4 w-4" />
                  )}
                  Disconnect & Try Different Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Not Connected</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Connect your Google Business Profile to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Display your business rating on the dashboard</li>
                  <li>View recent customer reviews</li>
                  <li>Generate review request links for campaigns</li>
                </ul>

                <Button 
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  data-testid="button-connect-google"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Connect Google Business
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Auto-Reply Section - Only show when Google Business is connected */}
        {googleStatus?.connected && googleStatus?.business && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Auto-Reply
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </CardTitle>
              <CardDescription>
                Automatically respond to positive Google reviews using AI-generated personalized replies in Polish.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {autoReplyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-reply-toggle">Enable Auto-Reply</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reply to new positive reviews
                      </p>
                    </div>
                    <Switch
                      id="auto-reply-toggle"
                      checked={autoReplyEnabled}
                      onCheckedChange={setAutoReplyEnabled}
                      data-testid="switch-auto-reply"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Minimum Star Rating</Label>
                      <Badge variant="outline" className="font-mono">
                        {minStars}+ stars
                      </Badge>
                    </div>
                    <Slider
                      value={[minStars]}
                      onValueChange={([value]) => setMinStars(value)}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                      data-testid="slider-min-stars"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 star</span>
                      <span>5 stars</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Only reply to reviews with {minStars} or more stars
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-instructions">Custom AI Instructions (optional)</Label>
                    <Textarea
                      id="ai-instructions"
                      placeholder="e.g., Mention our new summer promotion, Sign off with 'Your team at [Business Name]'"
                      value={aiInstructions}
                      onChange={(e) => setAiInstructions(e.target.value)}
                      rows={3}
                      data-testid="textarea-ai-instructions"
                    />
                    <p className="text-sm text-muted-foreground">
                      Add specific instructions for the AI to follow when generating replies.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => saveAutoReplyMutation.mutate({
                        enabled: autoReplyEnabled,
                        minStars,
                        instructions: aiInstructions,
                      })}
                      disabled={saveAutoReplyMutation.isPending}
                      data-testid="button-save-auto-reply"
                    >
                      {saveAutoReplyMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Settings
                    </Button>

                    {autoReplyEnabled && (
                      <Button
                        variant="outline"
                        onClick={() => processReviewsMutation.mutate()}
                        disabled={processReviewsMutation.isPending}
                        data-testid="button-process-reviews"
                      >
                        {processReviewsMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Process Reviews Now
                      </Button>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <p className="font-medium mb-2">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>AI generates personalized replies in Polish (2-4 sentences)</li>
                      <li>Reviews already replied to are skipped</li>
                      <li>Click "Process Reviews Now" to reply to pending reviews</li>
                      <li>Uses your custom instructions if provided</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Automatyczne Follow-up SMS
            </CardTitle>
            <CardDescription>
              Automatycznie wysyłaj przypomnienia do klientów, którzy nie zostawili jeszcze opinii.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {followUpLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="follow-up-toggle">Włącz automatyczne follow-up</Label>
                    <p className="text-sm text-muted-foreground">
                      System automatycznie wyśle przypomnienia w ustawionych terminach
                    </p>
                  </div>
                  <Switch
                    id="follow-up-toggle"
                    checked={followUpEnabled}
                    onCheckedChange={setFollowUpEnabled}
                    data-testid="switch-follow-up"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Konfiguracja wiadomości follow-up (do 5)</Label>
                    {sentCampaigns.length > 0 && (
                      <Select value={selectedCampaignId} onValueChange={handleCampaignSelect}>
                        <SelectTrigger className="w-56 h-8 text-sm" data-testid="select-campaign">
                          <SelectValue placeholder="Kopiuj z kampanii..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sentCampaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  {followUpMessages.map((msg, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={msg.enabled ? "default" : "secondary"}>
                            Follow-up #{index + 1}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>po</span>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={msg.daysAfter}
                              onChange={(e) => updateFollowUpMessage(index, 'daysAfter', parseInt(e.target.value) || 1)}
                              className="w-16 h-8"
                              data-testid={`input-days-${index}`}
                            />
                            <span>dniach</span>
                          </div>
                        </div>
                        <Switch
                          checked={msg.enabled}
                          onCheckedChange={(checked) => updateFollowUpMessage(index, 'enabled', checked)}
                          data-testid={`switch-followup-${index}`}
                        />
                      </div>
                      
                      <Textarea
                        placeholder={`Treść przypomnienia #${index + 1}... Użyj {{name}} i {{google_link}}`}
                        value={msg.message}
                        onChange={(e) => updateFollowUpMessage(index, 'message', e.target.value)}
                        rows={2}
                        disabled={!msg.enabled}
                        className={!msg.enabled ? 'opacity-50' : ''}
                        data-testid={`textarea-followup-${index}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => saveFollowUpMutation.mutate({
                      enabled: followUpEnabled,
                      messages: followUpMessages,
                      templateId: followUpTemplateId,
                    })}
                    disabled={saveFollowUpMutation.isPending}
                    data-testid="button-save-follow-up"
                  >
                    {saveFollowUpMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Zapisz Ustawienia
                  </Button>

                  {followUpEnabled && (
                    <Button
                      variant="outline"
                      onClick={() => processFollowUpMutation.mutate()}
                      disabled={processFollowUpMutation.isPending}
                      data-testid="button-process-follow-ups"
                    >
                      {processFollowUpMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Wyślij Teraz
                    </Button>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Jak to działa:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Follow-up wysyłany jest tylko do klientów ze statusem SENT lub CLICKED</li>
                    <li>Klienci którzy odpowiedzieli (RESPONDED) są pomijani</li>
                    <li>Dni liczone są od daty wysłania pierwszego SMS</li>
                    <li>Użyj {"{{name}}"} i {"{{google_link}}"} w treści wiadomości</li>
                    <li>System sprawdza i wysyła follow-upy co godzinę</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
