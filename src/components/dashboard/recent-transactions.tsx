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
import { ArrowRight } from "lucide-react";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>A summary of your most recent financial activities.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Party</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.party}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {transaction.description}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className="text-xs" variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Intl.DateTimeFormat('en-US').format(transaction.date)}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
