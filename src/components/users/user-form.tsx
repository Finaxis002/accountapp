"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X as RemoveIcon, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ALL_PERMISSIONS, type Permission } from "@/lib/permissions";
import { Switch } from "@/components/ui/switch";

// Friendly questions mapped to your existing permission codes
const PERM_QUESTIONS: {
  perm: Permission;
  label: string;
  autoIncludeRead?: Permission;
}[] = [
  // we auto-include the corresponding :read when :write is enabled
  {
    perm: "product:write" as Permission,
    label: "Can add products?",
    autoIncludeRead: "product:read" as Permission,
  },
  // If your app treats services as products(type=service), this can reuse product:write
  {
    perm: "product:write" as Permission,
    label: "Can add services?",
    autoIncludeRead: "product:read" as Permission,
  },
  {
    perm: "sales:write" as Permission,
    label: "Can add sales entries?",
    autoIncludeRead: "sales:read" as Permission,
  },
  {
    perm: "purchase:write" as Permission,
    label: "Can add purchase entries?",
    autoIncludeRead: "purchase:read" as Permission,
  },
  {
    perm: "company:write" as Permission,
    label: "Can manage company profile?",
    autoIncludeRead: "company:read" as Permission,
  },
];

type RoleDoc = {
  _id: string;
  name: string;
  label: string;
  rank: number;
  permissions: string[];
};

interface UserFormProps {
  user: User | null;
  allCompanies: Company[];
  onSave: (formData: Partial<User> & { roleId?: string }) => void;
  onCancel: () => void;
}

export function UserForm({
  user,
  allCompanies,
  onSave,
  onCancel,
}: UserFormProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleDoc[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    password: "",
    contactNumber: "",
    address: "",
    companies: [] as string[],
    roleId: "" as string, // <- we’ll store roleId now
  });

  const [openCompanySelect, setOpenCompanySelect] = React.useState(false);

  // Create Role dialog state
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    label: "",
    rank: 10,
    permissions: [] as Permission[],
  });

  const toggleNewRolePermission = (
    perm: Permission,
    autoIncludeRead?: Permission
  ) => {
    setNewRole((prev) => {
      const set = new Set(prev.permissions);

      if (set.has(perm)) {
        // turning OFF write: leave read as-is
        set.delete(perm);
      } else {
        // turning ON write
        set.add(perm);
        if (autoIncludeRead) set.add(autoIncludeRead);
      }
      return { ...prev, permissions: Array.from(set) as Permission[] };
    });
  };

  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseURL}/api/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: RoleDoc[] = await res.json();
        setRoles(data);

        // set default selected role on create
        if (!user && data.length > 0) {
          const userDefault =
            data.find((r) => r.name === "user") || data[data.length - 1];
          setFormData((prev) => ({ ...prev, roleId: userDefault._id }));
        }

        // when editing, try to map user.role (string) to roleId if needed
        if (user) {
          const match = data.find(
            (r) => r.name === String(user.role).toLowerCase()
          );
          if (match) {
            setFormData((prev) => ({ ...prev, roleId: match._id }));
          }
        }
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load roles",
          description: String(e),
        });
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL]);

  useEffect(() => {
    setFormData(
      user
        ? {
            userName: user.userName || "",
            userId: user.userId || "",
            password: "",
            contactNumber: user.contactNumber || "",
            address: user.address || "",
            companies: Array.isArray(user.companies)
              ? user.companies
                  .map((c: any) => (typeof c === "string" ? c : c?._id))
                  .filter(Boolean)
              : [],
            roleId: "", // will be set after roles load
          }
        : {
            userName: "",
            userId: "",
            password: "",
            contactNumber: "",
            address: "",
            companies: [],
            roleId: formData.roleId, // keep whatever default we picked after roles load
          }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleId) {
      toast({ variant: "destructive", title: "Please select a role" });
      return;
    }
    onSave(formData); // includes roleId
  };

  const handleCompanySelect = (companyId: string) => {
    setFormData((prev) => {
      const newCompanies = prev.companies.includes(companyId)
        ? prev.companies.filter((id) => id !== companyId)
        : [...prev.companies, companyId];
      return { ...prev, companies: newCompanies };
    });
  };

  const selectedCompanies = allCompanies.filter((c) =>
    formData.companies.includes(c._id)
  );

  const createRole = async () => {
    try {
      if (!newRole.name || !newRole.label) {
        toast({
          variant: "destructive",
          title: "Role name and label are required",
        });
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      });
      const role: RoleDoc = await res.json();
      if (!res.ok)
        throw new Error((role as any)?.message || "Failed to create role");

      // update local list and select it
      setRoles((prev) => [role, ...prev]);
      setFormData((prev) => ({ ...prev, roleId: role._id }));

      // reset dialog
      setNewRole({ name: "", label: "", rank: 10, permissions: [] });
      setIsCreateRoleOpen(false);
      toast({ title: "Role created", description: `${role.label} added` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Create role failed",
        description: String(e),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Row: User Name + User ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={formData.userName}
              onChange={(e) =>
                setFormData({ ...formData, userName: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              disabled={!!user}
            />
          </div>
        </div>

        {!user && (
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
        )}

        {/* Row: Contact + Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={formData.contactNumber}
              onChange={(e) =>
                setFormData({ ...formData, contactNumber: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
        </div>

        {/* --- Role selector + Create role --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Role</Label>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> New Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Role</DialogTitle>
                  <DialogDescription>
                    Define a new role and its default permissions.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                 
                  <div>
                    <Label>Role Name</Label>
                    <Input
                      placeholder="e.g. Auditor"
                      value={newRole.label}
                      onChange={(e) =>
                        setNewRole({ ...newRole, label: e.target.value })
                      }
                    />
                  </div>
                

                  <div>
                    <Label>Default Permissions</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {PERM_QUESTIONS.map(
                        ({ perm, label, autoIncludeRead }) => {
                          const checked = newRole.permissions.includes(perm);
                          return (
                            <div
                              key={label}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <span className="text-sm">{label}</span>
                              <Switch
                                checked={checked}
                                onCheckedChange={() =>
                                  toggleNewRolePermission(perm, autoIncludeRead)
                                }
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                    {/* Optional hint */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Enabling “add” automatically grants the related “view”
                      permission.
                    </p>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateRoleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={createRole}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* simple radio list for roles (you can swap to Combobox if you prefer) */}
          <RadioGroup
            className="mt-2 grid gap-3"
            value={formData.roleId}
            onValueChange={(val) => setFormData({ ...formData, roleId: val })}
          >
            {rolesLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading roles…
              </div>
            ) : roles.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No roles found. Create one.
              </div>
            ) : (
              roles.map((r) => (
                <div key={r._id} className="flex items-center space-x-2">
                  <RadioGroupItem id={`role-${r._id}`} value={r._id} />
                  <Label htmlFor={`role-${r._id}`}>
                    {r.label}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({r.name})
                    </span>
                  </Label>
                </div>
              ))
            )}
          </RadioGroup>
        </div>

        {/* Companies multi-select */}
        <div>
          <Label>Companies</Label>
          <Popover open={openCompanySelect} onOpenChange={setOpenCompanySelect}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCompanySelect}
                className="w-full justify-between h-auto min-h-10"
              >
                <div className="flex gap-1 flex-wrap">
                  {selectedCompanies.length > 0
                    ? selectedCompanies.map((company) => (
                        <Badge
                          variant="secondary"
                          key={company._id}
                          className="mr-1"
                        >
                          {company.businessName}
                        </Badge>
                      ))
                    : "Select companies..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search companies..." />
                <CommandList>
                  <CommandEmpty>No company found.</CommandEmpty>
                  <CommandGroup>
                    {allCompanies.map((company) => (
                      <CommandItem
                        key={company._id}
                        value={company.businessName}
                        onSelect={() => handleCompanySelect(company._id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            formData.companies.includes(company._id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <RemoveIcon className="h-4 w-4" />
                        </div>
                        {company.businessName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{user ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}
