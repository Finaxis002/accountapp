import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    renderNotes,
    getUnifiedLines,
    invNo,
    getBillingAddress,
    getShippingAddress,
} from "./pdf-utils";

// FIX: Interfaces simplified to minimally include 'email' and core fields.
// We use type assertions inside the function to handle dynamic/non-standard fields (like panNumber, stateCode).
interface ExtendedCompany extends Company { email?: string; panNumber?: string; stateCode?: string; }
interface ExtendedParty extends Party { email?: string; panNumber?: string; stateCode?: string; }
interface ExtendedShippingAddress extends ShippingAddress { stateCode?: string; }


interface BaseLineItem {
    name: string; description: string; quantity: number; pricePerUnit: number;
    amount: number; gstPercentage: number; lineTax: number; lineTotal: number;
}
interface DynamicLineItem extends BaseLineItem { hsnSac?: string; unit?: string; }
interface DynamicTransaction extends Transaction {
    poNumber?: string; poDate?: string | Date | number; eWayBillNo?: string; notes?: string;
}

// --- Constants & Placeholders (UI unchanged) ---
const LOGO_DATA_URL = 'data:image/png;base64,...'; 
const STAMP_DATA_URL = 'data:image/png;base64,...'; 
const QR_CODE_DATA_URL = 'data:image/png;base64,...'; 

// Hardcoded Terms for default use when transaction.notes is empty
const IMAGE_DEFAULT_TERMS = `Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.`;


export const generatePdfForTemplate16 = async (
    transaction: DynamicTransaction, 
    company: ExtendedCompany | null | undefined, 
    party: ExtendedParty | null | undefined, 
    serviceNameById?: Map<string, string>,
    shippingAddressOverride?: ExtendedShippingAddress | null 
): Promise<jsPDF> => {
    
    // --- START: Hardcoded Bank Details (Left UNCHANGED as requested) ---
    const getBankDetails = () => ({
        name: "Kotak Mahindra Bank",
        branch: "City Center",
        accNumber: "123654789321", 
        ifsc: "KKBK0000888", 
        upiId: "kotaksample@icici", 
    });
    // --- END: Hardcoded Bank Details ---
    
    // ---------------- DYNAMIC HELPERS ----------------
    const _getGSTIN = (x?: any): string | null =>
        x?.gstin ?? x?.gstIn ?? x?.gstNumber ?? x?.gst_no ?? x?.gst ?? x?.gstinNumber ?? x?.tax?.gstin ?? null;

    const money = (n: number) =>
        Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtDate = (d?: string | number | Date | null) =>
        d ? new Intl.DateTimeFormat("en-GB").format(new Date(d)).replace(/\//g, '-') : "N/A"; 
    
    const numberToWords = (n: number): string => {
        return "AMOUNT IN WORDS LOGIC REQUIRED HERE."; 
    };
    
    // derive lines/totals (DYNAMIC)
    const { lines, subtotal, tax, invoiceTotal, gstEnabled, totalQuantity, totalItems } = (() => {
        
        const L: DynamicLineItem[] = getUnifiedLines(transaction, serviceNameById) as DynamicLineItem[];
        
        const finalLines: DynamicLineItem[] = L.length > 0 ? L : (() => {
            const amount = Number((transaction as any).amount ?? 0);
            const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
            const lineTax = (amount * gstPct) / 100;
            const lineTotal = amount + lineTax;
            return [{
                name: transaction.description || "Service Rendered",
                description: "",
                quantity: 1,
                pricePerUnit: amount,
                amount: amount,
                gstPercentage: gstPct,
                lineTax: lineTax,
                lineTotal: lineTotal,
                hsnSac: 'N/A', 
                unit: 'PCS'    
            } as DynamicLineItem];
        })();

        const cleanedLines = finalLines.map(line => ({
            ...line,
            formattedDescription: line.description ? line.description.split('\n').join(' / ') : '',
            hsnSac: line.hsnSac || 'N/A', 
            unit: line.unit || 'PCS',
        }));

        const st = cleanedLines.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
        const tt = cleanedLines.reduce((s: number, it: any) => s + (Number(it.lineTax) || 0), 0);
        const gt = cleanedLines.reduce((s: number, it: any) => s + (Number(it.lineTotal) || 0), 0);
        const tQty = cleanedLines.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);

        return {
            lines: cleanedLines,
            subtotal: st,
            tax: tt,
            invoiceTotal: gt,
            gstEnabled: tt > 0 && !!_getGSTIN(company)?.trim(),
            totalQuantity: tQty,
            totalItems: cleanedLines.length
        };
    })();

    const totalTaxableAmount = money(subtotal);
    const finalTotalAmount = money(invoiceTotal);
    
    const shippingAddressSource = shippingAddressOverride;
    const billingAddress = getBillingAddress(party);
    const shippingAddressStr = getShippingAddress(shippingAddressSource, billingAddress); 
    
    const companyGSTIN = _getGSTIN(company);
    const partyGSTIN = _getGSTIN(party);

    // --- Dynamic Invoice Data Object ---
    const invoiceData = {
        invoiceNumber: invNo(transaction),
        date: fmtDate(transaction.date) || fmtDate(new Date()),
        poNumber: transaction.poNumber || "N/A", 
        poDate: fmtDate(transaction.poDate) || "N/A",
        eWayNo: transaction.eWayBillNo || "N/A",
        // Using 'as any' for stateCode access
        placeOfSupply: (party as any)?.stateCode ? `${party?.state} (${(party as any)?.stateCode})` : (party?.state || "N/A"), 
        
        company: {
            name: company?.businessName || "Your Company Name",
            address: company?.address || "Company Address Missing",
            gstin: companyGSTIN || "N/A",
            pan: company?.panNumber || "N/A", 
            state: company?.stateCode || "N/A", 
            phone: company?.mobileNumber || "N/A",
            email: company?.email || company?.emailId || "N/A", // ADDED EMAIL ACCESS
        },
        invoiceTo: {
            name: party?.name || "Client Name",
            billingAddress: billingAddress,
            gstin: partyGSTIN || "N/A",
            pan: party?.panNumber || "N/A", 
            state: party?.state || "N/A",
            email: party?.email || "N/A", // ADDED EMAIL ACCESS
        },
        shippingAddress: {
            // Using 'as any' for safe access when types conflict (e.g., state, name)
            name: (shippingAddressSource as any)?.name || party?.name || 'Client Name',
            address: shippingAddressStr,
            state: (shippingAddressSource as any)?.state || party?.state || 'N/A', 
        }
    };
    
    const finalTerms = transaction.notes || IMAGE_DEFAULT_TERMS; 

    // ---------------- doc + theme ----------------
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const getW = () => doc.internal.pageSize.getWidth();
    const M = 36; 

    const BLUE: [number, number, number] = [24, 115, 204]; 
    const DARK: [number, number, number] = [45, 55, 72];
    const MUTED: [number, number, number] = [105, 112, 119];
    const BORDER: [number, number, number] = [220, 224, 228];

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);

    // ---------- header drawer (DYNAMIC) ----------
    let cursorY = M;

    // 1. Company Name & TAX INVOICE Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...DARK);
    doc.text("TAX INVOICE", M, cursorY);
    cursorY += 28; // Increased space after title

    // 2. Company Details (Left)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.company.name.toUpperCase(), M, cursorY);
    cursorY += 16; // Increased space

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    // GSTIN
    if (invoiceData.company.gstin !== 'N/A') {
        doc.text(`GSTIN ${invoiceData.company.gstin}`, M, cursorY);
        cursorY += 14; // Increased line spacing
    }
    
    // Address (Split and place dynamically)
    const companyAddressLines = doc.splitTextToSize(invoiceData.company.address, 250);
    if (companyAddressLines.length) {
        for(let i = 0; i < Math.min(companyAddressLines.length, 2); i++) {
            doc.text(companyAddressLines[i], M, cursorY);
            cursorY += 2; // Increased line spacing
        }
    }
    // PAN
    if (invoiceData.company.pan !== 'N/A') doc.text(`PAN: ${invoiceData.company.pan}`, M, cursorY);
    cursorY += 14; 
    // Phone
    if (invoiceData.company.phone !== 'N/A') doc.text(`Phone: ${invoiceData.company.phone}`, M, cursorY);
    cursorY += 14;
    // Email (NEWLY ADDED)
    if (invoiceData.company.email !== 'N/A') doc.text(`Email: ${invoiceData.company.email}`, M, cursorY);
    cursorY += 14;
    // State
    if (invoiceData.company.state !== 'N/A') doc.text(`State: ${invoiceData.company.state}`, M, cursorY);
    cursorY += 10; // Extra space before separator

    // 3. Logo/Graphic (Right) - Placeholder retained
    const logoSize = 60;
    const logoX = getW() - M - logoSize;
    doc.setFillColor(242, 133, 49); 
    doc.triangle(logoX + logoSize * 0.4, M, logoX + logoSize, M, logoX + logoSize * 0.4, M + logoSize, 'F');
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.triangle(logoX, M, logoX + logoSize * 0.6, M, logoX, M + logoSize, 'F');


    // 4. Horizontal Separator Line (Light Gray)
    cursorY = Math.max(cursorY, M + logoSize + 20); // Ensure cursor is below logo
   doc.setDrawColor(0, 110, 200);
    doc.setLineWidth(1.5);
    doc.line(M, cursorY, getW() - M, cursorY);
    cursorY += 16; // Increased space after separator


    // ---------------- Customer & Invoice Details Block (DYNAMIC) ----------------
    let detailY = cursorY;

    // LEFT: Customer Details (Billing)
    let leftY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Customer Details:", M, leftY);
    leftY += 16; // Increased space
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.invoiceTo.name, M, leftY);
    leftY += 12; // Increased space

    const billAddressLines = doc.splitTextToSize(invoiceData.invoiceTo.billingAddress, 250);
    if(billAddressLines.length) doc.text(billAddressLines, M, leftY);
    leftY += billAddressLines.length * 14; // Increased line height

    // Email (NEWLY ADDED)
    if(invoiceData.invoiceTo.email !== 'N/A') {
        doc.text(`Email: ${invoiceData.invoiceTo.email}`, M, leftY);
        leftY += 12;
    }

    if(invoiceData.invoiceTo.gstin !== 'N/A') doc.text(`GSTIN: ${invoiceData.invoiceTo.gstin}`, M, leftY);
    leftY += 12;
    if(invoiceData.invoiceTo.pan !== 'N/A') doc.text(`PAN: ${invoiceData.invoiceTo.pan}`, M, leftY);
    leftY += 12;
    if(invoiceData.invoiceTo.state !== 'N/A') doc.text(`State: ${invoiceData.invoiceTo.state}`, M, leftY);
    leftY += 12;
    doc.text(`Place of Supply: ${invoiceData.placeOfSupply}`, M, leftY);
    leftY += 14; // Extra space


    // MIDDLE: Shipping Address (DYNAMIC)
    let middleX = M + 200;
    let middleY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Shipping address:", middleX, middleY);
    middleY += 16; // Increased space
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.shippingAddress.name, middleX, middleY);
    middleY += 14; // Increased space

    const shipAddressLines = doc.splitTextToSize(invoiceData.shippingAddress.address, 180);
    if(shipAddressLines.length) doc.text(shipAddressLines, middleX, middleY);
    middleY += shipAddressLines.length * 12; // Increased line height

    if(invoiceData.shippingAddress.state !== 'N/A') doc.text(`State: ${invoiceData.shippingAddress.state}`, middleX, middleY);
    middleY += 14;


    // RIGHT: Invoice Metadata (DYNAMIC)
    let rightX = getW() - M - 120;
    let rightY = detailY ; // Start lower than blocks 
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const metaLabels = ["Invoice #:", "Invoice Date:", "P.O. No.:", "P.O. Date:", "E-Way No.:"];
    const metaValues = [
        invoiceData.invoiceNumber,
        invoiceData.date,
        invoiceData.poNumber,
        invoiceData.poDate,
        invoiceData.eWayNo,
    ];

    for (let i = 0; i < metaLabels.length; i++) {
        doc.text(metaLabels[i], rightX, rightY);
        doc.setFont("helvetica", "normal");
        doc.text(metaValues[i], rightX + 60, rightY);
        doc.setFont("helvetica", "bold");
        rightY += 14; // Increased line spacing
    }

    // Set cursor below the longest block
    cursorY = Math.max(leftY, middleY, rightY) + 10; // Increased space


    // ---------------- items table (DYNAMIC) ----------------
    autoTable(doc, {
        startY: cursorY,
        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 4, // Increased cell padding
            lineColor: BORDER,
            lineWidth: 0.3,
            textColor: DARK,
        },
        headStyles: {
            fillColor: [0, 110, 200],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            minCellHeight: 24 // Increased header height
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 32 },
            1: { cellWidth: 122 },
            2: { halign: "center", cellWidth: 50 },
            3: { halign: "right", cellWidth: 50 },
            4: { halign: "center", cellWidth: 30 },
            5: { halign: "center", cellWidth: 30 },
            6: { halign: "right", cellWidth: 70 },
            7: { halign: "right", cellWidth: 30 },
            8: { halign: "right", cellWidth: 50 },
            9: { halign: "right", cellWidth: 60 },
        },
        head: [
            [
                "Sr. No.",
                "Name of Product / Service",
                "HSN /\nSAC",
                "Rate",
                "Qty",
                "Unit",
                "Taxable\nValue",
                "IGST\n%",
                "IGST\nAmount",
                "Total",
            ],
        ],
        body: lines.map((it: DynamicLineItem, i: number) => [
            i + 1,
            `${it.name || ""}\n${it.description ? it.description.split('\n').join(' / ') : ""}`,
            it.hsnSac || "N/A",
            money(it.pricePerUnit),
            Number(it.quantity).toFixed(2),
            it.unit || 'PCS',
            money(it.amount),
            `${it.gstPercentage || 0}`,
            money(it.lineTax),
            money(it.lineTotal),
        ]),
        didParseCell: (d) => {
            if (d.section === "body" && d.column.dataKey === 1) {
                d.cell.styles.fontSize = 7.5;
            }
        },
        margin: { left: M, right: M },
        theme: 'grid',
    });

    let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

    // --------------- Totals Summary Block (DYNAMIC) ---------------
    const totalsW = 200;
    const totalsX = getW() - M - totalsW;

    const totalsY = afterTableY + 10; // Increased space

    const putTotalLine = (label: string, val: string, y: number, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(9);
        doc.text(label, totalsX + 12, y);
        doc.text(val, totalsX + totalsW - 12, y, { align: "right" });
    };

    let currentTotalsY = totalsY;

    // Row 1: Taxable Amount
    doc.setDrawColor(...BORDER);
    doc.setFillColor(255, 255, 255);
    doc.rect(totalsX, currentTotalsY, totalsW, 18, 'FD'); // Increased height
    putTotalLine("Taxable Amount", totalTaxableAmount, currentTotalsY + 12);
    currentTotalsY += 18;

    // Row 2: Total Amount (Grand Total)
    doc.setFillColor(240, 240, 240); 
    doc.rect(totalsX, currentTotalsY, totalsW, 18, 'FD'); // Increased height
    putTotalLine("Total Amount", finalTotalAmount, currentTotalsY + 12, true);
    currentTotalsY += 24; // Extra space after total
    
    // Total Items / Qty line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total Items / Qty : ${totalItems} / ${totalQuantity.toFixed(2)}`, M, afterTableY + 16);


    // Amount in Words
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); 
    doc.setFontSize(9);
    doc.text("Total amount (in words):", M , currentTotalsY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${numberToWords(invoiceTotal)}`, M + 110, currentTotalsY + 10);
    
    cursorY = currentTotalsY + 25;


    // ---------------- Bank Details & UPI (Left Block) and Signature (Right Block) ----------------
    
    const bankBlockH = 90;
    const requiredFooterSpace = bankBlockH + 10;
    const ensureSpace = (needed: number): number => {
        const H = doc.internal.pageSize.getHeight();
        const bottomSafe = H - M; 
        if (cursorY + needed > bottomSafe) {
            doc.addPage();
            return 80; 
        }
        return cursorY;
    };
    
    cursorY = ensureSpace(requiredFooterSpace);
    
    const blockY = cursorY + 10; // Increased space
    
    // LEFT: Bank Details & UPI
    let bankY = blockY;
    const bankDetails = getBankDetails(); // Uses Hardcoded Bank Details

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Pay using UPI:", M, bankY);
    doc.text("Bank Details:", M + 120, bankY);
    bankY += 16; // Increased space

    // UPI QR Code (Placeholder)
    const qrSize = 60; // Increased QR size
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(M + 10, bankY, qrSize, qrSize, 'FD'); // QR Code box placeholder

    // Bank Details Table-like layout
    let bankDetailY = bankY;
    const bankX = M + 120;
    doc.setFontSize(8);
    
    const putBankDetail = (label: string, val: string, y: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, bankX, y);
        doc.setFont("helvetica", "bold");
        doc.text(val, bankX + 50, y);
    };
    
    putBankDetail("Bank Name:", bankDetails.name, bankDetailY); bankDetailY += 12; // Increased spacing
    putBankDetail("Branch:", bankDetails.branch, bankDetailY); bankDetailY += 12;
    putBankDetail("Acc. Number:", bankDetails.accNumber, bankDetailY); bankDetailY += 12;
    putBankDetail("IFSC:", bankDetails.ifsc, bankDetailY); bankDetailY += 12;
    putBankDetail("UPI ID:", bankDetails.upiId, bankDetailY); bankDetailY += 12;
    
    
    // RIGHT: Signature Block (DYNAMIC Company Name)
    const sigX = getW() - M - 150;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`For ${invoiceData.company.name}`, sigX + 20, blockY + 5);

    // Signature/Stamp Placeholder
    const sigHeight = 50;
    const sigWidth = 150;
    doc.setDrawColor(0, 0, 0);
    doc.rect(sigX, blockY + 15, sigWidth, sigHeight, 'S'); // Signature box placeholder

    
    cursorY = Math.max(bankY + qrSize, blockY + sigHeight) + 20; // Increased space
    
    
    // ---------------- Terms and Conditions (DYNAMIC Notes) ----------------
    
    // Footer separator line
    cursorY = ensureSpace(100); // Ensure enough space for terms
    doc.setDrawColor(0, 110, 200);
    doc.setLineWidth(1);
    doc.line(M, cursorY, getW() - M, cursorY);
    cursorY += 20;

    let termsY = cursorY;
    const terms = `Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.`;
    
    const termsLines = doc.splitTextToSize(terms, 300);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Terms and Conditions:", M, termsY);
    termsY += 13;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(termsLines, M, termsY);


    return doc;
};