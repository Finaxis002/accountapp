import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { deriveTotals, formatCurrency, renderNotes, getItemsBody, invNo, getCompanyGSTIN, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate1 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): jsPDF => {
  const doc = new jsPDF();
  const { subtotal, tax, invoiceTotal } = deriveTotals(
    transaction,
    company,
    serviceNameById
  );
  const companyGSTIN = getCompanyGSTIN(company);

  const invoiceNo = invNo(transaction);
  const invoiceDate = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(transaction.date));
  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  // ---- helpers -------------------------------------------------------------
  const ITEMS_PER_PAGE = 10;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const headerStartY = 65; // where table starts
  const footerOffset = 40; // reserved space at bottom for footer
  const tableBottomMargin = 60;
  const tabletopMargin = 10; // to keep table off the footer

  const drawDecor = () => {
    doc.setFillColor(82, 101, 167);
    doc.rect(0, 0, 8, 40, "F");
    doc.rect(pageW - 8, pageH - 40, 8, 40, "F");
  };

  const drawHeader = () => {
    drawDecor();

    // Company / INVOICE label
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(company?.businessName || "Your Company", 15, 20);

    if (companyGSTIN) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`GSTIN: ${companyGSTIN}`, 15, 26);
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageW - 15, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceDate, pageW - 15, 26, { align: "right" });

    // Invoice info + Bill To / Ship To
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`INVOICE NO: ${invoiceNo}`, 15, 40);

    doc.setFontSize(10);
    doc.text("BILL TO:", pageW - 15, 40, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(party?.name || "N/A", pageW - 15, 45, { align: "right" });
    doc.text(billingAddress, pageW - 15, 50, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", pageW - 15, 55, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(shippingAddressStr, pageW - 15, 60, { align: "right" });
  };

  const drawFooter = () => {
    const y = pageH - footerOffset;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Method", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text("Please make payments to the provided account.", 15, y + 5);

    // Render notes instead of hardcoded terms
    renderNotes(
      doc,
      transaction.notes || "",
      pageW - 15 - 60,
      y,
      60,
      pageW,
      pageH
    );
  };

  // Build full rows, then chunk into pages of 8
  const allRows = getItemsBody(transaction, serviceNameById);
  const chunks: any[][] = [];
  for (let i = 0; i < allRows.length; i += ITEMS_PER_PAGE) {
    chunks.push(allRows.slice(i, i + ITEMS_PER_PAGE));
  }

  // Ensure we render at least one page even if there are 0 rows (your getItemsBody already handles empty)
  if (chunks.length === 0) chunks.push(allRows);

  // ---- render pages --------------------------------------------------------
  const tableHead = [
    [
      "S.No.",
      "QTY",
      "DESCRIPTION",
      "HSN/SAC",
      "PRICE",
      "GST %",
      "TAX",
      "TOTAL (Incl. GST)",
    ],
  ];

  chunks.forEach((rows, idx) => {
    if (idx > 0) doc.addPage();
    drawHeader();

    autoTable(doc, {
      startY: headerStartY,
      head: tableHead,
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0] },
      bodyStyles: { fillColor: [255, 255, 255] },
      showHead: "everyPage",
      margin: { bottom: tableBottomMargin }, // leaves space for footer
      didDrawPage: () => {
        // nothing here; we manually draw footer after the table so totals can sit above it on last page
      },
      didParseCell: (data) => {
        // Add extra TOP padding for ONLY the first body row
        if (data.section === "body" && data.row.index === 0) {
          // Ensure padding is in object form, then bump the top
          const current = data.cell.styles.cellPadding;
          if (typeof current === "number") {
            data.cell.styles.cellPadding = {
              top: current + 6,
              right: current,
              bottom: current,
              left: current,
            };
          } else {
            // data.cell.styles.cellPadding = { top: (current?.top || 2) + 6, right: current?.right || 2, bottom: current?.bottom || 2, left: current?.left || 2 };
          }
        }
      },
    });

    // Draw static footer on every page — totals will overwrite/come above on last page if needed
    drawFooter();
  });

  // ---- totals on the last page --------------------------------------------
  // Place totals under the last table; if no space, add a new page (with header & footer).
  let finalY = (doc as any).lastAutoTable?.finalY || headerStartY;
  const minSpaceNeeded = 30; // approx height for totals block
  if (finalY + minSpaceNeeded > pageH - footerOffset - 10) {
    doc.addPage();
    drawHeader();
    drawFooter();
    finalY = headerStartY; // start near top on the new page
  }

  let currentY = finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sub Total", 150, currentY, { align: "right" });
  doc.text(formatCurrency(subtotal), 200, currentY, { align: "right" });

  if (tax > 0) {
    currentY += 7;
    doc.text("GST Total", 150, currentY, { align: "right" });
    doc.text(formatCurrency(tax), 200, currentY, { align: "right" });
  }

  currentY += 5;
  doc.setDrawColor(0);
  doc.line(120, currentY, 200, currentY);

  currentY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", 160, currentY, { align: "right" });
  doc.text(formatCurrency(invoiceTotal), 200, currentY, { align: "right" });

  return doc;
};