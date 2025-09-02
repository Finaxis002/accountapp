import type { Company, Party, Transaction } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import { getUnifiedLines } from "./utils";
import { getUnifiedLines } from "./getUnifiedLines";

// read a GSTIN off a company no matter the key
const getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
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
const deriveTotals = (
  tx: Transaction,
  company?: Company | null,
  serviceNameById?: Map<string, string>
) => {
  const lines = getUnifiedLines(tx, serviceNameById);
  
  const subtotal = lines.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  const totalTax = lines.reduce((sum: number, item: any) => sum + (Number(item.lineTax) || 0), 0);
  const invoiceTotal = lines.reduce((sum: number, item: any) => sum + (Number(item.lineTotal) || 0), 0);

  const gstEnabled = totalTax > 0 && !!getCompanyGSTIN(company)?.trim();

  return { 
    lines, 
    subtotal, 
    tax: totalTax, 
    invoiceTotal, 
    gstPct: 0, // This will be handled per item now
    gstEnabled 
  };
};

const formatCurrency = (amount: number) => {
  // Manually format currency to avoid weird characters that break jspdf
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs ${formatted}`;
};

const getItemsBody = (
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

const invNo = (tx: Transaction) => {
  // Prefer the issued invoice number from server
  if ((tx as any)?.invoiceNumber) return String((tx as any).invoiceNumber);

  // Fallbacks for old data:
  if ((tx as any)?.referenceNumber) return String((tx as any).referenceNumber);
  const id = tx?._id ? String(tx._id) : "";
  return `INV-${id.slice(-6).toUpperCase() || "000000"}`;
};

export const generatePdfForTemplate1 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById: Map<string, string> | undefined
): jsPDF => {
  const doc = new jsPDF();
  const { lines, subtotal, tax, invoiceTotal, gstPct, gstEnabled } =
    deriveTotals(transaction, company, serviceNameById);
  const companyGSTIN = getCompanyGSTIN(company);

  const invoiceNo = invNo(transaction);
  const invoiceDate = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(transaction.date));
  const partyAddress = party
    ? [party.address, party.city, party.state].filter(Boolean).join(", ")
    : "Address not available";

  // Decorative Lines
  doc.setFillColor(82, 101, 167);
  doc.rect(0, 0, 8, 40, "F");
  doc.rect(
    doc.internal.pageSize.getWidth() - 8,
    doc.internal.pageSize.getHeight() - 40,
    8,
    40,
    "F"
  );

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(company?.businessName || "Your Company", 15, 20);

  // (optional) show GSTIN if present
  if (companyGSTIN) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`GSTIN: ${companyGSTIN}`, 15, 26);
  }

  doc.setFontSize(18);
  doc.text("INVOICE", doc.internal.pageSize.getWidth() - 15, 20, {
    align: "right",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceDate, doc.internal.pageSize.getWidth() - 15, 26, {
    align: "right",
  });

  // Invoice Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE NO: ${invoiceNo}`, 15, 40);

  doc.setFontSize(10);
  doc.text("TO:", doc.internal.pageSize.getWidth() - 15, 40, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text(party?.name || "N/A", doc.internal.pageSize.getWidth() - 15, 45, {
    align: "right",
  });
  doc.text(partyAddress, doc.internal.pageSize.getWidth() - 15, 50, {
    align: "right",
  });

  // Table
autoTable(doc, {
  startY: 65,
  head: [
    ["S.No.", "QTY", "DESCRIPTION", "PRICE", "GST %", "TAX", "TOTAL (Incl. GST)"]
  ],
  body: getItemsBody(transaction, serviceNameById),
  theme: "striped",
  headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0] },
  bodyStyles: { fillColor: [255, 255, 255] },
  didDrawPage: (data) => {
    if (data.pageNumber === 1 && data.cursor) data.cursor.y += 5;
  },
});



  const finalY = (doc as any).lastAutoTable.finalY;


// In generatePdfForTemplate1 function:
let currentY = finalY + 10;
doc.setFontSize(10);
doc.text("Sub Total", 140, currentY, { align: "right" });
doc.text(formatCurrency(subtotal), 200, currentY, { align: "right" });

if (tax > 0) {
  currentY += 7;
  doc.text("GST Total", 140, currentY, { align: "right" });
  doc.text(formatCurrency(tax), 200, currentY, { align: "right" });
}

currentY += 5;
doc.setDrawColor(0);
doc.line(120, currentY, 200, currentY);

currentY += 7;
doc.setFont("helvetica", "bold");
doc.text("GRAND TOTAL", 150, currentY, { align: "right" });
doc.text(formatCurrency(invoiceTotal), 200, currentY, { align: "right" });
  // Footer
  currentY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Method", 15, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("Please make payments to the provided account.", 15, currentY + 5);

  doc.setFont("helvetica", "bold");
  doc.text(
    "Terms and Conditions",
    doc.internal.pageSize.getWidth() - 15,
    currentY,
    { align: "right" }
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    "Payment is due within 30 days.",
    doc.internal.pageSize.getWidth() - 15,
    currentY + 5,
    { align: "right" }
  );

  return doc;
};

const getItemsBodyTemplate2 = (
  transaction: Transaction,
  serviceNameById?: Map<string, string>
) => {
  const lines = getUnifiedLines(transaction, serviceNameById);
  
  if (lines.length === 0) {
    const amt = Number((transaction as any).amount ?? 0);
    const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
    const tax = (amt * gstPct) / 100;
    const total = amt + tax;
    
    return [
      [
        "1",
        transaction.description || "Item",
        1,
        `${gstPct}%`,
        formatCurrency(amt),
        formatCurrency(tax),
        formatCurrency(total),
      ],
    ];
  }

  return lines.map((item: any, index: number) => [
    (index + 1).toString(),
    `${item.name}${item.description ? ' - ' + item.description : ''}`,
    item.quantity || 1,
    `${item.gstPercentage || 0}%`,
    formatCurrency(Number(item.pricePerUnit || item.amount)),
    formatCurrency(item.lineTax || 0),
    formatCurrency(item.lineTotal || item.amount || 0),
  ]);
};

export const generatePdfForTemplate2 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById: Map<string, string> | undefined
): jsPDF => {
  const doc = new jsPDF();
  const { lines, subtotal, tax, invoiceTotal, gstPct, gstEnabled } =
    deriveTotals(transaction, company, serviceNameById);
  const companyGSTIN = getCompanyGSTIN(company);

  const partyAddress = party
    ? [party.address, party.city, party.state].filter(Boolean).join(", ")
    : "Address not available";

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(company?.businessName || "Your Company", 20, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(company?.emailId || "", 20, 37);
  doc.text(company?.mobileNumber || "", 20, 44);
  if (companyGSTIN) {
    doc.text(`GSTIN: ${companyGSTIN}`, 20, 51);
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Invoice ${invNo(transaction)}`,
    doc.internal.pageSize.getWidth() - 20,
    30,
    { align: "right" }
  );

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Issued: ${new Intl.DateTimeFormat("en-US").format(
      new Date(transaction.date)
    )}`,
    doc.internal.pageSize.getWidth() - 20,
    37,
    { align: "right" }
  );
  doc.text(
    `Payment Due: ${new Intl.DateTimeFormat("en-US").format(
      new Date(
        new Date(transaction.date).setDate(
          new Date(transaction.date).getDate() + 30
        )
      )
    )}`,
    doc.internal.pageSize.getWidth() - 20,
    44,
    { align: "right" }
  );

  doc.line(15, 60, doc.internal.pageSize.getWidth() - 15, 60);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(party?.name || "Client Name", 20, 75);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(party?.email || "", 20, 82);
  doc.text(partyAddress, 20, 89);

  const body = getItemsBodyTemplate2(transaction, serviceNameById);

  autoTable(doc, {
    startY: 100,
    head: [["S.No.", "Item Description", "Qty", "GST%", "Rate", "Tax", "Total"]],
    body: body,
    theme: "grid",
    headStyles: { fillColor: [238, 238, 238], textColor: [0, 0, 0] },
    bodyStyles: { fillColor: [255, 255, 255] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals section
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sub Total", 140, finalY, { align: "right" });
  doc.text(formatCurrency(subtotal), 200, finalY, { align: "right" });

  if (gstEnabled) {
    doc.text(`GST Total`, 140, finalY + 7, { align: "right" });
    doc.text(formatCurrency(tax), 200, finalY + 7, { align: "right" });
  }

  doc.setDrawColor(0);
  doc.line(120, finalY + 12, 200, finalY + 12);

  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", 150, finalY + 19, { align: "right" });
  doc.text(formatCurrency(invoiceTotal), 200, finalY + 19, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Thank you for your business! Payment is expected within 31 days.",
    20,
    finalY + 30
  );

  return doc;
};

export const generatePdfForTemplate3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById: Map<string, string> | undefined
): Promise<jsPDF> => {
  // ------ local helpers ------
  const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
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

  const _deriveTotals = (
    tx: Transaction,
    co?: Company | null,
    svcNameById?: Map<string, string>
  ) => {
    const lines = getUnifiedLines(tx, svcNameById);

    const subtotal = lines.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
    const totalTax = lines.reduce((sum: number, it: any) => sum + (Number(it.lineTax) || 0), 0);
    const invoiceTotal = lines.reduce((sum: number, it: any) => sum + (Number(it.lineTotal) || 0), 0);

    const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();

    return { lines, subtotal, tax: totalTax, invoiceTotal, gstPct: 0, gstEnabled };
  };
  // -------------------------------------------------------------------------------

  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin

  // Palette
  const NAVY: [number, number, number] = [29, 44, 74];
  const GOLD: [number, number, number] = [204, 181, 122];
  const TEXT: [number, number, number] = [41, 48, 66];
  const MUTED: [number, number, number] = [110, 119, 137];

  const { lines, subtotal, tax, invoiceTotal, gstEnabled } =
    _deriveTotals(transaction, company, serviceNameById);
  const companyGSTIN = _getCompanyGSTIN(company);

  const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

  // Data scaffold
  const invoiceData = {
    companyWebsite: "WWW.COMPANYWEBSITE.COM",
    invoiceTo: {
      name: party?.name || "ANDREAS DAVID",
      address:
        party?.address && party?.city
          ? `${party.address}, ${party.city}, ${party.state || ""}`.replace(/,\s*$/, "")
          : "123 STREET, CANADA",
    },
    invoiceNumber: invNo(transaction),
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : "01 / 10 / 2024",
    terms: [
      "Lorem ipsum dolor sit asu sud",
      "amet, consectetur adipiscing elit,",
      "sed do eiusmod tempor incidid-",
      "ua  wu weurn awnt.",
    ],
    footer: {
      address: company?.address || "your address here",
      email: company?.emailId || "yourbusinessaccount@mail.com",
      phone: company?.mobileNumber || "123 456 789",
    },
  };

  // Convert unified lines into rows for the table
  const itemsForTable = lines.map((l: any, index: number) => ({
    sno: (index + 1).toString(),
    description: `${l.name}${l.description ? " — " + l.description : ""}`,
    quantity: l.quantity || 1,
    pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
    amount: Number(l.amount || 0),
    gstPercentage: l.gstPercentage || 0,
    lineTax: Number(l.lineTax || 0),
    lineTotal: Number(l.lineTotal || l.amount || 0),
  }));

  if (itemsForTable.length === 0) {
    const amount = Number((transaction as any).amount ?? 0);
    const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
    const lineTax = (amount * gstPct) / 100;
    const lineTotal = amount + lineTax;
    
    itemsForTable.push({
      sno: "1",
      description: transaction.description || "Item",
      quantity: 1,
      pricePerUnit: amount,
      amount: amount,
      gstPercentage: gstPct,
      lineTax: lineTax,
      lineTotal: lineTotal,
    });
  }

  const fetchAsDataURL = async (url: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);

  // Top header strip
  const stripY = 5;
  const stripH = 15;
  const rightLogoBlockW = 10;
  const stripX = 5;
  const stripW = pw - m - rightLogoBlockW - stripX;

  // thin top hairline
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(0, stripY - 6, pw, stripY - 6);

  // navy strip
  doc.setFillColor(...NAVY);
  doc.rect(stripX, stripY, stripW, stripH, "F");

  // Business name in gold, spaced
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  const spacedText = (company?.businessName || "Your Company")
    .toUpperCase()
    .split("")
    .join(" ");
  doc.text(spacedText, pw / 2, stripY + stripH - 5, { align: "center" });

  // right logo area
  const logoBoxX = pw - m - rightLogoBlockW;
  const maxLogoW = 24;
  const maxLogoH = 24;
  const logoTopY = stripY - 3;

  try {
    const logoUrl = "https://i.pinimg.com/736x/71/b3/e4/71b3e4159892bb319292ab3b76900930.jpg";
    const dataURL = await fetchAsDataURL(logoUrl);
    if (dataURL) {
      const props = doc.getImageProperties(dataURL);
      const scale = Math.min(maxLogoW / props.width, maxLogoH / props.height);
      const w = props.width * scale;
      const h = props.height * scale;
      const x = logoBoxX + 6;
      const y = logoTopY;
      doc.addImage(dataURL, "JPEG", x, y, w, h);
    }
  } catch {
    // vector fallback
    const x = logoBoxX + 5, y = logoTopY, s = 20;
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, y, s, s, 3, 3, "F");
    doc.setFillColor(...GOLD);
    doc.circle(x + s - 6, y + 6, 3, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(x + 6, y + 10, x + 10, y + 14);
    doc.line(x + 10, y + 14, x + 16, y + 8);
  }

  // Show company GSTIN under the strip
  if (companyGSTIN) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(`GSTIN: ${companyGSTIN}`, m, stripY + stripH + 7);
  }

  // Header blocks
  const headY = stripY + stripH + 22;

  // left block
  doc.setTextColor(...TEXT);
  doc.setFontSize(9.8);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE TO:", m, headY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.2);
  doc.text(invoiceData.invoiceTo.name, m, headY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(...MUTED);
  doc.text(invoiceData.invoiceTo.address, m, headY + 13.5);

  // right block
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.8);
  doc.text(`INVOICE NO. ${invoiceData.invoiceNumber}`, pw - m, headY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`DATE  ${invoiceData.date}`, pw - m, headY + 7, { align: "right" });

  // Table head - Adjusted column positions
  let y = headY + 28;
  doc.setDrawColor(225, 225, 225);
  doc.line(m, y - 10, pw - m, y - 10);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(10.5); // Smaller font to fit all columns
  
  // Column positions (adjust these based on your page width)
  const colSNo = m;
  const colItem = colSNo + 20;
  const colQty = colItem + 40; // Right-aligned columns
  const colPrice = pw - m - 110;
  const colAmount = pw - m - 80;
  const colGST = pw - m - 50;
  const colTax = pw - m - 30;
  const colTotal = pw - m;

  doc.text("S.No.", colSNo, y);
  doc.text("ITEM", colItem, y);
  doc.text("QTY", colQty, y, { align: "right" });
  doc.text("PRICE", colAmount, y, { align: "right" });
  doc.text("GST%", colGST, y, { align: "right" });
  doc.text("TAX", colTax, y, { align: "right" });
  doc.text("TOTAL", colTotal, y, { align: "right" });

  // Rows
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...GOLD);
  doc.setFontSize(9);

  itemsForTable.forEach((it: any) => {
    // S.No.
    doc.text(it.sno, colSNo, y);
    
    // Item Description (truncate if too long)
    const maxDescWidth = colQty - colItem - 5;
    let description = it.description;
    if (doc.getTextWidth(description) > maxDescWidth) {
      description = description.substring(0, 30) + "...";
    }
    doc.text(description, colItem, y);
    
    // Right-aligned columns
    doc.text(String(it.quantity), colQty, y, { align: "right" });
    doc.text(money(it.pricePerUnit), colAmount, y, { align: "right" });
    doc.text(`${it.gstPercentage}%`, colGST, y, { align: "right" });
    doc.text(money(it.lineTax), colTax, y, { align: "right" });
    doc.text(money(it.lineTotal), colTotal, y, { align: "right" });

    // row divider
    doc.line(m, y + 3.2, pw - m, y + 3.2);
    y += 14; // row height
  });

  // Totals section
  y += 6;
  const totalsTop = y;

  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  
  // Align totals to the right side columns
  doc.text("SUBTOTAL", colTax, totalsTop, { align: "right" });
  doc.text(money(subtotal), colTotal, totalsTop, { align: "right" });

  let lineOffset = 10;
  if (gstEnabled) {
    doc.text("GST TOTAL", colTax, totalsTop + lineOffset, { align: "right" });
    doc.text(money(tax), colTotal, totalsTop + lineOffset, { align: "right" });
    lineOffset += 14;
  }

  doc.setFontSize(12.5);
  doc.text("GRAND TOTAL", colTax, totalsTop + lineOffset, { align: "right" });
  doc.text(money(invoiceTotal), colTotal, totalsTop + lineOffset, { align: "right" });

  // Footer
  const afterTotals = Math.max(totalsTop + lineOffset + 6, y + 30);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(m, afterTotals + 6, pw - m, afterTotals + 6);

  // Bottom navy footer bar
  const fbH = 18;
  const fbY = ph - m - fbH;
  doc.setFillColor(...NAVY);
  doc.rect(0, fbY, pw, fbH, "F");

  const innerW = pw;
  const sectionW = innerW / 3;
  const padX = 10;
  const r = 2.2;
  const gap = 4;
  const baseline = fbY + fbH / 2 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  const footerVals = [
    String(invoiceData.footer.address || ""),
    String(invoiceData.footer.email || ""),
    String(invoiceData.footer.phone || ""),
  ];

  const maxTextW = sectionW - (padX + r * 2 + gap + 2);
  const fit = (s: string) => {
    let t = s;
    while (doc.getTextWidth(t) > maxTextW && t.length > 1) t = t.slice(0, -1);
    return t.length < s.length ? t.trimEnd() + "..." : t;
  };

  footerVals.forEach((val, i) => {
    const left = i * sectionW;
    doc.setFillColor(...GOLD);
    const textX = left + padX + r * 2 + gap;
    doc.text(fit(val), textX, baseline, { align: "left" });
  });

  return doc;
};
