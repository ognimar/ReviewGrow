import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, MessageSquare, Calendar } from "lucide-react";

export default function Campaigns() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">Create and manage your omnichannel campaigns.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
                { title: "Winter Sale Promo", type: "SMS & Email", status: "Completed", date: "Dec 24, 2023", stats: "98% Delivered" },
                { title: "New Collection Launch", type: "Email Only", status: "Scheduled", date: "Jan 15, 2024", stats: "Pending" },
                { title: "VIP Exclusive", type: "SMS Only", status: "Draft", date: "Not scheduled", stats: "N/A" },
            ].map((camp, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant={camp.status === 'Completed' ? 'default' : camp.status === 'Scheduled' ? 'secondary' : 'outline'}>
                                {camp.status}
                            </Badge>
                            {camp.type.includes("SMS") ? <MessageSquare className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <CardTitle className="mt-2">{camp.title}</CardTitle>
                        <CardDescription>Created on {camp.date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Type</span>
                            <span className="font-medium text-foreground">{camp.type}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>Performance</span>
                            <span className="font-medium text-foreground">{camp.stats}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">View Details</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
