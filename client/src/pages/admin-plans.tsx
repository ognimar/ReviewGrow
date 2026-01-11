import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSubscriptionPlans, updateSubscriptionPlan } from "@/lib/api";
import { ShieldAlert, Loader2, Save, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  requestLimit: number;
  features: string[];
  order: number;
}

export default function AdminPlans() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    requestLimit: 0,
    features: '',
  });

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => 
      updateSubscriptionPlan(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Plan zaktualizowany',
        description: 'Zmiany zostały zapisane.',
      });
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zaktualizować planu',
        variant: 'destructive',
      });
    },
  });

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      monthlyPrice: plan.monthlyPrice / 100,
      yearlyPrice: plan.yearlyPrice / 100,
      requestLimit: plan.requestLimit,
      features: plan.features.join('\n'),
    });
  };

  const handleSave = () => {
    if (!editingPlan) return;
    
    updateMutation.mutate({
      planId: editingPlan.id,
      data: {
        name: formData.name,
        monthlyPrice: Math.round(formData.monthlyPrice * 100),
        yearlyPrice: Math.round(formData.yearlyPrice * 100),
        requestLimit: formData.requestLimit,
        features: formData.features.split('\n').filter(f => f.trim()),
      },
    });
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Brak dostępu</h2>
          <p className="text-muted-foreground">Nie masz uprawnień do tej strony.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">
            Zarządzanie Planami
          </h1>
          <p className="text-muted-foreground">Edytuj ceny i limity planów subskrypcyjnych</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} data-testid={`card-admin-plan-${plan.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {plan.name}
                </CardTitle>
                <CardDescription>ID: {plan.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cena miesięczna:</span>
                    <p className="font-bold">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(plan.monthlyPrice / 100)} PLN</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cena roczna:</span>
                    <p className="font-bold">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(plan.yearlyPrice / 100)} PLN</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Limit requestów:</span>
                    <p className="font-bold">{plan.requestLimit} / miesiąc</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Funkcje:</span>
                  <ul className="mt-1 text-sm space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-muted-foreground">• {feature}</li>
                    ))}
                  </ul>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => openEditDialog(plan)}
                      data-testid={`button-edit-plan-${plan.id}`}
                    >
                      Edytuj plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edytuj plan: {editingPlan?.name}</DialogTitle>
                      <DialogDescription>
                        Zmień szczegóły planu subskrypcyjnego
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nazwa planu</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          data-testid="input-plan-name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monthlyPrice">Cena miesięczna (PLN)</Label>
                          <Input
                            id="monthlyPrice"
                            type="number"
                            value={formData.monthlyPrice}
                            onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                            data-testid="input-monthly-price"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearlyPrice">Cena roczna (PLN)</Label>
                          <Input
                            id="yearlyPrice"
                            type="number"
                            value={formData.yearlyPrice}
                            onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                            data-testid="input-yearly-price"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestLimit">Limit requestów / miesiąc</Label>
                        <Input
                          id="requestLimit"
                          type="number"
                          value={formData.requestLimit}
                          onChange={(e) => setFormData({ ...formData, requestLimit: parseInt(e.target.value) || 0 })}
                          data-testid="input-request-limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="features">Funkcje (każda w nowej linii)</Label>
                        <textarea
                          id="features"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.features}
                          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                          data-testid="input-features"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-plan"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Zapisz zmiany
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
