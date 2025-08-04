"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MapPin, Phone, User2, Building2 } from "lucide-react";
import type { User } from "@/lib/types";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Companies</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user._id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-md">
                  <User2 className="h-4 w-4 text-blue-500" />
                </div>
                <span className="font-medium">{user.userName}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-500/10 rounded-md">
                  <Phone className="h-4 w-4 text-green-500" />
                </div>
                <span>{user.contactNumber}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-500/10 rounded-md">
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <span>{user.address}</span>
              </div>
            </TableCell>
            {user.companies && user.companies.length > 0 ? (
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.companies.map((company, index) => {
                    const name =
                      typeof company === "object" && company !== null
                        ? (company as { companyName: string }).companyName
                        : String(company);
                    return (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded"
                      >
                        <Building2 className="inline h-4 w-4 mr-1" />
                        {name}
                      </span>
                    );
                  })}
                </div>
              </TableCell>
            ) : (
              <TableCell>No companies assigned</TableCell>
            )}

            <TableCell className="text-right space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
