
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import { PlusCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionForm } from '@/components/transactions/transaction-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/contexts/company-context';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import jsPDF from "jspdf";
import "jspdf-autotable";


export default function TransactionsPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();

  const fetchTransactions = React.useCallback(async () => {
    if (!selectedCompanyId) {
        setIsLoading(false);
        setSales([]);
        setPurchases([]);
        return;
    }
    
    setIsLoading(true);
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        
        const salesPromise = fetch(`http://localhost:5000/api/sales?companyId=${selectedCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const purchasesPromise = fetch(`http://localhost:5000/api/purchase?companyId=${selectedCompanyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const [salesRes, purchasesRes] = await Promise.all([salesPromise, purchasesPromise]);

        if (!salesRes.ok) {
            const errorData = await salesRes.json();
            throw new Error(errorData.message || 'Failed to fetch sales');
        }
         if (!purchasesRes.ok) {
            const errorData = await purchasesRes.json();
            throw new Error(errorData.message || 'Failed to fetch purchases');
        }

        const salesData = await salesRes.json();
        const purchasesData = await purchasesRes.json();

        setSales(salesData.entries.map((s: any) => ({ ...s, type: 'sales' })));
        setPurchases(purchasesData.map((p: any) => ({ ...p, party: p.vendor, type: 'purchases' })));

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to load transactions",
            description: error instanceof Error ? error.message : "Something went wrong."
        });
    } finally {
        setIsLoading(false);
    }
  }, [selectedCompanyId, toast]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const allTransactions = React.useMemo(() => [...sales, ...purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales, purchases]);

  const generateInvoicePDF = (transaction: Transaction) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Invoice", 14, 22);
    doc.setFontSize(12);
    doc.text("FinTrack Pro", 14, 32);
    doc.text("123 Finance St, Money City", 14, 38);
    doc.text(`Invoice #: ${transaction._id.slice(-6)}`, 150, 22);
    doc.text(`Date: ${new Intl.DateTimeFormat('en-US').format(new Date(transaction.date))}`, 150, 28);
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 50);
    const partyName = typeof transaction.party === 'object' && transaction.party !== null ? transaction.party.name : transaction.party;
    doc.text(partyName, 14, 56);

    const tableColumn = ["Description", "Product", "Amount"];
    const tableRows = [[
        transaction.description, 
        transaction.product?.name || 'N/A',
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(transaction.amount)
    ]];

    (doc as any).autoTable({
        startY: 65,
        head: [tableColumn],
        body: tableRows,
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text("Total:", 150, finalY + 10);
    doc.text(new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(transaction.amount), 170, finalY + 10);

    doc.setFontSize(10);
    doc.text("Thank you for your business!", 14, doc.internal.pageSize.height - 10);

    doc.save(`invoice-${transaction._id}.pdf`);
  }

  const renderContent = (data: Transaction[]) => {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }
    return <DataTable columns={columns({ generateInvoicePDF })} data={data} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            A list of all financial activities for the selected company.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
            <DialogHeader className="p-6">
              <DialogTitle>Create a New Transaction</DialogTitle>
              <DialogDescription>
                Fill in the details below to record a new financial event.
              </DialogDescription>
            </DialogHeader>
            <TransactionForm onFormSubmit={() => {
                setIsDialogOpen(false);
                fetchTransactions();
            }} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all">
          <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            {renderContent(allTransactions)}
          </TabsContent>
          <TabsContent value="sales" className="mt-4">
            {renderContent(sales)}
          </TabsContent>
          <TabsContent value="purchases" className="mt-4">
            {renderContent(purchases)}
          </TabsContent>
      </Tabs>
    </div>
  );
}
