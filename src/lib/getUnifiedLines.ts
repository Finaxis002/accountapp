// utils/getUnifiedLines.ts
export function getUnifiedLines(
  tx: any,
  serviceNameById?: Map<string, string>
) {
  const out: Array<{
    itemType: "product" | "service";
    name: string;
    description?: string;
    quantity?: number;
    pricePerUnit?: number;
    amount: number;
  }> = [];

  const num = (n: any, d = 0) => (n == null || n === "" ? d : Number(n));

  const pushRow = (row: any) => {
    const isService =
      row.itemType === "service" || !!row.service || row.serviceName;

    // Name fallbacks for products and services:
    const name =
      row.name ??
      row.productName ?? // ← use enrichment
      (row.product && typeof row.product === "object" ? row.product.name : undefined) ??
      (isService
        ? // service name fallbacks
          row.serviceName ??
          (row.service && typeof row.service === "object"
            ? row.service.serviceName
            : undefined) ??
          (row.service ? serviceNameById?.get(String(row.service)) : undefined)
        : undefined) ??
      // ultimate fallback
      "Item";

    const quantity = isService ? 1 : num(row.quantity, 1);
    const amount =
      row.amount != null ? num(row.amount) : num(row.pricePerUnit) * quantity;

    const pricePerUnit =
      row.pricePerUnit != null
        ? num(row.pricePerUnit)
        : quantity > 0
        ? amount / quantity
        : 0;

    out.push({
      itemType: isService ? "service" : "product",
      name,
      description: row.description || "",
      quantity,
      pricePerUnit,
      amount,
    });
  };

  // Prefer unified items if present
  if (Array.isArray(tx.items) && tx.items.length) {
    tx.items.forEach(pushRow);
    return out;
  }

  // Legacy shapes
  if (Array.isArray(tx.products)) {
    tx.products.forEach((p: any) => pushRow({ ...p, itemType: "product" }));
  }
  if (Array.isArray(tx.services)) {
    tx.services.forEach((s: any) => pushRow({ ...s, itemType: "service" }));
  }
  if (Array.isArray(tx.service)) {
    tx.service.forEach((s: any) => pushRow({ ...s, itemType: "service" })); // legacy singular
  }

  return out;
}
