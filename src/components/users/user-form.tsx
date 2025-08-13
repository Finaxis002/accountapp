// "use client";

// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import type { User, Company } from "@/lib/types";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Badge } from "@/components/ui/badge";
// import { X as RemoveIcon, ChevronsUpDown } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// type Role = "admin" | "manager" | "user";
// const ALL_ROLES: Role[] = ["admin", "manager", "user"];
// const assignableFor = (r: Role): Role[] =>
//   r === "admin" ? ALL_ROLES : r === "manager" ? ["user"] : ["user"];

// interface UserFormProps {
//   user: User | null;
//   allCompanies: Company[];
//   onSave: (formData: Partial<User>) => void;
//   onCancel: () => void;
//   currentUserRole: Role;
// }

// export function UserForm({
//   user,
//   allCompanies,
//   onSave,
//   onCancel,
//   currentUserRole,
// }: UserFormProps) {
//   const { toast } = useToast();
//   const [formData, setFormData] = useState({
//     userName: "",
//     userId: "",
//     password: "",
//     contactNumber: "",
//     address: "",
//     companies: [] as string[],
//     role: "user" as Role,
//   });

//   const [openCompanySelect, setOpenCompanySelect] = React.useState(false);
//    // Allowed roles for the logged-in creator
//   const allowedRoles = assignableFor(currentUserRole);

//   // If editing an admin while not admin yourself, lock role control
//   const roleReadOnly = !!(user && user.role === "admin" && currentUserRole !== "admin");

//   useEffect(() => {
//     setFormData(
//       user
//         ? {
//             userName: user.userName || "",
//             userId: user.userId || "",
//             password: "",
//             contactNumber: user.contactNumber || "",
//             address: user.address || "",
//             companies: Array.isArray(user.companies)
//               ? user.companies
//                   .map((c: any) => (typeof c === "string" ? c : c?._id))
//                   .filter(Boolean)
//               : [],
//               role: (user.role as any) || "user",
//           }
//         : {
//             userName: "",
//             userId: "",
//             password: "",
//             contactNumber: "",
//             address: "",
//             companies: [],
//              role: "user",
//           }
//     );
//   }, [user]); // no need to depend on allCompanies here

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSave(formData);
//   };

//   const handleCompanySelect = (companyId: string) => {
//     setFormData((prev) => {
//       const newCompanies = prev.companies.includes(companyId)
//         ? prev.companies.filter((id) => id !== companyId)
//         : [...prev.companies, companyId];
//       return { ...prev, companies: newCompanies };
//     });
//   };

//   const selectedCompanies = allCompanies.filter((c) =>
//     formData.companies.includes(c._id)
//   );

//   return (
//     <form onSubmit={handleSubmit}>
//       <div className="space-y-4">
//         <div>
//           <Label>User Name</Label>
//           <Input
//             value={formData.userName}
//             onChange={(e) =>
//               setFormData({ ...formData, userName: e.target.value })
//             }
//           />
//         </div>
//         <div>
//           <Label>User ID</Label>
//           <Input
//             value={formData.userId}
//             onChange={(e) =>
//               setFormData({ ...formData, userId: e.target.value })
//             }
//             disabled={!!user}
//           />
//         </div>
//         {!user && (
//           <div>
//             <Label>Password</Label>
//             <Input
//               type="password"
//               value={formData.password}
//               onChange={(e) =>
//                 setFormData({ ...formData, password: e.target.value })
//               }
//             />
//           </div>
//         )}
//         <div>
//           <Label>Contact Number</Label>
//           <Input
//             value={formData.contactNumber}
//             onChange={(e) =>
//               setFormData({ ...formData, contactNumber: e.target.value })
//             }
//           />
//         </div>
//         <div>
//           <Label>Address</Label>
//           <Input
//             value={formData.address}
//             onChange={(e) =>
//               setFormData({ ...formData, address: e.target.value })
//             }
//           />
//         </div>
//         <div>
//           <Label>Companies</Label>
//           <Popover open={openCompanySelect} onOpenChange={setOpenCompanySelect}>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="outline"
//                 role="combobox"
//                 aria-expanded={openCompanySelect}
//                 className="w-full justify-between h-auto min-h-10"
//               >
//                 <div className="flex gap-1 flex-wrap">
//                   {selectedCompanies.length > 0
//                     ? selectedCompanies.map((company) => (
//                         <Badge
//                           variant="secondary"
//                           key={company._id}
//                           className="mr-1"
//                         >
//                           {company.businessName}
//                         </Badge>
//                       ))
//                     : "Select companies..."}
//                 </div>
//                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
//               <Command>
//                 <CommandInput placeholder="Search companies..." />
//                 <CommandList>
//                   <CommandEmpty>No company found.</CommandEmpty>
//                   <CommandGroup>
//                     {allCompanies.map((company) => (
//                       <CommandItem
//                         key={company._id}
//                         value={company.businessName}
//                         onSelect={() => handleCompanySelect(company._id)}
//                       >
//                         <div
//                           className={cn(
//                             "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
//                             formData.companies.includes(company._id)
//                               ? "bg-primary text-primary-foreground"
//                               : "opacity-50 [&_svg]:invisible"
//                           )}
//                         >
//                           <RemoveIcon className="h-4 w-4" />
//                         </div>
//                         {company.businessName}
//                       </CommandItem>
//                     ))}
//                   </CommandGroup>
//                 </CommandList>
//               </Command>
//             </PopoverContent>
//           </Popover>
//         </div>
//       </div>

//       <div className="pt-6 flex justify-end gap-2">
//         <Button type="button" variant="ghost" onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button type="submit">{user ? "Update" : "Create"}</Button>
//       </div>
//     </form>
//   );
// }

////////////////////////////////////////////////////////

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { X as RemoveIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Role = "admin" | "manager" | "user";
const ALL_ROLES: Role[] = ["admin", "manager", "user"];
const assignableFor = (r: Role): Role[] =>
  r === "admin" ? ALL_ROLES : r === "manager" ? ["user"] : ["user"];

const normalizeRole = (r: unknown): Role =>
  (["admin", "manager", "user"] as const).includes(r as Role)
    ? (r as Role)
    : "user";

interface UserFormProps {
  user: User | null;
  allCompanies: Company[];
  onSave: (formData: Partial<User>) => void;
  onCancel: () => void;
}


export function UserForm({
  user,
  allCompanies,
  onSave,
  onCancel,
}: UserFormProps) {
  const { toast } = useToast();
  // ✅
  type Role = "admin" | "manager" | "user";
  const ROLES: Role[] = ["admin", "manager", "user"];

  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    password: "",
    contactNumber: "",
    address: "",
    companies: [] as string[],
    role: "user" as Role,
  });

  const [openCompanySelect, setOpenCompanySelect] = React.useState(false);

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
            role: (user.role as Role) || "user", // keep current role on edit
          }
        : {
            userName: "",
            userId: "",
            password: "",
            contactNumber: "",
            address: "",
            companies: [],
            // default to the lowest allowed role (usually "user")
            role: "user",
          }
    );
  }, [user]); // depends on currentUserRole for default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData); // contains role
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
        <div>
          <Label>User Name</Label>
          <Input
            value={formData.userName}
            onChange={(e) =>
              setFormData({ ...formData, userName: e.target.value })
            }
          />
        </div>

        <div>
          <Label>User ID</Label>
          <Input
            value={formData.userId}
            onChange={(e) =>
              setFormData({ ...formData, userId: e.target.value })
            }
            disabled={!!user}
          />
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

        <div>
          <Label>Contact Number</Label>
          <Input
            value={formData.contactNumber}
            onChange={(e) =>
              setFormData({ ...formData, contactNumber: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        {/* --- Role selector --- */}
        <div>
          <Label>Role</Label>
          <RadioGroup
            className="mt-2 flex gap-6"
            value={formData.role}
            onValueChange={(val) =>
              setFormData({ ...formData, role: val as Role })
            }
          >
            {ROLES.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem id={`role-${r}`} value={r} />
                <Label htmlFor={`role-${r}`} className="capitalize">
                  {r}
                </Label>
              </div>
            ))}
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
