
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MoreHorizontal, Edit, Trash2, PlusCircle, Building, Check, X, FileText, Hash, BadgeIndianRupee } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Vendor } from '@/lib/types';
import { VendorForm } from '@/components/vendors/vendor-form';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

export function VendorSettings() {
    const baseURL = process.env.REACT_APP_BASE_URL;
    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
    const [vendorToDelete, setVendorToDelete] = React.useState<Vendor | null>(null);
    const { toast } = useToast();

    const fetchVendors = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/vendors`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch vendors.");
            const data = await res.json();
            setVendors(Array.isArray(data) ? data : data.vendors || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load vendors", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleOpenForm = (vendor: Vendor | null = null) => {
        setSelectedVendor(vendor);
        setIsFormOpen(true);
    };
    
    const handleOpenDeleteDialog = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsAlertOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchVendors();
        const action = selectedVendor ? 'updated' : 'created';
        toast({ title: `Vendor ${action} successfully`, description: `The vendor details have been ${action}.` });
    }

    const handleDeleteVendor = async () => {
        if (!vendorToDelete) return;
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/vendors/${vendorToDelete._id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete vendor.');
            toast({ title: "Vendor Deleted", description: "The vendor has been successfully removed." });
            fetchVendors();
        } catch (error) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsAlertOpen(false);
            setVendorToDelete(null);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle>Manage Vendors</CardTitle>
                            <CardDescription>A list of all your vendors and suppliers.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className='mr-2 h-4 w-4' /> Add Vendor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : vendors.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor Details</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Tax Information</TableHead>
                                    <TableHead>TDS</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendors.map(vendor => (
                                    <TableRow key={vendor._id}>
                                        <TableCell>
                                            <div className='font-medium'>{vendor.vendorName}</div>
                                            <div className='text-muted-foreground text-xs'>{vendor.contactNumber || 'N/A'}</div>
                                            <div className='text-muted-foreground text-xs'>{vendor.email || ''}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='text-sm'>{vendor.address}</div>
                                            <div className='text-xs text-muted-foreground'>{vendor.city}, {vendor.state}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <FileText className='h-4 w-4 text-muted-foreground' />
                                                <span className='font-mono text-xs'>GSTIN: {vendor.gstin || 'N/A'}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                 <Hash className='h-4 w-4 text-muted-foreground' />
                                                <span className='font-mono text-xs'>PAN: {vendor.pan || 'N/A'}</span>
                                            </div>
                                            <Badge variant="outline" className='mt-2 text-xs'>{vendor.gstRegistrationType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", vendor.isTDSApplicable ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50")}>
                                                    {vendor.isTDSApplicable ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                                                </div>
                                                {vendor.isTDSApplicable && (
                                                    <div className="text-xs">
                                                        {/* <div>{vendor.tdsRate}%</div> */}
                                                        <div className="text-muted-foreground">{vendor.tdsSection}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleOpenForm(vendor)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDeleteDialog(vendor)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                            <Building className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Vendors Found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first vendor.</p>
                            <Button className="mt-6" onClick={() => handleOpenForm()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Vendor
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
                    <DialogHeader className="p-6">
                        <DialogTitle>{selectedVendor ? 'Edit Vendor' : 'Create New Vendor'}</DialogTitle>
                        <DialogDescription>{selectedVendor ? 'Update the details for this vendor.' : 'Fill in the form to add a new vendor.'}</DialogDescription>
                    </DialogHeader>
                    <VendorForm vendor={selectedVendor || undefined} onSuccess={handleFormSuccess} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the vendor.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVendor}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
