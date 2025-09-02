"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";


type TxType = "sales" | "purchases" | "receipts" | "payments" | "journals";

type Props = {
  /** Required to build client-wide endpoints */
  selectedClientId: string;
  /** For the company dropdown */
  companyMap: Map<string, string>;
  /** If a company is already selected in the page, preselect it here */
  defaultCompanyId?: string | null;
  /** Optional callback after successful export */
  onExported?: (rowCount: number) => void;
};

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

export function ExportTransactions({ selectedClientId, companyMap, defaultCompanyId, onExported }: Props) {
  const [open, setOpen] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | "ALL">("ALL");
  const [types, setTypes] = React.useState<Record<TxType, boolean>>({
    sales: true, purchases: true, receipts: true, payments: true, journals: true,
  });
  const allTypes: TxType[] = ["sales", "purchases", "receipts", "payments", "journals"];
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setCompanyId(defaultCompanyId ?? "ALL");
  }, [defaultCompanyId]);

  const toggleAll = (checked: boolean) => {
    const next = { ...types };
    allTypes.forEach(t => (next[t] = checked));
    setTypes(next);
  };

  const safe = (v: any) => (v ?? "").toString().replace(/"/g, '""');
  const toCSV = (rows: any[]) => {
    const headers = ["type","date","company","party","amount","reference","description","_id"];
    const lines = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${safe(r[h])}"`).join(",")),
    ];
    return lines.join("\n");
  };




  const handleExport = async () => {
    // ---------------- helpers ----------------
    const idOf = (v: any) => (typeof v === "string" ? v : v?.$oid || v?._id || v?.id || "");
    const fmtDate = (d: any) => {
      if (!d) return "";
      const dt = typeof d === "string" ? new Date(d) : new Date(d.$date || d);
      return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
    };

    const HEADERS = [
      "party",
      "date",
      "amount",
      "product",
      "description",
      "invoice type",
      "company",
      "gstin",
      "client",
    ] as const;

    // ---- type-aware mapping ----
    const normalizeByType = (t: any, txType: TxType) => {
      const base: any = {
        party: t.party?.name || t.partyName || t.customerName || t.vendorName || idOf(t.party) || "",
        date: fmtDate(t.date || t.createdAt),
        company: t.company?.businessName || companyMap.get(idOf(t.company)) || idOf(t.company) || "",
        gstin: t.gstin || "",
        client: idOf(t.client) || selectedClientId || "",
        amount: "",
        product: "",
        description: "",
        "invoice type": "",
      };

      if (txType === "sales") {
        const products = Array.isArray(t.items)
          ? t.items.map((it: any) => it?.product?.name || it?.productName || idOf(it?.product))
              .filter(Boolean).join(", ")
          : t.product?.name || t.productName || idOf(t.product) || "";
        base.amount = typeof t.totalAmount === "number" ? t.totalAmount : t.amount ?? "";
        base.product = products;
        base.description = t.description ?? (t.items?.[0]?.description || "");
        base["invoice type"] = t.invoiceType ?? "";
        return base;
      }

      if (txType === "purchases") {
        const products = Array.isArray(t.items)
          ? t.items.map((it: any) => it?.product?.name || it?.productName || idOf(it?.product))
              .filter(Boolean).join(", ")
          : t.product?.name || t.productName || idOf(t.product) || "";
        base.amount = t.totalAmount ?? t.amount ?? t.netAmount ?? t.grandTotal ?? "";
        base.product = products;
        base.description = t.description ?? (t.items?.[0]?.description || "");
        base["invoice type"] = t.invoiceType ?? t.voucherType ?? t.type ?? "";
        return base;
      }

      if (txType === "receipts") {
        base.amount = t.amount ?? t.value ?? t.total ?? "";
        base.description = t.description ?? t.narration ?? t.notes ?? "";
        base["invoice type"] = t.type ?? "Receipt";
        return base;
      }

      if (txType === "payments") {
        base.amount = t.amount ?? t.value ?? t.total ?? "";
        base.description = t.description ?? t.narration ?? t.notes ?? "";
        base["invoice type"] = t.type ?? "Payment";
        return base;
      }

      // journals
      base.amount = t.amount ?? t.value ?? t.total ?? "";
      base.description = t.description ?? t.narration ?? t.notes ?? "";
      base["invoice type"] = t.type ?? "Journal";
      return base;
    };

    try {
      setBusy(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const chosen = (["sales","purchases","receipts","payments","journals"] as TxType[])
        .filter(t => types[t]);
      if (!chosen.length) throw new Error("Choose at least one transaction type.");

      const byCompany = companyId !== "ALL";
      const qCompany = byCompany ? `?companyId=${companyId}` : "";
      const clientPath = `/by-client/${selectedClientId}`;

      const urlFor = (t: TxType) => {
        if (byCompany) {
          if (t === "sales") return `${BASE_URL}/api/sales${qCompany}`;
          if (t === "purchases") return `${BASE_URL}/api/purchase${qCompany}`;
          if (t === "receipts") return `${BASE_URL}/api/receipts${qCompany}`;
          if (t === "payments") return `${BASE_URL}/api/payments${qCompany}`;
          return `${BASE_URL}/api/journals${qCompany}`;
        }
        if (t === "sales") return `${BASE_URL}/api/sales${clientPath}`;
        if (t === "purchases") return `${BASE_URL}/api/purchase${clientPath}`;
        if (t === "receipts") return `${BASE_URL}/api/receipts${clientPath}`;
        if (t === "payments") return `${BASE_URL}/api/payments${clientPath}`;
        return `${BASE_URL}/api/journals${clientPath}`;
      };

      const fetchAuth = (u: string) =>
        fetch(u, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

      // fetch datasets per type
      const urls = chosen.map(t => ({ t, url: urlFor(t) }));
      const datasets = await Promise.all(urls.map(({ url }) => fetchAuth(url)));

      // group rows per type (for separate sheets)
      const byType: Record<TxType, any[]> = {
        sales: [], purchases: [], receipts: [], payments: [], journals: []
      };

      datasets.forEach((data, i) => {
        const txType = urls[i].t;
        const list = Array.isArray(data) ? data : (data?.entries ?? []);
        const filtered = byCompany
          ? list.filter((it: any) => {
              const cid = idOf(it.company?._id || it.company);
              return cid && cid === companyId;
            })
          : list;
        filtered.forEach((it: any) => byType[txType].push(normalizeByType(it, txType)));
      });

      // make at least one row total; if absolutely none, error
      const totalRows = chosen.reduce((n, t) => n + byType[t].length, 0);
      if (!totalRows) throw new Error("No data to export for selected filters.");

      // Dynamically import xlsx only when needed
      const XLSX = await import("xlsx");
      
      const wb = XLSX.utils.book_new();

      const sheetName = (t: TxType) =>
        t.charAt(0).toUpperCase() + t.slice(1); // Sales, Purchases, ...

      chosen.forEach((t) => {
        const rows = byType[t];
        if (rows.length === 0) {
          // create header-only sheet if user selected it but there are no rows
          const ws = XLSX.utils.aoa_to_sheet([HEADERS as unknown as string[]]);
          XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
          return;
        }
        const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS as unknown as string[] });
        XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
      });

      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob(
        [wbout],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );

      const a = document.createElement("a");
      const fnameCompany = byCompany ? (companyMap.get(companyId) || companyId) : "all-companies";
      const filename = `transactions_${fnameCompany}_${new Date().toISOString().slice(0,10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onExported?.(totalRows);
    } catch (err: any) {
      alert(err?.message || "Export failed.");
    } finally {
      setBusy(false);
    }
  };



  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">Select company</div>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All companies</SelectItem>
                {Array.from(companyMap.entries()).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <div className="text-sm font-medium">Transaction types</div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chk-all"
                checked={allTypes.every(t => types[t])}
                onCheckedChange={(c) => toggleAll(Boolean(c))}
              />
              <label htmlFor="chk-all" className="text-sm">Select all</label>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {allTypes.map(t => (
                <div key={t} className="flex items-center space-x-2">
                  <Checkbox
                    id={`chk-${t}`}
                    checked={types[t]}
                    onCheckedChange={(c) => setTypes(prev => ({ ...prev, [t]: Boolean(c) }))}
                  />
                  <label htmlFor={`chk-${t}`} className="text-sm capitalize">{t}</label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleExport} disabled={busy}>
              {busy ? "Exporting…" : "Export CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
