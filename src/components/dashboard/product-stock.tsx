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
import { useUserPermissions } from "@/contexts/user-permissions-context";
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
      const res = await fetch(`${baseURL}/api/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stocks: newStock }),
      });
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
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = React.useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = React.useState(false);

  const { toast } = useToast();
  const { permissions } = usePermissions();
  const { selectedCompanyId } = useCompany();

  const { permissions: userCaps } = useUserPermissions();

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
    setIsAddProductOpen(false); // close only product dialog
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
      createdByClient: newService.createdByClient, // ✅ now valid
    };

    setProducts((prev) => [...prev, serviceAsProduct]);
    setIsAddServiceOpen(false); // close service dialog
    toast({
      title: "Service Created!",
      description: `${newService.serviceName} added.`,
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (
    !permissions?.canCreateProducts &&
    !userCaps?.canCreateInventory &&
    (permissions?.maxInventories ?? 0) === 0
  ) {
    return null;
  }

  const role = localStorage.getItem("role");

  return (
    <>
      <Card className="rounded-lg shadow-sm border-0 md:border md:shadow">
        <CardHeader className="px-4 py-5 sm:px-6 bg-muted/20 rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <CardTitle className="text-xl sm:text-2xl font-bold ">
                Product & Service Stock
              </CardTitle>
              <CardDescription className="mt-1 text-sm sm:text-base">
                Current inventory levels
              </CardDescription>
            </div>
            {(permissions?.canCreateProducts ||
              userCaps?.canCreateInventory) && (
              <div className="flex flex-row justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
                {/* Add Product */}
                <Dialog
                  open={isAddProductOpen}
                  onOpenChange={setIsAddProductOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 rounded-full px-4 shadow-sm sm:rounded-md sm:px-3"
                      onClick={() => setIsAddProductOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      <span className="sm:inline">
                        Product
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg max-w-sm overflow-y-auto">
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
                <Dialog
                  open={isAddServiceOpen}
                  onOpenChange={setIsAddServiceOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-full px-4 shadow-sm sm:rounded-md sm:px-3"
                      onClick={() => setIsAddServiceOpen(true)}
                    >
                      <Server className="h-4 w-4 mr-1" />
                      <span className="sm:inline">
                        Service
                      </span>
                    </Button>
                  </DialogTrigger>
                 <DialogContent className="sm:max-w-lg max-w-sm overflow-y-auto">
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
        <CardContent className="px-4 py-5 sm:px-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9 py-5 sm:py-2 rounded-xl sm:rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="h-80 sm:h-80 rounded-lg border">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length > 0 ? (

              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Unit</TableHead>
                        {role !== "user" ? (
                          <TableHead className="text-right">Actions</TableHead>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {product.type === "service" ? (
                              <Server className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                            {product.name}
                            {product.type === "service" && (
                              <Badge variant="outline">Service</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.type === "service" ? (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            ) : (
                              <span className="font-bold text-lg">
                                {product.stocks ?? 0}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.type === "service" ? (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            ) : (
                              <span className="font-bold text-sm">
                                {product.unit ?? "NA"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {role !== "user" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(product)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                  Edit Stock
                                </span>
                                <span className="sm:hidden">Edit</span>
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {product.type === "service" ? (
                            <Server className="h-5 w-5 text-primary/70" />
                          ) : (
                            <Package className="h-5 w-5 text-primary/70" />
                          )}
                          <div>
                            <h3 className="font-semibold text-base">
                              {product.name}
                            </h3>
                            {product.type === "service" && (
                              <Badge
                                variant="secondary"
                                className="text-xs mt-1"
                              >
                                Service
                              </Badge>
                            )}
                          </div>
                        </div>

                        {product.type !== "service" && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              {product.stocks ?? 0}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              in stock
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        {role !== "user" && product.type !== "service" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full"
                            onClick={() => handleEditClick(product)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                <div className="rounded-full bg-muted/30 p-4 mb-4">
                  <Package className="h-8 w-8 text-muted-foreground sm:h-12 sm:w-12" />
                </div>
                <h3 className="mt-2 text-lg font-semibold">No Items Found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-[240px] mx-auto">

                  {searchTerm
                    ? `No items match "${searchTerm}".`
                    : "You haven't added any products or services yet."}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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
