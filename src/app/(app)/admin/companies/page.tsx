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
import { PlusCircle, Building, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCompanyForm } from "@/components/companies/admin-company-form";
import type { Company, Client } from "@/lib/types";
import { CompanyCard } from "@/components/companies/company-card";
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
import { useToast } from "@/hooks/use-toast";

export default function AdminCompaniesPage() { 
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(
    null
  );
  const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(
    null
  );
  const { toast } = useToast();

  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [companiesRes, clientsRes] = await Promise.all([
        fetch(`${baseURL}/api/companies/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseURL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!companiesRes.ok || !clientsRes.ok) {
        const errorData = !companiesRes.ok
          ? await companiesRes.json()
          : await clientsRes.json();
        throw new Error(errorData.message || "Failed to fetch data.");
      }

      const companiesData = await companiesRes.json();
      const clientsData = await clientsRes.json();

      setCompanies(companiesData);
      setClients(clientsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddNew = () => {
    setSelectedCompany(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `${baseURL}/api/companies/${companyToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete company.");
      }
      toast({
        title: "Company Deleted",
        description: `${companyToDelete.businessName} has been successfully deleted.`,
      });
      fetchAllData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setCompanyToDelete(null);
    }
  };

  const onFormSubmit = () => {
    setIsDialogOpen(false);
    fetchAllData();
  };

  const getClientInfo = (clientIdentifier: string | Client | undefined) => {
    if (!clientIdentifier) return { name: "N/A", email: "N/A" };

    let clientId: string;
    if (
      typeof clientIdentifier === "object" &&
      clientIdentifier !== null &&
      "contactName" in clientIdentifier
    ) {
      return {
        name: clientIdentifier.contactName,
        email: clientIdentifier.email || "N/A",
      };
    } else if (
      typeof clientIdentifier === "object" &&
      clientIdentifier !== null &&
      typeof (clientIdentifier as Client)._id === "string"
    ) {
      clientId = (clientIdentifier as Client)._id;
    } else {
      clientId = String(clientIdentifier);
    }

    const client = clients.find((c) => String(c._id) === clientId);
    return {
      name: client?.contactName || "N/A",
      email: client?.email || "N/A",
    };
  };

  return (
    <div className="pt-16 px-2 sm:px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Company Management
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage all companies across all clients.
          </p>
        </div>

        <Button onClick={handleAddNew} size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-0 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Create Company</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6">
            <DialogTitle>
              {selectedCompany ? "Edit Company" : "Create New Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? `Update the details for ${selectedCompany.businessName}.`
                : "Fill in the form to create a new company for a client."}
            </DialogDescription>
          </DialogHeader>
          <AdminCompanyForm
            company={selectedCompany || undefined}
            clients={clients}
            onFormSubmit={onFormSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company and all associated data for{" "}
              {companyToDelete?.businessName}.
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

      {/* Companies List */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                clientName={
                  getClientInfo(company.selectedClient || company.client).name
                }
                onEdit={() => handleEdit(company)}
                onDelete={() => handleDelete(company)}
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-6 sm:p-12 border-dashed text-center">
            <Building className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg sm:text-xl font-semibold">
              No Companies Found
            </h3>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Get started by creating the first company.
            </p>
            <Button className="mt-4 sm:mt-6" onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Company ..
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}           