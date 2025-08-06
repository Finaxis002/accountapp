
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import type { Client, Transaction } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface TransactionsTabProps {
    selectedClient: Client;
}

export function TransactionsTab({ selectedClient }: TransactionsTabProps) {
    const baseURL = process.env.REACT_APP_BASE_URL;
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

     React.useEffect(() => {
        async function fetchTransactions() {
            if (!selectedClient?._id) return;

            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");
                
                const buildRequest = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                
                // Note: These endpoints likely need to be adjusted to filter by clientId on the backend
                const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes] = await Promise.all([
                    buildRequest(`${baseURL}/api/sales/by-client/${selectedClient._id}`),
                    buildRequest(`${baseURL}/api/purchase/by-client/${selectedClient._id}`),
                    buildRequest(`${baseURL}/api/receipts/by-client/${selectedClient._id}`),
                    buildRequest(`${baseURL}/api/payments/by-client/${selectedClient._id}`),
                    buildRequest(`${baseURL}/api/journals/by-client/${selectedClient._id}`)
                ]);

                const salesData = await salesRes.json();
                const purchasesData = await purchasesRes.json();
                const receiptsData = await receiptsRes.json();
                const paymentsData = await paymentsRes.json();
                const journalsData = await journalsRes.json();

                const allTransactions = [
                    ...(salesData.entries?.map((s: any) => ({ ...s, type: 'sales' })) || []),
                    ...(purchasesData?.map((p: any) => ({ ...p, type: 'purchases' })) || []),
                    ...(receiptsData?.map((r: any) => ({ ...r, type: 'receipt' })) || []),
                    ...(paymentsData?.map((p: any) => ({ ...p, type: 'payment' })) || []),
                    ...(journalsData?.map((j: any) => ({ ...j, description: j.narration, type: 'journal' })) || [])
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setTransactions(allTransactions);

            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Failed to load transactions",
                    description: error instanceof Error ? error.message : "Something went wrong."
                });
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchTransactions();
     }, [selectedClient, toast]);

    const handleAction = () => {
        // Placeholder for edit/delete actions, which are not implemented in this read-only view.
        toast({ title: "Action not available", description: "Editing and deleting transactions is not available from the analytics dashboard."});
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Transaction history for {selectedClient.contactName}.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>Full transaction history for {selectedClient.contactName}.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns({ generateInvoicePDF: handleAction, onEdit: handleAction, onDelete: handleAction })} data={transactions} />
            </CardContent>
        </Card>
    )
}
