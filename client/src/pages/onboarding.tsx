import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Star, MessageSquare, Sparkles, Building2, Loader2 } from 'lucide-react';

interface Account {
  name: string;
  accountName: string;
}

interface Location {
  name: string;
  title: string;
  storefrontAddress?: {
    locality?: string;
    postalCode?: string;
  };
  metadata?: {
    placeId?: string;
  };
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'intro' | 'accounts' | 'locations' | 'success'>('intro');
  const [connecting, setConnecting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: googleStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['google-status'],
    queryFn: async () => {
      const res = await fetch('/api/google/status', { credentials: 'include' });
      return res.json();
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'google') {
      setStep('accounts');
      fetchAccounts();
    }
  }, []);

  useEffect(() => {
    if (googleStatus?.googleConnected) {
      setLocation('/dashboard');
    }
  }, [googleStatus, setLocation]);

  const handleConnectGoogle = () => {
    setConnecting(true);
    window.location.href = '/api/auth/google/business?redirect=/onboarding';
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/google/accounts', { credentials: 'include' });
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
        if (data.accounts.length === 1) {
          setSelectedAccount(data.accounts[0].name);
          fetchLocations(data.accounts[0].name);
        }
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać kont Google Business',
        variant: 'destructive',
      });
    }
  };

  const fetchLocations = async (accountName: string) => {
    try {
      const encodedAccountName = encodeURIComponent(accountName);
      const res = await fetch(`/api/google/locations/${encodedAccountName}`, { credentials: 'include' });
      const data = await res.json();
      if (data.locations) {
        setLocations(data.locations);
        setStep('locations');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać lokalizacji',
        variant: 'destructive',
      });
    }
  };

  const handleAccountSelect = (accountName: string) => {
    setSelectedAccount(accountName);
    fetchLocations(accountName);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) return;

    const location = locations.find(l => l.name === selectedLocation);
    if (!location) return;

    setSaving(true);
    try {
      const res = await fetch('/api/google/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          locationName: location.name,
          title: location.title,
          placeId: location.metadata?.placeId,
        }),
      });

      if (res.ok) {
        setStep('success');
        await refetchStatus();
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać lokalizacji',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil połączony pomyślnie!</h2>
            <p className="text-gray-600">Przekierowuję do dashboardu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  C
                </div>
                <span className="text-xl font-bold text-emerald-700">Contact Review Grow</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Witamy w ReviewGrow!<br />Zacznijmy od Twojej wizytówki
              </h1>
              <p className="text-lg text-gray-600">
                Abyśmy mogli automatyzować Twoje opinie i śledzić konwersje, musisz połączyć swój profil firmy w Google.
              </p>
            </div>

            <div className="relative max-w-sm mx-auto lg:mx-0">
              <div className="bg-white rounded-xl shadow-xl p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                    <span className="text-gray-600">G</span>
                    <span>Firmy w okolicy</span>
                  </div>
                  <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-6 h-6 ml-auto" />
                </div>

                <div className="relative">
                  <div className="bg-emerald-600 text-white rounded-lg p-3 mb-2 transform hover:scale-105 transition-transform shadow-lg border-2 border-emerald-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-emerald-700 px-2 py-0.5 rounded">🏆</span>
                      <span className="font-semibold">Twoja Firma</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">4.9</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-emerald-200 text-sm">467 Opinii</span>
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-3 opacity-60">
                    <div className="font-semibold text-gray-700">Konkurencja</div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-600">4.2</span>
                      <div className="flex">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="text-gray-500 text-sm">187</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <Card className="shadow-xl">
              <CardHeader className="text-center border-b pb-6">
                <CardTitle className="text-xl">
                  {step === 'intro' && 'Połącz swój Profil Firmy w Google'}
                  {step === 'accounts' && 'Wybierz konto Google Business'}
                  {step === 'locations' && 'Wybierz lokalizację'}
                </CardTitle>
                <CardDescription>
                  {step === 'intro' && 'Aby automatyzować opinie i śledzić konwersje, połącz swój profil.'}
                  {step === 'accounts' && 'Wybierz konto, z którego chcesz zarządzać opiniami.'}
                  {step === 'locations' && 'Wybierz lokalizację firmy do monitorowania.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {step === 'intro' && (
                  <>
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700">Dlaczego to jest potrzebne?</p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-sm text-gray-600">Pobieranie Place ID Twojej firmy</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-sm text-gray-600">Weryfikacja opinii w czasie rzeczywistym</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-sm text-gray-600">Automatyczne odpowiedzi AI na pozytywne opinie</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleConnectGoogle}
                      disabled={connecting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                      data-testid="button-connect-google"
                    >
                      {connecting ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="" className="w-5 h-5 mr-2" />
                      )}
                      Połącz z Google Business Profile
                    </Button>

                    <div className="text-center space-y-3 pt-4 border-t">
                      <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Nie masz jeszcze Profilu Firmy w Google?
                      </p>
                      <a
                        href="https://business.google.com/create"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:underline"
                      >
                        Załóż go za darmo →
                      </a>
                    </div>
                  </>
                )}

                {step === 'accounts' && (
                  <div className="space-y-4">
                    {accounts.length === 0 ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                        <p className="mt-2 text-gray-500">Ładowanie kont...</p>
                      </div>
                    ) : (
                      <>
                        <Select onValueChange={handleAccountSelect} value={selectedAccount || undefined}>
                          <SelectTrigger data-testid="select-account">
                            <SelectValue placeholder="Wybierz konto" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.name} value={account.name}>
                                {account.accountName || account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                )}

                {step === 'locations' && (
                  <div className="space-y-4">
                    {locations.length === 0 ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                        <p className="mt-2 text-gray-500">Ładowanie lokalizacji...</p>
                      </div>
                    ) : (
                      <>
                        <Select onValueChange={setSelectedLocation} value={selectedLocation || undefined}>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Wybierz lokalizację" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.name} value={location.name}>
                                {location.title}
                                {location.storefrontAddress?.locality && (
                                  <span className="text-gray-500 ml-2">
                                    ({location.storefrontAddress.locality})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={handleSaveLocation}
                          disabled={!selectedLocation || saving}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          data-testid="button-save-location"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Zapisz i kontynuuj
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
