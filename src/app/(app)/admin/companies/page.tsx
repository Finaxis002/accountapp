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
  PlusCircle,
  Building,
  Edit,
  Trash2,
  List,
  LayoutGrid,
  Loader2,
  User,
  Phone,
  Hash,
  FileText as FileTextIcon,
  MoreHorizontal,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function AdminCompaniesPage() {
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
  const [viewMode, setViewMode] = React.useState<"card" | "list">("list");
  const { toast } = useToast();

  const fetchAllData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const [companiesRes, clientsRes] = await Promise.all([
        fetch("http://localhost:5000/api/companies/all", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/clients", {
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
        `http://localhost:5000/api/companies/${companyToDelete._id}`,
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
        description: `${companyToDelete.companyName} has been successfully deleted.`,
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
      "_id" in clientIdentifier
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Company Management
          </h2>
          <p className="text-muted-foreground">
            Manage all companies across all clients.
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
            Create Company
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Edit Company" : "Create New Company"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany
                ? `Update the details for ${selectedCompany.companyName}.`
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              company and all associated data for {companyToDelete?.companyName}
              .
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

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length > 0 ? (
          viewMode === "card" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard
                  key={company._id}
                  company={company}
                  clientName={getClientInfo(company.client).name}
                  onEdit={() => handleEdit(company)}
                  onDelete={() => handleDelete(company)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Assigned Client</TableHead>
                      <TableHead>Owner & Contact</TableHead>
                      <TableHead>Identifiers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => {
                      const clientInfo = getClientInfo(company.client);
                      return (
                        <TableRow key={company._id}>
                          <TableCell>
                            <div className="font-semibold">
                              {company.companyName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {company.companyType}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {clientInfo.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {clientInfo.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {company.companyOwner}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {company.contactNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                                {company.registrationNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                                {company.gstin || "N/A"}
                              </span>
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
                                  onClick={() => handleEdit(company)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(company)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 border-dashed">
            <Building className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Companies Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating the first company.
            </p>
            <Button className="mt-6" onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Company
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
