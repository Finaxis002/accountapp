
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safely get a short id tail for fallback labels
const tail = (id?: string) => (id ? id.toString().slice(-6) : "");

// Build a unified list of product + service lines from a transaction
export function getUnifiedLines(tx: any, serviceNameById?: Map<string, string>) {
  if (!tx) return [];
  // Old (optional): tx.items[] might be present if you still return that
  const legacyProducts =
    Array.isArray(tx.items)
      ? tx.items.filter((i: any) => i?.product).map((i: any) => ({
          type: "product" as const,
          name: i.product?.name ?? `Product #${tail(i.product?._id || i.product)}`,
          quantity: i.quantity ?? "",
          unitType: i.unitType ?? "",
          pricePerUnit: i.pricePerUnit ?? "",
          description: i.description ?? "",
          amount: i.amount ?? 0,
        }))
      : [];

  // New shape: tx.products[]
  const products =
    Array.isArray(tx.products)
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
  // Get the service ID whether it's embedded or just the ID
  const serviceId = 
    (typeof s.serviceName === "object" ? s.serviceName?._id : s.serviceName) ||
    (typeof s.service === "object" ? s.service?._id : s.service);

  // Try to get the name from the map first, then fall back to other options
  const name = serviceNameById?.get(serviceId) || 
               s.serviceName?.name ||
               s.service?.name ||
               `Service #${tail(serviceId)}`;

  return {
    type: "service" as const,
    name,
    service: serviceId, // Store the ID for reference
    quantity: "",
    unitType: "",
    pricePerUnit: "",
    description: s.description ?? "",
    amount: s.amount ?? 0,
  };
});

  // Prefer explicit new arrays; append legacy for backward compatibility
  const lines = [...products, ...services];
  return lines.length ? lines : legacyProducts;
}
