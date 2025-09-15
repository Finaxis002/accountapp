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


function MobileCompanyCard({
  company,
  onEdit,
  onDelete,
  getClientInfo,
}: {
  company: Company;
  onEdit: (c: Company) => void;
  onDelete: (c: Company) => void;
  getClientInfo: (c: any) => { name: string; email?: string };
}) {
  const { name, email } =
    getClientInfo(company.selectedClient || (company as any).client);

  const [open, setOpen] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 bg-gray-200">
        {/* TOP: essential info only */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight truncate">
              {company?.businessName || "—"}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {company?.businessType || "—"}
            </CardDescription>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Client name */}
              <span className="text-[11px] px-2 py-0.5 rounded bg-secondary">
                {name || "N/A"}
              </span>
              {/* Phone (if available) */}
              {company?.mobileNumber ? (
                <span className="text-[11px] px-2 py-0.5 rounded bg-secondary">
                  {company.mobileNumber}
                </span>
              ) : null}
              {/* GST (show only if present) */}
              {company?.gstin ? (
                <span className="text-[11px] px-2 py-0.5 rounded bg-secondary">
                  GST: {company.gstin}
                </span>
              ) : null}
            </div>
          </div>

          {/* Toggle more/less */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-expanded={open}
            onClick={() => setOpen((p) => !p)}
            aria-label={open ? "Hide details" : "Show details"}
            title={open ? "Hide details" : "Show details"}
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* COLLAPSIBLE DETAILS */}
      <CardContent
        className={`px-4  bg-gray-300 pb-4 pt-2 transition-[grid-template-rows] duration-200 ${
          open ? "grid grid-rows-[1fr]" : "grid grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registration No.</span>
              <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                {company?.registrationNumber || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client Email</span>
              <span className="truncate max-w-[55%] text-right">
                {email || "—"}
              </span>
            </div>

           

            {/* Actions inside the expanded section */}
            <div className="pt-1 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(company)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(company)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function AdminCompaniesPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL as string;
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
  }, [toast, baseURL]);

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
const renderCardGrid = (gridClass = "grid grid-cols-1 gap-4") => (
  <div className={gridClass}>
    {companies.map((company) => (
      <CompanyCard
        key={company._id}
        company={company}
        clientName={getClientInfo(company.selectedClient || company.client).name}
        onEdit={() => handleEdit(company)}
        onDelete={() => handleDelete(company)}
      />
    ))}
  </div>
);
  return (
    <div className="space-y-6">
     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
      Company Management
    </h2>
    <p className="text-sm sm:text-base text-muted-foreground">
      Manage all companies across all clients.
    </p>
  </div>
  
  <div className="flex items-center justify-between gap-2">
    {/* View mode toggle - hidden on small screens if not needed */}
    {/* <div className="hidden sm:flex items-center gap-1 rounded-md bg-secondary p-1">

      <Button
        variant={viewMode === "card" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("card")}
        className="h-8 w-8"
        aria-label="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setViewMode("list")}
        className="h-8 w-8"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div> */}

    
    <Button onClick={handleAddNew} size="sm" className="sm:w-auto">
  <PlusCircle className="mr-0 sm:mr-2 h-4 w-4" />
  <span className="hidden sm:inline">Create Company</span>
  <span className="sm:hidden">Add</span>
</Button>
  </div>
</div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl  grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
          <DialogHeader className="p-6">
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

     <div>
  {isLoading ? (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ) : companies.length > 0 ? (
    <>
      {/* 📱 Mobile (< sm): hamesha cards */}
     {/* 📱 Mobile (< sm): always show the compact card with down-arrow */}
<div className="sm:hidden space-y-4">
  {companies.map((company) => (
    <MobileCompanyCard
      key={company._id}
      company={company}
      onEdit={handleEdit}
      onDelete={handleDelete}
      getClientInfo={(c: any) =>
        getClientInfo((c as any) || (company as any).client)
      }
    />
  ))}
</div>

      {/* 💻 sm aur upar: card/list toggle follow kare */}
      <div className="hidden sm:block">
        {viewMode === "card" ? (
          renderCardGrid("grid gap-6 md:grid-cols-1 lg:grid-cols-2")
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
               <TableHeader>
  <TableRow className="bg-gray-300 hover:bg-gray-300">
      <TableHead className="text-black">Company</TableHead>
      <TableHead className="text-black">Assigned Client</TableHead>
      <TableHead className="text-black">Owner & Contact</TableHead>
      <TableHead className="text-black">Identifiers</TableHead>
      <TableHead className="text-right ">Actions</TableHead>
    </TableRow>
  </TableHeader>
                <TableBody>
                  {companies.map((company) => {
                    const clientInfo = getClientInfo(company.selectedClient || company.client);
                    return (
                      <TableRow
                       key={company._id}
                       className="transition-colors duration-200 hover:bg-gray-200">
                        <TableCell>
                          <div className="font-semibold">{company.businessName}</div>
                          <div className="text-xs text-muted-foreground">{company.businessType}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{clientInfo.name}</div>
                          <div className="text-xs text-muted-foreground">{clientInfo.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4  text-green-900" />
                            <span className="text-sm text-green-800">{company.mobileNumber}</span>
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
                        <TableCell className="text-right space-x-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleEdit(company)}
     className=" bg-blue-500 hover:bg-blue-700  text-white transition-colors"
  >
    <Edit className="mr-1 h-4 w-4 " />
  </Button>

  <Button
  size="sm"
  onClick={() => handleDelete(company)}
  className="bg-red-400 hover:bg-red-700 text-white transition-colors "
>
  <Trash2 className="mr-1 h-4 w-4" />
</Button>
</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
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
