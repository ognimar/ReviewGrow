import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <DashboardLayout>
       <div className="space-y-6 max-w-4xl">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your API keys and integration preferences.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Enter your third-party service keys here. These are stored securely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="smsapi">SMSAPI Key</Label>
                    <Input id="smsapi" type="password" placeholder="Enter your SMSAPI token" value="••••••••••••••••" readOnly />
                    <p className="text-[0.8rem] text-muted-foreground">Used for sending SMS campaigns.</p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="stripe">Stripe Public Key</Label>
                    <Input id="stripe" type="text" placeholder="pk_test_..." />
                    <p className="text-[0.8rem] text-muted-foreground">Used for processing payments.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                    <Input id="stripe-secret" type="password" placeholder="sk_test_..." />
                    <p className="text-[0.8rem] text-muted-foreground">Used for processing payments.</p>
                </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
