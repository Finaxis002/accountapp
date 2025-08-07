
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Package, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';

export function ProductStock() {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
    const [products, setProducts] = React.useState<Product[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchProducts = async () => {
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
        };

        fetchProducts();
    }, [toast]);

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
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
                                    <TableHead className="text-right">Available Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => (
                                    <TableRow key={product._id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right font-bold text-lg">{product.stock ?? 0}</TableCell>
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
    );
}

