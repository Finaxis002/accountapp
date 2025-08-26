"use client";

import * as React from "react";
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
import { ArrowRight, Package, Server, Calendar, User } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

/* ---------- helpers ---------- */
const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0
  );

const safeDate = (d: any) => {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t.getTime())
    ? new Intl.DateTimeFormat("en-IN").format(t)
    : "-";
};

const getAmount = (tx: any) => {
  switch (tx.type) {
    case "sales":
      return Number(tx?.amount ?? tx?.totalAmount ?? 0);
    case "purchases":
      return Number(tx?.totalAmount ?? tx?.amount ?? 0);
    case "receipt":
    case "payment":
      return Number(tx?.amount ?? tx?.totalAmount ?? 0);
    case "journal":
      return 0;
    default:
      return Number(tx?.amount ?? tx?.totalAmount ?? 0);
  }
};

// A single normalized item for the dialog
type LineItem = {
  itemType: "product" | "service";
  name: string;
  quantity?: number | string;
  pricePerUnit?: number;
  amount: number;
  description?: string;
};

function getItems(
  tx: any,
  svcMap?: Map<string, string>
): { label: string; icon: "product" | "service" | "none"; items: LineItem[] } {
  const productsArr = Array.isArray(tx?.products) ? tx.products : [];
  const servicesArr =
    Array.isArray(tx?.services) ? tx.services
      : Array.isArray(tx?.service) ? tx.service
      : tx?.service ? [tx.service]
      : [];

  const normalized: LineItem[] = [];

  for (const p of productsArr) {
    const name =
      (typeof p.product === "object" &&
        (p.product?.name || p.product?.productName)) ||
      (typeof tx.product === "object" &&
        (tx.product?.name || tx.product?.productName)) ||
      "(product)";
    normalized.push({
      itemType: "product",
      name,
      quantity: p?.quantity ?? "",
      pricePerUnit: Number(p?.pricePerUnit ?? 0),
      amount: Number(p?.amount ?? 0),
      description: "",
    });
  }
  for (const s of servicesArr) {
    const ref: any = s?.serviceName ?? s?.service;
    let sName = "(service)";
    if (ref && typeof ref === "object") {
      sName =
        ref.serviceName ||
        ref.name ||
        (ref._id ? svcMap?.get(String(ref._id)) : "") ||
        "(service)";
    } else if (typeof ref === "string") {
      sName = svcMap?.get(String(ref)) || "(service)";
    } else if (typeof s?.serviceName === "string") {
      sName = svcMap?.get(String(s.serviceName)) || "(service)";
    }
    normalized.push({
      itemType: "service",
      name: sName,
      quantity: "",
      pricePerUnit: 0,
      amount: Number(s?.amount ?? 0),
      description: s?.description || "",
    });
  }

  if (normalized.length === 0) return { label: "—", icon: "none", items: [] };
  const first = normalized[0];
  const extra = normalized.length - 1;
  const label = extra > 0 ? `${first.name} +${extra}` : first.name;

  return { label, icon: first.itemType, items: normalized };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  serviceNameById?: Map<string, string>;
}

export function RecentTransactions({
  transactions,
  serviceNameById,
}: RecentTransactionsProps) {
  const [isItemsOpen, setIsItemsOpen] = React.useState(false);
  const [dialogItems, setDialogItems] = React.useState<LineItem[]>([]);
  const [dialogTitle, setDialogTitle] = React.useState<string>("Item Details");

  const openItemsDialog = (tx: any, items: LineItem[]) => {
    if (items.length === 0) return;
    setDialogItems(items);
    const party =
      (tx?.party && typeof tx.party === "object" && (tx.party.name || "")) ||
      (tx?.vendor &&
        typeof tx.vendor === "object" &&
        (tx.vendor.vendorName || "")) ||
      "";
    const date = safeDate(tx?.date);
    setDialogTitle(party ? `Items · ${party} · ${date}` : `Items · ${date}`);
    setIsItemsOpen(true);
  };

  const getPartyName = (tx: any) => {
    if (tx.type === "journal") return "Journal Entry";
    if (tx.party && typeof tx.party === "object")
      return tx.party.name || "Party";
    if (tx.vendor && typeof tx.vendor === "object")
      return tx.vendor.vendorName || "Vendor";
  };

  const typeStyles: Record<string, string> = {
    sales: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    purchases: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    receipt: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    payment: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    journal: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col shadow-lg rounded-2xl border border-border/50">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-t-2xl">
          <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
          <CardDescription>
            A summary of your most recent financial activities.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-80">
            {/* ✅ Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length > 0 ? (
                    transactions.map((tx: any) => {
                      const item = getItems(tx, serviceNameById);
                      const amt = getAmount(tx);
                      const clickable = item.items.length > 0;
                      return (
                        <TableRow
                          key={tx._id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="font-medium flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {getPartyName(tx)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tx.description || tx.narration}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.icon !== "none" ? (
                              <button
                                type="button"
                                disabled={!clickable}
                                onClick={() => openItemsDialog(tx, item.items)}
                                className="flex items-center gap-2 hover:underline"
                              >
                                {item.icon === "product" ? (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Server className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="font-medium">{item.label}</span>
                              </button>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${typeStyles[tx.type]} capitalize`}
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {safeDate(tx.date)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {inr(amt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No recent transactions.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
<div className="grid gap-5 md:hidden p-4">
  {transactions?.length > 0 ? (
    transactions.map((tx: any, i) => {
      const item = getItems(tx, serviceNameById);
      const amt = getAmount(tx);
      return (
        <motion.div
          key={tx._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl border backdrop-blur-md bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-xl p-5 space-y-4 hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          {/* ✅ Party name & date (no User / Calendar icon on mobile) */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100">
              {getPartyName(tx)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {safeDate(tx.date)}
            </span>
          </div>

          {/* ✅ Items (no Package / Server icons on mobile) */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{item.label}</span>
          </div>

          {tx.description && (
            <p className="text-xs italic text-gray-500 dark:text-gray-400">
              {tx.description}
            </p>
          )}

          {/* ✅ Transaction Type & Amount */}
          <div className="flex justify-between items-center">
            <Badge
              variant="secondary"
              className={`${typeStyles[tx.type]} capitalize`}
            >
              {tx.type}
            </Badge>
            <span className="px-4 py-1 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              {inr(amt)}
            </span>
          </div>
        </motion.div>
      );
    })
  ) : (
    <p className="text-center text-muted-foreground">
      No recent transactions.
    </p>
  )}
</div>

          </ScrollArea>
        </CardContent>

        <CardFooter className="justify-end pt-4">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/transactions">
              View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Items Dialog */}
      <Dialog open={isItemsOpen} onOpenChange={setIsItemsOpen}>
        <DialogContent className="sm:max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Detailed list of all items in this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dialogItems.map((li, idx) => {
                  const isService = li.itemType === "service";
                  const qty =
                    !isService && li.quantity !== undefined && li.quantity !== ""
                      ? li.quantity
                      : "—";
                  const rate = !isService ? inr(li.pricePerUnit ?? 0) : "—";
                  const total = inr(li.amount ?? 0);

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isService ? (
                            <Server className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span>{li.name || "—"}</span>
                            {isService && li.description ? (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {li.description}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">
                        {li.itemType}
                      </TableCell>
                      <TableCell className="text-center">{qty}</TableCell>
                      <TableCell className="text-right">{rate}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {total}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
