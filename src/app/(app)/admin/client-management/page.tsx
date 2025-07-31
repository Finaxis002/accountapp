
'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clients } from "@/lib/data";
import { MoreHorizontal, PlusCircle, List, LayoutGrid, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientCard } from "@/components/clients/client-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import type { Client } from "@/lib/types";

export default function ClientManagementPage() {
  const [viewMode, setViewMode] = React.useState<'card' | 'list'>('list');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  const onFormSubmit = () => {
    setIsDialogOpen(false);
    // In a real app you might want to refresh data here
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Client Management</h2>
          <p className="text-muted-foreground">
            Manage your clients and their accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
                <Button variant={viewMode === 'card' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('card')}>
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4" />
                </Button>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Client
            </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {selectedClient ? `Update the details for ${selectedClient.companyName}.` : 'Fill in the form below to add a new client.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm client={selectedClient || undefined} onFormSubmit={onFormSubmit} />
        </DialogContent>
      </Dialog>

      <Card className="w-full">
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
                <Input placeholder="Search clients..." className="max-w-xs bg-background" />
                <div className="flex gap-2">
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Plans" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className={viewMode === 'list' ? 'p-0' : ''}>
           {viewMode === 'list' ? (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.companyName}</TableCell>
                      <TableCell>{client.contactName}</TableCell>
                      <TableCell className="text-muted-foreground">{client.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">{client.subscriptionPlan}</Badge>
                      </TableCell>
                      <TableCell>
                         <Badge 
                          variant={client.status === 'Active' ? 'default' : 'secondary'}
                           className={
                            client.status === 'Active' 
                            ? 'bg-green-500/20 text-green-700 border-green-500/40' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Client</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
           ) : (
             <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {clients.map(client => (
                    <ClientCard key={client.id} client={client} onEdit={() => handleEdit(client)} />
                ))}
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
