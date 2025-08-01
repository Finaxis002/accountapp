"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  List,
  LayoutGrid,
  Edit,
  Loader2,
  Trash2,
  Mail,
  Phone,
  Eye,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { ClientCard } from "@/components/clients/client-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/clients/client-form";
import type { Client } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { MoreHorizontal } from "lucide-react";

export default function ClientManagementPage() {
  const [viewMode, setViewMode] = React.useState<"card" | "list">("list");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(
    null
  );
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const res = await fetch("http://localhost:5000/api/clients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch clients.");
      }
      const data = await res.json();
      setClients(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load clients",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `http://localhost:5000/api/clients/${clientToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete client.");
      }

      toast({
        title: "Client Deleted",
        description: `${clientToDelete.contactName} has been successfully deleted.`,
      });

      setClients(clients.filter((c) => c._id !== clientToDelete._id));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setClientToDelete(null);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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
    fetchClients();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Client Management
          </h2>
          <p className="text-muted-foreground">
            Manage your clients and their accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
            <Button
              variant={viewMode === "card" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
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
            <DialogTitle>
              {selectedClient ? "Edit Client" : "Add New Client"}
            </DialogTitle>
            <DialogDescription>
              {selectedClient
                ? `Update the details for ${selectedClient.contactName}.`
                : "Fill in the form below to add a new client."}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={selectedClient || undefined}
            onFormSubmit={onFormSubmit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              client account and all associated data for{" "}
              {clientToDelete?.contactName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search clients..."
              className="max-w-xs bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className={viewMode === "list" ? "p-0" : ""}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {client.contactName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {client.contactName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm p-2 bg-secondary rounded-md inline-block">
                          {client.clientUsername}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-md">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              {client.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              {client.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(client)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <ClientCard
                  key={client._id}
                  client={client}
                  onEdit={() => handleEdit(client)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
