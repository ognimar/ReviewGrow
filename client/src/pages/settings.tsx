import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link2, Unlink, MapPin, Star, ExternalLink, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

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

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [manualPlaceId, setManualPlaceId] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (location.includes('connected=google')) {
      toast({ title: 'Google account connected! Now enter your business details.' });
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
    mutationFn: async ({ placeId, title }: { placeId: string; title: string }) => {
      const response = await fetch('/api/google/location', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationName: 'manual',
          placeId,
          title,
          address: 'Entered manually',
        }),
      });
      if (!response.ok) throw new Error('Failed to save location');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Business location saved!' });
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
      setManualPlaceId("");
      setManualTitle("");
      setShowManualEntry(false);
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
      queryClient.invalidateQueries({ queryKey: ['google-status'] });
    },
    onError: () => {
      toast({ title: 'Failed to disconnect', variant: 'destructive' });
    },
  });

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
                  <Badge variant="default" className="bg-yellow-500">Enter Business Details</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Google account connected! Enter your business Place ID to generate review links.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-blue-800">How to find your Place ID:</p>
                  <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a></li>
                    <li>Search for your business name "BeePromoted"</li>
                    <li>Click on your business in the results</li>
                    <li>Copy the Place ID (starts with "ChIJ...")</li>
                  </ol>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input 
                      id="businessName"
                      placeholder="e.g., BeePromoted"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      data-testid="input-business-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="placeId">Google Place ID</Label>
                    <Input 
                      id="placeId"
                      placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                      value={manualPlaceId}
                      onChange={(e) => setManualPlaceId(e.target.value)}
                      data-testid="input-place-id"
                    />
                  </div>

                  <Button 
                    onClick={() => saveLocationMutation.mutate({ placeId: manualPlaceId, title: manualTitle })}
                    disabled={saveLocationMutation.isPending || !manualPlaceId || !manualTitle}
                    data-testid="button-save-location"
                  >
                    {saveLocationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                    Save Business
                  </Button>
                </div>

                <div className="pt-4 border-t">
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

                {!showManualEntry ? (
                  <div className="space-y-3">
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
                    
                    <div className="text-center">
                      <button 
                        onClick={() => setShowManualEntry(true)}
                        className="text-sm text-muted-foreground hover:text-primary underline"
                      >
                        Or enter Place ID manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-blue-800">How to find your Place ID:</p>
                      <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                        <li>Go to <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a></li>
                        <li>Search for your business name</li>
                        <li>Click on your business in the results</li>
                        <li>Copy the Place ID</li>
                      </ol>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessNameManual">Business Name</Label>
                      <Input 
                        id="businessNameManual"
                        placeholder="e.g., BeePromoted"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        data-testid="input-business-name-manual"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="placeIdManual">Google Place ID</Label>
                      <Input 
                        id="placeIdManual"
                        placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                        value={manualPlaceId}
                        onChange={(e) => setManualPlaceId(e.target.value)}
                        data-testid="input-place-id-manual"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => saveLocationMutation.mutate({ placeId: manualPlaceId, title: manualTitle })}
                        disabled={saveLocationMutation.isPending || !manualPlaceId || !manualTitle}
                        data-testid="button-save-location-manual"
                      >
                        {saveLocationMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="mr-2 h-4 w-4" />
                        )}
                        Save Business
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowManualEntry(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
