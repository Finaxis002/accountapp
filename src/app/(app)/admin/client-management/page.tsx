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
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Check,
  X,
  Building,
  Users,
  Filter,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { ClientCard } from "@/components/clients/client-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { IoIosKey } from "react-icons/io";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Combobox } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ClientManagementPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [viewMode, setViewMode] = React.useState<"card" | "list">("card");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(
    null
  );
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(
    null
  );
  const [clients, setClients] = React.useState<Client[]>([]);
  const [clientToResetPassword, setClientToResetPassword] =
    React.useState<Client | null>(null);

  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] =
    React.useState(false);

  const [clientForPermissions, setClientForPermissions] =
    React.useState<Client | null>(null);
  const [newPassword, setNewPassword] = React.useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [eyeOpen, setEyeOpen] = React.useState(false);

  const [contactNameFilter, setContactNameFilter] = React.useState("");
  const [usernameFilter, setUsernameFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const res = await fetch(`${baseURL}/api/clients`, {
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

      const res = await fetch(`${baseURL}/api/clients/${clientToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const handleResetPassword = (client: Client) => {
    setClientToResetPassword(client);
    setIsResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!clientToResetPassword || !newPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New password cannot be empty.",
      });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/clients/reset-password/${clientToResetPassword._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newpassword: newPassword }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset password.");
      }

      toast({
        title: "Password Reset Successful",
        description: `Password for ${clientToResetPassword.contactName} has been updated.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmittingPassword(false);
      setNewPassword("");
      setIsResetPasswordDialogOpen(false);
      setClientToResetPassword(null);
    }
  };

  const handleViewPermissions = (client: Client) => {
    setClientForPermissions(client);
    setIsPermissionsDialogOpen(true);
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

  const filteredClients = React.useMemo(() => {
    let filtered = clients;
    if (contactNameFilter) {
      filtered = filtered.filter(
        (client) => client.contactName === contactNameFilter
      );
    }
    if (usernameFilter) {
      filtered = filtered.filter(
        (client) => client.clientUsername === usernameFilter
      );
    }
    return filtered;
  }, [clients, contactNameFilter, usernameFilter]);

  const contactNameOptions = React.useMemo(() => {
    return clients.map((client) => ({
      value: client.contactName,
      label: client.contactName,
    }));
  }, [clients]);

  const usernameOptions = React.useMemo(() => {
    return clients.map((client) => ({
      value: client.clientUsername,
      label: client.clientUsername,
    }));
  }, [clients]);

  const handleClearFilters = () => {
    setContactNameFilter("");
    setUsernameFilter("");
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
        <DialogContent className="sm:max-w-[625px] grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
          <DialogHeader className="p-6">
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

      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {clientToResetPassword?.contactName}.
              They will be notified of this change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={eyeOpen ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setEyeOpen((prev) => !prev)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
                >
                  {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={isSubmittingPassword}
            >
              {isSubmittingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* permissions dialogue */}
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Permissions for {clientForPermissions?.contactName}
            </DialogTitle>
            <DialogDescription>
              Reviewing usage limits and feature permissions for this client.
            </DialogDescription>
          </DialogHeader>
          {clientForPermissions && (
            <div className="grid gap-6 py-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-secondary/50">
                  <CardTitle className="text-base">
                    Feature Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check
                        className={cn(
                          "h-5 w-5 p-1 rounded-full",
                          clientForPermissions.canSendInvoiceEmail
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        )}
                      />
                      <span className="font-medium">
                        Send Invoice via Email
                      </span>
                    </div>
                    <Badge
                      variant={
                        clientForPermissions.canSendInvoiceEmail
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        clientForPermissions.canSendInvoiceEmail
                          ? "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
                          : "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                      )}
                    >
                      {clientForPermissions.canSendInvoiceEmail
                        ? "Enabled"
                        : "Disabled"}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check
                        className={cn(
                          "h-5 w-5 p-1 rounded-full",
                          clientForPermissions.canSendInvoiceWhatsapp
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        )}
                      />
                      <span className="font-medium">
                        Send Invoice via WhatsApp
                      </span>
                    </div>
                    <Badge
                      variant={
                        clientForPermissions.canSendInvoiceWhatsapp
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        clientForPermissions.canSendInvoiceWhatsapp
                          ? "bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300"
                          : "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                      )}
                    >
                      {clientForPermissions.canSendInvoiceWhatsapp
                        ? "Enabled"
                        : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-secondary/50">
                  <CardTitle className="text-base">Usage Limits</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Max Companies</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-lg font-semibold"
                    >
                      {clientForPermissions.maxCompanies}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Max Users</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-lg font-semibold"
                    >
                      {clientForPermissions.maxUsers}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPermissionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Mobile filter button */}
            <div className="sm:hidden w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)] p-4 space-y-4">
                  <Combobox
                    options={contactNameOptions}
                    value={contactNameFilter}
                    onChange={setContactNameFilter}
                    placeholder="Filter by name..."
                    searchPlaceholder="Search by name..."
                    noResultsText="No clients found."
                  />
                  <Combobox
                    options={usernameOptions}
                    value={usernameFilter}
                    onChange={setUsernameFilter}
                    placeholder="Filter by username..."
                    searchPlaceholder="Search by username..."
                    noResultsText="No clients found."
                  />
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={!contactNameFilter && !usernameFilter}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop filters */}
            <div className="hidden sm:flex items-center gap-2">
              <Combobox
                options={contactNameOptions}
                value={contactNameFilter}
                onChange={setContactNameFilter}
                placeholder="Filter by name..."
                searchPlaceholder="Search by name..."
                noResultsText="No clients found."
              />
              <Combobox
                options={usernameOptions}
                value={usernameFilter}
                onChange={setUsernameFilter}
                placeholder="Filter by username..."
                searchPlaceholder="Search by username..."
                noResultsText="No clients found."
              />
            </div>

            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!contactNameFilter && !usernameFilter}
              className="hidden sm:flex"
            >
              Clear Filters
            </Button>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
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
                        <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-md">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {client.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {client.phone}
                          </span>
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
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/analytics?clientId=${client._id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Analytics
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewPermissions(client)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" /> View
                              Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(client)}
                            >
                              <KeyRound className="mr-2 h-4 w-4" /> Reset
                              Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
              {filteredClients.map((client) => (
                <ClientCard
                  key={client._id}
                  client={client}
                  onEdit={() => handleEdit(client)}
                  onDelete={() => handleDelete(client)}
                  onResetPassword={() => handleResetPassword(client)}
                  onViewPermissions={() => handleViewPermissions(client)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
