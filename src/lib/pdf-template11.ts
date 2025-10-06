import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import {
  renderNotes,
  getUnifiedLines,
  invNo,
  getBillingAddress,
  getShippingAddress,
} from "./pdf-utils";

/**
 * Left-aligned invoice matching your sample layout.
 * - Uses only company.businessName (or optional displayCompanyName) for header name
 * - Everything draws from a left margin; no right drift
 */
export const generatePdfForTemplate11 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  opts?: { displayCompanyName?: string; logoUrl?: string }
): Promise<jsPDF> => {
  // ---------- palette ----------
 const COLOR = {
  PRIMARY: [38, 70, 83] as [number, number, number],   // teal (current)
  TEXT: [52, 58, 64] as [number, number, number],
  SUB: [108, 117, 125] as [number, number, number],
  BORDER: [206, 212, 218] as [number, number, number],
  BG: [248, 249, 250] as [number, number, number],
  WHITE: [255, 255, 255] as [number, number, number],
  BLUE: [0, 102, 204] as [number, number, number],     // 👈 new royal blue
};

  // ---------- helpers ----------
  const detectGSTIN = (x?: Partial<Company | Party> | null): string | null => {
    const a = x as any;
    return (
      a?.gstin ??
      a?.gstIn ??
      a?.gstNumber ??
      a?.gst_no ??
      a?.gst ??
      a?.gstinNumber ??
      a?.tax?.gstin ??
      null
    );
  };

const money = (n: number) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// ---------------- NEW: Convert number to words ----------------
function numberToWords(num: number): string {
  const a = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  if ((num = Math.floor(num)) === 0) return 'ZERO';

  let str = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  if (crore) str += `${numberToWords(crore)} CRORE `;
  if (lakh) str += `${numberToWords(lakh)} LAKH `;
  if (thousand) str += `${numberToWords(thousand)} THOUSAND `;
  if (hundred) str += `${numberToWords(hundred)} HUNDRED `;
  if (num > 0) str += (str !== '' ? 'AND ' : '') + (num < 20 ? a[num] : b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : ''));

  return str.trim();
}

const rupeesInWords = (n: number) => `${numberToWords(n)} RUPEES ONLY`;

 
  const fetchAsDataURL = async (url?: string) => {
    if (!url) return "";
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  // ---------- derive ----------
  const lines = getUnifiedLines(transaction, serviceNameById);
  const fallbackAmount = Number((transaction as any)?.amount ?? 0);
  const fallbackGST = Number((transaction as any)?.gstPercentage ?? 0);

  const items =
    lines?.length
      ? lines
      : [
          {
            name: transaction.description || "Service Rendered",
            quantity: 1,
            pricePerUnit: fallbackAmount,
            amount: fallbackAmount,
            gstPercentage: fallbackGST,
            lineTax: (fallbackAmount * fallbackGST) / 100,
            lineTotal: fallbackAmount + (fallbackAmount * fallbackGST) / 100,
            hsn: (transaction as any)?.hsn || "",
            description: "",
          },
        ];

  const subtotal = items.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
  const totalTax = items.reduce((s: number, it: any) => s + (Number(it.lineTax) || 0), 0);
  const invoiceTotal = items.reduce(
    (s: number, it: any) => s + (Number(it.lineTotal ?? it.amount) || 0),
    0
  );

  const companyGSTIN = detectGSTIN(company)?.trim() || "";
  const partyGSTIN = detectGSTIN(party)?.trim() || "";
  const gstEnabled = totalTax > 0 && !!companyGSTIN;

  const stateCode = (gst: string) => (gst?.length >= 2 ? gst.slice(0, 2) : "");
  const isInterState =
    gstEnabled &&
    companyGSTIN &&
    partyGSTIN &&
    stateCode(companyGSTIN) !== stateCode(partyGSTIN);

  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  const displayedCompanyName =
    opts?.displayCompanyName?.trim() || (company?.businessName || "").trim();

  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : new Intl.DateTimeFormat("en-GB").format(new Date()),
    company: {
      name: displayedCompanyName || " ",
      address: company?.address || "",
      email: company?.emailId || "",
      phone: company?.mobileNumber || "",
      gstin: companyGSTIN,
      logoUrl: opts?.logoUrl || (company as any)?.logoUrl || "",
    },
    billTo: {
      name: party?.name || "",
      billing: billingAddress || "",
      shipping: shippingAddressStr || "",
      email: (party as any)?.email || "",
      gstin: partyGSTIN || "",
    },
    notes: transaction?.notes || "",
    totalInWords: rupeesInWords(invoiceTotal),
  };

  // ---------- doc ----------
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // >>> STRICT LEFT-ALIGNED CONTENT <<<
  const margin = 36;                    // ~0.5"
  const contentWidth = pw - margin * 2; // full printable width inside margins
  const gutter = 12;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.TEXT);

  // ---------- header (matches sample: left company block + right INVOICE) ----------
  const headerH = 90;

  const drawHeader = async () => {
    // background strip inside content area (left aligned)
    doc.setFillColor(...COLOR.BG);
    doc.rect(margin, 0, contentWidth, headerH, "F");

    // optional logo
    const dataURL = await fetchAsDataURL(invoiceData.company.logoUrl);
    if (dataURL) {
      try {
        doc.addImage(dataURL, "PNG", margin + gutter, 28, 80, 40);
      } catch {}
    }
    const hasLogo = !!invoiceData.company.logoUrl;
    const nameX = hasLogo ? margin + gutter + 100 : margin + gutter;
    // company name (left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text(
      (invoiceData.company.name || "").toUpperCase(),
      nameX,
      42
    );

    // divider
    doc.setDrawColor(...COLOR.BORDER);
    doc.setLineWidth(0.7);
    doc.line(margin, headerH, margin + contentWidth, headerH);
  };

  await drawHeader();

  // ---------- company & bill-to/meta ----------
  const infoTop = headerH + 18;

  const gstText = invoiceData.company.gstin
    ? `GSTIN: ${invoiceData.company.gstin}`
    : "GSTIN: -";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLOR.TEXT);

  // Left side → GSTIN
  doc.text(gstText, margin + gutter, 78);

  // Center → TAX INVOICE
  doc.text("TAX INVOICE", margin + contentWidth / 2, 78, { align: "center" });

  // Right side → ORIGINAL FOR RECIPIENT
  doc.text("ORIGINAL FOR RECIPIENT", margin + contentWidth - gutter, 78, {
    align: "right",
  });

  // ---------- 3-SECTION BLUE HEADER BLOCK (BUYER / CONSIGNEE / META) ----------
  const topY = 96;                // just below the GSTIN/TAX INVOICE bar
  const boxH = 120;               // total height of the blue framed block
  const bw = contentWidth;

  // Column widths (equally distributed)
  const w1 = bw * 0.33;           // Buyer
  const w2 = bw * 0.33;           // Consignee
  const w3 = bw * 0.33;           // Meta

  const x1 = margin;
  const x2 = margin + w1;
  const x3 = margin + w1 + w2;

  // Outer blue frame
 doc.setDrawColor(...COLOR.BLUE);   // 👈 royal blue now
doc.setLineWidth(1);
doc.rect(margin, topY, bw, boxH, "S");

// Vertical separators
doc.setLineWidth(0.7);
doc.line(x2, topY, x2, topY + boxH);
doc.line(x3, topY, x3, topY + boxH);

// Small underline for headers
const headH = 18;
doc.line(x1, topY + headH, x1 + w1, topY + headH);
doc.line(x2, topY + headH, x2 + w2, topY + headH);
doc.line(x3, topY + headH, x3 + w3, topY + headH);

// underline across all 3 columns
doc.line(x1, topY + headH, x1 + w1, topY + headH);
doc.line(x2, topY + headH, x2 + w2, topY + headH);
doc.line(x3, topY + headH, x3 + w3, topY + headH);

// Headings (now normal text, no background)
doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(...COLOR.TEXT);  
doc.text("Details of Buyer :", x1 + 6, topY + 12);
doc.text("Details of Consignee", x2 + 6, topY + 12);
doc.text("Shipped to :", x3 + 6, topY + 12); // 👈 left-aligned

  // Helper to print label/value rows
  const row = (
    label: string,
    value: string | string[] | undefined,
    x: number,
    y: number,
    colW: number
  ) => {
    const labelW = 72; // left label width
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.TEXT);
    doc.text(label, x + 6, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.TEXT);
    const txX = x + 6 + labelW;
    const txW = colW - (txX - x) - 6;
    const lines = doc.splitTextToSize((value || "-") as string, txW);
    doc.text(lines, txX, y);
    const used = (Array.isArray(lines) ? lines.length : 1) * 11 - 1;
    return y + Math.max(12, used + 4);
  };

  // 2) LEFT COLUMN — Buyer
  let yL = topY + headH + 12;
  yL = row("Name", invoiceData.billTo.name, x1, yL, w1);
  yL = row("Address", invoiceData.billTo.billing, x1, yL, w1);
  yL = row("Phone", (party as any)?.phone || "-", x1, yL, w1);
  yL = row("GSTIN", invoiceData.billTo.gstin, x1, yL, w1);

  // 3) MIDDLE COLUMN — Consignee / Shipped to
  let yM = topY + headH + 12;
  const consigneeName = (party as any)?.consigneeName || invoiceData.billTo.name || "";
  const consigneeAddr = invoiceData.billTo.shipping || invoiceData.billTo.billing || "";
  const consigneeCountry =
    (shippingAddress as any)?.country || (party as any)?.country || "India";
  const consigneePhone = (shippingAddress as any)?.phone || (party as any)?.phone || "-";
  const consigneeGST = (party as any)?.consigneeGSTIN || "-";
  const consigneeState =
    (shippingAddress as any)?.state || (party as any)?.state || "";

  yM = row("Name", consigneeName, x2, yM, w2);
  yM = row("Address", consigneeAddr, x2, yM, w2);
  yM = row("Country", consigneeCountry, x2, yM, w2);
  yM = row("Phone", consigneePhone, x2, yM, w2);
  yM = row("GSTIN", consigneeGST, x2, yM, w2);

  // 4) RIGHT COLUMN — Invoice Meta
  let yR = topY + headH + 12;
  const meta = {
    "Invoice No.": invoiceData.invoiceNumber,
    "Invoice Date": invoiceData.date,
    "Due Date": (transaction as any)?.dueDate
      ? new Intl.DateTimeFormat("en-GB").format(new Date((transaction as any).dueDate))
      : "-",
    "P.O. No.": (transaction as any)?.poNumber || "-",
    "P.O. Date": (transaction as any)?.poDate
      ? new Intl.DateTimeFormat("en-GB").format(new Date((transaction as any).poDate))
      : "-",
    "E-Way No.": (transaction as any)?.ewayBillNo || "-",
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.TEXT);

  Object.entries(meta).forEach(([k, v]) => {
    // draw small row with label left, value right-aligned
    doc.setFont("helvetica", "bold");
    doc.text(k, x3 + 6, yR);
    doc.setFont("helvetica", "normal");
    doc.text(String(v || "-"), x3 + w3 - 6, yR, { align: "right" });
    yR += 12;
  });

  // Sample Table Data (use dynamic data as required)
  const head: RowInput[] = [
    [
      { content: "Sr. No.", styles: { halign: "left" } },
      { content: "Name of Product / Service", styles: { halign: "left" } },
      { content: "HSN / SAC", styles: { halign: "left" } },
      { content: "Qty", styles: { halign: "right" } },
      { content: "Rate", styles: { halign: "right" } },
      { content: "Taxable Value", styles: { halign: "right" } },
      { content: "GST %", styles: { halign: "right" } },
      { content: "GST Amount", styles: { halign: "right" } },
      { content: "Total", styles: { halign: "right" } },
    ],
  ];
const totalTaxableValue = items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
const totalGSTAmount = items.reduce((sum: number, it: any) => sum + (Number(it.lineTax) || 0), 0);
const totalInvoiceAmount = items.reduce(
  (sum: number, it: any) => sum + (Number(it.lineTotal ?? it.amount) || 0),
  0
);
  // Generate sample data for the body of the table
  const body: RowInput[] = items.map((it: any, i: number) => {
    const qty = Number(it.quantity || 1);
    const rate = Number(it.pricePerUnit ?? it.amount ?? 0) / qty || 0;
    const taxable = Number(it.amount ?? 0);
    const gstPct = Number(it.gstPercentage ?? 0);
    const taxAmt = Number(it.lineTax ?? (taxable * gstPct) / 100);
    const total = Number(it.lineTotal ?? taxable + taxAmt);
    const desc = `${it?.name || ""}${it?.description ? " — " + it.description : ""}`;

    return [
      String(i + 1),
      { content: desc },
      it?.hsn || "",
      { content: Math.round(qty).toString(), styles: { halign: "right" } },
      { content: rate.toFixed(2), styles: { halign: "right" } },
        { content: taxable.toFixed(2), styles: { halign: "center" } },  
      { content: `${gstPct}%`, styles: { halign: "center" } },
      { content: taxAmt.toFixed(2), styles: { halign: "center" } },   
       { content: money(total), styles: { halign: "center" } },         
    ];
  });
const foot: RowInput[] = [
  [
    { 
      content: "Total", 
      colSpan: 5, 
      styles: { halign: "right", fontStyle: "bold", cellPadding: 10 }
    },
    { 
      content: totalTaxableValue.toLocaleString("en-IN", { maximumFractionDigits: 2 }), 
      styles: { halign: "center", fontStyle: "bold", cellPadding: 10 } 
    },
    { content: "", styles: { halign: "center", cellPadding: 10 } },
    { 
      content: totalGSTAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 }), 
      styles: { halign: "center", fontStyle: "bold", cellPadding: 10 } 
    },
    { 
      content: totalInvoiceAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 }), 
      styles: { halign: "center", fontStyle: "bold", cellPadding: 10 } 
    },
  ],
  [
    { 
      content: ["Total in Words:", invoiceData.totalInWords],
      colSpan: 9, 
      styles: { halign: "left", fontStyle: "bold", cellPadding: 10 } 
    }
  ]
];
  let startY = yR + 22;

  // Code to generate the table using `autoTable`
  autoTable(doc, {
    head,
    body,
     foot, 
    startY: startY, // Adjust the starting Y coordinate based on previous content
    theme: "grid",
   styles: {
  font: "helvetica",
  fontSize: 9,
  textColor: COLOR.TEXT as any,
  lineColor: COLOR.BLUE as any,   // 👈 BLUE use karo
  lineWidth: 0.2,
  cellPadding: 6,
  valign: "middle",
},
     headStyles: {
    fillColor: [255, 255, 255],   // 👈 heading background pure white
    textColor: [0, 0, 0],         // black text
    fontStyle: "bold",
  },
  alternateRowStyles: {
    fillColor: [255, 255, 255],   // 👈 remove grey striping
  },
  footStyles: {
    fillColor: [255, 255, 255],   // 👈 footer bhi white
    textColor: [0, 0, 0],
    fontStyle: "bold",
  },
  //   alternateRowStyles: { fillColor: COLOR.BG as any },
  // footStyles: {      // 👈 add this block
  //   fillColor: [255, 255, 255],  // pure white background
  //   textColor: [0, 0, 0],        // black text
  //   fontStyle: "bold"
  // },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50 },
      3: { cellWidth: 45 },
      4: { cellWidth: 45 },
      5: { cellWidth: 70 },
      6: { cellWidth: 45 },
      7: { cellWidth: 65 },
      8: { cellWidth: 85 },
      
    },
    
    didDrawPage: () => {
      // header on pages > 1 (still left-aligned)
      if (doc.getCurrentPageInfo().pageNumber > 1) {
        doc.setFillColor(...COLOR.BG);
        doc.rect(margin, 0, contentWidth, headerH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...COLOR.PRIMARY);
        doc.text((invoiceData.company.name || "").toUpperCase(), margin + gutter, 42);
        doc.setFontSize(20);
        doc.setTextColor(...COLOR.TEXT);
        doc.text("INVOICE", margin + contentWidth - gutter, 42, { align: "right" });
        doc.setDrawColor(...COLOR.BORDER);
        doc.setLineWidth(0.7);
        doc.line(margin, headerH, margin + contentWidth, headerH);
      }

      // footer (notes + page no.) within left-aligned content area
      const footerTop = ph - 90;
      doc.setDrawColor(...COLOR.PRIMARY);
      doc.setLineWidth(0.8);
      doc.line(margin, footerTop, margin + contentWidth, footerTop);

      const afterNotesY = renderNotes(
        doc,
        invoiceData.notes,
        margin + gutter,
        footerTop + 14,
        contentWidth - gutter * 2,
        pw,
        ph
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLOR.SUB);
      const contactLine = [
        invoiceData.company.address,
        invoiceData.company.email,
        invoiceData.company.phone,
      ]
        .filter(Boolean)
        .join(" | ");
      if (contactLine) {
        doc.text(contactLine, margin + gutter, afterNotesY + 12);
      }

      const page = doc.getCurrentPageInfo().pageNumber;
      const pages = (doc as any).internal.getNumberOfPages();
      doc.text(`Page ${page} of ${pages}`, margin + contentWidth - gutter, afterNotesY + 12, {
        align: "right",
      });
    },
    margin: { left: margin, right: margin }, // stays left-aligned inside margins
  });
// 👇 Start just below autoTable
let footerStartY = (doc as any).lastAutoTable.finalY + 20;

// --------------------------
// ⚙️ Three Column Layout Setup
const colW = contentWidth / 2; // Now two columns instead of three
const col1X = margin;
const col2X = margin + colW; // Adjusted position for second column

// Border box for both columns (instead of 3)
const blockHeight = 180;
doc.setDrawColor(...COLOR.BLUE);
doc.setLineWidth(1);
doc.rect(col1X, footerStartY, contentWidth, blockHeight, "S");

// Vertical separator between two columns
doc.setLineWidth(0.6);
doc.line(col2X, footerStartY, col2X, footerStartY + blockHeight);

// --------------------------
/// --------------------------
// --------------------------
// 🧾 Column 1: Total in Words + Bank Details + QR
// --------------------------

let y1 = footerStartY + 5;

// Set Y-coordinate to leave enough space between each line of text
y1 += 10; // Add some space after "Total in words" for the next text

// Bank Details
doc.setFont("helvetica", "bold");

doc.setDrawColor(...COLOR.BLUE); // Royal blue
doc.setLineWidth(0.7);
doc.line(col1X, y1, col1X + colW, y1);

doc.text("Bank Details", col1X + 8, y1);
y1 += 12;  // Add some space after "Bank Details" title

const bankLines = [
  `Name: ${(company as any)?.bankName || "-"}`,
  `Branch: ${(company as any)?.bankBranch || "-"}`,
  `Acc. Number: ${(company as any)?.bankAccount || "-"}`,
  `IFSC: ${(company as any)?.bankIFSC || "-"}`,
  `UPI ID: ${(company as any)?.upiId || "-"}`,
];
doc.setFont("helvetica", "normal");

// Iterate through each line and print it with proper spacing
bankLines.forEach((text: string, index: number) => {
  const splitLines = doc.splitTextToSize(text, colW - 16);
  splitLines.forEach((line: string, idx: number) => {
    doc.text(line, col1X + 8, y1 + (index + idx) * 12);
  });
});
y1 += bankLines.length * 12 + 6;  // Update y1 for QR code positioning

// --------------------------
// 🧾 Terms & Conditions: Section
// --------------------------

// Add the royal blue separation line between Bank Details and Terms & Conditions
doc.line(col1X, y1, col1X + colW, y1) // Draw the separation line

// Update y1 for Terms & Conditions section after the line
y1 += 10;  // Adding some space after the separation line

// Terms & Conditions: Top Box
doc.setFont("helvetica", "bold");
doc.text("Terms & Conditions", col1X + 8, y1);
y1 += 12;  // Add some space after the title
// Draw blue line below "Terms & Conditions" heading
doc.setDrawColor(...COLOR.BLUE); // Royal blue
doc.setLineWidth(0.7);
doc.line(col1X, y1, col1X + colW, y1);
// Terms content
doc.setFont("helvetica", "normal");
doc.setFontSize(9);
const terms = [
  "Subject to our home Jurisdiction.",
  "Our Responsibility Ceases as goods leaves our Premises.",
  "Goods once sold will not be taken back.",
  "Delivery Ex-Premises.",
];


// Adding each term below the header
terms.forEach((t, i) => {
  doc.text(t, col1X + 8, y1 + 14 + (i * 12));  // Adjust this to align inside the box
  y1 += 0;  // Increase y-coordinate to move to next line
});


// --------------------------
// 🧾 Column 2: Tax Summary (Top Box)
// --------------------------
let y2 = footerStartY + 18; // Start just below top of the footer row

const middleColPadding = 8;
const middleColWidth = colW; // Adjusted for 2-column layout
const labelX = col2X + 10;  // Adjust label position here (Shift right)
const valueX = col2X + 180; // Adjust value position here (Shift right)

// Tax rows
const taxRows = [
  ["Taxable Amount", money(totalTaxableValue)],
  ["Add: IGST", money(totalGSTAmount)],
  ["Total Tax", money(totalGSTAmount)],
];

doc.setFont("helvetica", "normal");
doc.setFontSize(9);

taxRows.forEach(([label, val]) => {
  // Ensure the label fits inside the box and does not overflow
  doc.text(label, labelX, y2, { maxWidth: middleColWidth - 2 * middleColPadding });

  // Split the value if it is too long and ensure it fits inside the box
  const valueLines = doc.splitTextToSize(val, middleColWidth - 2 * middleColPadding); // Split value into lines
  
  // Ensure no unwanted number or extra space before value
  if (valueLines && valueLines.length > 0) {
    doc.text(valueLines, valueX, y2);
  }

  // Update the Y-coordinate after each row
  y2 += Math.max(14, valueLines.length * 12); // Make sure there's enough space for wrapped text
});

// Add spacing before total
y2 += 6;

doc.setFont("helvetica", "bold");
doc.setFontSize(10);
doc.text("Total Amount After Tax : Rs", labelX, y2, { maxWidth: middleColWidth - 2 * middleColPadding });
doc.text(money(totalInvoiceAmount), valueX, y2, { align: "left" });

// --------------------------
// Draw a blue horizontal line between Tax Summary and GST Cert + Stamp
// --------------------------

// Calculate the Y-coordinate where the line will go (after Tax Summary)
const lineY = y2 + 20; // Adjust this for space after the tax section

// Set the line color to blue (as per your original request)
doc.setDrawColor(...COLOR.BLUE);  // Use the same blue color as your theme
doc.setLineWidth(0.7);  // Set line thickness

// Draw the line (horizontal)
doc.line(col2X, lineY, col2X + middleColWidth, lineY);  // Draw line from col2X to col2X + middleColWidth

// --------------------------
// 🧾 Column 2: GST Cert + Stamp (Bottom Box)
// --------------------------
y2 = lineY + 10; // Start the next section below the line

doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("GST Payable on Reverse Charge", col2X + 8, y2);

doc.setFont("helvetica", "normal");
doc.text("N.A.", col2X + 8, y2 + 14);
y2 += 30;

const certText =
  "Certified that the particulars given above are true and correct.";
const certLines = doc.splitTextToSize(certText, middleColWidth - 16);
doc.text(certLines, col2X + 8, y2);

y2 += certLines.length * 12 + 14;

doc.setFont("helvetica", "bold");
doc.text("For Global Securities", col2X + middleColWidth / 2, y2, { align: "center" });

try {
  const stamp = await fetchAsDataURL("/path/to/stamp.png"); // ⬅️ Replace with actual stamp image
  doc.addImage(stamp, "PNG", col2X + middleColWidth / 2 - 35, y2 + 4, 70, 70);
} catch {
  doc.text("[Stamp]", col2X + middleColWidth / 2, y2 + 20, { align: "center" });
}

doc.setFont("helvetica", "normal");
doc.text("Authorised Signatory", col2X + middleColWidth / 2, y2 + 80, { align: "center" });

// --------------------------
// 📜 Terms & Conditions (Placed Above Footer Line)
// --------------------------

// Set the Y-coordinate for Terms & Conditions to be just above the footer line
const termsY = ph - 140;  


// // Terms & Conditions header
// doc.setFont("helvetica", "bold");
// doc.setFontSize(9);
// doc.text("Terms & Condition", margin + 4, termsY);

// // Terms content
// doc.setFont("helvetica", "normal");
// doc.setFontSize(9);
// const terms = [
//   "Subject to our home Jurisdiction.",
//   "Our Responsibility Ceases as soon as goods leaves our Premises.",
//   "Goods once sold will not be taken back.",
//   "Delivery Ex-Premises.",
// ];

// // Adding each term below the header
// terms.forEach((t, i) => {
//   doc.text(t, margin + 4, termsY + 14 + (i * 12));  // Adjust this to align inside the box
// });
  return doc;
};
