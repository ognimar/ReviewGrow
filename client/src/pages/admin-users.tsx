import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, ShieldAlert, MoreHorizontal, Ban, UserCheck, HardDrive, Trash2, Image, FileText, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
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

interface StorageFile {
  id: string;
  storagePath: string;
  url: string;
  ownerId: string;
  type: 'campaign' | 'followup' | 'email_followup' | 'template';
  relatedEntityId?: string;
  fileName: string;
  size: number;
  createdAt: string;
}

interface StorageData {
  files: StorageFile[];
  totalSize: number;
  totalCount: number;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileTypeLabel(type: StorageFile['type']) {
  switch (type) {
    case 'campaign': return 'Kampania';
    case 'followup': return 'Follow-up SMS';
    case 'email_followup': return 'Follow-up Email';
    case 'template': return 'Szablon';
    default: return type;
  }
}

function StorageSection({ users }: { users: AdminUser[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data: storageData, isLoading } = useQuery<StorageData>({
    queryKey: ['admin-storage'],
    queryFn: async () => {
      const res = await fetch('/api/admin/storage', {
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch storage');
      return res.json();
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/admin/storage/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete file');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Plik usunięty' });
      queryClient.invalidateQueries({ queryKey: ['admin-storage'] });
    },
    onError: () => {
      toast({ title: 'Nie udało się usunąć pliku', variant: 'destructive' });
    },
  });

  const deleteUserFilesMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/storage/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await user?.getIdToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete user files');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Usunięto ${data.deletedCount} plików` });
      queryClient.invalidateQueries({ queryKey: ['admin-storage'] });
    },
    onError: () => {
      toast({ title: 'Nie udało się usunąć plików', variant: 'destructive' });
    },
  });

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const files = storageData?.files || [];

  // Group files by user
  const byUser = files.reduce<Record<string, StorageFile[]>>((acc, f) => {
    if (!acc[f.ownerId]) acc[f.ownerId] = [];
    acc[f.ownerId].push(f);
    return acc;
  }, {});

  const userIds = Object.keys(byUser);

  const getUserLabel = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.displayName || u.email} (${u.email})` : userId;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="text-lg font-semibold">{storageData?.totalCount || 0} plików</p>
          <p className="text-sm text-muted-foreground">Łącznie: {formatFileSize(storageData?.totalSize || 0)}</p>
        </div>
        <div className="text-sm text-muted-foreground">{userIds.length} użytkowników z plikami</div>
      </div>

      {userIds.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <HardDrive className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Brak plików w storage</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userIds.map(userId => {
            const userFiles = byUser[userId];
            const userSize = userFiles.reduce((s, f) => s + (f.size || 0), 0);
            const isExpanded = expandedUsers.has(userId);
            return (
              <div key={userId} className="border rounded-lg overflow-hidden" data-testid={`storage-user-${userId}`}>
                <div
                  className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleUser(userId)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    }
                    <span className="text-sm font-medium truncate">{getUserLabel(userId)}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="secondary">{userFiles.length} plików · {formatFileSize(userSize)}</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Usunąć wszystkie pliki użytkownika? (${userFiles.length} plików)`)) {
                          deleteUserFilesMutation.mutate(userId);
                        }
                      }}
                      disabled={deleteUserFilesMutation.isPending}
                      data-testid={`button-delete-user-storage-${userId}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Usuń wszystkie
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y">
                    {userFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between px-4 py-2 hover:bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName)
                            ? <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            : <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          }
                          <div className="min-w-0">
                            <p className="text-sm truncate" title={file.fileName}>{file.fileName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs py-0">{fileTypeLabel(file.type)}</Badge>
                              <span>{formatFileSize(file.size)}</span>
                              <span>{new Date(file.createdAt).toLocaleDateString('pl-PL')}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          disabled={deleteFileMutation.isPending}
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Pliki wygenerowane przed wdrożeniem systemu śledzenia nie są tutaj widoczne. Możesz je usunąć bezpośrednio w konsoli Firebase Storage.
        </p>
      </div>
    </>
  );
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Zarządzanie Storage
            </CardTitle>
            <CardDescription>
              Pliki Firebase Storage wszystkich użytkowników — obrazy kampanii, follow-upów i szablonów.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StorageSection users={users} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
