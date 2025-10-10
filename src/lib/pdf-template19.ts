import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
} from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  renderNotes,
  getUnifiedLines,
  invNo,
  getBillingAddress,
  getShippingAddress,
  calculateGST,
  prepareTemplate8Data,
  formatCurrency,
  numberToWords,
  getStateCode,
} from "./pdf-utils";
import { capitalizeWords } from "./utils"; // ⭐ ADDED capitalizeWords IMPORT

// FIX: Interfaces simplified to minimally include 'email' and core fields.
// We use type assertions inside the function to handle dynamic/non-standard fields (like panNumber, stateCode).
interface ExtendedCompany extends Company {
  email?: string;
  panNumber?: string;
  stateCode?: string;
}
interface ExtendedParty extends Party {
  email?: string;
  panNumber?: string;
  stateCode?: string;
}
interface ExtendedShippingAddress extends ShippingAddress {
  stateCode?: string;
}

interface BaseLineItem {
  name: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  amount: number;
  gstPercentage: number;
  lineTax: number;
  lineTotal: number;
}
interface DynamicLineItem extends BaseLineItem {
  hsnSac?: string;
  unit?: string;
}
interface DynamicTransaction extends Transaction {
  poNumber?: string;
  poDate?: string | Date | number;
  eWayBillNo?: string;
  notes?: string;
}

// --- Constants & Placeholders (UI unchanged) ---
const LOGO_DATA_URL = "data:image/png;base64,...";
const STAMP_DATA_URL = "data:image/png;base64,...";
const QR_CODE_DATA_URL = "data:image/png;base64,...";

// Hardcoded Terms for default use when transaction.notes is empty (NO LONGER USED AS FALLBACK)
const IMAGE_DEFAULT_TERMS = `Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.`;

export const generatePdfForTemplate19 = async (
  transaction: DynamicTransaction,
  company: ExtendedCompany | null | undefined,
  party: ExtendedParty | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ExtendedShippingAddress | null,
  bank?: Bank | null | undefined
): Promise<jsPDF> => {
  console.log("bank details from template 16 :", bank);

  // --- START: Bank Details N/A fallback (Modified from template 16) ---
  const getBankDetails = () => ({
    name: "Bank Details Not Available",
    branch: "N/A",
    accNumber: "N/A",
    ifsc: "N/A",
    upiId: "N/A",
  });
  // --- END: Bank Details N/A fallback ---

  // ---------------- DYNAMIC HELPERS ----------------
  const _getGSTIN = (x?: any): string | null =>
    x?.gstin ??
    x?.gstIn ??
    x?.gstNumber ??
    x?.gst_no ??
    x?.gst ??
    x?.gstinNumber ??
    x?.tax?.gstin ??
    null;

  const money = (n: number) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (d?: string | number | Date | null) =>
    d
      ? new Intl.DateTimeFormat("en-GB").format(new Date(d)).replace(/\//g, "-")
      : "N/A";

  // Use the actual numberToWords function from pdf-utils
  const convertNumberToWords = (n: number): string => {
    return numberToWords(n);
  };

  // Use template8 data preparation logic
  const {
    totalTaxable,
    totalAmount,
    items,
    totalItems,
    totalQty,
    itemsWithGST,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    isInterstate,
    showIGST,
    showCGSTSGST,
    showNoTax,
  } = prepareTemplate8Data(transaction, company, party, shippingAddress);

  const logoUrl = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  // Convert itemsWithGST to the format expected by template16
  const lines = itemsWithGST.map((item) => ({
    // ⭐ Apply capitalizeWords
    name: capitalizeWords(item.name),
    description: item.description || "",
    quantity: item.quantity || 0,
    pricePerUnit: item.pricePerUnit || 0,
    amount: item.taxableValue,
    gstPercentage: item.gstRate,
    lineTax: item.cgst + item.sgst + item.igst,
    lineTotal: item.total,
    hsnSac: item.code || "N/A",
    unit: item.unit || "PCS",
    formattedDescription: item.description
      ? item.description.split("\n").join(" / ")
      : "",
  }));

  const subtotal = totalTaxable;
  const tax = totalCGST + totalSGST + totalIGST;
  const invoiceTotal = totalAmount;
  const gstEnabled = isGSTApplicable;
  const totalQuantity = totalQty;

  const totalTaxableAmount = money(subtotal);
  const finalTotalAmount = money(invoiceTotal);

  const shippingAddressSource = shippingAddress;

  const billingAddress = capitalizeWords(getBillingAddress(party));

  const shippingAddressStr = capitalizeWords(
    getShippingAddress(shippingAddressSource, billingAddress)
  );

  const companyGSTIN = _getGSTIN(company);
  const partyGSTIN = _getGSTIN(party);

  // ----------------- FIX FOR FULL WIDTH TABLE (COPIED FROM TEMPLATE 16) -----------------
  const getColWidths = (availableWidth: number) => {
    // Base fixed column widths (Sr.No, HSN/SAC, Rate, Qty, Taxable Value, Total)
    const fixedWidthSum = 292;

    if (showCGSTSGST) {
      const taxWidth = 180;
      const nameColWidth = availableWidth - (fixedWidthSum + taxWidth);
      return [32, nameColWidth, 50, 50, 30, 70, 35, 55, 35, 55, 60];
    } else if (showIGST) {
      const taxWidth = 100;
      const nameColWidth = availableWidth - (fixedWidthSum + taxWidth);
      return [32, nameColWidth, 50, 50, 30, 70, 40, 60, 60];
    } else {
      const nameColWidth = availableWidth - fixedWidthSum;
      return [32, nameColWidth, 50, 50, 30, 70, 60];
    }
  };
  // ----------------- END FIX -----------------

  // --- Dynamic Invoice Data Object ---
  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: fmtDate(transaction.date) || fmtDate(new Date()),
    poNumber: transaction.poNumber || "N/A",
    poDate: fmtDate(transaction.poDate) || "N/A",
    eWayNo: transaction.eWayBillNo || "N/A",

    placeOfSupply: party?.state
      ? `${capitalizeWords(party.state)} (${getStateCode(party.state) || "-"})`
      : "N/A",

    company: {
      name: capitalizeWords(company?.businessName || "Your Company Name"),

      address: capitalizeWords(company?.address || "Company Address Missing"),
      gstin: companyGSTIN || "N/A",
      pan: company?.panNumber || "N/A",

      state: company?.addressState
        ? `${capitalizeWords(company?.addressState)} (${
            getStateCode(company?.addressState) || "-"
          })`
        : "N/A",

      city: capitalizeWords(company?.City || "N/A"),
      phone: company?.mobileNumber || "N/A",
      email: company?.email || company?.emailId || "N/A", // ADDED EMAIL ACCESS
    },
    invoiceTo: {
      name: capitalizeWords(party?.name || "Client Name"),
      billingAddress: billingAddress,
      gstin: partyGSTIN || "N/A",
      pan: party?.panNumber || "N/A",

      state: party?.state
        ? `${capitalizeWords(party.state)} (${
            getStateCode(party.state) || "-"
          })`
        : "N/A",
      email: party?.email || "N/A", // ADDED EMAIL ACCESS
    },
    shippingAddress: {
      name: capitalizeWords(
        (shippingAddressSource as any)?.name || party?.name || "Client Name"
      ),
      address: shippingAddressStr,

      state: (shippingAddressSource as any)?.state
        ? `${capitalizeWords((shippingAddressSource as any).state)} (${
            getStateCode((shippingAddressSource as any).state) || "-"
          })`
        : party?.state
        ? `${capitalizeWords(party.state)} (${
            getStateCode(party.state) || "-"
          })`
        : "N/A",
    },
  };

  // ---------------- PARSE TERMS AND CONDITIONS (COPIED FROM TEMPLATE 16) ----------------
  let termsTitle = "Terms and Conditions";
  let termsList: string[] = [];
  const notesHtml = transaction.notes || "";

  if (notesHtml.trim().length > 0) {
    // Match bold title span (like in the A5 template)
    const titleMatch = notesHtml.match(
      /<span class="ql-size-large">(.*?)<\/span>/
    );
    termsTitle = titleMatch
      ? capitalizeWords(titleMatch[1].replace(/&/g, "&"))
      : "Terms and Conditions"; // Fallback title

    // Match list items
    const liRegex = /<li[^>]*>(.*?)<\/li>/g;
    let match;
    while ((match = liRegex.exec(notesHtml)) !== null) {
      // Strip any remaining HTML tags from the item and decode &

      const cleanItem = capitalizeWords(
        match[1].replace(/<[^>]*>/g, "").replace(/&/g, "&")
      );
      termsList.push(cleanItem);
    }
  } else {
    // If notes are empty, the list remains empty
    termsList = [];
  }
  // ---------------- END PARSE TERMS AND CONDITIONS ----------------

  // ---------------- doc + theme ----------------
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const getW = () => doc.internal.pageSize.getWidth();
  const M = 36;
  const totalPageWidth = getW();
  const availableWidth = totalPageWidth - M * 2;

  const BLUE: [number, number, number] = [24, 115, 204];
  const DARK: [number, number, number] = [45, 55, 72];
  const MUTED: [number, number, number] = [105, 112, 119];
  const BORDER: [number, number, number] = [220, 224, 228];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  // ---------- header drawer (DYNAMIC) ----------
  // Helper to draw company header on each page and return bottom Y
  const drawStaticHeader = (): number => {
    let y = M;
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...DARK);
    doc.text("TAX INVOICE", M, y);
    y += 28;

    // Company Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    // ⭐ Apply capitalizeWords
    doc.text(capitalizeWords(invoiceData.company.name.toUpperCase()), M, y);
    y += 16;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    if (invoiceData.company.gstin !== "N/A") {
      doc.text(`GSTIN ${invoiceData.company.gstin}`, M, y);
      y += 14;
    }
    // ⭐ Apply capitalizeWords
    const headerAddr = doc.splitTextToSize(
      capitalizeWords(invoiceData.company.address),
      250
    );
    if (headerAddr.length) {
      for (let i = 0; i < Math.min(headerAddr.length, 2); i++) {
        doc.text(headerAddr[i], M, y);
        y += 2;
      }
    }
    y += 12;
    // ⭐ Apply capitalizeWords
    if (invoiceData.company.city !== "N/A") {
      doc.text(`${capitalizeWords(invoiceData.company.city)}`, M, y);
    }
    y += 1;
    if (invoiceData.company.pan !== "N/A") {
      doc.text(`PAN: ${invoiceData.company.pan}`, M, y + 11);
      y += 11;
    }
    if (invoiceData.company.phone !== "N/A") {
      y += 12;
      doc.text(`Phone: ${invoiceData.company.phone}`, M, y);
    }
    y += 14;
    // ⭐ Apply capitalizeWords
    if (invoiceData.company.state !== "N/A") {
      doc.text(`State: ${capitalizeWords(invoiceData.company.state)}`, M, y);
    }

    // Logo
    // Logo
    const logoSize = 60;
    const logoX = getW() - M - logoSize;
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, "PNG", logoX, M, logoSize, logoSize);
      } catch (e) {
        // Fallback to default logo
        doc.setFillColor(242, 133, 49);
        doc.triangle(
          logoX + logoSize * 0.4,
          M,
          logoX + logoSize,
          M,
          logoX + logoSize * 0.4,
          M + logoSize,
          "F"
        );
        doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.triangle(
          logoX,
          M,
          logoX + logoSize * 0.6,
          M,
          logoX,
          M + logoSize,
          "F"
        );
      }
    } else {
      // Default logo
      doc.setFillColor(242, 133, 49);
      doc.triangle(
        logoX + logoSize * 0.4,
        M,
        logoX + logoSize,
        M,
        logoX + logoSize * 0.4,
        M + logoSize,
        "F"
      );
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.triangle(
        logoX,
        M,
        logoX + logoSize * 0.6,
        M,
        logoX,
        M + logoSize,
        "F"
      );
    }

    // Separator
    y = Math.max(y, M + logoSize + 20);
    doc.setDrawColor(0, 110, 200);
    doc.setLineWidth(1.5);
    doc.line(M, y + 4, getW() - M, y + 4);
    return y + 16;
  };

  // Draw header on first page and capture bottom Y
  let headerBottomY = drawStaticHeader();

  // Helper to draw customer + shipping + invoice meta block; returns bottom Y
  const drawCustomerMetaBlock = (startY: number): number => {
    let detailY = startY;
    // LEFT: Customer Details
    let leftY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Customer Details:", M, leftY);
    leftY += 16;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    // ⭐ Apply capitalizeWords
    doc.text(capitalizeWords(invoiceData.invoiceTo.name), M, leftY);
    leftY += 12;
    // ⭐ Apply capitalizeWords
    const billAddressLines = doc.splitTextToSize(
      capitalizeWords(invoiceData.invoiceTo.billingAddress),
      200
    );
    if (billAddressLines.length) doc.text(billAddressLines, M, leftY);
    leftY += billAddressLines.length * 12;
    if (
      invoiceData.invoiceTo.email !== "N/A" ? invoiceData.invoiceTo.email : "-"
    ) {
      doc.text(`Email: ${invoiceData.invoiceTo.email}`, M, leftY);
      leftY += 12;
    }
    if (invoiceData.invoiceTo.gstin !== "N/A") {
      doc.text(`GSTIN: ${invoiceData.invoiceTo.gstin}`, M, leftY);
      leftY += 12;
    }
    if (invoiceData.invoiceTo.pan !== "N/A") {
      doc.text(`PAN: ${invoiceData.invoiceTo.pan}`, M, leftY);
      leftY += 12;
    }
    // ⭐ Apply capitalizeWords
    // State (This value already includes state code or is 'N/A')
    const state =
      invoiceData.invoiceTo.state !== "N/A" ? invoiceData.invoiceTo.state : "-";
    doc.text(`State: ${state}`, M, leftY);
    leftY += 12;
    // ⭐ Apply capitalizeWords
    const placeOfSupply =
      invoiceData.placeOfSupply !== "N/A" ? invoiceData.placeOfSupply : "-";
    doc.text(`Place of Supply: ${placeOfSupply}`, M, leftY);
    leftY += 14;

    // MIDDLE: Shipping
    const middleX = M + 200;
    let middleY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Shipping address:", middleX, middleY);
    middleY += 16;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal"); // ⭐ Apply capitalizeWords
    doc.text(
      capitalizeWords(invoiceData.shippingAddress.name),
      middleX,
      middleY
    );
    middleY += 14;
    // --- MODIFICATION START ---
    // Get the address string and apply capitalization
    let addressString = capitalizeWords(invoiceData.shippingAddress.address);

    // Check for common "not available" messages (case-insensitive) and replace with "-"
    if (
      addressString === "" ||
      addressString.toLowerCase().includes("not available") ||
      addressString.toLowerCase().includes("address missing")
    ) {
      addressString = "-";
    } // ⭐ Use the checked address string

    const shipAddressLines = doc.splitTextToSize(addressString, 180);

    if (shipAddressLines.length) doc.text(shipAddressLines, middleX, middleY);
    middleY += shipAddressLines.length * 12; // ⭐ Apply capitalizeWords (State logic remains the same)

    if (invoiceData.shippingAddress.state !== "N/A") {
      doc.text(`State: ${invoiceData.shippingAddress.state}`, middleX, middleY);
      middleY += 14;
    }
    // --- MODIFICATION END ---

    // RIGHT: Invoice meta
    const rightX = getW() - M - 120;
    let rightY = detailY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const metaLabels = [
      "Invoice #:",
      "Invoice Date:",
      "P.O. No.:",
      "P.O. Date:",
      "E-Way No.:",
    ];
    const metaValues = [
      invoiceData.invoiceNumber,
      invoiceData.date,
      invoiceData.poNumber,
      invoiceData.poDate,
      invoiceData.eWayNo,
    ];
    for (let i = 0; i < metaLabels.length; i++) {
      doc.text(metaLabels[i], rightX, rightY);
      // --- MODIFICATION START ---
      let displayValue = metaValues[i];

      // Check if the value is "N/A" and replace it with "-"
      if (displayValue === "N/A") {
        displayValue = "-";
      }

      doc.setFont("helvetica", "normal");
      doc.text(displayValue, rightX + 60, rightY); // Using the modified displayValue
      doc.setFont("helvetica", "bold");
      // --- MODIFICATION END ---

      rightY += 14;
    }
    return Math.max(leftY, middleY, rightY) + 10;
  };

  // Draw block on first page and get its bottom for table margin
  let blockBottomY = drawCustomerMetaBlock(headerBottomY);

  // Calculate the fixed height of the repeating header blocks for page break management
  const REPEATING_HEADER_HEIGHT = blockBottomY;

  let cursorY = blockBottomY;

  // Get final column widths
  const colWidths = getColWidths(availableWidth);

  // ---------------- items table (DYNAMIC with GST logic) ----------------

  // Build dynamic column styles based on GST type
  const columnStyles: any = {};
  colWidths.forEach((width, index) => {
    columnStyles[index] = {
      cellWidth: width,
      halign:
        index === 0 || index === 2 || index === 4
          ? "center"
          : index >= 3 && index <= 9
          ? "right"
          : "left",
    };
  });

  // Build dynamic headers based on GST type
  const buildHeaders = () => {
    const baseHeaders = [
      "Sr. No.",
      "Name of Product / Service",
      "HSN /\nSAC",
      "Rate",
      "Qty",
      "Taxable\nValue",
    ];

    if (showIGST) {
      return [...baseHeaders, "IGST\n%", "IGST\nAmount", "Total"];
    } else if (showCGSTSGST) {
      return [
        ...baseHeaders,
        "CGST\n%",
        "CGST\nAmount",
        "SGST\n%",
        "SGST\nAmount",
        "Total",
      ];
    } else {
      return [...baseHeaders, "Total"];
    }
  };

  // Build dynamic body data based on GST type
  const buildBodyData = () => {
    return lines.map((it: DynamicLineItem, i: number) => {
      // ⭐ Apply capitalizeWords
      const nameAndDesc = `${capitalizeWords(it.name || "")}\n${
        it.description ? it.description.split("\n").join(" / ") : ""
      }`;

      const baseData = [
        i + 1,
        nameAndDesc,
        it.hsnSac || "N/A",
        money(it.pricePerUnit),
        Number(it.quantity).toFixed(2),
        money(it.amount),
      ];

      if (showIGST) {
        return [
          ...baseData,
          `${it.gstPercentage || 0}`,
          money(it.lineTax),
          money(it.lineTotal),
        ];
      } else if (showCGSTSGST) {
        const cgst = (it.lineTax || 0) / 2;
        const sgst = (it.lineTax || 0) / 2;
        return [
          ...baseData,
          `${(it.gstPercentage || 0) / 2}`,
          money(cgst),
          `${(it.gstPercentage || 0) / 2}`,
          money(sgst),
          money(it.lineTotal),
        ];
      } else {
        return [...baseData, money(it.lineTotal)];
      }
    });
  };

  autoTable(doc, {
    startY: cursorY,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 4,
      lineColor: BORDER,
      lineWidth: 0.3,
      textColor: DARK,
    },
    headStyles: {
      fillColor: [0, 110, 200],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      minCellHeight: 24,
    },
    columnStyles,
    head: [buildHeaders()],
    body: buildBodyData(),
    didParseCell: (d) => {
      if (d.section === "body" && d.column.dataKey === 1) {
        d.cell.styles.fontSize = 7.5;
      }
    },
    didDrawPage: () => {
      // repeat header and customer/meta block on each page
      const hdrY = drawStaticHeader();
      drawCustomerMetaBlock(hdrY);
    },
    // IMPORTANT: Use the calculated repeating height for the top margin
    margin: { left: M, right: M, top: REPEATING_HEADER_HEIGHT },
    theme: "grid",
  });

  let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

  // --------------- Totals Summary Block (DYNAMIC) ---------------
  const totalsW = 200;
  const totalsX = getW() - M - totalsW;

  // Ensure there is space for totals, else new page with header
  const pageH = doc.internal.pageSize.getHeight();
  if (afterTableY + 140 > pageH - M) {
    doc.addPage();
    drawStaticHeader();
    drawCustomerMetaBlock(REPEATING_HEADER_HEIGHT - 16); // Redraw customer/meta block manually
    afterTableY = REPEATING_HEADER_HEIGHT; // Reset Y to below the repeated header block
  }
  const totalsY = afterTableY + 10;

  const putTotalLine = (
    label: string,
    val: string,
    y: number,
    bold = false
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.text(label, totalsX + 12, y);
    doc.text(val, totalsX + totalsW - 12, y, { align: "right" });
  };

  let currentTotalsY = totalsY;

  // Row 1: Taxable Amount
  doc.setDrawColor(...BORDER);
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
  putTotalLine("Taxable Amount", totalTaxableAmount, currentTotalsY + 12);
  currentTotalsY += 18;

  // GST breakdown rows (only if GST is applicable)
  if (isGSTApplicable) {
    if (showIGST) {
      // IGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("IGST", money(totalIGST), currentTotalsY + 12);
      currentTotalsY += 18;
    } else if (showCGSTSGST) {
      // CGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("CGST", money(totalCGST), currentTotalsY + 18); // Adjusted Y for vertical centering
      currentTotalsY += 18;

      // SGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("SGST", money(totalSGST), currentTotalsY + 12);
      currentTotalsY += 18;
    }
  }

  // Logo
  const logoSize = 60;
  const logoX = getW() - M - logoSize;
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, "PNG", logoX, M, logoSize, logoSize);
    } catch (e) {
      // Fallback to default logo
      doc.setFillColor(242, 133, 49);
      doc.triangle(
        logoX + logoSize * 0.4,
        M,
        logoX + logoSize,
        M,
        logoX + logoSize * 0.4,
        M + logoSize,
        "F"
      );
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.triangle(
        logoX,
        M,
        logoX + logoSize * 0.6,
        M,
        logoX,
        M + logoSize,
        "F"
      );
    }
  }

  // Total Items / Qty line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Total Items / Qty : ${totalItems} / ${totalQuantity.toFixed(2)}`,
    M,
    afterTableY + 16
  );

  // Amount in Words
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text("Total amount (in words):", M, currentTotalsY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `INR ${convertNumberToWords(invoiceTotal)}`,
    M + 110,
    currentTotalsY + 10,
    { maxWidth: 420 }
  );

  cursorY = currentTotalsY + 25;

  // ---------------- Bank Details & UPI (Left Block) and Signature (Right Block) ----------------

  const bankBlockH = 90;
  const requiredFooterSpace = bankBlockH + 10;

  // ⭐ FIX: Updated ensureSpace to use REPEATING_HEADER_HEIGHT
  const ensureSpace = (needed: number): number => {
    const H = doc.internal.pageSize.getHeight();
    const bottomSafe = H - M;
    if (cursorY + needed > bottomSafe) {
      doc.addPage();
      const newHeaderBottomY = drawStaticHeader();
      drawCustomerMetaBlock(newHeaderBottomY); // Redraw customer/meta block
      return REPEATING_HEADER_HEIGHT; // Reset Y to below the repeating header height
    }
    return cursorY;
  };

  cursorY = ensureSpace(requiredFooterSpace);

  const blockY = cursorY + 10; // Increased space

  // LEFT: Bank Details & UPI (Dynamic)
  let bankY = blockY;

  // --- Dynamic Bank Details Acquisition (COPIED FROM TEMPLATE 16 FIXED VERSION) ---
  // Prefer passed-in 'bank' details, fall back to the N/A placeholders
  const dynamicBankDetails =
    bank && typeof bank === "object" && (bank as any).bankName
      ? {
          name: capitalizeWords((bank as any).bankName || "N/A"),

          branch: capitalizeWords(
            (bank as any).branchName || (bank as any).branchAddress || "N/A"
          ),
          accNumber: (bank as any).accountNumber || "N/A",

          ifsc: capitalizeWords((bank as any).ifscCode || "N/A"),
          upiId: (bank as any).upiId || "N/A",
        }
      : getBankDetails(); // Calls the N/A fallback

  const areBankDetailsAvailable =
    dynamicBankDetails.name !== "Bank Details Not Available";

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Only display 'Pay using UPI' and QR code title if details are available
  if (areBankDetailsAvailable) {
    doc.text("Pay using UPI:", M, bankY);
    doc.text("Bank Details:", M + 120, bankY);
  } else {
    doc.text("Bank Details:", M, bankY);
  }

  bankY += 16;

  // UPI QR Code (Placeholder)
  const qrSize = 60;
  if (areBankDetailsAvailable) {
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(M + 10, bankY, qrSize, qrSize, "FD"); // QR Code box placeholder
  }

  // Bank Details Table-like layout (Dynamic)
  let bankDetailY = bankY;
  const bankX = areBankDetailsAvailable ? M + 120 : M; // If N/A, start details earlier on the left
  doc.setFontSize(8);

  const putBankDetail = (label: string, val: string, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, bankX, y);
    doc.setFont("helvetica", "bold");
    // ⭐ Bank details values are already capitalized in dynamicBankDetails object
    doc.text(val, bankX + 50, y);
  };

  if (areBankDetailsAvailable) {
    putBankDetail("Bank Name:", dynamicBankDetails.name, bankDetailY);
    bankDetailY += 12;
    putBankDetail("Branch:", dynamicBankDetails.branch, bankDetailY);
    bankDetailY += 12;
    putBankDetail("Acc. Number:", dynamicBankDetails.accNumber, bankDetailY);
    bankDetailY += 12;
    putBankDetail("IFSC:", dynamicBankDetails.ifsc, bankDetailY);
    bankDetailY += 12;
    putBankDetail("UPI ID:", dynamicBankDetails.upiId, bankDetailY);
    bankDetailY += 12;
  } else {
    // Display the "NOT AVAILABLE" message prominently
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("-", bankX, bankDetailY);
    bankDetailY += 40;
  }
  // --- END Dynamic Bank Details Acquisition ---

  // RIGHT: Signature Block (DYNAMIC Company Name)
  const sigX = getW() - M - 150;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  // ⭐ Apply capitalizeWords
  doc.text(
    `For ${capitalizeWords(invoiceData.company.name)}`,
    sigX + 20,
    blockY + 5
  );

  // Signature/Stamp Placeholder
  const sigHeight = 50;
  const sigWidth = 150;
  doc.setDrawColor(0, 0, 0);
  doc.rect(sigX, blockY + 15, sigWidth, sigHeight, "S"); // Signature box placeholder

  cursorY = Math.max(bankY + qrSize, blockY + sigHeight) + 20; // Increased space

  // ---------------- Terms and Conditions (DYNAMIC Notes) ----------------
  // Footer separator line
  const termsHeightEstimate =
    (termsList.length > 0 ? termsList.length * 10 : 20) + 30; // Estimate required height
  cursorY = ensureSpace(termsHeightEstimate);

  doc.setDrawColor(0, 110, 200);
  doc.setLineWidth(1);
  doc.line(M, cursorY, getW() - M, cursorY);
  cursorY += 20;

  let termsY = cursorY;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  // Render Title
  doc.text(`${termsTitle}:`, M, termsY); // Note: termsTitle is already capitalized
  termsY += 13;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);

  // RENDER LOGIC: Display parsed terms or the "No terms..." message
  const TERMS_COL_WIDTH = 300;
  if (termsList.length > 0) {
    termsList.forEach((item, index) => {
      // item is already capitalized (from parsing logic)
      const itemLines = doc.splitTextToSize(`• ${item}`, TERMS_COL_WIDTH);
      doc.text(itemLines, M, termsY);
      termsY += itemLines.length * 10; // 10pt line height
    });
  } else {
    // Display the specific "No terms..." message
    doc.text("No terms and conditions added yet", M, termsY);
    termsY += 10;
  }

  return doc;
};

