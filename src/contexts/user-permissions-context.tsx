"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";

export type UserPermissions = {
  // caps (effective = tenant ceiling ∧ user overrides)
  canCreateUsers?: boolean; // tenant-level
  canCreateProducts?: boolean; // tenant-level
  canCreateInventory?: boolean;
  canCreateCustomers?: boolean;
  canCreateVendors?: boolean;
  canCreateCompanies?: boolean;
  canUpdateCompanies?: boolean;
  canSendInvoiceEmail?: boolean;
  canSendInvoiceWhatsapp?: boolean;
  canCreateSaleEntries?: boolean;
  canCreatePurchaseEntries?: boolean;
  canCreateJournalEntries?: boolean;
  canCreateReceiptEntries?: boolean;
  canCreatePaymentEntries?: boolean;

  // limits (tenant-level)
  maxCompanies?: number;
  maxUsers?: number;
  maxInventories?: number;
};

type Ctx = {
  permissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const UserPermissionsContext = React.createContext<Ctx | undefined>(undefined);

export function UserPermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [permissions, setPermissions] = React.useState<UserPermissions | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPermissions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/user-permissions/me/effective`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          "Failed to fetch permissions";
        throw new Error(msg);
      }

      // The endpoint should return a flattened object: { ...caps, ...limits }
      const data = await res.json();
      setPermissions({
        canCreateUsers: data.canCreateUsers,
        canCreateProducts: data.canCreateProducts,
        canCreateInventory: data.canCreateInventory,
        canCreateCustomers: data.canCreateCustomers,
        canCreateVendors: data.canCreateVendors,
        canCreateCompanies: data.canCreateCompanies,
        canUpdateCompanies: data.canUpdateCompanies,
        canSendInvoiceEmail: data.canSendInvoiceEmail,
        canSendInvoiceWhatsapp: data.canSendInvoiceWhatsapp,
        canCreateSaleEntries: data.canCreateSaleEntries,
        canCreatePurchaseEntries: data.canCreatePurchaseEntries,
        canCreateJournalEntries: data.canCreateJournalEntries,
        canCreateReceiptEntries: data.canCreateReceiptEntries,
        canCreatePaymentEntries: data.canCreatePaymentEntries,
        maxCompanies: data.maxCompanies,
        maxUsers: data.maxUsers,
        maxInventories: data.maxInventories,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      // toast({ variant: 'destructive', title: 'Could not load your permissions', description: msg });
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [baseURL, toast]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const value: Ctx = React.useMemo(
    () => ({ permissions, isLoading, error, refetch: fetchPermissions }),
    [permissions, isLoading, error, fetchPermissions]
  );

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  );
}

export function useUserPermissions() {
  const ctx = React.useContext(UserPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useUserPermissions must be used within a UserPermissionsProvider"
    );
  }
  return ctx;
}
