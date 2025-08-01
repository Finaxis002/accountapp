
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Building, Edit, Trash2, List, LayoutGrid, Loader2, User, Phone, Hash, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyForm } from '@/components/companies/company-form';
import type { Company } from "@/lib/types";
import { CompanyCard } from '@/components/companies/company-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export default function CompaniesPage() {
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [companyToDelete, setCompanyToDelete] = React.useState<Company | null>(null);
    const [viewMode, setViewMode] = React.useState<'card' | 'list'>('card');
    const { toast } = useToast();

    const fetchCompanies = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch("http://localhost:5000/api/companies/my", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch companies.");
            }
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to load companies",
                description: error instanceof Error ? error.message : "Something went wrong."
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

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
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Authentication token not found.");

            const res = await fetch(`http://localhost:5000/api/companies/${companyToDelete._id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete company.");
            }
            toast({
                title: "Company Deleted",
                description: `${companyToDelete.companyName} has been successfully deleted.`,
            });
            fetchCompanies();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error instanceof Error ? error.message : "Something went wrong."
            });
        } finally {
            setIsAlertOpen(false);
            setCompanyToDelete(null);
        }
    };

    const onFormSubmit = () => {
        setIsDialogOpen(false);
        fetchCompanies();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
                <p className="text-muted-foreground">
                    Manage all your business entities in one place.
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
                        Add Company
                    </Button>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                    <DialogDescription>
                    {selectedCompany ? `Update the details for ${selectedCompany.companyName}.` : 'Fill in the form below to add a new company.'}
                    </DialogDescription>
                </DialogHeader>
                <CompanyForm company={selectedCompany || undefined} onFormSubmit={onFormSubmit} />
                </DialogContent>
            </Dialog>

             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the company
                     and all associated data for {companyToDelete?.companyName}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : companies.length > 0 ? (
                    viewMode === 'card' ? (
                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {companies.map(company => (
                               <CompanyCard 
                                    key={company._id} 
                                    company={company}
                                    onEdit={() => handleEdit(company)}
                                    onDelete={() => handleDelete(company)}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Owner & Contact</TableHead>
                                        <TableHead>Registration No.</TableHead>
                                        <TableHead>GSTIN</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map(company => (
                                        <TableRow key={company._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Building className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{company.companyName}</p>
                                                        <p className="text-xs text-muted-foreground">{company.companyType}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                             <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-blue-500/10 rounded-md">
                                                           <User className="h-3 w-3 text-blue-500" />
                                                        </div>
                                                        <span className="text-sm">{company.companyOwner}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 bg-green-500/10 rounded-md">
                                                            <Phone className="h-3 w-3 text-green-500" />
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{company.contactNumber}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                 <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="font-mono bg-secondary/50">
                                                        <Hash className="mr-2 h-3 w-3" />
                                                        {company.registrationNumber}
                                                    </Badge>
                                                   
                                                 </div>
                                            </TableCell>
                                            <TableCell>
                                                {company.gstin ? (
                                                    <Badge variant="outline" className="font-mono bg-yellow-50 text-yellow-700">
                                                        <FileText className="mr-2 h-3 w-3" />
                                                        {company.gstin}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(company)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 border-dashed">
                        <Building className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No Companies Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first company.</p>
                        <Button className="mt-6" onClick={handleAddNew}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Company
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
