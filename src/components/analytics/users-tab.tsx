
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Client } from "@/lib/types";

interface UsersTabProps {
    selectedClient: Client;
}

export function UsersTab({ selectedClient }: UsersTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>User accounts associated with {selectedClient.contactName}.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-8">User management for this client will be displayed here.</p>
            </CardContent>
        </Card>
    );
}
