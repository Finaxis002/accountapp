import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import { getUnifiedLines } from "./getUnifiedLines";
export { getUnifiedLines };

// read a GSTIN off a company no matter the key
export const getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
  const x = c as any;
  return (
    x?.gstin ??
    x?.gstIn ??
    x?.gstNumber ??
    x?.gst_no ??
    x?.gst ??
    x?.gstinNumber ??
    x?.tax?.gstin ??
    null
  );
};

// derive subtotal, tax, final using tx + company context
export const deriveTotals = (
  tx: Transaction,
  company?: Company | null,
  serviceNameById?: Map<string, string>
) => {
  const lines = getUnifiedLines(tx, serviceNameById);

  const subtotal = lines.reduce(
    (sum: number, item: any) => sum + (Number(item.amount) || 0),
    0
  );
  const totalTax = lines.reduce(
    (sum: number, item: any) => sum + (Number(item.lineTax) || 0),
    0
  );
  const invoiceTotal = lines.reduce(
    (sum: number, item: any) => sum + (Number(item.lineTotal) || 0),
    0
  );

  const gstEnabled = totalTax > 0 && !!getCompanyGSTIN(company)?.trim();

  return {
    lines,
    subtotal,
    tax: totalTax,
    invoiceTotal,
    gstPct: 0, // This will be handled per item now
    gstEnabled,
  };
};

export const formatCurrency = (amount: number) => {
  // Manually format currency to avoid weird characters that break jspdf
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs ${formatted}`;
};

export const renderNotes = (
  pdfDoc: any,
  notes: string,
  startX: number,
  startY: number,
  maxWidth: number,
  pageWidth: number,
  pageHeight: number
) => {
  if (!notes || typeof window === "undefined") return startY;

  const parser = new DOMParser();
  const docHTML = parser.parseFromString(notes, "text/html");
  const elements = Array.from(docHTML.body.children);

  let currentY = startY;

  let listCounter = 1;
  for (let el of elements) {
    let bgColor: [number, number, number] | null = null; // Background color
    if (el.tagName === "P") {
      let text = el.textContent?.trim() || "";
      if (!text) continue;

      let align: "left" | "center" | "right" = "left";
      let fontSize = 10;
      let bold = false;
      let textColor: [number, number, number] = [0, 0, 0]; // Default black

      if (el.classList.contains("ql-align-center")) align = "center";
      if (el.classList.contains("ql-align-right")) align = "right";
      if (el.classList.contains("ql-size-large")) fontSize = 14;
      if (el.classList.contains("ql-size-small")) fontSize = 8;

      // Check for strong and underline tags
      const strongEl = el.querySelector("strong");
      const underlineEl = el.querySelector("u");
      if (strongEl) {
        bold = true;
        text = strongEl.textContent?.trim() || text;
        // Check for color in strong element
        const style = strongEl.getAttribute("style");
        if (style) {
          const colorMatch = style.match(
            /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
          );
          if (colorMatch) {
            textColor = [
              parseInt(colorMatch[1]),
              parseInt(colorMatch[2]),
              parseInt(colorMatch[3]),
            ];
          }
        }
      }
      const isUnderlined = !!underlineEl;
      if (isUnderlined && !strongEl) {
        text = underlineEl.textContent?.trim() || text;
      }

      // Check for color and background in paragraph itself
      const paraStyle = el.getAttribute("style");
      if (paraStyle) {
        const colorMatch = paraStyle.match(
          /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
        );
        if (colorMatch) {
          textColor = [
            parseInt(colorMatch[1]),
            parseInt(colorMatch[2]),
            parseInt(colorMatch[3]),
          ];
        }
        const bgMatch = paraStyle.match(
          /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
        );
        if (bgMatch) {
          bgColor = [
            parseInt(bgMatch[1]),
            parseInt(bgMatch[2]),
            parseInt(bgMatch[3]),
          ];
        }
      }

      pdfDoc.setFontSize(fontSize);
      pdfDoc.setFont("helvetica", bold ? "bold" : "normal");
      pdfDoc.setTextColor(...textColor);

      const lines = pdfDoc.splitTextToSize(text, maxWidth);
      const lineHeight = fontSize * 0.4 + 2;
      const totalHeight = lines.length * lineHeight;

      // Draw background if needed
      if (bgColor) {
        let bgX = startX;
        let bgWidth = maxWidth;
        if (align === "center") {
          bgX = startX + maxWidth / 2 - maxWidth / 2;
        } else if (align === "right") {
          bgX = startX;
        }
        pdfDoc.setFillColor(...bgColor);
        pdfDoc.rect(
          bgX - 2,
          currentY - fontSize * 0.3,
          bgWidth + 4,
          totalHeight + 2,
          "F"
        );
      }

      for (let line of lines) {
        let x = startX;
        if (align === "center") x = startX + maxWidth / 2;
        else if (align === "right") x = startX + maxWidth;
        pdfDoc.text(line, x, currentY, { align });

        // Draw underline if needed
        if (isUnderlined) {
          const textWidth = pdfDoc.getTextWidth(line);
          let underlineX = x;
          if (align === "center") underlineX = x - textWidth / 2;
          else if (align === "right") underlineX = x - textWidth;
          pdfDoc.setLineWidth(0.5);
          pdfDoc.setDrawColor(...textColor); // Use same color for underline
          pdfDoc.line(
            underlineX,
            currentY + 1,
            underlineX + textWidth,
            currentY + 1
          );
          pdfDoc.setDrawColor(0, 0, 0); // Reset to black
        }

        currentY += lineHeight;
      }

      // Reset text color to black for next elements
      pdfDoc.setTextColor(0, 0, 0);
      currentY += 5; // paragraph spacing
    } else if (el.tagName === "OL") {
      const listItems = el.querySelectorAll("li");
      listItems.forEach((li, index) => {
        let text = li.textContent?.trim() || "";
        if (!text) return;

        let align: "left" | "center" | "right" = "left";
        let fontSize = 10;
        let bold = false;
        let textColor: [number, number, number] = [0, 0, 0]; // Default black

        if (li.classList.contains("ql-align-center")) align = "center";
        if (li.classList.contains("ql-align-right")) align = "right";
        if (li.classList.contains("ql-size-large")) fontSize = 14;
        if (li.classList.contains("ql-size-small")) fontSize = 8;

        // Check for strong and underline tags
        const strongEl = li.querySelector("strong");
        const underlineEl = li.querySelector("u");
        if (strongEl) {
          bold = true;
          text = strongEl.textContent?.trim() || text;
          // Check for color in strong element
          const style = strongEl.getAttribute("style");
          if (style) {
            const colorMatch = style.match(
              /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
            );
            if (colorMatch) {
              textColor = [
                parseInt(colorMatch[1]),
                parseInt(colorMatch[2]),
                parseInt(colorMatch[3]),
              ];
            }
          }
        }
        const isUnderlined = !!underlineEl;
        if (isUnderlined && !strongEl) {
          text = underlineEl.textContent?.trim() || text;
        }

        // Check for color and background in list item itself
        const liStyle = li.getAttribute("style");
        if (liStyle) {
          if (!strongEl) {
            const colorMatch = liStyle.match(
              /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
            );
            if (colorMatch) {
              textColor = [
                parseInt(colorMatch[1]),
                parseInt(colorMatch[2]),
                parseInt(colorMatch[3]),
              ];
            }
          }
          const bgMatch = liStyle.match(
            /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
          );
          if (bgMatch) {
            bgColor = [
              parseInt(bgMatch[1]),
              parseInt(bgMatch[2]),
              parseInt(bgMatch[3]),
            ];
          }
        }

        pdfDoc.setFontSize(fontSize);
        pdfDoc.setFont("helvetica", bold ? "bold" : "normal");
        pdfDoc.setTextColor(...textColor);

        const listText = `${listCounter}. ${text}`;
        const lines = pdfDoc.splitTextToSize(listText, maxWidth);
        const lineHeight = fontSize * 0.4 + 2;
        const totalHeight = lines.length * lineHeight;

        // Draw background if needed
        if (bgColor) {
          let bgX = startX;
          let bgWidth = maxWidth;
          if (align === "center") {
            bgX = startX + maxWidth / 2 - maxWidth / 2;
          } else if (align === "right") {
            bgX = startX;
          }
          pdfDoc.setFillColor(...bgColor);
          pdfDoc.rect(
            bgX - 2,
            currentY - fontSize * 0.3,
            bgWidth + 4,
            totalHeight + 2,
            "F"
          );
        }

        for (let line of lines) {
          let x = startX;
          if (align === "center") x = startX + maxWidth / 2;
          else if (align === "right") x = startX + maxWidth;
          pdfDoc.text(line, x, currentY, { align });

          // Draw underline if needed
          if (isUnderlined) {
            const textWidth = pdfDoc.getTextWidth(line);
            let underlineX = x;
            if (align === "center") underlineX = x - textWidth / 2;
            else if (align === "right") underlineX = x - textWidth;
            pdfDoc.setLineWidth(0.5);
            pdfDoc.setDrawColor(...textColor); // Use same color for underline
            pdfDoc.line(
              underlineX,
              currentY + 1,
              underlineX + textWidth,
              currentY + 1
            );
            pdfDoc.setDrawColor(0, 0, 0); // Reset to black
          }

          currentY += lineHeight;
        }

        // Reset text color to black for next elements
        pdfDoc.setTextColor(0, 0, 0);
        currentY += 3; // list item spacing
        listCounter++;
      });
      currentY += 5; // list spacing
    }
  }

  return currentY;
};

export const getItemsBody = (
  transaction: Transaction,
  serviceNameById?: Map<string, string>
) => {
  const lines = getUnifiedLines(transaction, serviceNameById);

  if (lines.length === 0) {
    return [
      [
        "1",
        1,
        transaction.description || "Item",
        formatCurrency((transaction as any).amount ?? 0),
        "0%",
        formatCurrency(0),
        formatCurrency((transaction as any).amount ?? 0),
      ],
    ];
  }

  return lines.map((item: any, index: number) => [
    (index + 1).toString(),
    item.quantity || 1,
    `${item.name}\n${item.description || ""}`,
    formatCurrency(Number(item.pricePerUnit || item.amount)),
    `${item.gstPercentage || 0}%`,
    formatCurrency(item.lineTax || 0),
    formatCurrency(item.lineTotal || item.amount || 0),
  ]);
};

export const invNo = (tx: Transaction) => {
  // Prefer the issued invoice number from server
  if ((tx as any)?.invoiceNumber) return String((tx as any).invoiceNumber);

  // Fallbacks for old data:
  if ((tx as any)?.referenceNumber) return String((tx as any).referenceNumber);
  const id = tx?._id ? String(tx._id) : "";
  return `INV-${id.slice(-6).toUpperCase() || "000000"}`;
};

export const getBillingAddress = (party?: Party | null): string => {
  if (!party) return "Address not available";
  return [party.address, party.city, party.state].filter(Boolean).join(", ");
};

export const getShippingAddress = (shippingAddress?: ShippingAddress | null, billingAddress?: string): string => {
  if (!shippingAddress) return billingAddress || "Address not available";
  return [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(", ");
};