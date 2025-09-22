"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Calendar,
  Eye,
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
import { useToast } from "@/hooks/use-toast";
import type { Company, Product } from "@/lib/types";
import { ProductForm } from "@/components/products/product-form";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export function ProductSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const { toast } = useToast();

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

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenForm = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchProducts();
    const action = selectedProduct ? "updated" : "created";
    toast({
      title: `Item ${action} successfully`,
      description: `The item details have been ${action}.`,
    });
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const res = await fetch(
        `${baseURL}/api/products/${productToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to delete product.");
      toast({
        title: "Item Deleted",
        description: "The item has been successfully removed.",
      });
      fetchProducts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setProductToDelete(null);
    }
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const role = localStorage.getItem("role");

  return (
    <>
      {companies.length === 0 ? (
        <div className="w-full flex align-middle items-center justify-center">
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
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center space-y-3 lg:flex-row lg:items-center lg:justify-between lg:text-left lg:space-y-0">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Manage Products & Services
                  </CardTitle>
                  <CardDescription className="max-w-md">
                    A list of all your products or services.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleOpenForm()}
                  className="w-full sm:w-auto lg:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : products.length > 0 ? (
                <>
                  {/* ✅ Desktop / Laptop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Created At</TableHead>
                          {role !== "user" ? (
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          ) : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product._id}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-2">
                                {product.type === "service" ? (
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                                {product.name}
                                {product.type === "service" && (
                                  <Badge variant="outline">Service</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.type === "service" ? (
                                <span className="text-xs text-muted-foreground">
                                  N/A
                                </span>
                              ) : (
                                product.stocks ?? 0
                              )}
                            </TableCell>
                            <TableCell>
                              {product.unit ?? "Piece"}
                            </TableCell>
                            <TableCell>
                              {new Intl.DateTimeFormat("en-US").format(
                                new Date(product.createdAt!)
                              )}
                            </TableCell>
                            {role !== "user" ? (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenForm(product)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleOpenDeleteDialog(product)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* ✅ Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700"
                      >
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {product.type === "service" ? (
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                  <Server className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              ) : (
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                {product.name}
                              </h3>
                            </div>
                            {product.type === "service" && (
                              <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs"
                              >
                                Service
                              </Badge>
                            )}
                          </div>

                          {role !== "user" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenForm(product)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleOpenDeleteDialog(product)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Details Section */}
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          {/* Stock Information */}
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {product.type === "service" ? "Type" : "Stock"}
                            </span>
                            <div className="flex items-center gap-2">
                              {product.type === "service" ? (
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Service Item
                                </span>
                              ) : (
                                <>
                                  <div
                                    className={cn(
                                      "h-2 w-2 rounded-full",
                                      (product.stocks ?? 0) > 0
                                        ? "bg-green-500 dark:bg-green-400"
                                        : "bg-red-500 dark:bg-red-400"
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-sm font-semibold",
                                      (product.stocks ?? 0) > 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                    )}
                                  >
                                    {product.stocks ?? 0} in stock
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Unit Information */}
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Unit
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {product.unit ?? "Piece"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Created: {new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }).format(new Date(product.createdAt!))}
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions for Users */}
                        {role === "user" && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handleOpenForm(product)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Items Found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding your first product or service.
                  </p>
                  <Button className="mt-6" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={isFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedProduct(null);
              setIsFormOpen(isOpen);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? "Edit Item" : "Create New Item"}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct
                    ? "Update the details for this item."
                    : "Fill in the form to add a new product or service."}
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                product={selectedProduct || undefined}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  item.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProduct}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
