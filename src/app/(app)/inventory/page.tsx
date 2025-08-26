"use client";

import * as React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Edit,
  Trash2,
  PlusCircle,
  Package,
  Server,
} from "lucide-react";
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
import { ServiceForm } from "@/components/services/service-form";
import { usePermissions } from "@/contexts/permission-context";
import { useUserPermissions } from "@/contexts/user-permissions-context";
import { Badge } from "@/components/ui/badge";

type Service = {
  _id: string;
  serviceName: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function InventoryPage() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const { permissions: userCaps, isLoading } = useUserPermissions();
  // Lists

  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);

  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);

  const [isProductFormOpen, setIsProductFormOpen] = React.useState(false);
  const [productToEdit, setProductToEdit] = React.useState<Product | null>(
    null
  );
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );

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
      console.error(err);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [baseURL]);

  React.useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

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
                  ? new Intl.DateTimeFormat("en-US").format(
                      new Date(p.createdAt)
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
    );
  };


  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }


  console.log("userCaps?.canCreateInventory" , userCaps?.canCreateInventory)
  console.log("permissions?.canCreateProducts" , permissions?.canCreateProducts)
    console.log("userCaps?.canCreateSaleEntries",userCaps?.canCreateSaleEntries)

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-8 max-w-full overflow-x-hidden min-h-screen">
      {companies.length === 0 ? (
        <div className="h-[80vh] w-full flex align-middle items-center justify-center">
          {/* Company setup required card can be placed here */}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Inventory Management
              </h2>
              <p className="text-muted-foreground">
                Track and manage your products and services.
              </p>
            </div>

            {permissions?.canCreateProducts && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start max-w-full">
                <Button
                  variant="outline"
                  onClick={openCreateProduct}
                  className="whitespace-nowrap"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
                <Button
                  onClick={openCreateService}
                  className="whitespace-nowrap"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </div>
            )}
          </div>

          <Card className="overflow-visible">
            <CardContent className="p-0">
              <Tabs defaultValue="products" className="w-full">
                <div className="px-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <TabsList>
                    <TabsTrigger value="products">
                      Products ({products.length})
                    </TabsTrigger>
                    <TabsTrigger value="services">
                      Services ({services.length})
                    </TabsTrigger>
                  </TabsList>


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

                <TabsContent value="products" className="p-4 pt-2">
                  {isLoadingProducts ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">
                        No Products Found
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create your first product to get started.
                      </p>
                      {permissions?.canCreateProducts && (
                        <Button className="mt-6" onClick={openCreateProduct}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Card view for small devices */}
                      <div className="grid grid-cols-1 gap-4 md:hidden">
                        {products.map((p) => (
                          <Card
                            key={p._id}
                            className="flex flex-col min-w-0 break-words"
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <Package className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-bold text-lg truncate max-w-[calc(100%-8rem)]">
                                  {p.name ?? "Unnamed Product"}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="flex-shrink-0"
                                >
                                  Product
                                </Badge>
                              </div>

                              <p className="text-sm truncate">
                                Stocks:{" "}
                                <span className="font-medium">
                                  {p.stocks != null ? p.stocks : "N/A"}
                                </span>
                              </p>

                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Created:{" "}
                                {p.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "—"}
                              </p>
                            </CardContent>

                            <CardFooter className="mt-auto border-t p-2 flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditProduct(p)}
                                className="whitespace-nowrap"
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteProduct(p)}
                                className="whitespace-nowrap"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>

                      {/* Table view for medium+ devices */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full table-auto border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left p-2 border-b">
                                Product
                              </th>
                              <th className="text-left p-2 border-b">Stock</th>
                              <th className="text-left p-2 border-b">
                                Created At
                              </th>
                              <th className="text-right p-2 border-b">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((p) => (
                              <tr key={p._id} className="hover:bg-gray-50">
                                <td className="p-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{p.name}</span>
                                  </div>
                                </td>
                                <td className="p-2 border-b">
                                  {p.stocks ?? 0}
                                </td>
                                <td className="p-2 border-b whitespace-nowrap">
                                  {p.createdAt
                                    ? new Intl.DateTimeFormat("en-US").format(
                                        new Date(p.createdAt)
                                      )
                                    : "—"}
                                </td>
                                <td className="p-2 border-b text-right whitespace-nowrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => openEditProduct(p)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => confirmDeleteProduct(p)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="services" className="p-4 pt-2">
                  {isLoadingServices ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                      <Server className="h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">
                        No Services Found
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Create your first service to get started.
                      </p>
                      {permissions?.canCreateProducts && (
                        <Button className="mt-6" onClick={openCreateService}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Service
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Card view for small devices */}
                      <div className="grid grid-cols-1 gap-4 md:hidden">
                        {services.map((s) => (
                          <Card
                            key={s._id}
                            className="flex flex-col min-w-0 break-words"
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <Server className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-bold text-lg truncate max-w-[calc(100%-8rem)]">
                                  {s.serviceName ?? "Unnamed Service"}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="flex-shrink-0"
                                >
                                  Service
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                Created:{" "}
                                {s.createdAt
                                  ? new Date(s.createdAt).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "—"}
                              </p>
                            </CardContent>

                            <CardFooter className="mt-auto border-t p-2 flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditService(s)}
                                className="whitespace-nowrap"
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteService(s)}
                                className="whitespace-nowrap"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>

                      {/* Table view for medium+ devices */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full table-auto border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left p-2 border-b">
                                Service
                              </th>
                              <th className="text-left p-2 border-b">
                                Created At
                              </th>
                              <th className="text-right p-2 border-b">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {services.map((s) => (
                              <tr key={s._id} className="hover:bg-gray-50">
                                <td className="p-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <Server className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">
                                      {s.serviceName}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 border-b whitespace-nowrap">
                                  {s.createdAt
                                    ? new Intl.DateTimeFormat("en-US").format(
                                        new Date(s.createdAt)
                                      )
                                    : "—"}
                                </td>
                                <td className="p-2 border-b text-right whitespace-nowrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => openEditService(s)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => confirmDeleteService(s)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Product Form Dialog */}
          <Dialog
            open={isProductFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setProductToEdit(null);
              setIsProductFormOpen(isOpen);
            }}
          >
            <DialogContent
              className="w-full max-w-md mx-auto my-8 p-6 overflow-y-auto rounded-lg"
              style={{ maxHeight: "85vh" }}
            >
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

          {/* Service Form Dialog */}
          <Dialog
            open={isServiceFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setServiceToEdit(null);
              setIsServiceFormOpen(isOpen);
            }}
          >
            <DialogContent
              className="w-full max-w-md mx-auto my-8 p-6 overflow-y-auto rounded-lg"
              style={{ maxHeight: "85vh" }}
            >
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

          {/* Delete Confirmation */}
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
