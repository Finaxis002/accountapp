
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Client } from "@/lib/types";

interface TransactionsTabProps {
    selectedClient: Client;
}

export function TransactionsTab({ selectedClient }: TransactionsTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Transaction history for {selectedClient.contactName}.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-8">Transaction data for this client will be displayed here.</p>
            </CardContent>
        </Card>
    )
}
