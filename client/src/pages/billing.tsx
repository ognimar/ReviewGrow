import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession } from "@/lib/api";
import { useLocation } from "wouter";

export default function Billing() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: 'Payment successful!',
        description: 'Your subscription has been activated.',
      });
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Payment canceled',
        description: 'You can try again when ready.',
        variant: 'destructive',
      });
    }
  }, [location, toast]);

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
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

  const handleCheckout = (plan: 'monthly' | 'yearly') => {
    setLoadingPlan(plan);
    checkoutMutation.mutate(plan);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">Billing & Plans</h1>
            <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:max-w-4xl mx-auto py-8">
            {/* Monthly Plan */}
            <Card className="flex flex-col" data-testid="card-monthly-plan">
                <CardHeader>
                    <CardTitle className="text-2xl">Monthly</CardTitle>
                    <CardDescription>Standard monthly subscription.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="text-4xl font-bold font-display mb-6">
                        99 PLN <span className="text-base font-normal text-muted-foreground">/ month</span>
                    </div>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> All core features</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited campaigns</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic support</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleCheckout('monthly')}
                      disabled={loadingPlan !== null}
                      data-testid="button-checkout-monthly"
                    >
                      {loadingPlan === 'monthly' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Subscribe Monthly
                    </Button>
                </CardFooter>
            </Card>

            {/* Yearly Plan */}
            <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden" data-testid="card-yearly-plan">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                </div>
                <CardHeader>
                    <CardTitle className="text-2xl">Pro (Annual)</CardTitle>
                    <CardDescription>Save 20% by billing annually.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="text-4xl font-bold font-display mb-2 text-primary">
                        80 PLN <span className="text-base font-normal text-muted-foreground">/ month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">Billed as 960 PLN / year</p>
                    
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Everything in Monthly</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Analytics</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Custom Templates</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => handleCheckout('yearly')}
                      disabled={loadingPlan !== null}
                      data-testid="button-checkout-yearly"
                    >
                      {loadingPlan === 'yearly' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to Pro
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
