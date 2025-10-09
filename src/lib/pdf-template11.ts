import type {
    Company,
    Party,
    Transaction,
    ShippingAddress,
    Bank,
} from "@/lib/types";
import jsPDF from "jspdf";
import {
    deriveTotals,
    formatCurrency,
    getBillingAddress,
    getShippingAddress,
    getItemsBody,
    calculateGST,
    getUnifiedLines
} from "./pdf-utils";
import autoTable, { RowInput, Styles } from "jspdf-autotable";
import {
    renderNotes,
    invNo,
} from "./pdf-utils";
import { capitalizeWords } from "./utils";


export const generatePdfForTemplate11 = async (
    transaction: Transaction,
    company: Company | null | undefined,
    party: Party | null | undefined,
    serviceNameById?: Map<string, string>,
    shippingAddress?: ShippingAddress | null,
    opts?: { displayCompanyName?: string; logoUrl?: string },
    bank?: Bank | null
): Promise<jsPDF> => {
    

    console.log("Transactions data from template 11", transaction)
    console.log("Bank details from template 11:", bank)

    console.log("Bank details from temp11 :", bank)

    // ---------- palette ----------

    const COLOR = {
        PRIMARY: [38, 70, 83] as [number, number, number],
        TEXT: [52, 58, 64] as [number, number, number],
        SUB: [108, 117, 125] as [number, number, number],
        BORDER: [206, 212, 218] as [number, number, number],
        BG: [248, 249, 250] as [number, number, number],
        WHITE: [255, 255, 255] as [number, number, number],
        BLUE: [0, 102, 204] as [number, number, number],
    };

    function checkPageBreak(doc: jsPDF, y: number, neededSpace: number = 40) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const bottomMargin = 40; // safe space at bottom
        if (y + neededSpace > pageHeight - bottomMargin) {
            doc.addPage();
            return 40; // new Y position at top of next page
        }
        return y;
    }

    // ---------- helpers ----------
const detectGSTIN = (x?: Partial<Company | Party> | null): string | null => {
    const a = x as any;
    const gstin =
    a?.gstin ??
    a?.GSTIN ??
    a?.gstIn ??
    a?.GSTIn ??
    a?.gstNumber ??
    a?.GSTNumber ??
    a?.gst_no ??
    a?.GST_no ??
    a?.GST ??
    a?.gstinNumber ??
    a?.tax?.gstin;
    return gstin || null;
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

        
        
const companyGSTIN = detectGSTIN(company)?.trim() || "";
const partyGSTIN = detectGSTIN(party)?.trim() || "";
const stateCode = (gst: string) => {
    if (!gst || typeof gst !== "string") return "";
    const code = gst.slice(0, 2);
    return /^\d+$/.test(code) ? code : "";
};

const gstEnabled = !!companyGSTIN && items.some((it: any) => Number(it?.gstPercentage || 0) > 0);


function extractStateFromAddress(address: string): string {
    if (!address) return "";
    const parts = address.split(",").map(p => p.trim());
    if (parts.length < 2) return "";
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (/^[A-Za-z\s]+$/.test(part)) return part;
    }
    return parts[parts.length - 2] || "";
}
const companyState = company?.addressState || "";
const partyState = party?.state || "";
let isInterState = false;
if (companyState && partyState) {
    isInterState = companyState.toLowerCase() !== partyState.toLowerCase();
}
const buyerState = party?.state || "State not available";
const consigneeState =
    shippingAddress?.state || party?.state || "State not available";

    const billingAddress = capitalizeWords(getBillingAddress(party));
    const shippingAddressStr = capitalizeWords(getShippingAddress(shippingAddress, billingAddress));
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
            state: companyState || "State not available",
        },
        billTo: {
            name: party?.name || "",
            billing: billingAddress || "",
            shipping: shippingAddressStr || "",
            email: (party as any)?.email || "",
            gstin: partyGSTIN || "",
        },
        notes: transaction?.notes || "",
        totalInWords: "",
    };

    // ---------- doc ----------
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    // >>> STRICT LEFT-ALIGNED CONTENT <<<
    const margin = 36;
    const contentWidth = pw - margin * 2;
    const gutter = 12;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.TEXT);

    // ---------- header (matches sample: left company block + right INVOICE) ----------
    const headerH = 90;

    const drawHeader = async () => {
        // background strip inside content area (left aligned)
        const headerH = 90;
        doc.setFillColor(...COLOR.BG);
        (doc as any).rect(margin, 0, contentWidth, headerH, "F");

        // fetch logo first
        const dataURL = await fetchAsDataURL(invoiceData.company.logoUrl);
        const hasLogo = !!dataURL;

        const nameX = hasLogo ? margin + gutter + 100 : margin + gutter;

        // optional logo
        if (hasLogo) {
            try {
                doc.addImage(dataURL, "PNG", margin + gutter, 28, 80, 40);
            } catch { }
        }

        // company name 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...COLOR.PRIMARY);
        doc.text(
            capitalizeWords((invoiceData.company.name || "").toUpperCase()),
            nameX,
            42
        );

        // address
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR.SUB);
const addr = (invoiceData.company.address || "").trim();
const stateText = company?.addressState ? `, ${company.addressState}` : "";
if (addr || stateText) {
    doc.text(addr + stateText, nameX, 58, { maxWidth: contentWidth - (nameX - margin) - 12 });
}
    };

    await drawHeader();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const infoBoxW = 100, infoBoxH = 34;
    const infoX = margin + contentWidth - infoBoxW - 4, infoY = 16;

    doc.text("Name :", infoX + 6, infoY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(capitalizeWords(invoiceData.billTo.name || "-"), infoX + 60, infoY + 12, { align: "left" });

    doc.setFont("helvetica", "bold");
    doc.text("Phone :", infoX + 6, infoY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(((party as any)?.phone || company?.mobileNumber || "-"), infoX + 60, infoY + 24);
    // ---------- company & bill-to ----------
    const infoTop = headerH + 18;

    const gstText = invoiceData.company.gstin
        ? `GSTIN: ${invoiceData.company.gstin}`
        : "GSTIN: -";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.TEXT);
    // ---------- 3-SECTION BLUE HEADER BLOCK (BUYER / CONSIGNEE / META) ----------
    const topY = 96;
    const boxH = 120;
    const bw = contentWidth;
    // 2️⃣ TAX INVOICE strip 
    const headerBarY = topY - 6;

    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(1);
    doc.line(margin, headerBarY - 10, margin + contentWidth, headerBarY - 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.TEXT);
    doc.text(gstText, margin + gutter, headerBarY);
    doc.text("TAX INVOICE", margin + contentWidth / 2, headerBarY, { align: "center" });
    doc.text("ORIGINAL FOR RECIPIENT", margin + contentWidth - gutter, headerBarY, { align: "right" });

    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(1);
    doc.line(margin, topY, margin + contentWidth, topY);
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(1);

    doc.line(margin, headerBarY - 10, margin, topY);

    doc.line(margin + contentWidth, headerBarY - 10, margin + contentWidth, topY);
    // buyer / consignee
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(1);
    (doc as any).rect(margin, topY, bw, boxH, "S" as "S");
    // Column widths (equally distributed)
    const w1 = bw * 0.33;  // Buyer
    const w2 = bw * 0.33; // Consignee
    const w3 = bw * 0.33; // Meta

    const x1 = margin;
    const x2 = margin + w1;
    const x3 = margin + w1 + w2;

    // Vertical separators
    doc.setLineWidth(0.7);
    doc.line(x2, topY, x2, topY + boxH);
    doc.line(x3, topY, x3, topY + boxH);

    const headH = 18;
    doc.line(x1, topY + headH, x1 + w1, topY + headH);
    doc.line(x2, topY + headH, x2 + w2, topY + headH);
    doc.line(x3, topY + headH, x3 + w3, topY + headH);

    doc.line(x1, topY + headH, x1 + w1, topY + headH);
    doc.line(x2, topY + headH, x2 + w2, topY + headH);
    doc.line(x3, topY + headH, x3 + w3, topY + headH);
    let y = 40;
    // Headings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.TEXT);
    y = checkPageBreak(doc, y, 80);
    doc.text("Details of Buyer :", x1 + 6, topY + 12);
    doc.text("Details of Consignee :", x2 + 6, topY + 12);
    doc.text("", x3 + 6, topY + 12); // 👈 left-aligned
    y += 60;
    // Helper to print label
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

    // 2)  Buyer
    let yL = topY + headH + 12;
    yL = row("Name", invoiceData.billTo.name, x1, yL, w1);
    yL = row("Address", invoiceData.billTo.billing || "Address not ", x1, yL, w1);
yL = row("State", buyerState, x1, yL, w1);
    yL = row("Phone", (party as any)?.phone || "-", x1, yL, w1);
    yL = row("GSTIN", invoiceData.billTo.gstin, x1, yL, w1);

    // 3) Consignee / Shipped to
    let yM = topY + headH + 12;
    const consigneeName = (party as any)?.consigneeName || invoiceData.billTo.name || "";
    const consigneeAddr = invoiceData.billTo.shipping || invoiceData.billTo.billing || "";
    const consigneeCountry =
        (shippingAddress as any)?.country || (party as any)?.country || "India";
    const consigneePhone = (shippingAddress as any)?.phone || (party as any)?.phone || "-";
    const consigneeGST = (party as any)?.consigneeGSTIN || "-";

    yM = row("Name", consigneeName, x2, yM, w2);
    yM = row("Address", consigneeAddr, x2, yM, w2);
    yM = row("State", consigneeState, x2, yM, w2);
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

    //  GST helpers + totals  
    const gstBreakup = (taxable: number, gstPct: number, inter: boolean) => {
        const base = Number(taxable || 0);
        const rate = Number(gstPct || 0);

        if (rate <= 0 || base <= 0) {
            return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, total: base };
        }

        if (inter) {
            // Apply IGST for inter-state
            const igst = (base * rate) / 100;
            return { cgst: 0, sgst: 0, igst, totalTax: igst, total: base + igst };
        }

        // Apply CGST/SGST for intra-state
        const halfRate = rate / 2;
        const cgst = (base * halfRate) / 100;
        const sgst = (base * halfRate) / 100;
        return { cgst, sgst, igst: 0, totalTax: cgst + sgst, total: base + cgst + sgst };
    };
    type RowCalc = {
        sr: number;
        desc: string;
        hsn: string;
        qty: number;
        unit?: string;
        rate: number;
        taxable: number;
        gstPct: number;
        cgst: number;
        sgst: number;
        igst: number;
        total: number;
    };
    
    const calcRows: RowCalc[] = items.map((it: any, i: number) => {
        const qty = Number(it.quantity || 1);
        const rate = Number(it.pricePerUnit ?? it.amount ?? 0) / (qty || 1);
        const taxable = Number(it.amount ?? qty * rate);
        const gstPct = Number(it.gstPercentage ?? 0);
        const { cgst, sgst, igst, total } = gstBreakup(taxable, gstPct, isInterState);
        const desc = `${capitalizeWords(it?.name || "")}${it?.description ? " — " + it.description : ""}`;
        return {
            sr: i + 1,
            desc,
            hsn: it?.code || "N/A",
            qty: Math.round(qty),
            unit: it?.unit || it?.uom || "",
            rate,
            taxable,
            gstPct,
            cgst,
            sgst,
            igst,
            total,
        };
        
    });
    

    const totalTaxableValue = calcRows.reduce((s, r) => s + r.taxable, 0);
    const totalCGST = calcRows.reduce((s, r) => s + r.cgst, 0);
    const totalSGST = calcRows.reduce((s, r) => s + r.sgst, 0);
    const totalIGST = calcRows.reduce((s, r) => s + r.igst, 0);
    const totalGSTAmount = isInterState ? totalIGST : (totalCGST + totalSGST);
    const totalInvoiceAmount = calcRows.reduce((s, r) => s + r.total, 0);
    invoiceData.totalInWords = rupeesInWords(totalInvoiceAmount);

    // FIX: Determine if CGST/SGST columns are needed based on GST being applicable AND not being inter-state
    const shouldShowCGSTSGSTColumns = gstEnabled && !isInterState;
    const shouldShowIGSTColumns = gstEnabled && isInterState;

    // --- Dynamic Column Widths ---
    // Recalculate dynamic width for Name/Desc (index 1) to properly use available space
    const fixedWidthsIGST = 40 + 50 + 40 + 45 + 70 + 50 + 65 + 85; // Sum of fixed IGST columns (0, 2-8) = 445. 
    const fixedWidthsCGSTSGST = 35 + 35 + 35 + 35 + 50 + 40 + 60 + 40 + 60 + 80; // Sum of fixed CGST/SGST columns (0, 2-10) = 470.
    const fixedWidthsNoGST = 35 + 35 + 35 + 50 + 80; // Sum of fixed No-GST columns (0, 2, 3, 4, 5, 6) = 315

    const dynamicNameColIGST = contentWidth - 445; 
    const dynamicNameColCGSTSGST = contentWidth - 400;
    const dynamicNameColNoGST = contentWidth - 315; 


    // BLOCK-2 (IGST vs CGST/SGST)
    const head: RowInput[] = shouldShowIGSTColumns
        ? [[
            { content: "Sr. No.", styles: { halign: "left" } },
            { content: "Name of Product / Service", styles: { halign: "left" } },
            { content: "HSN / SAC", styles: { halign: "left" } },
            { content: "Qty", styles: { halign: "right" } },
            { content: "Rate", styles: { halign: "right" } },
            { content: "Taxable Value", styles: { halign: "right" } },
            { content: "IGST %", styles: { halign: "center" } },
            { content: "IGST Amount", styles: { halign: "center" } },
            { content: "Total", styles: { halign: "right" } },
        ]]
        : shouldShowCGSTSGSTColumns ? [[
            { content: "Sr. No.", styles: { halign: "left" } },
            { content: "Name of Product / Service", styles: { halign: "left" } },
            { content: "HSN / SAC", styles: { halign: "left" } },
            { content: "Qty", styles: { halign: "right" } },
            { content: "Rate", styles: { halign: "right" } },
            { content: "Taxable Value", styles: { halign: "right" } },
            { content: "CGST %", styles: { halign: "center" } },
            { content: "CGST Amount", styles: { halign: "center" } },
            { content: "SGST %", styles: { halign: "center" } },
            { content: "SGST Amount", styles: { halign: "center" } },
            { content: "Total", styles: { halign: "right" } },
        ]]
        : [[
            { content: "Sr. No.", styles: { halign: "left" } },
            { content: "Name of Product / Service", styles: { halign: "left" } },
            { content: "HSN / SAC", styles: { halign: "left" } },
            { content: "Qty", styles: { halign: "right" } },
            { content: "Rate", styles: { halign: "right" } },
            { content: "Taxable Value", styles: { halign: "right" } },
            { content: "Total", styles: { halign: "right" } },
        ]]; // 7 columns for No-GST

    const body: RowInput[] = calcRows.map((r) => {
        const qtyCell = r.unit ? `${r.qty} ${r.unit}` : String(r.qty);

        // Case 1: IGST (Inter-state)
        if (shouldShowIGSTColumns) {
            return [
                String(r.sr),
                { content: r.desc },
                r.hsn, // HSN/SAC
                { content: qtyCell, styles: { halign: "right" } },
                { content: r.rate.toFixed(2), styles: { halign: "right" } },
                { content: r.taxable.toFixed(2), styles: { halign: "right" } },
                { content: `${r.gstPct}%`, styles: { halign: "center" } },
                { content: r.igst.toFixed(2), styles: { halign: "right" } }, 
                { content: money(r.total), styles: { halign: "right" } }, 
            ];
        } 
        
        // Case 2: CGST/SGST (Intra-state)
        else if (shouldShowCGSTSGSTColumns) {
            const halfPct = (r.gstPct / 2).toFixed(2);
            return [
                String(r.sr),
                { content: r.desc },
                r.hsn, // HSN/SAC
                { content: qtyCell, styles: { halign: "right" } },
                { content: r.rate.toFixed(2), styles: { halign: "right" } },
                { content: r.taxable.toFixed(2), styles: { halign: "right" } },
                { content: `${halfPct}%`, styles: { halign: "center" } }, 
                { content: r.cgst.toFixed(2), styles: { halign: "right" } }, 
                { content: `${halfPct}%`, styles: { halign: "center" } }, 
                { content: r.sgst.toFixed(2), styles: { halign: "right" } }, 
                { content: money(r.total), styles: { halign: "right" } },
            ];
        } 
        
        // Case 3: NO GST (7 columns)
        else {
            return [
                String(r.sr),
                { content: r.desc },
                r.hsn, // HSN/SAC is correctly placed
                { content: qtyCell, styles: { halign: "right" } },
                { content: r.rate.toFixed(2), styles: { halign: "right" } },
                { content: r.taxable.toFixed(2), styles: { halign: "right" } },
                { content: money(r.total), styles: { halign: "right" } },
            ];
        }
    });

    // Foot logic adapted for three scenarios (IGST, CGST/SGST, No GST)
    const foot: RowInput[] = shouldShowIGSTColumns
        ? [
            [
                { content: "Total", colSpan: 6, styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } }, 
                { content: totalTaxableValue.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } }, 
                { content: "", styles: { halign: "center", cellPadding: 10 } },
                { content: totalIGST.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: totalInvoiceAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
            ],
        ]
        : shouldShowCGSTSGSTColumns ? [
            [
                { content: "Total", colSpan: 6, styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } }, 
                { content: totalTaxableValue.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: "", styles: { halign: "center", cellPadding: 10 } },
                { content: totalCGST.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: "", styles: { halign: "center", cellPadding: 10 } },
                { content: totalSGST.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: totalInvoiceAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
            ],
        ]
        : [
            [
                { content: "Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: totalTaxableValue.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
                { content: totalInvoiceAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", cellPadding: 10 } },
            ],
        ];


    const columnStyles: Record<string, Partial<Styles>> = shouldShowIGSTColumns
        ? {
            "0": { cellWidth: 40 },
            "1": { cellWidth: dynamicNameColIGST }, 
            "2": { cellWidth: 50 }, // HSN/SAC
            "3": { cellWidth: 40 },
            "4": { cellWidth: 45 },
            "5": { cellWidth: 70 },
            "6": { cellWidth: 50 },
            "7": { cellWidth: 65 },
            "8": { cellWidth: 85 },
        }
        : shouldShowCGSTSGSTColumns ? {
            "0": { cellWidth: 35 },
            "1": { cellWidth: dynamicNameColCGSTSGST }, 
            "2": { cellWidth: 35 }, // HSN/SAC
            "3": { cellWidth: 35 },
            "4": { cellWidth: 35 },
            "5": { cellWidth: 50 },
            "6": { cellWidth: 40 },
            "7": { cellWidth: 40 },
            "8": { cellWidth: 40 },
            "9": { cellWidth: 40 },
            "10": { cellWidth: 50 },
        }
        : {
            // No GST (7 columns) - HSN/SAC is column 2
            "0": { cellWidth: 35 },
            "1": { cellWidth: dynamicNameColNoGST }, 
            "2": { cellWidth: 50 }, // HSN/SAC
            "3": { cellWidth: 35 }, // Qty
            "4": { cellWidth: 50 }, // Rate
            "5": { cellWidth: 80 }, // Taxable Value
            "6": { cellWidth: 60 }, // Total
        };

    let startY = yR + 22;

    autoTable(doc, {
        head,
        body,
        pageBreak: "auto",
        foot,
        startY,
        theme: "grid",
        styles: {
            font: "helvetica",
            fontSize: 8,
            textColor: COLOR.TEXT as any,
            lineColor: COLOR.BLUE as any,
            lineWidth: 0.2,
            cellPadding: 6,
            valign: "middle",
        },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold" },
        columnStyles, 
didDrawPage: (data) => {

},
    });
    let footerStartY = (doc as any).lastAutoTable.finalY + 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 40; 
    
    if (footerStartY + 250 > pageHeight - bottomMargin) {
        doc.addPage();
        footerStartY = 60;
    }
    // Split area into 2 columns
    const colW = contentWidth / 2;
    const col1X = margin;
    const col2X = margin + colW;
    const blockHeight = 250;

    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(1);
    (doc as any).rect(col1X, footerStartY, contentWidth, blockHeight, "S");
    doc.setLineWidth(0.6);
    doc.line(col2X, footerStartY, col2X, footerStartY + blockHeight);
    const drawHeading = (
        title: string,
        x: number,
        y: number,
        width: number
    ): number => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...COLOR.TEXT);

        const headingW = doc.getTextWidth(title);
        const headingX = x + (width - headingW) / 2;
        doc.text(title, headingX, y);

        
        doc.setDrawColor(...COLOR.BLUE);
        doc.setLineWidth(1);
        doc.line(x, y + 4, x + width, y + 4);

        return y + 12;
    };

    let y1 = footerStartY + 16;

    // === Total in Words ===
    y1 = drawHeading("Total in Words", col1X, y1, colW);

    // add tax summary heading
    const WORDS_HEADING_GAP = 8;
    y1 += WORDS_HEADING_GAP;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const totalWordsLines = doc.splitTextToSize(invoiceData.totalInWords, colW - 16);
    doc.text(totalWordsLines, col1X + 8, y1);

    y1 += totalWordsLines.length * 12 + 8;

    // thin section divider
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(0.5);
    doc.line(col1X, y1, col1X + colW, y1);
    y1 += 10;

    // === Bank Details ===
y1 = drawHeading("Bank Details", col1X, y1, colW);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);
    y1 += 4;



const bankLines = [
    `Bank Name: ${capitalizeWords(bank?.bankName || "-")}`,
    `Branch: ${capitalizeWords(bank?.branchAddress || "-")}`,
    `City: ${capitalizeWords(bank?.city || "-")}`,
    `IFSC Code: ${capitalizeWords(bank?.ifscCode || "-")}`,
    `Contact Number: ${bank?.contactNumber || "-"}`,
];

// Draw lines in PDF
bankLines.forEach((line, i) => {
    const lineY = y1 + i * 14; 
    const split = doc.splitTextToSize(line, colW - 16);
    doc.text(split, col1X + 8, lineY);
});
y1 += bankLines.length * 14 + 8;
    
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(0.5);
    doc.line(col1X, y1, col1X + colW, y1);
    y1 += 10;

    // === Terms & Conditions ===
y1 = drawHeading("Terms & Conditions", col1X, y1, colW);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

if (transaction?.notes) {
    const notesHtml = transaction.notes;

    // Extract optional title from <span class="ql-size-large">
    const titleMatch = notesHtml.match(/<span class="ql-size-large">(.*?)<\/span>/);
    const title = titleMatch ? titleMatch[1].replace(/&/g, "&") : "Terms and Conditions";

    // Extract <li> items
    const listItems: string[] = [];
    const liRegex = /<li[^>]*>(.*?)<\/li>/g;
    let match;
    while ((match = liRegex.exec(notesHtml)) !== null) {
        const cleanItem = match[1].replace(/<[^>]*>/g, "").replace(/&/g, "&");
        listItems.push(cleanItem);
    }

    // Render title
    doc.setFont("helvetica", "bold");
    doc.text(title, col1X + 8, y1);
    y1 += 12;

    // Render each item
    doc.setFont("helvetica", "normal");
    listItems.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, colW - 16);
        doc.text(lines, col1X + 8, y1);
        y1 += lines.length * 12;
    });
    y1 += 8;
} else {
    // Fallback
    y1 += 4;
    doc.text("No terms and conditions added yet", col1X + 8, y1);
    y1 += 2;
}

    /* ================= RIGHT SIDE BOX (Drop-in) ================= */

    const RIGHT_PAD = 8;
    const LINE_H = 12;
    const HEADING_FS = 11;
    const BODY_FS = 10;
    const SEP_THICK = 0.5;
    const UNDER_THICK = 1;
    const MARGIN_GAP = 6;


    const rightBoxX = col2X;
    const rightBoxW = colW;
    const rightBoxTopY = footerStartY;

    // Inner text area (text padding same)
    const innerRX = rightBoxX + RIGHT_PAD;
    const innerRW = rightBoxW - RIGHT_PAD * 2;

    // 👇 NEW: full box edges for lines
    const BOX_LEFT = rightBoxX;
    const BOX_RIGHT = rightBoxX + rightBoxW;

    // FULL-WIDTH divider (touches vertical borders)
    const rDivider = (y: number) => {
        doc.setDrawColor(...COLOR.BLUE);
        doc.setLineWidth(0.5);
        doc.line(BOX_LEFT, y, BOX_RIGHT, y);  
    };

    const rHeading = (title: string, y: number): number => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(HEADING_FS);
        doc.setTextColor(...COLOR.TEXT);

        const w = doc.getTextWidth(title);
        const x = innerRX + (innerRW - w) / 2;
        doc.text(title, x, y);

        // royal underline across inner width
        doc.setDrawColor(...COLOR.BLUE);
        doc.setLineWidth(UNDER_THICK);
        doc.line(BOX_LEFT, y + 4, BOX_RIGHT, y + 4);

        return y + 12;
    };

    // start cursor
    const TOP_GAP = 16;
    let y2 = rightBoxTopY + TOP_GAP;

    // ================= Tax Summary =================
    y2 = rHeading("Tax Summary", y2);


    const TAX_HEADING_GAP = 8;
    y2 += TAX_HEADING_GAP + MARGIN_GAP;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FS);

    const labelX = innerRX;
    const valueX = innerRX + innerRW;

    // BLOCK-3: Tax Summary rows (conditional)
    const taxRows: Array<[string, string]> = isInterState
        ? [
            ["Taxable Amount", money(totalTaxableValue)],
            ["Add: IGST", money(totalIGST)],
            ["Total Tax", money(totalIGST)],
        ]
        : [
            ["Taxable Amount", money(totalTaxableValue)],
            ["Add: CGST", money(totalCGST)],
            ["Add: SGST", money(totalSGST)],
            ["Total Tax", money(totalCGST + totalSGST)],
        ];

    taxRows.forEach(([label, value]) => {
        doc.text(label, labelX, y2);
        doc.text(value, valueX, y2, { align: "right" });
        y2 += LINE_H + 2;
    });
    rDivider(y2);
    y2 += 10;

    y2 += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount After Tax : Rs", labelX, y2);
    doc.text(money(totalInvoiceAmount), valueX, y2, { align: "right" });
    y2 += LINE_H - 4;
    rDivider(y2);
    const RC_TOP_GAP = 14;
    y2 += RC_TOP_GAP;


    // ========== Reverse Charge ==========
    doc.setFont("helvetica", "bold");
    doc.setFontSize(HEADING_FS);
    doc.setTextColor(...COLOR.TEXT);

    const rcLabel = "GST Payable on Reverse Charge : ";
    const rcValue = "N.A.";
    doc.text(rcLabel, rightBoxX + 8, y2);
    const labelWidth = doc.getTextWidth(rcLabel);
    doc.setFont("helvetica", "normal");
    doc.text(rcValue, rightBoxX + 8 + labelWidth + 2, y2);

    y2 += LINE_H - 3;

    // ✅ ADD THIS LINE (to draw the royal blue divider)
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(0.5);
    doc.line(rightBoxX, y2, rightBoxX + rightBoxW, y2);

    const CERT_TOP_GAP = 12;
    y2 += CERT_TOP_GAP;

    // certificate 
    const certText =
        "Certified that the particulars given above are true and correct.";
    const certLines = doc.splitTextToSize(certText, innerRW);
    doc.text(certLines, innerRX, y2);
    y2 += certLines.length * LINE_H + 6;

    // ================= Signature / Stamp =================
    const companyDisplayName =
        capitalizeWords((company as any)?.legalName || (company as any)?.name || "Company Name");

    doc.setFont("helvetica", "bold");
    doc.text(`For ${companyDisplayName}`, rightBoxX + rightBoxW / 2, y2, {
        align: "center",
    });
    y2 += 8;

    // stamp centered & safe inside the box
    const stampW = 70;
    const stampH = 70;
    const stampX = rightBoxX + rightBoxW / 2 - stampW / 2;
    let stampPlaced = false;

    try {
        const stampUrl = (company as any)?.stampDataUrl || "/path/to/stamp.png";
        const stamp = await fetchAsDataURL(stampUrl);
        if (stamp) {
            doc.addImage(stamp, "PNG", stampX, y2 + 6, stampW, stampH);
            stampPlaced = true;
        }
    } catch {
        // ignore and fallback to text
    }

    if (!stampPlaced) {
        doc.setFont("helvetica", "italic");
        doc.text("[Stamp]", rightBoxX + rightBoxW / 2, y2 + 22, { align: "center" });
    }

    // sign text placed based on whether image printed
    const signY = y2 + (stampPlaced ? stampH + 34 : 50);

    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(0.8);
    doc.line(rightBoxX, signY - 10, rightBoxX + rightBoxW, signY - 10);

    // ✅ add a clean margin before the text (to avoid touching divider)
    const SIGN_TOP_GAP = 2;
    const finalSignY = signY + SIGN_TOP_GAP;

    // "Authorised Signatory
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Signatory", rightBoxX + rightBoxW / 2, finalSignY, { align: "center" });
    y2 = finalSignY + 6;
    y2 = checkPageBreak(doc, y2, 120);
    doc.text("", innerRX, y2);

const pageCount = doc.getNumberOfPages(); // total pages

for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); // current page select karo
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20; 
    const marginRight = 15;  

    const pageNum = (doc.internal as any).getCurrentPageInfo().pageNumber;
    const totalPages = (doc.internal as any).getNumberOfPages();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth - marginRight,
        pageHeight - marginBottom,
        { align: "right" }
    );
}

    return doc;
};