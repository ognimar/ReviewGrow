import { CheckCircle, Gift, PartyPopper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full text-center" data-testid="card-review-success">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-500" />
              <PartyPopper className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-2xl">Dziękujemy!</CardTitle>
          <CardDescription className="text-base">
            Twoja opinia jest dla nas bardzo cenna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Doceniamy, że poświęciłeś czas na podzielenie się swoimi wrażeniami.
            Twoja opinia pomaga nam stawać się lepszymi każdego dnia.
          </p>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Specjalny bonus!</span>
            </div>
            <p className="text-sm text-amber-700">
              Jako podziękowanie przygotowaliśmy dla Ciebie 10% zniżki na następną wizytę.
              Kod: <span className="font-mono font-bold">REVIEW10</span>
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Możesz teraz zamknąć tę stronę.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
