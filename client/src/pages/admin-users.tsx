import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, ShieldAlert, MoreHorizontal, Ban, MessageSquare, Mail, UserCheck } from "lucide-react";
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
  subscription: string | null;
  smsQuota: number;
  smsUsed: number;
  emailQuota: number;
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
  const [quotaDialog, setQuotaDialog] = useState<'sms' | 'email' | null>(null);
  const [quotaAmount, setQuotaAmount] = useState("");

  const { data: users = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, action, value }: { userId: string; action: string; value?: number }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ action, value }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const actionMessages: Record<string, string> = {
        ban: 'User has been banned',
        unban: 'User has been unbanned',
        addSms: 'SMS quota updated',
        addEmail: 'Email quota updated',
      };
      toast({ title: actionMessages[variables.action] || 'User updated' });
      setQuotaDialog(null);
      setSelectedUser(null);
      setQuotaAmount("");
    },
    onError: () => {
      toast({ title: 'Failed to update user', variant: 'destructive' });
    },
  });

  const handleBanUser = (targetUser: AdminUser) => {
    const action = targetUser.banned ? 'unban' : 'ban';
    updateUserMutation.mutate({ userId: targetUser.id, action });
  };

  const handleAddQuota = () => {
    if (!selectedUser || !quotaDialog || !quotaAmount) return;
    const amount = parseInt(quotaAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid number', variant: 'destructive' });
      return;
    }
    const action = quotaDialog === 'sms' ? 'addSms' : 'addEmail';
    updateUserMutation.mutate({ userId: selectedUser.id, action, value: amount });
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

  const activeSubscriptions = users.filter(u => u.subscription).length;
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
                    <TableHead>SMS Quota</TableHead>
                    <TableHead>Email Quota</TableHead>
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
                      <TableCell>{targetUser.smsUsed || 0} / {targetUser.smsQuota || 0}</TableCell>
                      <TableCell>{targetUser.emailUsed || 0} / {targetUser.emailQuota || 0}</TableCell>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(targetUser);
                                setQuotaDialog('sms');
                              }}
                              data-testid={`menu-add-sms-${targetUser.id}`}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add SMS Quota
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(targetUser);
                                setQuotaDialog('email');
                              }}
                              data-testid={`menu-add-email-${targetUser.id}`}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Add Email Quota
                            </DropdownMenuItem>
                            {!targetUser.isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleBanUser(targetUser)}
                                className={targetUser.banned ? "text-green-600" : "text-destructive"}
                                data-testid={`menu-ban-${targetUser.id}`}
                              >
                                {targetUser.banned ? (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban User
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

      <Dialog open={!!quotaDialog} onOpenChange={(open) => !open && setQuotaDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {quotaDialog === 'sms' ? 'SMS' : 'Email'} Quota
            </DialogTitle>
            <DialogDescription>
              Add quota for {selectedUser?.displayName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Quota</Label>
              <p className="text-sm text-muted-foreground">
                {quotaDialog === 'sms' 
                  ? `${selectedUser?.smsUsed || 0} / ${selectedUser?.smsQuota || 0} SMS used`
                  : `${selectedUser?.emailUsed || 0} / ${selectedUser?.emailQuota || 0} emails sent`
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota-amount">Amount to Add</Label>
              <Input
                id="quota-amount"
                type="number"
                min="1"
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                placeholder="Enter amount..."
                data-testid="input-quota-amount"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddQuota}
              disabled={updateUserMutation.isPending}
              data-testid="button-confirm-quota"
            >
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Quota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
