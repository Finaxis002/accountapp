import { TransactionForm } from "@/components/transactions/transaction-form";

export default function NewTransactionPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Transaction</h2>
        <p className="text-muted-foreground">
          Add a new transaction to your records. Fill in the details below.
        </p>
      </div>
      <TransactionForm />
    </div>
  );
}
