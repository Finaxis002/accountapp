import type { Transaction, Company, Party, Item } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

const formatCurrency = (amount: number) => {
  // Manually format currency to avoid weird characters that break jspdf
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
};

const getItemsBody = (transaction: Transaction) => {
  if (!transaction.items || transaction.items.length === 0) {
    const amount = transaction.amount || 0;
    const quantity = transaction.quantity || 1;
    const price = transaction.pricePerUnit || amount;
    return [
      [
        "1",
        quantity,
        transaction.description || "Item",
        formatCurrency(price),
        formatCurrency(amount),
      ],
    ];
  }
  return transaction.items.map((item, index) => {
    const quantity = item.quantity || 0;
    const pricePerUnit = item.pricePerUnit || 0;
    const amount = quantity * pricePerUnit;
    return [
      (index + 1).toString(),
      quantity,
      `${item.product?.name || "Item"}\n${transaction.description || ""}`,
      formatCurrency(pricePerUnit),
      formatCurrency(amount),
    ];
  });
};

const fetchImageAsDataURL = async (url: string) => {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("fetch failed");
  const blob = await res.blob();
  const mime = blob.type || "image/jpeg";
  const fmt = mime.includes("png") ? "PNG" : "JPEG";
  const dataURL: string = await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
  return { dataURL, fmt: fmt as "PNG" | "JPEG" };
};

export const generatePdfForTemplate1 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined
): jsPDF => {
  const doc = new jsPDF();
  const subtotal =
    transaction.items?.reduce(
      (sum, item) => sum + item.quantity * item.pricePerUnit,
      0
    ) ||
    transaction.amount ||
    0;
  const tax = subtotal * 0.1; // 10% tax
  const totalAmount = subtotal + tax;
  const invoiceNumber = `#${transaction._id.slice(-6).toUpperCase()}`;
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
  doc.text(`INVOICE NO: ${invoiceNumber}`, 15, 40);

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
  const bodyRows = getItemsBody(transaction) as RowInput[];

  // one empty row matching your 5 columns
  const blankRow: RowInput = ["", "", "", "", ""];

  autoTable(doc, {
    startY: 65,
    head: [["S.No.", "QTY", "DESCRIPTION", "PRICE", "TOTAL"]],
    body: [blankRow, ...bodyRows],
    theme: "striped",
    headStyles: {
      fillColor: [241, 245, 249] as [number, number, number],
      textColor: [0, 0, 0] as [number, number, number],
    },
    bodyStyles: { fillColor: [255, 255, 255] as [number, number, number] },
    didParseCell: (h) => {
      // make the first body row truly blank
      if (h.section === "body" && h.row.index === 0) {
        h.cell.text = [];
        h.cell.styles.minCellHeight = 8; // height of the gap
        h.cell.styles.lineWidth = 0; // no borders
        h.cell.styles.fillColor = [255, 255, 255] as [number, number, number];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Totals
  let currentY = finalY + 10;
  doc.setFontSize(10);
  doc.text("Sub Total", 140, currentY, { align: "right" });
  doc.text(formatCurrency(subtotal), 200, currentY, { align: "right" });
  currentY += 7;
  doc.text("Tax 10%", 140, currentY, { align: "right" });
  doc.text(formatCurrency(tax), 200, currentY, { align: "right" });
  currentY += 5;
  doc.setDrawColor(0);
  doc.line(120, currentY, 200, currentY);
  currentY += 7;
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", 150, currentY, { align: "right" });
  doc.text(formatCurrency(totalAmount), 200, currentY, { align: "right" });

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

const getItemsBodyTemplate2 = (transaction: Transaction) => {
  if (!transaction.items || transaction.items.length === 0) {
    const amount = transaction.amount || 0;
    const quantity = transaction.quantity || 1;
    const price = transaction.pricePerUnit || amount;
    return [
      [
        "1",
        transaction.description || "Item",
        quantity,
        formatCurrency(price),
        formatCurrency(amount),
      ],
    ];
  }
  return transaction.items.map((item, index) => {
    const quantity = item.quantity || 0;
    const pricePerUnit = item.pricePerUnit || 0;
    const amount = item.amount;
    return [
      (index + 1).toString(),
      item.product?.name || "Item",
      quantity,
      formatCurrency(pricePerUnit),
      formatCurrency(amount),
    ];
  });
};

export const generatePdfForTemplate2 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined
): jsPDF => {
  const doc = new jsPDF();
  const subtotal =
    transaction.items?.reduce((sum, item) => sum + item.amount, 0) ||
    transaction.amount ||
    0;
  const tax = subtotal * 0.13; // 13% tax
  const totalAmount = subtotal + tax;
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

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Invoice #${transaction._id.slice(-6).toUpperCase()}`,
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

  const body = getItemsBodyTemplate2(transaction);
  body.push(["", "", "", "HST", formatCurrency(tax)]);

  autoTable(doc, {
    startY: 100,
    head: [["S.No.", "Item Description", "Qty", "Rate", "Sub-total"]],
    body: body,
    foot: [["", "", "", "Total", formatCurrency(totalAmount)]],
    theme: "grid",
    headStyles: { fillColor: [238, 238, 238], textColor: [0, 0, 0] },
    footStyles: {
      fillColor: [238, 238, 238],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(8);
  doc.text(
    "Thank you for your business! Payment is expected within 31 days.",
    20,
    finalY
  );

  return doc;
};

export const generatePdfForTemplate3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin

  // --- Palette (approx. from mock) ---
  const NAVY: [number, number, number] = [29, 44, 74]; // header/footer & headings
  const GOLD: [number, number, number] = [204, 181, 122]; // accents and row rules
  const TEXT: [number, number, number] = [41, 48, 66]; // body text (dark gray/blue)
  const MUTED: [number, number, number] = [110, 119, 137]; // secondary text

  const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

  // Data
  const invoiceData = {
    companyWebsite: "WWW.COMPANYWEBSITE.COM",
    invoiceTo: {
      name: party?.name || "ANDREAS DAVID",
      address:
        party?.address && party?.city
          ? `${party.address}, ${party.city}, ${party.state}`
          : "123 STREET, CANADA",
    },
    invoiceNumber: transaction._id
      ? transaction._id.slice(-6).toUpperCase()
      : "000111",
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : "01 / 10 / 2024",
    items: transaction.items?.length
      ? transaction.items.map((item) => ({
          description: item.product?.name || "Lorem ipsum dolor",
          price: item.pricePerUnit || 0,
          quantity: item.quantity || 1,
          total: item.amount || 0,
        }))
      : [],
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

  const fetchAsDataURL = async (url: string) => {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  };

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);

  // --- replace your existing "Top Header Strip" block with THIS ---
  const stripY = 5;
  const stripH = 15;
  const rightLogoBlockW = 10; // reserved white area for logo & text (matches mock)
  // const gap = 8;                  // gap between navy strip and logo block

  const stripX = 5;
  const stripW = pw - m - rightLogoBlockW - stripX; // not full width (stops before logo)

  // thin top hairline over page content (subtle)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(0, stripY - 6, pw, stripY - 6);

  // navy strip
  doc.setFillColor(...NAVY);
  doc.rect(stripX, stripY, stripW, stripH, "F");

  // “INVOICE” in gold, spaced
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  const spacedText = (company?.businessName || "Your Company")
    .toUpperCase()
    .split("")
    .join("  "); // adds 1 space between letters

  doc.text(spacedText, pw / 2, stripY + stripH - 5, { align: "center" });

  // website centered under strip
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(...TEXT);
  // doc.text(invoiceData.companyWebsite, pw / 2, stripY + stripH + 7, {
  //   align: "center",
  // });
  // --- right logo area ---
  const logoBoxX = pw - m - rightLogoBlockW; // reserved white area
  const maxLogoW = 24;
  const maxLogoH = 24;
  const logoTopY = stripY - 3;

  // try to load your URL; fallback to vector if blocked
  try {
    const logoUrl =
      "https://i.pinimg.com/736x/71/b3/e4/71b3e4159892bb319292ab3b76900930.jpg";
    const dataURL = await fetchAsDataURL(logoUrl);
    const props = doc.getImageProperties(dataURL);
    const scale = Math.min(maxLogoW / props.width, maxLogoH / props.height);
    const w = props.width * scale;
    const h = props.height * scale;
    const x = logoBoxX + 6; // left inside the block
    const y = logoTopY; // top align
    doc.addImage(dataURL, "JPEG", x, y, w, h);
  } catch {
    // vector fallback (simple shield + check)
    const x = logoBoxX + 5,
      y = logoTopY,
      s = 20;
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, y, s, s, 3, 3, "F");
    doc.setFillColor(...GOLD);
    doc.circle(x + s - 6, y + 6, 3, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(x + 6, y + 10, x + 10, y + 14);
    doc.line(x + 10, y + 14, x + 16, y + 8);
  }

  // ===== Header Right: Logo Text Placeholder =====
  // (text-only placeholder to match layout)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  // doc.text("LOGO TEXT", pw - m, stripY + 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...MUTED);
  // doc.text("BUSINESS TAGLINE", pw - m, stripY + 12, { align: "right" });

  // ===== Invoice To (left) & Invoice No/Date (right) =====
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
  doc.text(`INVOICE NO. ${invoiceData.invoiceNumber}`, pw - m, headY, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text(`DATE  ${invoiceData.date}`, pw - m, headY + 7, { align: "right" });

  // ===== Table Head =====
  let y = headY + 28;
  doc.setDrawColor(225, 225, 225);
  doc.line(m, y - 10, pw - m, y - 10); // subtle divider above table

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(13.5);
  doc.text("DESCRIPTION", m, y);

  doc.text("PRICE", 140, y, { align: "right" });
  doc.text("QTY.", 160, y, { align: "right" });
  doc.text("TOTAL", pw - m, y, { align: "right" });

  // ===== Rows =====
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...GOLD);

  invoiceData.items.forEach((it) => {
    // description (left)
    doc.setFontSize(10);
    doc.text(it.description, m, y);

    // numbers (right columns)
    doc.setFontSize(10);
    doc.text(money(it.price), 140, y, { align: "right" });
    doc.text(String(it.quantity), 160, y, { align: "right" });
    doc.text(money(it.total), pw - m, y, { align: "right" });

    // gold hairline under each row
    doc.line(m, y + 3.2, pw - m, y + 3.2);

    y += 14; // row height
  });

  // ===== Terms (left) & Totals (right) =====
  y += 6;

  // Terms block
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  doc.setFontSize(10.5);
  // doc.text("Terms and conditions", m, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  // invoiceData.terms.forEach((line, i) => {
  //   doc.text(line, m, y + 6 + i * 5.8);
  // });

  // Totals block (right aligned)
  const subtotal = transaction.items?.reduce((s, it) => s + it.amount, 0) || 0;
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;
  const totalsTop = y;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("SUBTOTAL", 140, totalsTop, { align: "right" });
  doc.text(money(subtotal), pw - m, totalsTop, { align: "right" });

  doc.text("TAX", 140, totalsTop + 10, { align: "right" });
  doc.text(money(tax), pw - m, totalsTop + 10, { align: "right" });

  doc.setFontSize(12.5); // a bit bigger for emphasis
  doc.text("GRAND TOTAL", 140, totalsTop + 24, { align: "right" });
  doc.text(money(grandTotal), pw - m, totalsTop + 24, { align: "right" });

  // subtle divider above footer
  const afterTotals = Math.max(totalsTop + 30, y + 30);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(m, afterTotals + 6, pw - m, afterTotals + 6);

  // ===== Bottom Navy Footer Bar (fixed) =====
  const fbH = 18;
  const fbY = ph - m - fbH;
  doc.setFillColor(...NAVY);
  doc.rect(0, fbY, pw, fbH, "F"); // ⟵ full width

  // layout helpers
  const innerW = pw; // ⟵ use full width
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
    return t.length < s.length ? t.trimEnd() + "" : t;
  };

  footerVals.forEach((val, i) => {
    const left = i * sectionW; // ⟵ no margin

    doc.setFillColor(...GOLD);

    const textX = left + padX + r * 2 + gap;
    doc.text(fit(val), textX, baseline, { align: "left" });
  });

  return doc;
};
