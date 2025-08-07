
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreHorizontal, Edit, Trash2, PlusCircle, Users, Check, X, FileText, Hash, BadgeIndianRupee } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Party } from '@/lib/types';
import { CustomerForm } from '@/components/customers/customer-form';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export function CustomerSettings() {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [customers, setCustomers] = React.useState<Party[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedCustomer, setSelectedCustomer] = React.useState<Party | null>(null);
    const [customerToDelete, setCustomerToDelete] = React.useState<Party | null>(null);
    const { toast } = useToast();

    const fetchCustomers = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/parties`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch customers.");
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : data.parties || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load customers", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

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

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchCustomers();
        const action = selectedCustomer ? 'updated' : 'created';
        toast({ title: `Customer ${action} successfully`, description: `The customer details have been ${action}.` });
    }

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/parties/${customerToDelete._id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete customer.');
            toast({ title: "Customer Deleted", description: "The customer has been successfully removed." });
            fetchCustomers();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsAlertOpen(false);
            setCustomerToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle>Manage Customers</CardTitle>
                            <CardDescription>A list of all your customers.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className='mr-2 h-4 w-4' /> Add Customer
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : customers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer Details</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Tax Information</TableHead>
                                    <TableHead>TDS</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(customer => (
                                    <TableRow key={customer._id}>
                                        <TableCell>
                                            <div className='font-medium'>{customer.name}</div>
                                            <div className='text-muted-foreground text-xs'>{customer.contactNumber || 'N/A'}</div>
                                            <div className='text-muted-foreground text-xs'>{customer.email || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='text-sm'>{customer.address}</div>
                                            <div className='text-xs text-muted-foreground'>{customer.city}, {customer.state}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <FileText className='h-4 w-4 text-muted-foreground' />
                                                <span className='font-mono text-xs'>GSTIN: {customer.gstin || 'N/A'}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                 <Hash className='h-4 w-4 text-muted-foreground' />
                                                <span className='font-mono text-xs'>PAN: {customer.pan || 'N/A'}</span>
                                            </div>
                                            <Badge variant="outline" className='mt-2 text-xs'>{customer.gstRegistrationType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", customer.isTDSApplicable ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50")}>
                                                    {customer.isTDSApplicable ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                                </div>
                                                {customer.isTDSApplicable && (
                                                    <div className="text-xs">
                                                        {/* <div>{customer.tdsRate}%</div> */}
                                                        <div className="text-muted-foreground">{customer.tdsSection}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenForm(customer)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDeleteDialog(customer)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Customers Found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first customer.</p>
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
                        <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Create New Customer'}</DialogTitle>
                        <DialogDescription>{selectedCustomer ? 'Update the details for this customer.' : 'Fill in the form to add a new customer.'}</DialogDescription>
                    </DialogHeader>
                    <CustomerForm customer={selectedCustomer || undefined} onSuccess={handleFormSuccess} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the customer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
