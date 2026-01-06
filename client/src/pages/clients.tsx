import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileDown, Search, Loader2, Users, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClients, importClientsCSV } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export default function Clients() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const importMutation = useMutation({
    mutationFn: importClientsCSV,
    onSuccess: (data) => {
      toast({
        title: 'Import successful',
        description: `Imported ${data.imported} clients successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsImportOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import CSV file',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, phone, email }: { id: string; name: string; phone: string; email: string }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ name, phone, email }),
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Client updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
    },
    onError: () => {
      toast({ title: 'Failed to update client', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
      });
      if (!response.ok) throw new Error('Failed to delete client');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Client deleted' });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete client', variant: 'destructive' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditPhone(client.phone || '');
    setEditEmail(client.email || '');
  };

  const handleSaveClient = () => {
    if (!editingClient) return;
    if (!editName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({
      id: editingClient.id,
      name: editName,
      phone: editPhone,
      email: editEmail,
    });
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-page-title">Clients</h1>
            <p className="text-muted-foreground">Manage your client list and import CSV data for campaigns.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-export">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-import-csv">
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Clients from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with columns: Name, Phone, Email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    {importMutation.isPending ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to select CSV file</span>
                      </>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileChange}
                    data-testid="input-csv-file"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected format: Name, Phone (with country code), Email
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>
                      {clients.length} total clients
                    </CardDescription>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search clients..." 
                      className="pl-8" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search"
                    />
                </div>
             </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">Import a CSV file to add your first clients.</p>
                <Button onClick={() => setIsImportOpen(true)} data-testid="button-import-empty">
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>
                        {client.createdAt ? format(new Date(client.createdAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClient(client)}
                            data-testid={`button-edit-${client.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClient(client.id)}
                            data-testid={`button-delete-${client.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Client name"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                data-testid="input-edit-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
                data-testid="input-edit-email"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveClient}
              disabled={updateMutation.isPending}
              data-testid="button-save-client"
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
