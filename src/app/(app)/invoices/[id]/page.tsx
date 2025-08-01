import { invoices } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  let invoice = invoices.find(inv => inv.id === params.id);

  if (!invoice) {
    if (params.id === 'inv_4') {
        invoice = {
            id: 'inv_4',
            invoiceNumber: 'INV-2024-004',
            customerName: 'New Client Co.',
            customerEmail: 'contact@newclient.com',
            invoiceDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [{ description: 'Newly created transaction', amount: 1500.00 }],
            status: 'Pending'
        };
    } else {
        notFound();
    }
  }

  const totalAmount = invoice.items.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h2>
          <p className="text-muted-foreground">
            Details for invoice issued to {invoice.customerName}.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button><Download className="mr-2 h-4 w-4" /> Download</Button>
        </div>
      </div>
      <Card className="p-4 sm:p-6 md:p-8">
        <CardHeader className="grid grid-cols-2 gap-4">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">FinTrack Pro</h1>
                </div>
                <p className="text-muted-foreground">123 Finance St, Money City, 12345</p>
            </div>
            <div className="text-right">
                <CardTitle className="text-4xl font-bold mb-2">INVOICE</CardTitle>
                <Badge 
                    variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Pending' ? 'secondary' : 'destructive'}
                    className={invoice.status === 'Paid' ? 'bg-green-500/20 text-green-700' : ''}
                >
                    {invoice.status}
                </Badge>
            </div>
        </CardHeader>
        <Separator className="my-6" />
        <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <h3 className="font-semibold mb-1">Bill To</h3>
                    <p className="font-bold">{invoice.customerName}</p>
                    <p className="text-muted-foreground">{invoice.customerEmail}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}</p>
                    <p><span className="font-semibold">Invoice Date:</span> {new Intl.DateTimeFormat('en-US').format(invoice.invoiceDate)}</p>
                    <p><span className="font-semibold">Due Date:</span> {new Intl.DateTimeFormat('en-US').format(invoice.dueDate)}</p>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Separator className="my-6" />
            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <Separator/>
                     <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount)}</span>
                    </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="mt-6 text-center text-sm text-muted-foreground">
            Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  );
}
