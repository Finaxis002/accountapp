import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safely get a short id tail for fallback labels
const tail = (id?: string) => (id ? id.toString().slice(-6) : "");

// Build a unified list of product + service lines from a transaction
export function getUnifiedLines(
  tx: any,
  serviceNameById?: Map<string, string>
) {
  // console.log("ServiceById:", serviceNameById);
  if (!tx) return [];
  // Old (optional): tx.items[] might be present if you still return that
  const legacyProducts = Array.isArray(tx.items)
    ? tx.items
        .filter((i: any) => i?.product)
        .map((i: any) => ({
          type: "product" as const,
          name:
            i.product?.name ?? `Product #${tail(i.product?._id || i.product)}`,
          quantity: i.quantity ?? "",
          unitType: i.unitType ?? "",
          pricePerUnit: i.pricePerUnit ?? "",
          description: i.description ?? "",
          amount: i.amount ?? 0,
        }))
    : [];

  // New shape: tx.products[]
  const products = Array.isArray(tx.products)
    ? tx.products.map((p: any) => ({
        type: "product" as const,
        name: p.product?.name ?? `Product #${tail(p.product)}`,
        quantity: p.quantity ?? "",
        unitType: p.unitType ?? "",
        pricePerUnit: p.pricePerUnit ?? "",
        description: p.description ?? "",
        amount: p.amount ?? 0,
      }))
    : [];

  // New shape: tx.service[] or tx.services[]
  const svcArray = Array.isArray(tx.service)
    ? tx.service
    : Array.isArray(tx.services)
    ? tx.services
    : [];

  const services = svcArray.map((s: any) => {
    // find the raw id whether you use `service` or legacy `serviceName`
    const rawId =
      (s.service &&
        (typeof s.service === "object" ? s.service._id : s.service)) ??
      (s.serviceName &&
        (typeof s.serviceName === "object"
          ? s.serviceName._id
          : s.serviceName));

    const serviceId = rawId ? String(rawId) : undefined;

    // if the doc is populated, use its `serviceName` field
    const nameFromDoc =
      (typeof s.service === "object" &&
        (s.service.serviceName || s.service.name)) ||
      (typeof s.serviceName === "object" &&
        (s.serviceName.serviceName || s.serviceName.name));

    const name =
      nameFromDoc ||
      (serviceId ? serviceNameById?.get(serviceId) : undefined) ||
      `Service #${tail(serviceId)}`;

    return {
      type: "service" as const,
      name,
      service: serviceId,
      quantity: "",
      unitType: "",
      pricePerUnit: "",
      description: s.description ?? "",
      amount: Number(s.amount) || 0,
    };
  });

  // Prefer explicit new arrays; append legacy for backward compatibility
  const lines = [...products, ...services];
  return lines.length ? lines : legacyProducts;
}
