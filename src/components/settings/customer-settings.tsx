"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  PlusCircle,
  Users,
  Check,
  X,
  FileText,
  Hash,
  User,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  IdCard,
  Settings,
  Edit2,
  Percent
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Company, Party } from "@/lib/types";
import { CustomerForm } from "@/components/customers/customer-form";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export function CustomerSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [customers, setCustomers] = React.useState<Party[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Party | null>(null);
  const [customerToDelete, setCustomerToDelete] =
    React.useState<Party | null>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const { toast } = useToast();

  const fetchCompanies = React.useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch companies.");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [baseURL]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/parties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch customers.");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : data.parties || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load customers",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, baseURL]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenForm = (customer: Party | null = null) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (customer: Party) => {
    setCustomerToDelete(customer);
    setIsAlertOpen(true);
  };

  const handleFormSuccess = (customer: Party) => {
    setIsFormOpen(false);
    fetchCustomers();
    const action = selectedCustomer ? "updated" : "created";
    toast({
      title: `Customer ${action} successfully`,
      description: `${customer.name}'s details have been ${action}.`,
    });
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/parties/${customerToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete customer.");
      toast({
        title: "Customer Deleted",
        description: "The customer has been successfully removed.",
      });
      fetchCustomers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setCustomerToDelete(null);
    }
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {companies.length === 0 ? (
        <div className="w-full flex align-middle items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Company Setup Required
                </h3>
                <p className="text-gray-600 mb-5">
                  Contact us to enable your company account and access all
                  features.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
  <div className="flex flex-col items-center text-center space-y-3 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:space-y-0">
    <div>
      <CardTitle className="text-xl font-semibold">
        Manage Customer
      </CardTitle>
      <CardDescription className="max-w-md">
        A list of all your customer.
      </CardDescription>
    </div>

    <Button
      onClick={() => handleOpenForm()}
      className="w-full sm:w-auto lg:w-auto"
    >
      <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
    </Button>
  </div>
</CardHeader>

            <CardContent>
  {isLoading ? (
    <div className="flex justify-center items-center h-40">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ) : customers.length > 0 ? (
    <>
      {/* ✅ Desktop / Laptop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Details</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>GST / PAN</TableHead>
              <TableHead>TDS</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {customer.contactNumber || "N/A"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {customer.email || ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.address}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.city}, {customer.state}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      GSTIN: {customer.gstin || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      PAN: {customer.pan || "N/A"}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {customer.gstRegistrationType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        customer.isTDSApplicable
                          ? "bg-green-100 dark:bg-green-900/50"
                          : "bg-red-100 dark:bg-red-900/50"
                      )}
                    >
                      {customer.isTDSApplicable ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {customer.isTDSApplicable && (
                      <div className="text-xs text-muted-foreground">
                        {customer.tdsSection}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleOpenForm(customer)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDeleteDialog(customer)}
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


{/* ✅ Mobile Card View */}
<div className="md:hidden space-y-4">
  {customers.map((customer) => (
    <div
      key={customer._id}
      className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
            {customer.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {customer.gstRegistrationType}
            </Badge>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px]",
                customer.isTDSApplicable
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              )}
            >
              {customer.isTDSApplicable ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>
                TDS{" "}
                {customer.isTDSApplicable
                  ? "Applicable"
                  : "Not Applicable"}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleOpenForm(customer)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(customer)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4">
        {(customer.contactNumber || customer.email) && (
          <div className="flex flex-col items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {customer.contactNumber && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {customer.contactNumber}
                </span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {customer.email}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Address */}
        {customer.address && (
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {customer.address}
              </p>
              {(customer.city || customer.state) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {[customer.city, customer.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tax Information - Only show if GSTIN or PAN exists */}
      {(customer.gstin || customer.pan) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <h4 className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tax Information
          </h4>
          <div className="space-y-2">
            {customer.gstin && (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  GSTIN:
                </span>
                <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                  {customer.gstin}
                </span>
              </div>
            )}
            {customer.pan && (
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  PAN:
                </span>
                <span className="text-xs font-mono text-gray-800 dark:text-gray-200">
                  {customer.pan}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TDS Details */}
      {customer.isTDSApplicable && customer.tdsSection && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              TDS Section:
            </span>
            <span className="text-sm text-green-700 dark:text-green-400">
              {customer.tdsSection}
            </span>
          </div>
        </div>
      )}
    </div>
  ))}
</div>


    </>
  ) : (
    <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
      <Users className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No Customers Found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Get started by adding your first customer.
      </p>
      <Button className="mt-6" onClick={() => handleOpenForm()}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Customer
      </Button>
    </div>
  )}
</CardContent>

          </Card>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
              <DialogHeader className="p-6">
                <DialogTitle>
                  {selectedCustomer ? "Edit Customer" : "Create New Customer"}
                </DialogTitle>
                <DialogDescription>
                  {selectedCustomer
                    ? "Update the details for this customer."
                    : "Fill in the form to add a new customer."}
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                customer={selectedCustomer || undefined}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  customer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCustomer}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
