import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, ShieldAlert, MoreHorizontal, Ban, UserCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminUsers } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  subscription: {
    planId: string;
    status: string;
    requestLimit: number;
    requestsUsed: number;
    expiresAt: string;
  } | null;
  smsUsed: number;
  emailUsed: number;
  createdAt: string;
  lastLogin: string;
  banned?: boolean;
}

export default function AdminUsers() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: string }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const actionMessages: Record<string, string> = {
        ban: 'Użytkownik zablokowany',
        unban: 'Użytkownik odblokowany',
      };
      toast({ title: actionMessages[variables.action] || 'Zaktualizowano' });
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: 'Nie udało się zaktualizować', variant: 'destructive' });
    },
  });

  const handleBanUser = (targetUser: AdminUser) => {
    const action = targetUser.banned ? 'unban' : 'ban';
    updateUserMutation.mutate({ userId: targetUser.id, action });
  };

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

  const activeSubscriptions = users.filter(u => u.subscription?.status === 'active').length;
  const totalSmsUsed = users.reduce((acc, u) => acc + (u.smsUsed || 0), 0);
  const totalEmailsSent = users.reduce((acc, u) => acc + (u.emailUsed || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">User Management</h1>
            <p className="text-muted-foreground">Admin only: Manage users, quotas, and subscriptions.</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((targetUser) => (
                    <TableRow key={targetUser.id} data-testid={`row-user-${targetUser.id}`}>
                      <TableCell className="font-medium">{targetUser.displayName}</TableCell>
                      <TableCell>{targetUser.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {targetUser.isAdmin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                          {targetUser.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {targetUser.subscription?.status === 'active' ? (
                          <Badge variant="default" className="capitalize">{targetUser.subscription.planId}</Badge>
                        ) : (
                          <Badge variant="outline">Brak</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {targetUser.subscription?.status === 'active' 
                          ? `${targetUser.subscription.requestsUsed || 0} / ${targetUser.subscription.requestLimit || 0}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {targetUser.createdAt ? format(new Date(targetUser.createdAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${targetUser.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!targetUser.isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleBanUser(targetUser)}
                                className={targetUser.banned ? "text-green-600" : "text-destructive"}
                                data-testid={`menu-ban-${targetUser.id}`}
                              >
                                {targetUser.banned ? (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Odblokuj
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Zablokuj
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
