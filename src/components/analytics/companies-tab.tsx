
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Hash, FileText, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Company, Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CompaniesTabProps {
    selectedClientId: string;
    selectedClient: Client;
}

export function CompaniesTab({ selectedClientId, selectedClient }: CompaniesTabProps) {
    const baseURL = process.env.REACT_APP_BASE_URL;
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isCompaniesLoading, setIsCompaniesLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchCompanies(clientId: string) {
          if (!clientId) return;
          setIsCompaniesLoading(true);
          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/companies/by-client/${clientId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch companies for the selected client.");
            const data = await res.json();
            setCompanies(data);
          } catch (error) {
            toast({ variant: "destructive", title: "Failed to load companies", description: error instanceof Error ? error.message : "Something went wrong." });
          } finally {
            setIsCompaniesLoading(false);
          }
        }
        fetchCompanies(selectedClientId);
      }, [selectedClientId, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Companies managed by {selectedClient.contactName}.</CardDescription>
            </CardHeader>
            <CardContent>
                {isCompaniesLoading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : companies.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Owner & Contact</TableHead>
                                <TableHead>Registration no.</TableHead>
                                <TableHead>GSTIN</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map(company => (
                                <TableRow key={company._id}>
                                    <TableCell><div className="font-semibold">{company.companyName}</div><div className="text-xs text-muted-foreground">{company.companyType}</div></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4 text-muted-foreground"/><span className="text-sm">{company.companyOwner}</span></div>
                                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><span className="text-sm">{company.contactNumber}</span></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 mb-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"><Hash className="h-4 w-4 text-muted-foreground"/><span className="text-sm font-mono ">{company.registrationNumber}</span></div>
                                      
                                    </TableCell>

                                    <TableCell >
                                        <div className="flex items-center px-2 py-0.5 rounded gap-2 bg-green-500/10 text-green-700 dark:text-green-300"><FileText className="h-4 w-4 text-muted-foreground"/><span className="text-sm font-mono  ">{company.gstin || 'N/A'}</span></div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No companies found for this client.</p>
                )}
            </CardContent>
        </Card>
    )
}
