
"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Users, Loader2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import type { User, Company } from "@/lib/types";
import { UserTable } from "@/components/users/user-table";
import { UserForm } from "@/components/users/user-form";
import { UserCard } from "@/components/users/user-card";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const { toast } = useToast();

  const fetchUsersAndCompanies = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      
      const [usersRes, companiesRes] = await Promise.all([
        fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/companies/my", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      if (!usersRes.ok || !companiesRes.ok) {
        throw new Error("Failed to fetch data");
      }
      const usersData = await usersRes.json();
      const companiesData = await companiesRes.json();
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: err.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCompanies();
  }, []);

  const handleOpenForm = (user: User | null = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async (formData: Partial<User>) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const method = selectedUser ? "PUT" : "POST";
      const url = selectedUser
        ? `http://localhost:5000/api/users/${selectedUser._id}`
        : "http://localhost:5000/api/users";
      
      const res = await fetch(url, {
          method,
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${selectedUser ? 'update' : 'create'} user.`);
      }

      toast({ title: `User ${selectedUser ? "updated" : "created"} successfully` });
      fetchUsersAndCompanies(); // Refresh data
      handleCloseForm();

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Operation Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        
        const res = await fetch(`http://localhost:5000/api/users/${userToDelete._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to delete user.");
        }

        toast({ title: "User deleted successfully" });
        fetchUsersAndCompanies(); // Refresh data
        setIsAlertOpen(false);
        setUserToDelete(null);

    } catch (error) {
         toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error instanceof Error ? error.message : "Something went wrong.",
        });
    }
  };

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach(company => {
        map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">Manage your users</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
                <Button variant={viewMode === 'card' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('card')}>
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4" />
                </Button>
            </div>
            <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
            </Button>
        </div>
      </div>

     <Card>
        <CardContent className={viewMode === "list" ? "p-0" : "p-6"}>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : users.length > 0 ? (
                viewMode === 'list' ? (
                    <UserTable users={users} onEdit={handleOpenForm} onDelete={openDeleteDialog} companyMap={companyMap} />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {users.map(user => (
                            <UserCard 
                                key={user._id} 
                                user={user} 
                                onEdit={() => handleOpenForm(user)} 
                                onDelete={() => openDeleteDialog(user)} 
                            />
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first user.</p>
                    <Button className="mt-6" onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            )}
        </CardContent>
     </Card>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>Fill in the form below.</DialogDescription>
          </DialogHeader>
          <UserForm 
            user={selectedUser}
            allCompanies={companies}
            onSave={handleSave}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
