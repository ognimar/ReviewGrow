import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Crown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCheckoutSession, fetchSubscriptionPlans, fetchBillingStatus, verifyCheckoutSession } from "@/lib/api";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  requestLimit: number;
  features: string[];
  order: number;
}

interface Subscription {
  planId: string;
  billingCycle: string;
  status: string;
  requestLimit: number;
  requestsUsed: number;
  startedAt: string;
  expiresAt: string;
}

export default function Billing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [verifying, setVerifying] = useState(false);

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  });

  const { data: billingData, isLoading: statusLoading } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ['billing-status'],
    queryFn: fetchBillingStatus,
  });

  const subscription = billingData?.subscription;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    
    if (params.get('success') === 'true' && sessionId) {
      // Verify and activate subscription
      setVerifying(true);
      verifyCheckoutSession(sessionId)
        .then(() => {
          toast({
            title: 'Płatność zakończona!',
            description: 'Twoja subskrypcja została aktywowana.',
          });
          // Refresh billing status and stats
          queryClient.invalidateQueries({ queryKey: ['billing-status'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          // Clear URL params
          window.history.replaceState({}, '', '/billing');
        })
        .catch((error) => {
          console.error('Verification failed:', error);
          toast({
            title: 'Błąd weryfikacji',
            description: 'Nie udało się aktywować subskrypcji. Skontaktuj się z supportem.',
            variant: 'destructive',
          });
        })
        .finally(() => setVerifying(false));
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Płatność anulowana',
        description: 'Możesz spróbować ponownie.',
        variant: 'destructive',
      });
    }
  }, [location, toast, queryClient]);

  const checkoutMutation = useMutation({
    mutationFn: ({ planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' }) => 
      createCheckoutSession(planId, billingCycle),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Checkout failed',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive',
      });
      setLoadingPlan(null);
    },
  });

  const handleCheckout = (planId: string) => {
    setLoadingPlan(planId);
    checkoutMutation.mutate({ planId, billingCycle });
  };

  const formatPrice = (priceInGrosze: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    }).format(priceInGrosze / 100);
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  };

  if (plansLoading || statusLoading || verifying) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {verifying && <p className="text-muted-foreground">Aktywowanie subskrypcji...</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">
            Płatności i Plany
          </h1>
          <p className="text-muted-foreground">Zarządzaj swoją subskrypcją</p>
        </div>

        {subscription && subscription.status === 'active' && (
          <Card className="border-primary bg-primary/5" data-testid="card-current-subscription">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Aktywna subskrypcja: {plans.find(p => p.id === subscription.planId)?.name || subscription.planId}
              </CardTitle>
              <CardDescription>
                {subscription.billingCycle === 'yearly' ? 'Rozliczenie roczne' : 'Rozliczenie miesięczne'} 
                {' '}• Wygasa: {new Date(subscription.expiresAt).toLocaleDateString('pl-PL')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Wykorzystane requesty</span>
                  <span className="font-medium">{subscription.requestsUsed} / {subscription.requestLimit}</span>
                </div>
                <Progress 
                  value={(subscription.requestsUsed / subscription.requestLimit) * 100} 
                  className="h-2"
                  data-testid="progress-requests"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {(!subscription || subscription.status !== 'active') && (
          <Card className="border-destructive bg-destructive/5" data-testid="card-no-subscription">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium">Brak aktywnej subskrypcji</p>
                <p className="text-sm text-muted-foreground">Wybierz plan, aby odblokować wszystkie funkcje</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
            <TabsList>
              <TabsTrigger value="monthly" data-testid="tab-monthly">Miesięcznie</TabsTrigger>
              <TabsTrigger value="yearly" data-testid="tab-yearly">
                Rocznie
                <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                  -17%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const isPopular = plan.id === 'growth';
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const monthlyEquivalent = billingCycle === 'yearly' 
              ? Math.round(plan.yearlyPrice / 12) 
              : plan.monthlyPrice;
            const isCurrentPlan = subscription?.planId === plan.id && subscription?.status === 'active';

            return (
              <Card 
                key={plan.id}
                className={`flex flex-col relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    NAJPOPULARNIEJSZY
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    AKTUALNY
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.requestLimit} requestów / miesiąc</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <div className="text-4xl font-bold font-display">
                      {formatPrice(monthlyEquivalent)} PLN
                      <span className="text-base font-normal text-muted-foreground"> / mies</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Płatność {formatPrice(price)} PLN / rok (oszczędzasz {getYearlySavings(plan)}%)
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isPopular ? 'text-primary' : 'text-green-500'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loadingPlan !== null || isCurrentPlan}
                    data-testid={`button-checkout-${plan.id}`}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrentPlan ? 'Aktualny plan' : 'Wybierz plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
