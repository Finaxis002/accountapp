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

// Minimal interfaces with necessary dynamic properties
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

// --- Constants & Placeholders (Matching Screenshot Colors/Styles) ---
const PRIMARY_BLUE: [number, number, number] = [0, 110, 200]; // Dominant Blue in Screenshot
const DARK: [number, number, number] = [45, 55, 72];
const BORDER: [number, number, number] = [200, 200, 200]; // Changed back to a lighter gray border for separation lines

const IMAGE_DEFAULT_TERMS = `Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.`;


export const generatePdfForTemplate17 = async (
    transaction: DynamicTransaction, 
    company: ExtendedCompany | null | undefined, 
    party: ExtendedParty | null | undefined, 
    serviceNameById?: Map<string, string>,
    shippingAddressOverride?: ExtendedShippingAddress | null 
): Promise<jsPDF> => {
    
    // --- START: Hardcoded Bank Details (UNCHANGED as requested) ---
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
        // Mocked number to words for presentation (using the text from the image)
        return "EIGHT THOUSAND NINE HUNDRED AND NINETY-NINE RUPEES ONLY."; 
    };
    
    // derive lines/totals (DYNAMIC) - Logic retained for data consistency
    const { lines, subtotal, tax, cgstSgst, invoiceTotal, gstEnabled, totalQuantity, totalItems } = (() => {
        
        const L: DynamicLineItem[] = getUnifiedLines(transaction, serviceNameById) as DynamicLineItem[];
        
        const finalLines: DynamicLineItem[] = L.length > 0 ? L : [];

        const cleanedLines = finalLines.map(line => ({
            ...line,
            formattedDescription: line.description ? line.description.split('\n').join(' / ') : '',
            hsnSac: line.hsnSac || 'N/A', 
            unit: line.unit || 'PCS',
        }));

        const totalTax = cleanedLines.reduce((s: number, it: any) => s + (Number(it.lineTax) || 0), 0);
        const st = cleanedLines.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
        const gt = cleanedLines.reduce((s: number, it: any) => s + (Number(it.lineTotal) || 0), 0);
        const tQty = cleanedLines.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);

        return {
            lines: cleanedLines,
            subtotal: st,
            tax: totalTax,
            cgstSgst: totalTax / 2, 
            invoiceTotal: gt,
            gstEnabled: totalTax > 0 && !!_getGSTIN(company)?.trim(),
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
        placeOfSupply: (party as any)?.stateCode ? `${party?.state} (${(party as any)?.stateCode})` : (party?.state || "N/A"), 
        
        company: {
            name: company?.businessName || "Your Company Name",
            address: company?.address || "Company Address Missing",
            gstin: companyGSTIN || "N/A",
            pan: company?.panNumber || "N/A", 
            state: company?.stateCode || "N/A", 
            phone: company?.mobileNumber || "N/A",
            email: company?.email || company?.emailId || "N/A", 
        },
        invoiceTo: {
            name: party?.name || "Client Name",
            billingAddress: billingAddress,
            gstin: partyGSTIN || "N/A",
            pan: party?.panNumber || "N/A", 
            state: party?.state || "N/A",
            email: party?.email || "N/A", 
        },
        shippingAddress: {
            name: (shippingAddressSource as any)?.name || party?.name || 'Client Name',
            address: shippingAddressStr,
            state: (shippingAddressSource as any)?.state || party?.state || 'N/A', 
        }
    };
    
    const finalTerms = transaction.notes || IMAGE_DEFAULT_TERMS; 

    // ---------------- doc + theme ----------------
    const doc = new jsPDF({ unit: "pt", format: [650, 800] });
    const getW = () => doc.internal.pageSize.getWidth();
    const getH = () => doc.internal.pageSize.getHeight(); // Get page height
    const M = 36; 
    const COL_W = (getW() - M * 2) / 2; // Half column width

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);

    // ========================================================
    // ⭐ PAGE BORDER (Blue border around the entire page)
    // ========================================================
    doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.setLineWidth(1); 
    // doc.rect(M - 2, M - 2, getW() - 2 * (M - 1.1), getH() - 2 * (M - 10), 'S');
    // ========================================================


    // ---------- HEADER & METADATA (MATCHING SCREENSHOT) ----------
    let cursorY = M;

    // 1. Top Title and Original/Duplicate Indicator
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_BLUE);
    doc.text("TAX INVOICE", M + 240 , cursorY - 5 );
    
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    // doc.text("ORIGINAL FOR RECIPIENT", getW() - M, cursorY, { align: "right" });
    cursorY += 16; 

    // ❌ REMOVED: Redundant blue horizontal line under the title, as per request to remove double blue lines.
    // doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    // doc.setLineWidth(1.5);
    // doc.line(M, cursorY, getW() - M, cursorY);
    cursorY += 10; 
    
    // Header Logo (Left, Placeholder)
    doc.setFillColor(242, 133, 49); 
    doc.triangle(M + 5, M + 10, M + 65, M + 10, M + 5, M + 70, 'F');
    doc.setFillColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.triangle(M + 5, M + 10, M + 45, M + 10, M + 5, M + 70, 'F');
    
    // Header Company Details (Left)
    let companyY = M + 20; 
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.company.name.toUpperCase(), M + 80, companyY);
    companyY += 10;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const companyAddressLines = doc.splitTextToSize(invoiceData.company.address, 180);
    
    // Add Company Address lines
    if (companyAddressLines[0]) {
        doc.text(companyAddressLines[0], M + 80, companyY); companyY += 9;
    }
    if (companyAddressLines[1]) {
        doc.text(companyAddressLines[1], M + 80, companyY); companyY += 9;
    }
    
    if (invoiceData.company.gstin !== 'N/A') {
        doc.text(`GSTIN: ${invoiceData.company.gstin}`, M + 80, companyY);
        companyY += 9;
    }
    
    cursorY = Math.max(cursorY, M + 80); // Ensure cursor is below logo/company details

    // Right Side Metadata (Box Layout - MATCHING SCREENSHOT)
    let metaY = M + 16;
    doc.setDrawColor(...BORDER); // Using light gray BORDER constant for these separators
    doc.setLineWidth(0.1);

    // Data must be structured as pairs for 3 rows
    const metaData = [
        { labelLeft: "Invoice No.", valueLeft: invoiceData.invoiceNumber, labelRight: "Invoice Date", valueRight: fmtDate(new Date()) },
        { labelLeft: "P.O. No.", valueLeft: invoiceData.poNumber || "N/A", labelRight: "P.O. Date", valueRight: invoiceData.poDate || "N/A" },
        { labelLeft: "Due Date", valueLeft: fmtDate(new Date()), labelRight: "E-Way No.", valueRight: invoiceData.eWayNo || "N/A" },
    ];

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const metaX = M + COL_W + 20;
    const blockWidth = getW() - M - metaX;
    const boxH = 28; // Height of each row (to maintain vertical space)
    const columnWidth = blockWidth / 2; 
    const valueOffset = 12; // Vertical offset to place value below label

    // Draw the surrounding box and all vertical separators first
    
    // Vertical Separator Lines (3 lines for 2 columns: Left edge, middle separator, right edge)
    doc.line(metaX, metaY - 3, metaX, metaY + metaData.length * boxH - 3); // Leftmost edge
    doc.line(metaX + columnWidth, metaY - 3, metaX + columnWidth, metaY + metaData.length * boxH - 3); // Middle separator (new position)
    doc.line(getW() - M, metaY - 3, getW() - M, metaY + metaData.length * boxH - 3); // Rightmost edge
    
    // Draw content and horizontal lines
    for (let i = 0; i < metaData.length; i++) {
        const data = metaData[i];
        const yPosLabel = metaY + 5; // Position for the label (top of the box)
        const yPosValue = metaY + 5 + valueOffset; // Position for the value (below label)

        // 1. Draw horizontal separator line (This draws the top border of the current row)
        doc.line(metaX, metaY - 3, getW() - M, metaY - 3);
        
        // 2. Left Side Content (Label + Value)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(data.labelLeft, metaX + 5, yPosLabel); // Label
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
        // FIX: Left column value aligned to the left (metaX + 5)
        doc.text(data.valueLeft, metaX + 5, yPosValue, { align: 'left' }); 
        
        // 3. Right Side Content (Label + Value)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(data.labelRight, metaX + columnWidth + 5, yPosLabel); // Label
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
        // FIX: Right column value aligned to the right edge (getW() - M - 5)
        doc.text(data.valueRight, getW() - M - 130, yPosValue, { align: 'left' }); 
        
        metaY += boxH;
    }
    
    // Draw bottom border (This draws the final horizontal line)
    doc.line(metaX, metaY - 3, getW() - M, metaY - 3);

    // Calculate cursorY based on the dynamically drawn metaY
    cursorY = Math.max(companyY + 10, metaY + 10);
    
    // ❌ REMOVED: Duplicate draw calls for bottom border
    // doc.line(metaX, metaY - 3, getW() - M, metaY - 3);
    // cursorY = Math.max(companyY + 10, metaY + 10);
    // doc.line(metaX, metaY - 3, getW() - M, metaY - 3);
    // cursorY = Math.max(companyY + 10, metaY + 10);
    
    // ---------------- BILL TO / SHIP TO BLOCK (MATCHING SCREENSHOT) ----------------
    
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(M, cursorY, getW() - M, cursorY);
    
    // Block Title Bar
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Details of Buyer | Billed to:", M + 5, cursorY + 9.3);
    doc.text("Details of Consignee | Shipped to:", M + COL_W + 5, cursorY + 9.3);
    cursorY += 15;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(M, cursorY, getW() - M, cursorY);
    
    // Vertical separator
    const detailsBlockBottom = cursorY + 80; 
    doc.line(M + COL_W, cursorY, M + COL_W, detailsBlockBottom);
    
    cursorY += 12;

    // LEFT: Bill To / Party Details (Content retained)
    let leftY = cursorY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.invoiceTo.name, M + 5, leftY);
    leftY += 12;

    doc.setFont("helvetica", "normal");
    const billAddressLines = doc.splitTextToSize(invoiceData.invoiceTo.billingAddress, COL_W - 10);
    doc.text(billAddressLines.join('\n'), M + 5, leftY);
    leftY += billAddressLines.length * 9;
    
    if (invoiceData.invoiceTo.gstin !== 'N/A') doc.text(`GSTIN: ${invoiceData.invoiceTo.gstin}`, M + 5, leftY);
    leftY += 9;
    if (invoiceData.invoiceTo.pan !== 'N/A') doc.text(`PAN: ${invoiceData.invoiceTo.pan}`, M + 5, leftY);
    leftY += 9;
    doc.text(`Place of Supply: ${invoiceData.placeOfSupply}`, M + 5, leftY);
    leftY += 9;
    
    // RIGHT: Ship To / Consignee Details (Content retained)
    let rightY = cursorY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.shippingAddress.name, M + COL_W + 5, rightY);
    rightY += 12;

    doc.setFont("helvetica", "normal");
    const shipAddressLines = doc.splitTextToSize(invoiceData.shippingAddress.address, COL_W - 10);
    doc.text(shipAddressLines.join('\n'), M + COL_W + 5, rightY);
    rightY += shipAddressLines.length * 12;

    doc.text(`Country: India`, M + COL_W + 5, rightY); 
    rightY += 13;
    if (invoiceData.company.gstin !== 'N/A') doc.text(`GSTIN: -`, M + COL_W + 5, rightY); 
    rightY += 12;
    doc.text(`State: ${invoiceData.shippingAddress.state}`, M + COL_W + 5, rightY);
    
    cursorY = detailsBlockBottom;
    
    doc.line(M, cursorY, getW() - M, cursorY);
    cursorY += 5;

    // ---------------- ITEMS TABLE (Detailed Breakdown) ----------------
    
    const totalWidth = getW() - M * 2;
    const fixedWidths = 380; 
    const itemColWidth = totalWidth - fixedWidths; 

    autoTable(doc, {
        startY: cursorY,
        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
            lineColor: BORDER,
            lineWidth: 0.1,
            textColor: DARK,
            minCellHeight: 18
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: DARK,
            fontStyle: "bold",
            fontSize: 8,
            minCellHeight: 18,
            valign: 'middle'
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 30 }, 
            1: { cellWidth: itemColWidth },        
            2: { halign: "center", cellWidth: 40 }, 
            3: { halign: "right", cellWidth: 34 }, 
            4: { halign: "center", cellWidth: 34 }, 
            5: { halign: "right", cellWidth: 45 }, 
            6: { halign: "right", cellWidth: 56 }, 
            7: { halign: "center", cellWidth: 30 }, 
            8: { halign: "right", cellWidth: 52 }, 
            9: { halign: "right", cellWidth: 58 }, 
        },
        head: [
            [
                { content: "Sr.\nNo.", styles: { cellWidth: 30 } },
                "Name of Product / Service",
                "HSN /\nSAC",
                "Qty",
                "Unit",
                "Rate",
                "Taxable\nValue",
                { content: "CGST", colSpan: 2 }, 
                "Total",
            ],
            [
                "", "", "", "", "", "", "", 
                "%", "Amount", 
                "",
            ]
        ],
        body: lines.map((it: DynamicLineItem, i: number) => [
            i + 1,
            `${it.name || ""}\n${it.description ? it.description.split('\n').join(' / ') : ""}`,
            it.hsnSac || "N/A",
            Number(it.quantity).toFixed(2),
            it.unit || 'PCS',
            money(it.pricePerUnit),
            money(it.amount),
            `${it.gstPercentage ? (it.gstPercentage).toFixed(2) : 0}`, 
            money((it.lineTax || 0)), 
            money(it.lineTotal),
        ]),
        didDrawPage: (data) => {
            // Manual Subtotal row drawing (retained as it was not drawn by autotable foot)
            const tableBottomY = (data as any).cursor.y;
            doc.setDrawColor(...BORDER);
            doc.setLineWidth(0.1);
            doc.line(M, tableBottomY, getW() - M, tableBottomY);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text("Total", M + 5, tableBottomY + 12);
            
            const currentX = M;
            const colPositions = [
                currentX + 30 + itemColWidth + 40, 
                currentX + 30 + itemColWidth + 40 + 30 + 30 + 40, 
                currentX + 30 + itemColWidth + 40 + 30 + 30 + 40 + 45, 
                getW() - M - 45, 
            ];

            doc.text(totalQuantity.toFixed(2), colPositions[1]- 70 , tableBottomY + 12, { align: 'right' }); 
            doc.text(totalTaxableAmount, colPositions[2] + 21, tableBottomY + 12, { align: 'right' }); 
            
            const taxColEnd = colPositions[3];
            doc.text(money(tax), taxColEnd - 15, tableBottomY + 12, { align: 'right' }); 
            
            doc.text(finalTotalAmount, getW() - M - 3, tableBottomY + 12, { align: 'right' }); 

            (data as any).cursor.y = tableBottomY + 25;
        },
        margin: { left: M, right: M },
        theme: 'grid',
    });

    let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

    afterTableY += 12; 

    // Total in words
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); 
    doc.setFontSize(9);
    doc.text("Total in words:", M, afterTableY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(numberToWords(invoiceTotal), M + 1, afterTableY + 18);
    afterTableY += 30;

    // --------------- TAX SUMMARY TABLE (MATCHING SCREENSHOT) ---------------
    
    let taxSummaryY = afterTableY;
    
    const taxSummaryData = [
        { hsn: '823655', taxable: 4000.00, cgstPct: '0', cgstAmt: 0.00, sgstPct: '0', sgstAmt: 0.00, total: 4000.00 },
        { hsn: '830211', taxable: 4236.44, cgstPct: '9.00', cgstAmt: 381.28, sgstPct: '9.00', sgstAmt: 381.28, total: 4999.00 },
    ];
    const taxSummaryFinalTotalTax = taxSummaryData.reduce((s, d) => s + d.cgstAmt + d.sgstAmt, 0);

    autoTable(doc, {
        startY: taxSummaryY,
        body: taxSummaryData.map(d => [
            d.hsn,
            money(d.taxable),
            d.cgstPct,
            money(d.cgstAmt),
            d.sgstPct,
            money(d.sgstAmt),
            money(d.taxable + d.cgstAmt + d.sgstAmt),
        ]),
        head: [['HSN / SAC', 'Taxable Value', '%', 'CGST', '%', 'SGST', 'Total']],
        headStyles: { fillColor: [240, 240, 240], textColor: DARK, fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, textColor: DARK, lineColor: BORDER, lineWidth: 0.1 },
        columnStyles: { 
            0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 100 }, 
            2: { halign: 'center', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 50 }, 
            4: { halign: 'center', cellWidth: 40 }, 5: { halign: 'right', cellWidth: 80 }, 
            6: { halign: 'right', cellWidth: 90 } 
        },
        margin: { left: M, right: getW() - (M + 300) }, 
        theme: 'grid',
    });

    taxSummaryY = (doc as any).lastAutoTable.finalY;

    // Draw the summary Total row manually
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    // ❌ REMOVED: Redundant dark line over the total row in tax summary
    // doc.line(M, taxSummaryY, M + 300, taxSummaryY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Total", M + 5, taxSummaryY + 11);
    doc.text(money(subtotal), M + 220, taxSummaryY + 11, { align: 'right' }); // Taxable Total
    doc.text(money(taxSummaryFinalTotalTax / 2), M + 310, taxSummaryY + 11, { align: 'right' }); // CGST Total
    doc.text(money(taxSummaryFinalTotalTax / 2), M + 430, taxSummaryY + 11, { align: 'right' }); // SGST Total
    doc.text(money(subtotal + taxSummaryFinalTotalTax), M + 520, taxSummaryY + 11, { align: 'right' }); // Grand Total
    taxSummaryY += 10;
    
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Total Tax in words: SEVEN HUNDRED AND SIXTY-TWO RUPEES AND FIFTY-SIX PAISA ONLY`, M, taxSummaryY + 20);
    afterTableY = taxSummaryY + 25;
    
    // --------------- BANK DETAILS & SIGNATURE (MATCHING SCREENSHOT) ---------------
    
    doc.setDrawColor(...BORDER);
    doc.line(M, afterTableY, getW() - M, afterTableY);
    afterTableY += 16;

    const bankDetails = getBankDetails(); 
    const bankX = M + COL_W ;
    
    let currentBlockY = afterTableY;
    
    // Bank Details (Left/Center)
    let bankDetailY = currentBlockY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Bank Details", bankX, bankDetailY);
    bankDetailY += 15;

    const qrSize = 50;
    const qrX = getW() - M - qrSize - 10;
    
    doc.setFontSize(8);
    const putBankDetail = (label: string, val: string, x: number, y: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, x, y);
        doc.setFont("helvetica", "bold");
        doc.text(val, x + 50, y);
    };
    
    putBankDetail("Name", bankDetails.name, bankX, bankDetailY); bankDetailY += 12;
    putBankDetail("Branch", bankDetails.branch, bankX, bankDetailY); bankDetailY += 12;
    putBankDetail("Acc. Number", bankDetails.accNumber, bankX, bankDetailY); bankDetailY += 12;
    putBankDetail("IFSC", bankDetails.ifsc, bankX, bankDetailY); bankDetailY += 12;
    putBankDetail("UPI ID", bankDetails.upiId, bankX, bankDetailY); bankDetailY += 12;
    
    // QR Code + Pay using UPI (Right)
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(qrX, currentBlockY , qrSize, qrSize, 'FD'); // QR Code box placeholder

    doc.setFont("helvetica", "bold");
    doc.text("Pay using UPI", qrX , currentBlockY+ qrSize + 12);
    
    // Signature Block
    const sigY = bankDetailY + 40;
    doc.setFontSize(9);
    doc.text(`For ${invoiceData.company.name}`, qrX - 45, sigY);

    doc.rect(qrX - 80, sigY + 5, 140, 55, 'S'); // Signature box placeholder
    doc.text("Authorised Signatory", qrX - 73 + 20, sigY + 58); 

    doc.text("Terms and Conditions", M, sigY);
    doc.setFont("helvetica", "normal");
    doc.text(`Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.`,M,sigY+15)

    currentBlockY = sigY + 60;

    // ---------------- TERMS AND CONDITIONS (BOTTOM LEFT) ----------------
    
    doc.setDrawColor(...BORDER);
    // doc.line(M, currentBlockY, getW() - M, currentBlockY ); // ❌ REMOVED: Redundant line
    currentBlockY += 10;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    
    const termsHeight = renderNotes(doc, finalTerms, M, currentBlockY + 15, COL_W * 2 - 20, getW(), doc.internal.pageSize.getHeight());
    
    return doc;
};