"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Package,
  Search,
  Edit,
  PlusCircle,
  Server,
  Boxes,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Service } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { ProductForm } from "../products/product-form";
import { usePermissions } from "@/contexts/permission-context";
import { useCompany } from "@/contexts/company-context";
import { Badge } from "../ui/badge";
import { ServiceForm } from "../services/service-form";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;



function StockEditForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: Product;
  onSuccess: (updatedProduct: Product) => void;
  onCancel: () => void;
}) {
  const [newStock, setNewStock] = React.useState(product.stocks ?? 0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/products/${product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stocks: newStock }),
        }
      );
      if (!res.ok) throw new Error("Failed to update stock.");
      const data = await res.json();
      toast({ title: "Stock updated successfully!" });
      onSuccess(data.product);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update stock",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
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
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProductStock() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = React.useState(false);

  const { toast } = useToast();
  const { permissions } = usePermissions();
  const { selectedCompanyId } = useCompany();

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const url = selectedCompanyId
        ? `${baseURL}/api/products?companyId=${selectedCompanyId}`
        : `${baseURL}/api/products?companyId=${selectedCompanyId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products.");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load products",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedCompanyId]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSuccess = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
    );
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleAddProductSuccess = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    setIsAddProductOpen(false);
    toast({
      title: "Product Created!",
      description: `${newProduct.name} added.`,
    });
  };

  const handleAddServiceSuccess = (newService: Service) => {
    const serviceAsProduct: Product = {
      _id: newService._id,
      name: newService.serviceName,
      type: "service",
      stocks: 0,
      createdByClient: newService.createdByClient,
    };

    setProducts((prev) => [...prev, serviceAsProduct]);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (
    !permissions?.canCreateProducts &&
    (permissions?.maxInventories ?? 0) === 0
  ) {
    return null;
  }

  return (
    <>
      <Card className="shadow-sm border rounded-xl">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">
                Product & Service Stock
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Current inventory levels
              </CardDescription>
            </div>
            {permissions?.canCreateProducts && (
              <div className="flex flex-wrap gap-3">
                {/* Add Product */}
                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setIsAddProductOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg rounded-2xl shadow-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Product</DialogTitle>
                      <DialogDescription>
                        Fill in the form to add a new product.
                      </DialogDescription>
                    </DialogHeader>
                    <ProductForm onSuccess={handleAddProductSuccess} />
                  </DialogContent>
                </Dialog>

                {/* Add Service */}
                <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setIsAddServiceOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg rounded-2xl shadow-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Service</DialogTitle>
                      <DialogDescription>
                        Fill in the form to add a new service.
                      </DialogDescription>
                    </DialogHeader>
                    <ServiceForm onSuccess={handleAddServiceSuccess} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9 pr-3 rounded-full shadow-sm focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* ✅ Desktop Table View */}
          <div className="hidden md:block">
            <ScrollArea className="h-72 rounded-md border">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product._id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          {product.type === "service" ? (
                            <Server className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          {product.name}
                          {product.type === "service" && (
                            <Badge variant="outline" className="ml-2 rounded-full">
                              Service
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.type === "service" ? (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          ) : (
                            <span className="font-bold text-lg">{product.stocks ?? 0}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {permissions?.canCreateProducts &&
                            product.type !== "service" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleEditClick(product)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">No Items Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm
                      ? `No items match "${searchTerm}".`
                      : "You haven't added any products or services yet."}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ✅ Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card
                  key={product._id}
                  className="p-4 shadow-md rounded-2xl border hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {product.type === "service" ? (
                        <Server className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Boxes className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        {product.type === "service" && (
                          <Badge variant="outline" className="mt-1 rounded-full text-xs">
                            Service
                          </Badge>
                        )}
                      </div>
                    </div>
                    {permissions?.canCreateProducts &&
                      product.type !== "service" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                  </div>
                  <div className="mt-3">
                    {product.type === "service" ? (
                      <span className="text-xs text-muted-foreground">No Stock</span>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Stock:{" "}
                        <span className="font-bold text-base">{product.stocks ?? 0}</span>
                      </p>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-semibold">No Items Found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? `No items match "${searchTerm}".`
                    : "You haven't added any products or services yet."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit stock dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Stock</DialogTitle>
            <DialogDescription>
              Update the stock quantity for the selected product.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <StockEditForm
              product={selectedProduct}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
