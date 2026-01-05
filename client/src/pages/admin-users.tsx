import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminUsers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Admin only: Overview of all registered users and subscriptions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">142</div>
                </CardContent>
             </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">89</div>
                </CardContent>
             </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">8,900 PLN</div>
                </CardContent>
             </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                    { name: "John Doe", email: "john@example.com", status: "Active", plan: "Pro (Yearly)", date: "2023-11-01" },
                    { name: "Sarah Connor", email: "sarah@skynet.com", status: "Active", plan: "Monthly", date: "2023-12-15" },
                    { name: "Kyle Reese", email: "kyle@resistance.org", status: "Past Due", plan: "Monthly", date: "2024-01-02" },
                    { name: "T-800", email: "arnie@cyberdyne.com", status: "Inactive", plan: "None", date: "2023-10-20" },
                ].map((user, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : user.status === 'Past Due' ? 'destructive' : 'secondary'}>
                            {user.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{user.plan}</TableCell>
                    <TableCell>{user.date}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">Manage</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
