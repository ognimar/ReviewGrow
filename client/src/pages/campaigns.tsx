import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, MessageSquare, Loader2, Megaphone, Send, Eye, CheckCircle, Image } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCampaigns, fetchClients, fetchTemplates, createCampaign } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  message?: string;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  imageUrl: string;
  textX: number;
  textY: number;
  fontSize: number;
  fontColor: string;
}

export default function Campaigns() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      toast({ title: 'Campaign created successfully' });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create campaign', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user) throw new Error('Not authenticated');
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send');
      }
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      toast({ 
        title: 'Campaign sent!', 
        description: `Sent to ${data.sentCount} recipients` 
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (viewingCampaign?.id === campaignId) {
        setViewingCampaign({
          ...viewingCampaign,
          status: 'sent',
          sentAt: new Date().toISOString(),
          sentCount: data.sentCount,
          failedCount: data.failedCount,
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to send campaign', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const resetForm = () => {
    setCampaignName("");
    setCampaignType("");
    setMessage("");
    setSelectedTemplate("");
  };

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast({ title: 'Please enter a campaign name', variant: 'destructive' });
      return;
    }
    if (!campaignType) {
      toast({ title: 'Please select a campaign type', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }
    if (clients.length === 0) {
      toast({ title: 'No clients available', description: 'Import clients first before creating a campaign', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      name: campaignName,
      type: campaignType,
      message,
      templateId: selectedTemplate && selectedTemplate !== "none" ? selectedTemplate : null,
      scheduled: null,
    });
  };

  const handleSendCampaign = (campaignId: string) => {
    sendMutation.mutate(campaignId);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'sent': return 'default';
      case 'scheduled': return 'secondary';
      case 'sending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">Campaigns</h1>
            <p className="text-muted-foreground">Create and manage your SMS and Email campaigns.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-campaign">
                <Plus className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Set up a new SMS or Email campaign to send to your clients.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input 
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Winter Sale Promotion"
                    data-testid="input-campaign-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger data-testid="select-campaign-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Wybierz szablon graficzny (Opcjonalne)
                    </Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger data-testid="select-template">
                        <SelectValue placeholder="Wybierz szablon..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Brak szablonu</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedTemplate && selectedTemplate !== "none" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Podgląd szablonu:</p>
                        {(() => {
                          const template = templates.find(t => t.id === selectedTemplate);
                          const firstClient = clients[0];
                          if (!template) return null;
                          return (
                            <div className="bg-muted/50 rounded-lg p-2">
                              <div className="relative inline-block w-full">
                                <img 
                                  src={template.imageUrl} 
                                  alt={template.name}
                                  className="w-full h-auto rounded"
                                />
                                {firstClient && (
                                  <div 
                                    className="absolute font-bold pointer-events-none"
                                    style={{ 
                                      left: `${template.textX}%`,
                                      top: `${template.textY}%`,
                                      transform: 'translate(-50%, -50%)',
                                      color: template.fontColor,
                                      fontSize: `${Math.min(template.fontSize, 32)}px`,
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                    }}
                                  >
                                    {firstClient.name}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-center text-muted-foreground mt-2">
                                Przykład dla: {firstClient?.name || 'Pierwszy kontakt'}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Treść wiadomości</Label>
                  <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={campaignType === 'sms' 
                      ? "Cześć {{name}}, sprawdź naszą ofertę! {{google_link}}" 
                      : "Drogi {{name}},\n\nMamy dla Ciebie świetną wiadomość..."}
                    rows={4}
                    data-testid="input-message"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><code className="bg-muted px-1 rounded">{"{{name}}"}</code> - imię klienta</p>
                    <p><code className="bg-muted px-1 rounded">{"{{google_link}}"}</code> - link do opinii Google</p>
                    {selectedTemplate && selectedTemplate !== "none" && (
                      <p><code className="bg-muted px-1 rounded">{"{{image}}"}</code> - spersonalizowane zdjęcie</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Recipients:</strong> {clients.length} clients
                  </p>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleCreateCampaign}
                  disabled={createMutation.isPending}
                  data-testid="button-submit-campaign"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first campaign to start engaging with clients.</p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-campaign">
              <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant={getStatusVariant(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    {campaign.type === 'sms' ? (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="mt-2">{campaign.name}</CardTitle>
                  <CardDescription>
                    Created on {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Type</span>
                    <span className="font-medium text-foreground capitalize">{campaign.type}</span>
                  </div>
                  {campaign.status === 'sent' && (
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Sent</span>
                      <span className="font-medium text-foreground">{campaign.sentCount || 0}</span>
                    </div>
                  )}
                  {campaign.message && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {campaign.message}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  {campaign.status === 'draft' && (
                    <Button 
                      className="flex-1" 
                      onClick={() => handleSendCampaign(campaign.id)}
                      disabled={sendMutation.isPending}
                      data-testid={`button-send-campaign-${campaign.id}`}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Now
                    </Button>
                  )}
                  {campaign.status === 'sent' && (
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => handleSendCampaign(campaign.id)}
                      disabled={sendMutation.isPending}
                      data-testid={`button-resend-campaign-${campaign.id}`}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Resend
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setViewingCampaign(campaign)}
                    data-testid={`button-view-campaign-${campaign.id}`}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewingCampaign} onOpenChange={(open) => !open && setViewingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingCampaign?.name}</DialogTitle>
            <DialogDescription>
              Campaign details and statistics
            </DialogDescription>
          </DialogHeader>
          {viewingCampaign && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(viewingCampaign.status)}>
                  {viewingCampaign.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {viewingCampaign.type}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Message</Label>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{viewingCampaign.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(viewingCampaign.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {viewingCampaign.sentAt && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Sent</p>
                    <p className="text-sm font-medium">
                      {format(new Date(viewingCampaign.sentAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                )}
              </div>

              {viewingCampaign.status === 'sent' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-700">{viewingCampaign.sentCount || 0}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{viewingCampaign.failedCount || 0}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
