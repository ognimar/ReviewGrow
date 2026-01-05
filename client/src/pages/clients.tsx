import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Contacts() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your audience list and import CSV data for campaigns.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>Manage your recipients.</CardDescription>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-8" />
                </div>
             </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                    { name: "Alice Johnson", phone: "+1 555-0100", email: "alice@example.com", date: "Jan 12, 2024" },
                    { name: "Bob Smith", phone: "+1 555-0101", email: "bob@example.com", date: "Jan 11, 2024" },
                    { name: "Charlie Brown", phone: "+1 555-0102", email: "charlie@example.com", date: "Jan 10, 2024" },
                    { name: "Diana Prince", phone: "+1 555-0103", email: "diana@example.com", date: "Jan 09, 2024" },
                    { name: "Evan Wright", phone: "+1 555-0104", email: "evan@example.com", date: "Jan 08, 2024" },
                ].map((client, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.date}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
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
