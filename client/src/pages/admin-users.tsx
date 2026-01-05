import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsers } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  subscription: string | null;
  smsQuota: number;
  smsUsed: number;
  emailQuota: number;
  emailUsed: number;
  createdAt: string;
  lastLogin: string;
}

export default function AdminUsers() {
  const { isAdmin } = useAuth();

  const { data: users = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const activeSubscriptions = users.filter(u => u.subscription).length;
  const totalSmsUsed = users.reduce((acc, u) => acc + (u.smsUsed || 0), 0);
  const totalEmailsSent = users.reduce((acc, u) => acc + (u.emailUsed || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">User Management</h1>
            <p className="text-muted-foreground">Admin only: Overview of all registered users and subscriptions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
             <Card data-testid="card-total-users">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
             </Card>
             <Card data-testid="card-active-subscriptions">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeSubscriptions}</div>
                </CardContent>
             </Card>
             <Card data-testid="card-total-sms">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total SMS Sent</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSmsUsed}</div>
                </CardContent>
             </Card>
             <Card data-testid="card-total-emails">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails Sent</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmailsSent}</div>
                </CardContent>
             </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                Failed to load users. Please try again.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>SMS Used</TableHead>
                    <TableHead>Emails Sent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.smsUsed || 0} / {user.smsQuota || 0}</TableCell>
                      <TableCell>{user.emailUsed || 0} / {user.emailQuota || 0}</TableCell>
                      <TableCell>
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
