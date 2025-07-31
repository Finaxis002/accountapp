import { Button } from "@/components/ui/button";
import { transactions } from "@/lib/data";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "@/components/transactions/columns";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Here's a list of all your recent financial activities.
          </p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Transaction
          </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={transactions} />
    </div>
  );
}
