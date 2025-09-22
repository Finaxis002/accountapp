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
import { useUserPermissions } from "@/contexts/user-permissions-context";

export function CustomerSettings({ canBlur = false }: { canBlur?: boolean }) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [customers, setCustomers] = React.useState<Party[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Party | null>(
    null
  );
  const [customerToDelete, setCustomerToDelete] = React.useState<Party | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const { toast } = useToast();

  const { permissions: userCaps } = useUserPermissions();
  const canShowCustomers = userCaps?.canShowCustomers ?? false;

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
                <div className={cn({ "blur-sm": !canShowCustomers })}>
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
                                    onClick={() =>
                                      handleOpenDeleteDialog(customer)
                                    }
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

                  {/* ✅ Mobile / Tablet Card View for Customers */}
                  <div className="block md:hidden space-y-4">
                    {customers.map((customer) => (
                      <div
                        key={customer._id}
                        className="border rounded-xl p-4 shadow-sm bg-white dark:bg-gray-900"
                      >
                        {/* Name */}
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-100">
                              <User className="h-3.5 w-3.5 text-blue-600" />
                            </span>
                            <span className="font-medium text-gray-600 ">
                              Customer
                            </span>
                          </div>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                            {customer.name}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* Contact */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-green-100 dark:bg-green-100">
                              <Phone className="h-3.5 w-3.5 text-green-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              Contact
                            </span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">
                            {customer.contactNumber || "N/A"}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* Email */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-100">
                              <Mail className="h-3.5 w-3.5 text-indigo-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              Email
                            </span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200 truncate max-w-[150px] text-right">
                            {customer.email || "N/A"}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* Address */}
                        <div className="flex justify-between items-start text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-red-100 dark:bg-red-100">
                              <MapPin className="h-3.5 w-3.5 text-red-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              Address
                            </span>
                          </div>
                          <span className="text-gray-800 dark:text-gray-200 text-right max-w-[150px]">
                            {customer.address}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* GSTIN */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-100">
                              <FileBadge className="h-3.5 w-3.5 text-orange-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              GSTIN
                            </span>
                          </div>
                          <span className="font-mono">
                            {customer.gstin || "N/A"}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* PAN */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-100">
                              <IdCard className="h-3.5 w-3.5 text-teal-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              PAN
                            </span>
                          </div>
                          <span className="font-mono">
                            {customer.pan || "N/A"}
                          </span>
                        </div>
                        <hr className="my-2" />

                        {/* TDS */}
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-100">
                              <FileText className="h-3.5 w-3.5 text-yellow-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              TDS
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {customer.isTDSApplicable ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            {customer.isTDSApplicable && (
                              <span className="text-muted-foreground">
                                {customer.tdsSection}
                              </span>
                            )}
                          </div>
                        </div>
                        <hr className="my-2" />

                        {/* Actions - unchanged */}
                        {/* Actions */}
                        <div className="flex justify-between items-center text-xs">
                          {/* Left side - label */}
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-100">
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            </span>
                            <span className="font-medium text-gray-600">
                              Actions
                            </span>
                          </div>

                          {/* Right side - 3 dots dropdown */}
                          <div className="flex justify-end">
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
                                  onClick={() =>
                                    handleOpenDeleteDialog(customer)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No Customers Found
                  </h3>
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
