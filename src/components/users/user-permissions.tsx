"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

// ---- Capability constants (mirror backend CAP_KEYS) ----
const ALL_CAPS = [
  "canCreateInventory",
  "canCreateCustomers",
  "canCreateVendors",
  "canCreateCompanies",
  "canUpdateCompanies",
  "canSendInvoiceEmail",
  "canSendInvoiceWhatsapp",
  "canCreateSaleEntries",
  "canCreatePurchaseEntries",
  "canCreateJournalEntries",
  "canCreateReceiptEntries",
  "canCreatePaymentEntries",
] as const;

type CapKey = (typeof ALL_CAPS)[number];

const CAP_LABELS: Record<CapKey, string> = {
  canCreateInventory: "Create Inventory",
  canCreateCustomers: "Create Customers",
  canCreateVendors: "Create Vendors",
  canCreateCompanies: "Create Companies",
  canUpdateCompanies: "Update Companies",
  canSendInvoiceEmail: "Send Invoice via Email",
  canSendInvoiceWhatsapp: "Send Invoice via WhatsApp",
  canCreateSaleEntries: "Create Sales Entries",
  canCreatePurchaseEntries: "Create Purchase Entries",
  canCreateJournalEntries: "Create Journal Entries",
  canCreateReceiptEntries: "Create Receipt Entries",
  canCreatePaymentEntries: "Create Payment Entries",
};

function ManageUserPermissionsDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  // overrides: true | false | null
  const [overrides, setOverrides] = useState<
    Partial<Record<CapKey, boolean | null>>
  >({});
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  };

  // load current overrides
  useEffect(() => {
    if (!open || !user?._id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${baseURL}/api/user-permissions/${user._id}`, {
          headers: authHeaders,
        });
        if (res.status === 404) {
          const init: Partial<Record<CapKey, boolean | null>> = {};
          for (const k of ALL_CAPS) init[k] = null;
          setOverrides(init);
        } else {
          const data = await res.json();
          const init: Partial<Record<CapKey, boolean | null>> = {};
          for (const k of ALL_CAPS) {
            init[k] = data[k] === true ? true : data[k] === false ? false : null;
          }
          setOverrides(init);
        }
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load permissions",
          description: String(e),
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?._id, baseURL]);

  // Cycle Inherit(null) -> Allow(true) -> Deny(false) -> Inherit(null)
  const cycle = (k: CapKey) => {
    setOverrides((prev) => {
      const v = prev[k];
      const next = v === null || v === undefined ? true : v === true ? false : null;
      return { ...prev, [k]: next };
    });
  };

  const clearAllToInherit = () => {
    const next: Partial<Record<CapKey, boolean | null>> = {};
    for (const k of ALL_CAPS) next[k] = null;
    setOverrides(next);
  };

  const grantAll = () => {
    const next: Partial<Record<CapKey, boolean | null>> = {};
    for (const k of ALL_CAPS) next[k] = true;
    setOverrides(next);
  };

  const denyAll = () => {
    const next: Partial<Record<CapKey, boolean | null>> = {};
    for (const k of ALL_CAPS) next[k] = false;
    setOverrides(next);
  };

  const save = async () => {
    try {
      const body: Record<string, boolean | null> = {};
      for (const k of ALL_CAPS) {
        if (overrides[k] !== undefined) body[k] = overrides[k]!;
      }
      const res = await fetch(`${baseURL}/api/user-permissions/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to save permissions");
      }
      toast({ title: "Permissions updated" });
      onClose();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: String(e),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Permissions — {user.userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearAllToInherit}>
                Clear all
              </Button>
              <Button size="sm" variant="outline" onClick={grantAll}>
                Allow all
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_CAPS.map((k) => {
                const v = overrides[k];
                const isChecked = v === true; // only true shows a tick
                const badge = v === null ? "Inherit" : v === true ? "Allow" : "Deny";

                return (
                  <label
                    key={k}
                    className={`flex items-center justify-between rounded-xl border p-3 hover:bg-accent/40 ${
                      v === false ? "border-destructive/70" : ""
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-sm font-medium">{CAP_LABELS[k as CapKey]}</div>
                      <div className="text-xs text-muted-foreground">{badge}</div>
                    </div>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => cycle(k as CapKey)}
                      className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ManageUserPermissionsDialog;
