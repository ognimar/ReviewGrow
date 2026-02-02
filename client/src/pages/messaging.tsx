import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, MessageSquare, Send, Clock, CheckCircle2, Bell, RefreshCw, Loader2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClients } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  status?: string;
}

interface UserData {
  subscription?: {
    requestLimit?: number;
    requestsUsed?: number;
  };
  googleBusiness?: {
    title?: string;
  };
  followUpSettings?: {
    enabled?: boolean;
  };
}

const SMART_MESSAGES = {
  thanks: {
    label: "Podziękowanie",
    message: "Cześć {{first_name}}! Dziękujemy za skorzystanie z usług {{business_name}}. Czy mógłbyś poświęcić chwilę na wystawienie opinii? {{review_link}}"
  },
  bonus: {
    label: "Bonus",
    message: "Hej {{first_name}}! W podziękowaniu za Twoje zaufanie, przygotowaliśmy dla Ciebie niespodziankę. Zostaw nam opinię tutaj: {{review_link}}"
  },
  reminder: {
    label: "Przypomnienie",
    message: "Cześć {{first_name}}, czy pamiętasz o zostawieniu opinii? Twoja opinia jest dla nas bardzo ważna! {{review_link}}"
  },
  experience: {
    label: "Doświadczenie",
    message: "{{first_name}}, mamy nadzieję, że Twoje doświadczenie z {{business_name}} było pozytywne! Podziel się opinią: {{review_link}}"
  }
};

export default function Messaging() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [messageMode, setMessageMode] = useState<'smart' | 'custom'>('smart');
  const [smartCategory, setSmartCategory] = useState<string>('thanks');
  const [customMessage, setCustomMessage] = useState("Hej {{first_name}}, mamy nadzieję, że podobało Ci się doświadczenie z {{business_name}}! Czy mógłbyś zostawić opinię?");

  const handleCustomMessageChange = (newValue: string) => {
    setCustomMessage(newValue);
    if (!newValue.includes('{{review_link}}')) {
      setCustomMessage(newValue + ' {{review_link}}');
    }
  };
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: userData } = useQuery<UserData>({
    queryKey: ['user-data'],
    queryFn: async () => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }),
      });
      const data = await res.json();
      return data.user;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userData?.googleBusiness?.title) {
      setBusinessName(userData.googleBusiness.title);
    }
  }, [userData]);

  const activeClients = clients.filter(c => c.status !== 'RESPONDED' && c.phone);
  const creditsRemaining = (userData?.subscription?.requestLimit || 0) - (userData?.subscription?.requestsUsed || 0);
  const campaignCost = activeClients.length;
  const followUpsEnabled = userData?.followUpSettings?.enabled ?? true;

  const getCurrentMessage = () => {
    if (messageMode === 'smart') {
      return SMART_MESSAGES[smartCategory as keyof typeof SMART_MESSAGES]?.message || '';
    }
    return customMessage;
  };

  const getPreviewMessage = () => {
    let msg = getCurrentMessage();
    msg = msg.replace(/\{\{first_name\}\}/g, 'Jan');
    msg = msg.replace(/\{\{name\}\}/g, 'Jan Kowalski');
    msg = msg.replace(/\{\{business_name\}\}/g, businessName || 'Twoja Firma');
    msg = msg.replace(/\{\{review_link\}\}/g, '');
    return msg;
  };

  const hasReviewLink = getCurrentMessage().includes('{{review_link}}');
  const canSend = activeClients.length > 0 && creditsRemaining >= campaignCost && hasReviewLink;

  const handleSendCampaign = async () => {
    if (!canSend || !user) return;
    
    setIsSending(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: getCurrentMessage(),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send campaign');
      }
      
      const result = await response.json();
      toast({ 
        title: 'Kampania wysłana!', 
        description: `Wysłano do ${result.sentCount} klientów.` 
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
    } catch (error: any) {
      toast({ 
        title: 'Błąd wysyłania', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const insertTag = (tag: string) => {
    setCustomMessage(prev => prev + `{{${tag}}}`);
  };

  const maxChars = 320;
  const charsRemaining = maxChars - customMessage.length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Nowa Kampania</h1>
          <p className="text-gray-600" data-testid="text-recipient-info">
            Twoja kampania zostanie wysłana do wszystkich aktywnych klientów ({activeClients.length} osób), z pominięciem osób, które już wystawiły opinię.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Configuration (60%) */}
          <div className="lg:w-[60%] space-y-6">
            {/* Message Mode Toggle */}
            <div className="bg-white rounded-xl border p-1 inline-flex" data-testid="toggle-message-mode">
              <button
                onClick={() => setMessageMode('smart')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  messageMode === 'smart' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid="button-smart-message"
              >
                <Sparkles className="w-4 h-4" />
                Smart Message
              </button>
              <button
                onClick={() => setMessageMode('custom')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  messageMode === 'custom' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid="button-custom-message"
              >
                <MessageSquare className="w-4 h-4" />
                Custom Message
              </button>
            </div>

            {/* Smart Message Content */}
            {messageMode === 'smart' && (
              <div className="bg-white rounded-xl border p-6 space-y-4" data-testid="panel-smart-message">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">Smart Messaging</h3>
                  </div>
                  <p className="text-sm text-gray-600">Zoptymalizowane wiadomości, które zwiększają współczynnik odpowiedzi.</p>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Najskuteczniejsze wiadomości</span>
                  </div>
                  <p className="text-sm text-emerald-700">Testujemy różne warianty wiadomości, aby znaleźć te, które działają najlepiej.</p>
                  <ul className="mt-3 space-y-1 text-sm text-emerald-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Automatycznie testowane style wiadomości
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Uczymy się, jaki ton odpowiada Twoim klientom
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" /> Ciągle optymalizowane dla wyższych wyników
                    </li>
                  </ul>
                </div>

                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Wybierz szablon</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(SMART_MESSAGES).map(([key, { label }]) => (
                      <button
                        key={key}
                        onClick={() => setSmartCategory(key)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          smartCategory === key
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        data-testid={`button-template-${key}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Message Content */}
            {messageMode === 'custom' && (
              <div className="bg-white rounded-xl border p-6 space-y-4" data-testid="panel-custom-message">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Custom Message</h3>
                  <p className="text-sm text-gray-600">Napisz własny szablon wiadomości</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => insertTag('first_name')}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    data-testid="button-tag-first-name"
                  >
                    First Name
                  </button>
                  <button
                    onClick={() => insertTag('review_link')}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 bg-orange-50 border-orange-200 text-orange-700"
                    data-testid="button-tag-review-link"
                  >
                    Review Link <span className="text-xs text-orange-500">Required</span>
                  </button>
                  <button
                    onClick={() => insertTag('business_name')}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    data-testid="button-tag-business-name"
                  >
                    Business Name
                  </button>
                </div>
                
                <Textarea
                  value={customMessage}
                  onChange={(e) => handleCustomMessageChange(e.target.value)}
                  placeholder="Hej {{first_name}}, mamy nadzieję, że podobało Ci się doświadczenie z {{business_name}}! Czy mógłbyś zostawić opinię?"
                  className="min-h-[120px] resize-none"
                  maxLength={maxChars}
                  data-testid="textarea-custom-message"
                />
                
                <div className="flex justify-between items-center text-sm">
                  <span className={charsRemaining < 50 ? 'text-orange-600' : 'text-gray-500'} data-testid="text-chars-remaining">
                    {charsRemaining} znaków pozostało
                  </span>
                  {!hasReviewLink && (
                    <span className="text-red-500 text-xs" data-testid="text-review-link-required">
                      Wymagany tag {'{{review_link}}'}
                    </span>
                  )}
                </div>

                <Button 
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-0"
                  variant="outline"
                  data-testid="button-save-message"
                >
                  Zapisz wiadomość
                </Button>
              </div>
            )}

            {/* Business Info */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700">Imię właściciela</Label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Bartosz"
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="input-owner-name"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Nazwa firmy</Label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Review Grow"
                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="input-business-name"
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-0"
                variant="outline"
                data-testid="button-update-business"
              >
                Aktualizuj
              </Button>
            </div>

            {/* Send Campaign Section */}
            <div className="bg-white rounded-xl border p-6" data-testid="panel-send-campaign">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Odbiorcy kampanii</p>
                  <p className="text-sm text-gray-500" data-testid="text-active-clients">
                    {activeClients.length} aktywnych klientów (bez odpowiadających)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-t border-b mb-4">
                <span className="text-gray-700">Koszt kampanii:</span>
                <span className="font-semibold text-lg" data-testid="text-campaign-cost">{campaignCost} kredytów</span>
              </div>
              
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-500">Dostępne kredyty:</span>
                <span className={creditsRemaining < campaignCost ? 'text-red-500' : 'text-emerald-600'} data-testid="text-credits-remaining">
                  {creditsRemaining}
                </span>
              </div>
              
              <Button 
                onClick={handleSendCampaign}
                disabled={!canSend || isSending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                data-testid="button-send-campaign"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Wyślij kampanię teraz
                  </>
                )}
              </Button>
              
              {!hasReviewLink && messageMode === 'custom' && (
                <p className="text-center text-sm text-red-500 mt-2" data-testid="text-add-review-link">
                  Dodaj tag {'{{review_link}}'} do wiadomości
                </p>
              )}
            </div>

            {/* Follow-up Section */}
            <div className="bg-white rounded-xl border p-6" data-testid="panel-followup">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Follow-ups {followUpsEnabled ? 'Włączone' : 'Wyłączone'}</h3>
                    <p className="text-sm text-gray-500">Zmień w Ustawieniach aby włączyć/wyłączyć przypomnienia</p>
                  </div>
                </div>
                <Switch 
                  checked={followUpsEnabled} 
                  disabled
                  className="data-[state=checked]:bg-emerald-600"
                  data-testid="switch-followups"
                />
              </div>
              
              {followUpsEnabled && (
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-800">42% opinii pochodzi z follow-upów</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Będziemy wysyłać delikatne przypomnienia do klientów, którzy jeszcze nie zostawili opinii.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Phone Preview (40%) */}
          <div className="lg:w-[40%]">
            <div className="sticky top-8">
              {/* iPhone Mockup */}
              <div className="relative mx-auto" style={{ width: '280px' }} data-testid="phone-mockup">
                <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-gray-900 rounded-[32px] overflow-hidden">
                    {/* Notch */}
                    <div className="bg-gray-900 h-7 flex items-center justify-center">
                      <div className="w-20 h-5 bg-black rounded-full"></div>
                    </div>
                    {/* Screen */}
                    <div className="bg-gray-100 min-h-[480px] p-4">
                      {/* Time */}
                      <div className="text-center text-xs text-gray-500 mb-4">9:41</div>
                      
                      {/* Message Bubble */}
                      <div className="space-y-2">
                        <div className="bg-emerald-600 text-white rounded-2xl rounded-bl-md p-4 max-w-[90%] shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-message-preview">
                            {getPreviewMessage()}
                            {hasReviewLink && (
                              <span className="text-emerald-200 underline block mt-1">
                                reviewharvest.pl/u/test-link
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400 ml-2">9:41 AM</div>
                      </div>
                      
                      {/* Follow-up preview */}
                      {followUpsEnabled && (
                        <div className="mt-6 space-y-2">
                          <div className="bg-emerald-600 text-white rounded-2xl rounded-bl-md p-4 max-w-[90%] shadow-sm opacity-70">
                            <p className="text-sm leading-relaxed">
                              Hej Jan, chcieliśmy szybko sprawdzić. Bardzo docenimy Twoją opinię!{' '}
                              <span className="text-emerald-200 underline">reviewharvest.pl/u/test-link</span>
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 ml-2">2:30 PM</div>
                        </div>
                      )}
                    </div>
                    {/* Home indicator */}
                    <div className="bg-gray-900 h-8 flex items-center justify-center">
                      <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Send Test Button */}
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  data-testid="button-send-test"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Wyślij testową wiadomość
                </Button>
              </div>

              {/* How Follow-ups Work */}
              {followUpsEnabled && (
                <div className="mt-8 bg-white rounded-xl border p-6" data-testid="panel-followup-info">
                  <h4 className="font-semibold text-gray-900 mb-4">Jak działają Follow-ups</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Automatyczny timing</p>
                        <p className="text-xs text-gray-500">Pierwszy follow-up 3 dni po pierwszej wiadomości</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Do 3 przypomnień</p>
                        <p className="text-xs text-gray-500">Rozłożone w czasie dla najlepszych wyników</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Smart Stop</p>
                        <p className="text-xs text-gray-500">Zatrzymuje się gdy klient odpowie</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
