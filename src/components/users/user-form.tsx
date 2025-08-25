"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X as RemoveIcon, ChevronsUpDown } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RoleDoc = { _id: string; name: "admin" | "manager" | "user" };

// ✅ Hardcode the 3 default roles (PUT YOUR REAL ROLE IDS HERE)
const DEFAULT_ROLES: RoleDoc[] = [
  { _id: "REPLACE_ADMIN_ROLE_ID", name: "admin" },
  { _id: "REPLACE_MANAGER_ROLE_ID", name: "manager" },
  { _id: "REPLACE_USER_ROLE_ID", name: "user" },
];

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
  const { toast } = useToast();
  const [roles] = useState<RoleDoc[]>(DEFAULT_ROLES); // no fetching
  const [rolesLoading] = useState(false);

  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    password: "",
    contactNumber: "",
    address: "",
    companies: [] as string[],
    roleId: "" as string,
  });

  const [openCompanySelect, setOpenCompanySelect] = React.useState(false);

  // when user prop changes, hydrate fields; roleId set below
  useEffect(() => {
    setFormData((prev) =>
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
            roleId: prev.roleId, // set after we match by name
          }
        : {
            userName: "",
            userId: "",
            password: "",
            contactNumber: "",
            address: "",
            companies: [],
            roleId: prev.roleId,
          }
    );
  }, [user]);

  // set default role on create; map user.role (string) to roleId on edit
  useEffect(() => {
    if (!roles || roles.length === 0) return;

    if (!user) {
      const def = roles.find((r) => r.name === "user") || roles[0];
      setFormData((prev) => ({ ...prev, roleId: def._id }));
    } else {
      const currentName = String(user.role || "").toLowerCase();
      const match = roles.find((r) => r.name === currentName);
      if (match) setFormData((prev) => ({ ...prev, roleId: match._id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, user]);

  // helper: true only for real 24-hex objectids
  const isObjectId = (s?: string) => !!s && /^[a-f0-9]{24}$/i.test(s);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // find the selected role from your local defaults
    const selectedRole =
      roles.find((r) => r._id === formData.roleId) ||
      roles.find((r) => r.name === "user"); // fallback

    if (!selectedRole) {
      toast({ variant: "destructive", title: "Please select a role" });
      return;
    }

    // only send roleId if it's a real ObjectId; always send roleName
    const payload = {
      ...formData,
      roleId: isObjectId(selectedRole._id) ? selectedRole._id : undefined,
      roleName: selectedRole.name, // backend will resolve by name if id is missing/invalid
    } as any; // cast if your onSave type doesn't include roleName

    onSave(payload);
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

        {/* Role selector (no API, just defaults) */}
        <div className="space-y-2">
          <Label>Role</Label>
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
                No roles available. Please set DEFAULT_ROLES ids.
              </div>
            ) : (
              roles.map((r) => (
                <div key={r._id} className="flex items-center space-x-2">
                  <RadioGroupItem id={`role-${r._id}`} value={r._id} />
                  <Label htmlFor={`role-${r._id}`}>{r.name}</Label>
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
