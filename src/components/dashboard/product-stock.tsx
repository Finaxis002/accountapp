
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Package, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';

function StockEditForm({ 
    product, 
    onSuccess,
    onCancel
}: { 
    product: Product, 
    onSuccess: (updatedProduct: Product) => void,
    onCancel: () => void,
}) {
    const [newStock, setNewStock] = React.useState(product.stock ?? 0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`http://localhost:5000/api/products/${product._id}`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ stock: newStock })
            });
            if (!res.ok) throw new Error('Failed to update stock.');
            const data = await res.json();
            toast({ title: "Stock updated successfully!" });
            onSuccess(data.product);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to update stock", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='space-y-4 py-4'>
                <div className="space-y-2">
                    <Label htmlFor="stock">Stock for {product.name}</Label>
                    <Input 
                        id="stock"
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(Number(e.target.value))}
                    />
                </div>
            </div>
            <DialogFooter>
                 <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </form>
    )
}

export function ProductStock() {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [products, setProducts] = React.useState<Product[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const { toast } = useToast();

    const fetchProducts = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const res = await fetch(`${baseURL}/api/products`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch products.");
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.products || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load products", description: error instanceof Error ? error.message : "Something went wrong." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    const handleUpdateSuccess = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        setIsDialogOpen(false);
        setSelectedProduct(null);
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Product Stock</CardTitle>
                            <CardDescription>Current inventory levels.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search products..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <Table>
                                <TableHeader className="sticky top-0 bg-card">
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Available Stock</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(product => (
                                        <TableRow key={product._id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="font-bold text-lg">{product.stocks ?? 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(product)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Stock
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {searchTerm ? `No products match "${searchTerm}".` : "You haven't added any products yet."}
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Stock</DialogTitle>
                        <DialogDescription>Update the stock quantity for the selected product.</DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <StockEditForm 
                            product={selectedProduct}
                            onSuccess={handleUpdateSuccess}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
