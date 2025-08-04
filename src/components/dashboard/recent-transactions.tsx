
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  
  const getPartyName = (transaction: Transaction) => {
    if (transaction.type === 'journal') return 'Journal Entry';
    if (transaction.party && typeof transaction.party === 'object') return transaction.party.name;
    if (transaction.vendor && typeof transaction.vendor === 'object') return transaction.vendor.vendorName;
    return 'N/A';
  }
  
  const typeStyles: { [key: string]: string } = {
    sales: 'bg-green-500/20 text-green-700 dark:text-green-300',
    purchases: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
    receipt: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    payment: 'bg-red-500/20 text-red-700 dark:text-red-300',
    journal: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>A summary of your most recent financial activities.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    <div className="font-medium">{getPartyName(transaction)}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {transaction.description || transaction.narration}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.product ? (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{transaction.product.name}</div>
                          {transaction.product.stock !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Stock: {transaction.product.stock}
                              </div>
                            )}
                        </div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className={typeStyles[transaction.type]}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Intl.DateTimeFormat('en-US').format(new Date(transaction.date))}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No recent transactions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="justify-end pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
