"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const stringifyId = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      if (v.$oid) return String(v.$oid);
      if (v._id) return stringifyId(v._id);
      if (v.id) return stringifyId(v.id);
    }
    try { return String(v); } catch { return ""; }
  };

  const [open, setOpen] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | "ALL">("ALL");
  const [types, setTypes] = React.useState<Record<TxType, boolean>>({
    sales: true, purchases: true, receipts: true, payments: true, journals: true,
  });
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
  type TxType = "sales" | "purchases" | "receipts" | "payments" | "journals";
  const allTypes: TxType[] = ["sales", "purchases", "receipts", "payments", "journals"];
  const [busy, setBusy] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
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
    const headers = ["type", "date", "company", "party", "amount", "reference", "description", "_id"];
    const lines = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${safe(r[h])}"`).join(",")),
    ];
    return lines.join("\n");
  };

  const fetchClients = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch(`${baseURL}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text(); // 👈 always read as text first
      console.log("👉 raw /api/clients response:", text);

      let data;
      try {
        data = JSON.parse(text); // 👈 try parse JSON
      } catch (err) {
        throw new Error("Response is not valid JSON.");
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch clients.");
      }


      setClients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [baseURL]);
  // Call fetchClients on component mount or whenever needed
  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientsById = React.useMemo(
    () => new Map(clients.map((c: any) => [
      stringifyId(c._id),
      c.name || c.clientUsername || c.contactName || c.slug || "(no name)"
    ])),
    [clients]
  );

  const handleExport = async () => {


    // ---------------- helpers ----------------
    const idOf = (v: any) => (typeof v === "string" ? v : v?.$oid || v?._id || v?.id || "");
    const HEADERS: string[] = [
      "party",
      "date",
      "amount",
      "product",
      "description",
      "invoice type",
      "company",
      "gstin",
      "client",
    ];
    const first = (...vals: any[]) => vals.find(v => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim().length > 0;
      return true;
    }) ?? "";

    const nameOf = (obj: any) => first(
      obj?.name, obj?.businessName, obj?.fullName, obj?.displayName, obj?.title, obj?.partyName, obj?.customerName, obj?.vendorName
    );

    const gstinOf = (obj: any) => first(
      obj?.gstin, obj?.GSTIN, obj?.gstNumber, obj?.gst_no, obj?.gstNo, obj?.gstinNumber, obj?.gst
    );

    const fmtDate = (d: any) => {
      if (!d) return "";
      const dt = typeof d === "string" ? new Date(d) : new Date(d.$date || d);
      return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
    };

    const itemsArrayOf = (t: any) =>
      (Array.isArray(t.items) && t.items) ||
      (Array.isArray(t.lineItems) && t.lineItems) ||
      (Array.isArray(t.products) && t.products) ||
      [];

    const productsListOf = (t: any) => {
      const items = itemsArrayOf(t);
      if (!items.length) {
        return first(
          nameOf(t.product),
          t.productName,
          idOf(t.product)
        );
      }
      return items.map((it: any) =>
        first(nameOf(it?.product), it?.productName, idOf(it?.product))
      ).filter(Boolean).join(", ");
    };

    const descriptionOf = (t: any) => first(
      t.description,
      t.notes,
      t.note,
      t.narration,
      t.remark,
      t.remarks,
      t.invoiceNote,
      t.memo,
      itemsArrayOf(t)?.[0]?.description
    );

    const invoiceTypeOf = (t: any, fallback: string) => first(
      t.invoiceType,
      t.voucherType,
      t.voucher,
      t.entryType,
      t.type,
      fallback
    );

    const amountOf = (t: any) => first(
      t.totalAmount, t.grandTotal, t.netAmount, t.amount, t.value, t.total
    );
    // ---- type-aware mapping ----
    const normalizeByType = (t: any, txType: TxType) => {
      const companyName = first(
        t.company?.businessName,
        nameOf(t.company),
        companyMap.get(idOf(t.company)),
        idOf(t.company)
      );

      const partyName = first(
        nameOf(t.party),
        t.partyName,
        t.customerName,
        t.vendorName,
        idOf(t.party)
      );

      // Prefer party GSTIN, fallback to on-doc or company GSTIN
      const gstin = first(
        gstinOf(t.party),
        t.partyGstin,
        t.gstin,
        gstinOf(t.company)
      );

      const clientName = first(
        t.clientName,
        t.client?.name,
        nameOf(t.client),
        clientsById.get(stringifyId(t.client)),
        clientsById.get(stringifyId(t.clientId)),
        clientsById.get(selectedClientId),
        stringifyId(t.client || t.clientId)
      );



      const base: any = {
        party: partyName,
        date: fmtDate(first(t.date, t.createdAt, t.invoiceDate, t.voucherDate)),
        company: companyName,
        gstin,
        client: clientName,
        amount: "",
        product: "",
        description: "",
        "invoice type": "",
      };

      if (txType === "sales") {
        base.amount = amountOf(t);
        base.product = productsListOf(t);
        base.description = descriptionOf(t);
        base["invoice type"] = invoiceTypeOf(t, "Sales");
        return base;
      }

      if (txType === "purchases") {
        base.amount = amountOf(t);
        base.product = productsListOf(t);
        base.description = descriptionOf(t);
        base["invoice type"] = invoiceTypeOf(t, "Purchase");
        return base;
      }

      if (txType === "receipts") {
        base.amount = amountOf(t);
        base.description = descriptionOf(t);
        base["invoice type"] = invoiceTypeOf(t, "Receipt");
        return base;
      }

      if (txType === "payments") {
        base.amount = amountOf(t);
        base.description = descriptionOf(t);
        base["invoice type"] = invoiceTypeOf(t, "Payment");
        return base;
      }

      // journals
      base.amount = amountOf(t);
      base.description = descriptionOf(t);
      base["invoice type"] = invoiceTypeOf(t, "Journal");
      return base;
    };

    try {
      setBusy(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const chosen = (["sales", "purchases", "receipts", "payments", "journals"] as TxType[])
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

        const list = Array.isArray(data)
          ? data
          : (data?.entries ?? data?.data ?? []);
        const filtered = byCompany
          ? list.filter((it: any) => {
            const cid = idOf(it.company?._id || it.company);
            return cid && cid === companyId;
          })
          : list;

        filtered.forEach((it: any) => {
          byType[txType].push(normalizeByType(it, txType));
        })
      });
      for (const t of chosen) {
        byType[t] = await Promise.all(byType[t]); // resolve promises -> plain objects
      }

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
          const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
          XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
          return;
        }
        const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
        XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
      });

      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob(
        [wbout],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );

      const a = document.createElement("a");
      const fnameCompany = byCompany ? (companyMap.get(companyId) || companyId) : "all-companies";
      const filename = `transactions_${fnameCompany}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
              {busy ? "Exporting…" : "Export XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
