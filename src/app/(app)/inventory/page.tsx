"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MoreHorizontal,
  Edit,
  Trash2,
  PlusCircle,
  Package,
  Server,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Company, Product } from "@/lib/types";
import { ProductForm } from "@/components/products/product-form";
// ⬇️ import your real ServiceForm
import { ServiceForm } from "@/components/services/service-form";
import { usePermissions } from "@/contexts/permission-context";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Badge } from "@/components/ui/badge";

type Service = {
  _id: string;
  serviceName: string;
  createdAt?: string;
  updatedAt?: string;
  // add more fields if you have them (price, description, etc.)
};

export default function InventoryPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { permissions: userCaps, isLoading } = useUserPermissions();
  // Lists
  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);

  // Dialog states: product
  const [isProductFormOpen, setIsProductFormOpen] = React.useState(false);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(
    null
  );
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );

  // Dialog states: service
  const [isServiceFormOpen, setIsServiceFormOpen] = React.useState(false);
  const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(
    null
  );
  const [serviceToDelete, setServiceToDelete] = React.useState<Service | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);

  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const { toast } = useToast();
  const { permissions } = usePermissions();

  const fetchCompanies = React.useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/companies/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch companies.");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.companies || []);
    } catch (err) {
      // optional toast if you want
      console.error(err);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [baseURL]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Fetchers
  const fetchProducts = React.useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/products`, {
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
      setIsLoadingProducts(false);
    }
  }, [toast, baseURL]);

  const fetchServices = React.useCallback(async () => {
    setIsLoadingServices(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(`${baseURL}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch services.");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load services",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [toast, baseURL]);

  React.useEffect(() => {
    fetchProducts();
    fetchServices();
  }, [fetchProducts, fetchServices]);

  // Open forms
  const openCreateProduct = () => {
    setProductToEdit(null);
    setIsProductFormOpen(true);
  };
  const openCreateService = () => {
    setServiceToEdit(null);
    setIsServiceFormOpen(true);
  };
  const openEditProduct = (p: Product) => {
    setProductToEdit(p);
    setIsProductFormOpen(true);
  };
  const openEditService = (s: Service) => {
    setServiceToEdit(s);
    setIsServiceFormOpen(true);
  };

  // Success callbacks
  const onProductSaved = (saved: Product) => {
    setIsProductFormOpen(false);
    setProductToEdit(null);
    setProducts((prev) =>
      prev.some((p) => p._id === saved._id)
        ? prev.map((p) => (p._id === saved._id ? saved : p))
        : [...prev, saved]
    );
    toast({
      title: "Product saved",
      description: "Product has been saved successfully.",
    });
  };

  const onServiceSaved = (saved: Service) => {
    setIsServiceFormOpen(false);
    setServiceToEdit(null);
    setServices((prev) =>
      prev.some((s) => s._id === saved._id)
        ? prev.map((s) => (s._id === saved._id ? saved : s))
        : [...prev, saved]
    );
    toast({
      title: "Service saved",
      description: "Service has been saved successfully.",
    });
  };


  // Delete handlers
  const confirmDeleteProduct = (p: Product) => {
    setProductToDelete(p);
    setServiceToDelete(null);
    setIsAlertOpen(true);
  };
  const confirmDeleteService = (s: Service) => {
    setServiceToDelete(s);
    setProductToDelete(null);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      if (productToDelete) {
        const res = await fetch(
          `${baseURL}/api/products/${productToDelete._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to delete product.");
        setProducts((prev) =>
          prev.filter((p) => p._id !== productToDelete._id)
        );
        toast({ title: "Product deleted" });
      } else if (serviceToDelete) {
        const res = await fetch(
          `${baseURL}/api/services/${serviceToDelete._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to delete service.");
        setServices((prev) =>
          prev.filter((s) => s._id !== serviceToDelete._id)
        );
        toast({ title: "Service deleted" });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setProductToDelete(null);
      setServiceToDelete(null);
    }
  };

  // Render helpers
  const renderProductsTable = () => {
    if (isLoadingProducts) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first product to get started.
          </p>
          {(permissions?.canCreateProducts || userCaps?.canCreateInventory) && (
            <Button className="mt-6" onClick={openCreateProduct}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      );
    }
    return (


      <div className="space-y-6">
        {/* Table View for Larger Screens */}
        <div className="hidden sm:block">
          {/* Table Component */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-lg">{p.stocks ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    {p.createdAt
                      ? new Intl.DateTimeFormat("en-US").format(new Date(p.createdAt))
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => openEditProduct(p)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDeleteProduct(p)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards  product */}
        <div className="sm:hidden">
          {products.map((p) => (
            <div key={p._id} className="mb-4 bg-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {p.name}
                </div>
                <div className="text-lg font-bold">{p.stocks ?? 0}</div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  {p.createdAt
                    ? new Intl.DateTimeFormat("en-US").format(new Date(p.createdAt))
                    : "—"}
                </span>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditProduct(p)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => confirmDeleteProduct(p)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

    );
  };

  const renderServicesTable = () => {
    if (isLoadingServices) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    if (services.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
          <Server className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Services Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first service to get started.
          </p>
          {(permissions?.canCreateProducts || userCaps?.canCreateInventory) && (
            <Button className="mt-6" onClick={openCreateService}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>
      );
    }
    return (
     <div className="space-y-6">
      <div className="sm:hidden">
        {services.map((s) => (
          <div key={s._id} className="mb-4 bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="font-medium flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                {s.serviceName}
                <Badge variant="outline">Service</Badge>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                {s.createdAt
                  ? new Intl.DateTimeFormat("en-US").format(new Date(s.createdAt))
                  : "—"}
              </span>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditService(s)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => confirmDeleteService(s)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

            </div>
          </div>
        ))}
      </div>
      <div>
         <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s) => (
            <TableRow key={s._id}>
              <TableCell>
                <div className="font-medium flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  {s.serviceName}
                  <Badge variant="outline">Service</Badge>
                </div>
              </TableCell>
              <TableCell>
                {s.createdAt
                  ? new Intl.DateTimeFormat("en-US").format(
                      new Date(s.createdAt)
                    )
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openEditService(s)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDeleteService(s)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      </div>
    );
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // console.log("userCaps?.canCreateInventory", userCaps?.canCreateInventory);
  // console.log("permissions?.canCreateProducts", permissions?.canCreateProducts);
  // console.log("userCaps?.canCreateSaleEntries", userCaps?.canCreateSaleEntries);

  return (
    <div className="space-y-6">
      {companies.length === 0 ? (
        <div className="h-[80vh] w-full flex align-middle items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Icon Section */}
                <div className="mb-5 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-4 0H9m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12m4 0V9m0 12h4m0 0V9m0 12h2"
                    ></path>
                  </svg>
                </div>

                {/* Text Content */}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Company Setup Required
                </h3>
                <p className="text-gray-600 mb-5">
                  Contact us to enable your company account and access all
                  features.
                </p>

                {/* Call-to-Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                    +91-8989773689
                  </a>
                  <a
                    href="mailto:support@company.com"
                    className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Email Us
                  </a>
                </div>

                {/* Support Hours */}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {/* Content Section */}
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl font-bold tracking-tight">
                Inventory Management
              </h2>
              <p className="text-muted-foreground">
                Track and manage your products and services.
              </p>
            </div>

            {/* Buttons Section */}
            {(permissions?.canCreateProducts || userCaps?.canCreateInventory) && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={openCreateProduct}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
                <Button onClick={openCreateService}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </div>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="products" className="w-full">
                <div className="px-4 pt-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="products">
                      Products ({products.length})
                    </TabsTrigger>
                    <TabsTrigger value="services">
                      Services ({services.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="products" className="p-4 pt-2">
                  {renderProductsTable()}
                </TabsContent>

                <TabsContent value="services" className="p-4 pt-2">
                  {renderServicesTable()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Product Form */}
          <Dialog
            open={isProductFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setProductToEdit(null);
              setIsProductFormOpen(isOpen);
            }}
          >
            <DialogContent className="w-full max-w-[95%] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {productToEdit ? "Edit Product" : "Create New Product"}
                </DialogTitle>
                <DialogDescription>
                  {productToEdit
                    ? "Update the product details."
                    : "Fill in the form to add a new product."}
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                product={productToEdit || undefined}
                onSuccess={onProductSaved}
              />
            </DialogContent>
          </Dialog>

          {/* Service Form */}
          <Dialog
            open={isServiceFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setServiceToEdit(null);
              setIsServiceFormOpen(isOpen);
            }}
          >
            <DialogContent className="w-full max-w-[95%] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {serviceToEdit ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription>
                  {serviceToEdit
                    ? "Update the service details."
                    : "Fill in the form to add a new service."}
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                service={serviceToEdit || undefined}
                onSuccess={onServiceSaved}
              />
            </DialogContent>
          </Dialog>

          {/* Shared delete confirm (knows which one is set) */}
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the{" "}
                  {productToDelete ? "product" : "service"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
