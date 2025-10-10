  import type { Company, Party, Transaction, ShippingAddress, Bank } from "@/lib/types";
  import { Text } from "@react-pdf/renderer";
  import { getUnifiedLines } from "./getUnifiedLines";
import { Rss } from "lucide-react";
  export { getUnifiedLines };

  const stateCodeMap: Record<string, string> = {
    "Jammu & Kashmir": "01",
    "Himachal Pradesh": "02",
    "Punjab": "03",
    "Chandigarh": "04",
    "Uttarakhand": "05",
    "Haryana": "06",
    "Delhi": "07",
    "Rajasthan": "08",
    "Uttar Pradesh": "09",
    "Bihar": "10",
    "Sikkim": "11",
    "Arunachal Pradesh": "12",
    "Nagaland": "13",
    "Manipur": "14",
    "Mizoram": "15",
    "Tripura": "16",
    "Meghalaya": "17",
    "Assam": "18",
    "West Bengal": "19",
    "Jharkhand": "20",
    "Odisha": "21",
    "Chhattisgarh": "22",
    "Madhya Pradesh": "23",
    "Gujarat": "24",
    "Daman & Diu": "25",
    "Dadra & Nagar Haveli": "26",
    "Maharashtra": "27",
    "Andhra Pradesh": "28",
    "Karnataka": "29",
    "Goa": "30",
    "Lakshadweep": "31",
    "Kerala": "32",
    "Tamil Nadu": "33",
    "Puducherry": "34",
    "Andaman & Nicobar Islands": "35",
    "Telangana": "36",
    "Ladakh": "37",
  };

  export const getStateCode = (stateName: string): string | null => {
    return stateCodeMap[stateName] || null;
  };

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
  // export const deriveTotals = (
  //   tx: Transaction,
  //   company?: Company | null,
  //   serviceNameById?: Map<string, string>
  // ) => {
  //   const lines = getUnifiedLines(tx, serviceNameById);

  //   const subtotal = lines.reduce(
  //     (sum: number, item: any) => sum + (Number(item.amount) || 0),
  //     0
  //   );
  //   const totalTax = lines.reduce(
  //     (sum: number, item: any) => sum + (Number(item.lineTax) || 0),
  //     0
  //   );
  //   const invoiceTotal = lines.reduce(
  //     (sum: number, item: any) => sum + (Number(item.lineTotal) || 0),
  //     0
  //   );

  //   const gstEnabled = totalTax > 0 && !!getCompanyGSTIN(company)?.trim();

  //   return {
  //     lines,
  //     subtotal,
  //     tax: totalTax,
  //     invoiceTotal,
  //     gstPct: 0, // This will be handled per item now
  //     gstEnabled,
  //   };
  // };

  export const formatCurrency = (amount: number) => {
    // Manually format currency to avoid weird characters that break jspdf
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
   return `Rs. ${formatted}`;
  };

  export const numberToWords = (num: number): string => {
    if (num === 0) return "ZERO";

    const ones = [
      "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
      "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
      "SEVENTEEN", "EIGHTEEN", "NINETEEN"
    ];

    const tens = [
      "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"
    ];

    const scales = ["", "THOUSAND", "LAKH", "CRORE"];

    const convertHundreds = (n: number): string => {
      let str = "";
      if (n > 99) {
        str += ones[Math.floor(n / 100)] + " HUNDRED ";
        n %= 100;
      }
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + " ";
      }
      return str.trim();
    };

    const convertToWords = (n: number): string => {
      if (n === 0) return "";

      let words = "";
      let scaleIndex = 0;

      while (n > 0) {
        if (n % 1000 !== 0) {
          words = convertHundreds(n % 1000) + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + " " + words;
        }
        n = Math.floor(n / 1000);
        scaleIndex++;
      }

      return words.trim();
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = convertToWords(integerPart);

    if (decimalPart > 0) {
      result += " AND " + convertToWords(decimalPart) + " PAISE ONLY";
    } else {
      result += " RUPEES ONLY";
    }

    return result.trim();
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
          "",
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
      item.code || "",
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
    return [party.address, party.city, party.state , party.pincode].filter(Boolean).join(", ");
  };

  export const getShippingAddress = (shippingAddress?: ShippingAddress | null, billingAddress?: string): string => {
    if (!shippingAddress) return billingAddress || "Address not available";
    return [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(", ");
  };

  export const getBankDetails = (bank?: Bank | string | null): string => {
    if (!bank) return "Bank details not available";
    if (typeof bank === "string") return bank;
    return [bank.bankName, bank.branchAddress, bank.city, `IFSC: ${bank.ifscCode}`].filter(Boolean).join(", ");
  };

  // Function to determine which GST is applicable (CGST, SGST, IGST)
  export const calculateGST = (
    amount: number,
    gstRate: number,
    tx: Transaction,
    company?: Company | null,
    party?: Party | null,
    shippingAddress?: ShippingAddress | null
  ) => {
    const companyGstin = getCompanyGSTIN(company);

    // If company doesn't have GSTIN, no tax applies (unregistered dealer)
    if (!companyGstin) {
      return {
        cgst: 0,
        sgst: 0,
        igst: 0,
        isInterstate: false,
        isGSTApplicable: false
      };
    }

    // Check if supplier state and recipient state are different (interstate)
    // If shipping address exists, compare with shipping state, otherwise compare with party billing state
    const recipientState = shippingAddress?.state || party?.state;
    const supplierState = company?.addressState;
    const isInterstate = supplierState && recipientState ? supplierState.toLowerCase().trim() !== recipientState.toLowerCase().trim() : false;

    // Calculate GST amounts
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterstate) {
      // IGST for interstate transactions
      igst = (amount * gstRate) / 100;
    } else {
      // CGST and SGST for intrastate transactions (split equally)
      const halfRate = gstRate / 2;
      cgst = (amount * halfRate) / 100;
      sgst = (amount * halfRate) / 100;
    }

    return {
      cgst,
      sgst,
      igst,
      isInterstate,
      isGSTApplicable: true
    };
  };

  // Example usage in the deriveTotals function
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

    // Apply IGST/CGST/SGST calculations
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    lines.forEach(item => {
      const gst = calculateGST(item.amount || 0, item.gstPercentage || 0, tx, company);
      cgstTotal += gst.cgst;
      sgstTotal += gst.sgst;
      igstTotal += gst.igst;
    });

    return {
      lines,
      subtotal,
      tax: totalTax,
      invoiceTotal,
      gstPct: 0, // This will be handled per item now
      gstEnabled,
      cgstTotal,
      sgstTotal,
      igstTotal,
    };
  };


// Helper function to group items by HSN/SAC and calculate totals
export const getHsnSummary = (items: any[], showIGST: boolean, showCGSTSGST: boolean) => {
  const hsnMap = new Map();
  
  items.forEach(item => {
    const hsnCode = item.code || '-';
    if (!hsnMap.has(hsnCode)) {
      hsnMap.set(hsnCode, {
        hsnCode,
        taxableValue: 0,
        taxRate: item.gstRate || 0,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        total: 0
      });
    }
    
    const existing = hsnMap.get(hsnCode);
    existing.taxableValue += item.taxableValue;
    
    if (showIGST) {
      existing.taxAmount += item.igst || 0;
    } else if (showCGSTSGST) {
      existing.cgstAmount += item.cgst || 0;
      existing.sgstAmount += item.sgst || 0;
      existing.taxAmount = existing.cgstAmount + existing.sgstAmount;
    }
    
    existing.total += item.total;
  });
  
  return Array.from(hsnMap.values());
};

  export const prepareTemplate8Data = (
    transaction: Transaction,
    company?: Company | null,
    party?: Party | null,
    shippingAddress?: ShippingAddress | null,
  ) => {
    const totals = deriveTotals(transaction, company || undefined);
    const totalTaxable = totals.subtotal;
    const totalAmount = totals.invoiceTotal;
    const items = getUnifiedLines(transaction);
    const totalItems = items.length;
    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const itemsBody = getItemsBody(transaction);


    // Calculate GST for each item with proper party and shipping address context
    const itemsWithGST = items.map((item) => {
      const taxableValue = item.amount;
      const gstRate = item.gstPercentage || 0;

      const gst = calculateGST(
        taxableValue,
        gstRate,
        transaction,
        company,
        party,
        shippingAddress
      );

      return {
        ...item,
        taxableValue,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        total: taxableValue + gst.cgst + gst.sgst + gst.igst,
        isGSTApplicable: gst.isGSTApplicable,
        isInterstate: gst.isInterstate,
        gstRate,
      };
    });

    // Calculate total GST amounts
    const totalCGST = itemsWithGST.reduce(
      (sum, item) => sum + (item.cgst || 0),
      0
    );
    const totalSGST = itemsWithGST.reduce(
      (sum, item) => sum + (item.sgst || 0),
      0
    );
    const totalIGST = itemsWithGST.reduce(
      (sum, item) => sum + (item.igst || 0),
      0
    );

    // Determine GST type based on actual calculations
    const isGSTApplicable = itemsWithGST.some((item) => item.isGSTApplicable);
    const isInterstate = itemsWithGST.some((item) => item.isInterstate);
    const showIGST = isGSTApplicable && isInterstate;
    const showCGSTSGST = isGSTApplicable && !isInterstate;
    const showNoTax = !isGSTApplicable;



    return {
      totals,
      totalTaxable,
      totalAmount,
      items,
      totalItems,
      totalQty,
      itemsBody,
      itemsWithGST,
      totalCGST,
      totalSGST,
      totalIGST,
      isGSTApplicable,
      isInterstate,
      showIGST,
      showCGSTSGST,
      showNoTax,
    };
  };
