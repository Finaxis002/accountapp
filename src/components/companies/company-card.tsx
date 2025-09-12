"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client, Company } from "@/lib/types";
import { Building, Edit, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { AdminCompanyForm } from "./admin-company-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CompanyCardProps {
  company: Company;
  clientName?: string;
  onEdit?: () => void;
  onDelete: () => void;
}

export function CompanyCard({
  company,
  clientName,
  onEdit,
  onDelete,
}: CompanyCardProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(
    null
  );
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

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

  const onFormSubmit = () => {
    setIsDialogOpen(false);
    fetchAllData();
  };

   const handleEdit = (company: Company) => {
      setSelectedCompany(company);
      setIsDialogOpen(true);
    };

  return (
    <>
      <Card className="flex flex-col w-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{company.businessName}</CardTitle>
              <CardDescription>{company.businessType}</CardDescription>
              {clientName && (
                <Badge variant="outline" className="mt-2">
                  Client: {clientName}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 px-0 text-sm">
          <ScrollArea className="h-72">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium w-[180px]">
                    Owner
                  </TableCell>
                  <TableCell>{company.companyOwner}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    Contact Number
                  </TableCell>
                  <TableCell>{company.mobileNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    Registration No.
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                      {company.registrationNumber}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    GSTIN
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                      {company.gstin || "N/A"}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    PAN Number
                  </TableCell>
                  <TableCell>
                    <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                      {company.PANNumber || "N/A"}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    Address
                  </TableCell>
                  <TableCell>
                    {company.address}, {company.City}, {company.addressState},{" "}
                    {company.Country} - {company.Pincode}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    Email
                  </TableCell>
                  <TableCell>{company.emailId || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground font-medium">
                    E-Way Bill
                  </TableCell>
                  <TableCell>
                    {company.ewayBillApplicable ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="mt-auto border-t p-2 flex justify-end gap-1">
         <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>

            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
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
    </>
  );
}
