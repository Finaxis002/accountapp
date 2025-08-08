
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
import type { Transaction, Company } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function TransactionsPage() {
   const baseURL = process.env. NEXT_PUBLIC_BASE_URL;
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] = React.useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = React.useState<Transaction | null>(null);

  const [sales, setSales] = React.useState<Transaction[]>([]);
  const [purchases, setPurchases] = React.useState<Transaction[]>([]);
  const [receipts, setReceipts] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Transaction[]>([]);
  const [journals, setJournals] = React.useState<Transaction[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();

  const fetchTransactions = React.useCallback(async () => {
    if (!selectedCompanyId) {
        setIsLoading(false);
        setSales([]);
        setPurchases([]);
        setReceipts([]);
        setPayments([]);
        setJournals([]);
        setCompanies([]);
        return;
    }
    
    setIsLoading(true);
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        
        const buildRequest = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        
        const [salesRes, purchasesRes, receiptsRes, paymentsRes, journalsRes, companiesRes] = await Promise.all([
            buildRequest(`${baseURL}/api/sales?companyId=${selectedCompanyId}`),
            buildRequest(`${baseURL}/api/purchase?companyId=${selectedCompanyId}`),
            buildRequest(`${baseURL}/api/receipts?companyId=${selectedCompanyId}`),
            buildRequest(`${baseURL}/api/payments?companyId=${selectedCompanyId}`),
            buildRequest(`${baseURL}/api/journals?companyId=${selectedCompanyId}`),
            buildRequest(`${baseURL}/api/companies/my`)
        ]);

        const salesData = await salesRes.json();
        const purchasesData = await purchasesRes.json();
        const receiptsData = await receiptsRes.json();
        const paymentsData = await paymentsRes.json();
        const journalsData = await journalsRes.json();
        const companiesData = await companiesRes.json();

        setSales(salesData.entries?.map((s: any) => ({ ...s, type: 'sales' })) || []);
        setPurchases(purchasesData?.map((p: any) => ({ ...p, type: 'purchases' })) || []);
        setReceipts(receiptsData?.map((r: any) => ({ ...r, type: 'receipt' })) || []);
        setPayments(paymentsData?.map((p: any) => ({ ...p, type: 'payment' })) || []);
        setJournals(journalsData?.map((j: any) => ({ ...j, description: j.narration, type: 'journal' })) || []);
        setCompanies(companiesData);

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
  
  const handleOpenForm = (transaction: Transaction | null = null) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };
  
  const handleOpenDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsAlertOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const endpointMap: Record<string, string> = {
        sales: `/api/sales/${transactionToDelete._id}`,
        purchases: `/api/purchase/${transactionToDelete._id}`,
        receipt: `/api/receipts/${transactionToDelete._id}`,
        payment: `/api/payments/${transactionToDelete._id}`,
        journal: `/api/journals/${transactionToDelete._id}`,
      };
      
      const endpoint = endpointMap[transactionToDelete.type];
      if (!endpoint) throw new Error(`Invalid transaction type: ${transactionToDelete.type}`);

      const res = await fetch(`${baseURL}${endpoint}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete transaction.");
      }

      toast({
        title: "Transaction Deleted",
        description: "The transaction has been successfully removed.",
      });

      fetchTransactions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsAlertOpen(false);
      setTransactionToDelete(null);
    }
  };


  const allTransactions = React.useMemo(() => 
    [...sales, ...purchases, ...receipts, ...payments, ...journals]
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [sales, purchases, receipts, payments, journals]);

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
    const partyName = typeof transaction.party === 'object' && transaction.party !== null ? transaction.party.name : String(transaction.party || '');
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

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach(company => {
        map.set(company._id, company.businessName);
    });
    return map;
  }, [companies]);

  const tableColumns = React.useMemo(() => columns({ generateInvoicePDF, onEdit: handleOpenForm, onDelete: handleOpenDeleteDialog, companyMap }), [companyMap]);


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
    return <DataTable columns={tableColumns} data={data} />;
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
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
            <DialogHeader className="p-6">
              <DialogTitle>{transactionToEdit ? 'Edit Transaction' : 'Create a New Transaction'}</DialogTitle>
              <DialogDescription>
                {transactionToEdit ? 'Update the details of the financial event.' : 'Fill in the details below to record a new financial event.'}
              </DialogDescription>
            </DialogHeader>
            <TransactionForm 
              transactionToEdit={transactionToEdit}
              onFormSubmit={() => {
                setIsFormOpen(false);
                setTransactionToEdit(null);
                fetchTransactions();
            }} />
          </DialogContent>
        </Dialog>
      </div>
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Tabs defaultValue="all">
          <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="receipts">Receipts</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="journals">Journals</TabsTrigger>
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
          <TabsContent value="receipts" className="mt-4">
            {renderContent(receipts)}
          </TabsContent>
           <TabsContent value="payments" className="mt-4">
            {renderContent(payments)}
          </TabsContent>
           <TabsContent value="journals" className="mt-4">
            {renderContent(journals)}
          </TabsContent>
      </Tabs>
    </div>
  );
}
