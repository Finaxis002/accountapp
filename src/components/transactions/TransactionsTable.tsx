"use client";

import * as React from "react";
import { DataTable } from "@/components/transactions/data-table";
import { columns } from "./columns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/lib/types";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

interface TransactionsTableProps {
  data: Transaction[];
  onPreview: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onViewItems: (tx: Transaction) => void;
  onSendInvoice: (tx: Transaction) => void;
  companyMap: Map<string, string>;
  serviceNameById: Map<string, string>;
  hideActions?: boolean;
}

export function TransactionsTable({
  data,
  onPreview,
  onEdit,
  onDelete,
  onViewItems,
  onSendInvoice,
  companyMap,
  serviceNameById,
  hideActions = false,
}: TransactionsTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    // 📱 Mobile Card View
    return (
      <div className="space-y-4">
        {data.map((tx) => {
          const party =
            (tx.party as any)?.name || (tx.vendor as any)?.vendorName || "N/A";
         const companyId =
  typeof tx.company === "object" && tx.company !== null
    ? (tx.company as any)._id
    : tx.company ?? null;

const companyName = companyId
  ? companyMap.get(companyId as string) ?? "N/A"
  : "N/A";
          return (
            <Card key={tx._id} className="rounded-xl shadow">
              <CardContent className="p-4 space-y-3">
                {/* Party + Description */}
                <div>
                  <div className="font-semibold">{party}</div>
                  <p className="text-sm text-muted-foreground">
                    {tx.description || tx.narration || ""}
                  </p>
                </div>

                {/* Company */}
                <div className="text-sm">
                  <span className="font-medium">Company: </span>
                  {companyName || "N/A"}
                </div>

                {/* Amount + Date */}
              
  <div className="flex flex-col">
    <span className="text-sm font-medium text-muted-foreground">Amount</span>
    <span className="font-bold text-green-600">
      ₹
      {new Intl.NumberFormat("en-IN", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).format(Number(tx.totalAmount ?? (tx as any).amount ?? 0))}
    </span>
  </div>
  <div className="flex flex-col text-right">
    <span className="text-sm font-medium text-muted-foreground">Date</span>
    <span className="text-sm text-muted-foreground">
      {new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(tx.date))}
    </span>
  </div>

                {/* Type */}
                <Badge>{tx.type}</Badge>

                {/* Actions */}
                {!hideActions && (
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPreview(tx)}
                          disabled={tx.type !== "sales"}
                        >
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(tx)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(tx)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // 🖥 Desktop Table View
  return (
    <DataTable
      data={data}
      columns={columns({
        onPreview,
        onEdit,
        onDelete,
        onViewItems,
        onSendInvoice,
        companyMap,
        serviceNameById,
        hideActions,
      })}
    />
  );
}
