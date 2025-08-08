
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
import { Edit, Trash2, MapPin, Phone, User2, Building } from "lucide-react";
import type { User } from "@/lib/types";
import { Badge } from "../ui/badge";

interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    companyMap: Map<string, string>;
}

export function UserTable({ users, onEdit, onDelete, companyMap }: UserTableProps) {
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
                         <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {user.companies && user.companies.length > 0 ? (
                                    user.companies.map((companyId: any) => {
                                        const id = typeof companyId === 'object' ? companyId._id : companyId;
                                        const companyName = companyMap.get(id);
                                        return companyName ? (
                                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                                <Building className="h-3 w-3" />
                                                {companyName}
                                            </Badge>
                                        ) : null;
                                    })
                                ) : (
                                    <span className="text-xs text-muted-foreground">No companies assigned</span>
                                )}
                            </div>
                        </TableCell>
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
