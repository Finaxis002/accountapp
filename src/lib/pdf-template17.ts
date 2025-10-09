// template17.ts
import type { Company, Party, Transaction, ShippingAddress, Bank } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    renderNotes,
    getUnifiedLines,
    invNo,
    getBillingAddress,
    getShippingAddress,
    prepareTemplate8Data,
    numberToWords,
} from "./pdf-utils";
import { capitalizeWords } from "./utils";

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

// --- Constants (Global) ---
const PRIMARY_BLUE: [number, number, number] = [0, 110, 200];
const DARK: [number, number, number] = [45, 55, 72];
const BORDER: [number, number, number] = [0, 110, 200];

const IMAGE_DEFAULT_TERMS = `Subject to our Home Jurisdiction.
Our Responsibility Ceases as soon as goods leaves our Premises.
Goods once sold will not taken back.
Delivery Ex-Premises.
`;

// --- FRAME & MARGIN CONSTANTS ---
const TITLE_Y = 20; 
const FRAME_TOP_Y = 30;
// Using a small offset, assuming you will adjust the PDF height for final space as discussed earlier.
const BOTTOM_OFFSET = 20; 


// ⭐ BORDER DRAWING FUNCTION (Global)

const drawBorderFrame = (doc: jsPDF, M: number) => {
    const h = doc.internal.pageSize.getHeight();
    const w = doc.internal.pageSize.getWidth(); 
    
    // 1. Calculate the start and end Y coordinates for the vertical lines
    const start_Y = FRAME_TOP_Y; 
    const end_Y = h - BOTTOM_OFFSET;
    
    doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]); 
    doc.setLineWidth(1); 
    
    // --- 2. Draw Vertical Borders ---
    doc.line(M - 1, start_Y, M - 1, end_Y); 
    doc.line(w - M + 1, start_Y, w - M + 1, end_Y);

    // --- 3. Draw Horizontal Borders ---
    doc.line(M - 1, FRAME_TOP_Y, w - M + 1, FRAME_TOP_Y); 
    doc.line(M - 1, h - BOTTOM_OFFSET, w - M + 1, h - BOTTOM_OFFSET);
};



// ⭐ BUYER/CONSIGNEE BLOCK DRAWING FUNCTION (New Global Function)

const drawBuyerConsigneeBlock = (doc: jsPDF, M: number, COL_W: number, invoiceData: any, getW: () => number, startY: number): number => {
    
    let cursorY = startY;
    const W = getW();

    // Horizontal Separator Line (preceding the block)
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(M, cursorY, W - M, cursorY);
    
    // Block Title Bar
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Details of Buyer | Billed to:", M + 5, cursorY + 9.3);
    doc.text("Details of Consignee | Shipped to:", M + COL_W + 5, cursorY + 9.3);
    cursorY += 15;

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(M, cursorY, W - M, cursorY);
    
    // Vertical separator
    const detailsBlockBottom = cursorY + 80; 
    doc.line(M + COL_W, cursorY, M + COL_W, detailsBlockBottom);
    
    cursorY += 12;

    // LEFT: Bill To / Party Details
    let leftY = cursorY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    doc.text(capitalizeWords(invoiceData.invoiceTo.name), M + 5, leftY);
    leftY += 12;
    

    doc.setFont("helvetica", "normal");
    const billAddressLines = doc.splitTextToSize(
        
        capitalizeWords(invoiceData.invoiceTo.billingAddress),
        COL_W - 10
    );
    // Adjust starting position for split text
    let currentBillY = leftY + 2; 
    doc.text(billAddressLines.join("\n"), M + 5, currentBillY);
    currentBillY += billAddressLines.length * 9;

    currentBillY += 4;
        doc.text(`GSTIN: ${invoiceData.invoiceTo.gstin}`, M + 5, currentBillY);
    currentBillY += 12;
    
        doc.text(`PAN: ${invoiceData.invoiceTo.pan}`, M + 5, currentBillY);
    currentBillY += 12;
    doc.text(`Place of Supply: ${invoiceData.placeOfSupply}`, M + 5, currentBillY);
    
    // RIGHT: Ship To / Consignee Details
    let rightY = cursorY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(capitalizeWords(invoiceData.shippingAddress.name), M + COL_W + 5, rightY);
    rightY += 12;

    doc.setFont("helvetica", "normal");
    const shipAddressLines = doc.splitTextToSize(
        
        capitalizeWords(invoiceData.shippingAddress.address),
        COL_W - 10
    );
    // Adjust starting position for split text
    let currentShipY = rightY;
    doc.text(shipAddressLines.join("\n"), M + COL_W + 5, currentShipY);
    currentShipY += shipAddressLines.length * 9; 

    doc.text(`Country: India`, M + COL_W + 5, currentShipY + 2);
    currentShipY += 10;
    if (invoiceData.company.gstin !== "N/A")
        doc.text(`GSTIN: -`, M + COL_W + 5, currentShipY + 2);
    currentShipY += 10;
  
    doc.text(
        `State: ${capitalizeWords(invoiceData.shippingAddress.state)}`,
        M + COL_W + 5,
        currentShipY + 2
    );

    cursorY = detailsBlockBottom;

    doc.line(M, cursorY, W - M, cursorY);
    cursorY += 5;
    
    // Return the final Y position after the block
    return cursorY;
};



// =========================================================================
// ⭐ COMPANY/METADATA BLOCK DRAWING FUNCTION (Global - Updated)
// =========================================================================
const drawHeaderContent = (doc: jsPDF, M: number, COL_W: number, invoiceData: any, getW: () => number, fmtDate: (d?: string | number | Date | null) => string, transaction: DynamicTransaction, isGSTApplicable: boolean, logoUrl: string | null): number => {
    
    const W = getW();

    // 1. Top Title (outside the border)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_BLUE);
    doc.text(transaction.type === "proforma" ? "PROFORMA INVOICE" : isGSTApplicable ? "TAX INVOICE" : "INVOICE", M + 240, TITLE_Y);

    // Header Logo (Left)
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', M + 5, FRAME_TOP_Y + 5, 60, 60);
      } catch (e) {
        // Fallback to default logo
        doc.setFillColor(242, 133, 49);
        doc.triangle(M + 5, FRAME_TOP_Y + 5, M + 65, FRAME_TOP_Y + 5, M + 5, FRAME_TOP_Y + 65, 'F');
        doc.setFillColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
        doc.triangle(M + 5, FRAME_TOP_Y + 5, M + 45, FRAME_TOP_Y + 5, M + 5, FRAME_TOP_Y + 65, 'F');
      }
    } 

    // Header Company Details (Left)
    let companyY = FRAME_TOP_Y + 25; 

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
   
    doc.text(capitalizeWords(invoiceData.company.name.toUpperCase()), M + 80, companyY);
    companyY += 12;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const companyAddressLines = doc.splitTextToSize(
        
        capitalizeWords(invoiceData.company.address),
        250
    );

    if (invoiceData.company.lAddress !== "N/A")
        
        doc.text(` ${capitalizeWords(invoiceData.company.lAddress)}`, M + 78, companyY);
    companyY += 12;

    if (invoiceData.company.state !== "N/A")
        
        doc.text(` ${capitalizeWords(invoiceData.company.state)}`, M + 78, companyY);
    companyY += 12;

    if (invoiceData.company.gstin !== "N/A") {
        doc.text(`GSTIN: ${invoiceData.company.gstin}`, M + 80, companyY);
        companyY += 12;
    }
    if (invoiceData.company.phone !== "N/A")
        doc.text(`Phone: ${invoiceData.company.phone}`, M + 80, companyY);
    companyY += 12;
    if (companyAddressLines.length) {
        for (let i = 0; i < Math.min(companyAddressLines.length, 2); i++) {
           
            doc.text(`State:${capitalizeWords(companyAddressLines[i])}`, M + 80, companyY);
            companyY += 2; 
        }
    }

    // Right Side Metadata (Box Layout)
    let metaY = FRAME_TOP_Y + 20; 
    doc.setDrawColor(...BORDER); 
    doc.setLineWidth(0.1);

    const metaData = [
        {
            labelLeft: "Invoice No.",
            valueLeft: invoiceData.invoiceNumber,
            labelRight: "Invoice Date",
            valueRight: fmtDate(new Date()),
        },
        {
            labelLeft: "P.O. No.",
            valueLeft: invoiceData.poNumber || "N/A",
            labelRight: "P.O. Date",
            valueRight: invoiceData.poDate || "N/A",
        },
        {
            labelLeft: "Due Date",
            valueLeft: fmtDate(new Date()),
            labelRight: "E-Way No.",
            valueRight: invoiceData.eWayNo || "N/A",
        },
    ];

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const metaX = M + COL_W + 20;
    const blockWidth = W - M - metaX;
    const boxH = 28; 
    const columnWidth = blockWidth / 2;
    const valueOffset = 12; 

    // Draw vertical lines
    doc.line(metaX, metaY - 3, metaX, metaY + metaData.length * boxH - 3); 
    doc.line(metaX + columnWidth, metaY - 3, metaX + columnWidth, metaY + metaData.length * boxH - 3); 
    doc.line(W - M, metaY - 3, W - M, metaY + metaData.length * boxH - 3); 

    // Draw content and horizontal lines
    for (let i = 0; i < metaData.length; i++) {
        const data = metaData[i];
        const yPosLabel = metaY + 5; 
        const yPosValue = metaY + 5 + valueOffset; 

        // 1. Draw horizontal separator line
        doc.line(metaX, metaY - 3, W - M, metaY - 3);

        // 2. Left Side Content (Label + Value)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(data.labelLeft, metaX + 5, yPosLabel); 

        doc.setFont("helvetica", "bold");
        doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
        doc.text(data.valueLeft, metaX + 5, yPosValue, { align: "left" });

        // 3. Right Side Content (Label + Value)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(data.labelRight, metaX + columnWidth + 5, yPosLabel); 

        doc.setFont("helvetica", "bold");
        doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
        doc.text(data.valueRight, W - M - 130, yPosValue, { align: "left" });

        metaY += boxH;
    }

    // Draw bottom border
    doc.line(metaX, metaY - 3, W - M, metaY - 3);

    // Return the lowest Y coordinate used in the block + padding
    return Math.max(companyY + 10, metaY + 10);
};



// ⭐ EXPORTED FUNCTION (Main Logic)

export const generatePdfForTemplate17 = async (
    transaction: DynamicTransaction, 
    company: ExtendedCompany | null | undefined, 
    party: ExtendedParty | null | undefined, 
    serviceNameById?: Map<string, string>,
    shippingAddressOverride?: ExtendedShippingAddress | null,
    bank?: Bank | null
): Promise<jsPDF> => {
    
    // --- START: Hardcoded Bank Details (REMOVED/MODIFIED) ---
    const getBankDetails = () => ({
        name: "Bank Details Not Available",
        branch: "N/A",
        accNumber: "N/A", 
        ifsc: "N/A", 
        upiId: "N/A", 
    });
    // --- END: Hardcoded Bank Details ---
    
    // ---------------- DYNAMIC HELPERS ----------------
    const _getGSTIN = (x?: any): string | null =>
        x?.gstin ?? x?.gstIn ?? x?.gstNumber ?? x?.gst_no ?? x?.gst ?? x?.gstinNumber ?? x?.tax?.gstin ?? null;

    const money = (n: number) =>
        Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtDate = (d?: string | number | Date | null) =>
        d ? new Intl.DateTimeFormat("en-GB").format(new Date(d)).replace(/\//g, '-') : "N/A"; 
    
    // Use Template8 data preparation logic
    const {
        totalTaxable,
        totalAmount,
        itemsWithGST,
        totalCGST,
        totalSGST,
        totalIGST,
        isGSTApplicable,
        isInterstate,
        showIGST,
        showCGSTSGST,
        showNoTax,
        totalQty,
        totalItems
    } = prepareTemplate8Data(transaction, company, party, shippingAddressOverride);

    const logoUrl = company?.logo ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}` : null;

    // Map itemsWithGST to local lines for table rendering
    const lines: DynamicLineItem[] = (itemsWithGST || []).map((it: any) => ({
       
        name: capitalizeWords(it.name),
        description: it.description || "",
        quantity: it.quantity || 0,
        pricePerUnit: it.pricePerUnit || 0,
        amount: it.taxableValue || 0,
        gstPercentage: it.gstRate || 0,
        lineTax: (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0),
        lineTotal: it.total || 0,
        hsnSac: it.code || 'N/A',
        unit: it.unit || 'PCS',
    }));

    const subtotal = totalTaxable;
    const tax = totalCGST + totalSGST + totalIGST;
    const invoiceTotal = totalAmount;
    const gstEnabled = isGSTApplicable;
    const totalQuantity = totalQty;

    const totalTaxableAmount = money(subtotal);
    const finalTotalAmount = money(invoiceTotal);
    
    const shippingAddressSource = shippingAddressOverride;
  
    const billingAddress = capitalizeWords(getBillingAddress(party));
    
    const shippingAddressStr = capitalizeWords(getShippingAddress(shippingAddressSource, billingAddress)); 
    
    const companyGSTIN = _getGSTIN(company);
    const partyGSTIN = _getGSTIN(party);

    // --- Dynamic Invoice Data Object ---
    const invoiceData = {
        invoiceNumber: invNo(transaction),
        date: fmtDate(transaction.date) || fmtDate(new Date()),
        poNumber: transaction.poNumber || "N/A", 
        poDate: fmtDate(transaction.poDate) || "N/A",
        eWayNo: transaction.eWayBillNo || "N/A",
        
        placeOfSupply: (party as any)?.stateCode ? `${capitalizeWords(party?.state)} (${(party as any)?.stateCode})` : (party?.state || "N/A"), 
        
        company: {
            
            name: capitalizeWords(company?.businessName || "Your Company Name"),
            lAddress: company?.address,
            address: company?.addressState || "Company Address Missing", // Will be capitalized in drawHeaderContent
            gstin: companyGSTIN || "N/A",
            pan: company?.panNumber || "N/A", 
            state: company?.City || "N/A", // Will be capitalized in drawHeaderContent
            phone: company?.mobileNumber || company?.Telephone || "N/A",
            email: company?.email || company?.emailId || "N/A", 
        },
        invoiceTo: {
          
            name: capitalizeWords(party?.name || "Client Name"),
            billingAddress: billingAddress,
            gstin: partyGSTIN || "N/A",
            pan: party?.panNumber || "N/A", 
            state: party?.state || "N/A", // Will be capitalized in drawBuyerConsigneeBlock
            email: party?.email || "N/A", 
        },
        shippingAddress: {
            
            name: capitalizeWords((shippingAddressSource as any)?.name || party?.name || 'Client Name'),
            address: shippingAddressStr,
            state: (shippingAddressSource as any)?.state || party?.state || 'N/A', // Will be capitalized in drawBuyerConsigneeBlock
        }
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
            ? capitalizeWords(titleMatch[1].replace(/&amp;/g, "&")) 
            : "Terms and Conditions"; // Fallback title

        // Match list items
        const liRegex = /<li[^>]*>(.*?)<\/li>/g;
        let match;
        while ((match = liRegex.exec(notesHtml)) !== null) {
            // Strip any remaining HTML tags from the item and decode &amp;
           
            const cleanItem = capitalizeWords(match[1]
                .replace(/<[^>]*>/g, "")
                .replace(/&amp;/g, "&"));
            termsList.push(cleanItem);
        }
    } else {
        // If notes are empty, the list remains empty
        termsList = [];
    }
    // ---------------- END PARSE TERMS AND CONDITIONS ----------------

    // ---------------- doc + theme ----------------
    // Set a custom height (e.g., 750) if you want extra space at the bottom beyond the BOTTOM_OFFSET
    const doc = new jsPDF({ unit: "pt", format: [650, 800] });
    const getW = () => doc.internal.pageSize.getWidth();
    const getH = () => doc.internal.pageSize.getHeight(); // Get page height
    const M = 36; 
    const COL_W = (getW() - M * 2) / 2; // Half column width

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);

    
    // ⭐ Calculate initial header height for autotable margin
    
    // Draw on Page 1 to establish the layout and determine the repeating height
    drawBorderFrame(doc, M); 
    const initialHeaderBottomY = drawHeaderContent(doc, M, COL_W, invoiceData, getW, fmtDate);
    // Calculate the start Y for the buyer/consignee block after the initial header
    let initialBuyerBlockStart = initialHeaderBottomY;
    // Get the Y position after the first buyer block draw
    const initialBuyerBlockBottomY = drawBuyerConsigneeBlock(doc, M, COL_W, invoiceData, getW, initialBuyerBlockStart);
    
    // The total height of the repeating content: Header + Buyer/Consignee Block
    const REPEATING_HEADER_HEIGHT = initialBuyerBlockBottomY; 

    // ========================================================
    // ⭐ SETUP AUTOTABLE FOR ITEMS
    // ========================================================
    // 1. Draw Company/Metadata block and capture header bottom for repeating header
    let headerBottomY = drawHeaderContent(doc, M, COL_W, invoiceData, getW, fmtDate, transaction, isGSTApplicable, logoUrl);
    let cursorY = headerBottomY;

    // 2. Draw Buyer/Consignee block and get starting Y for the table
    cursorY = drawBuyerConsigneeBlock(doc, M, COL_W, invoiceData, getW, cursorY);

    let cursorY = initialBuyerBlockBottomY;
    
    const totalWidth = getW() - M * 2;
    const fixedWidths = 380; 
    const itemColWidth = totalWidth - fixedWidths; 

    // Determine GST header labels for sub-columns in UI
    const gstGroupHeader = showIGST ? "IGST" : (showCGSTSGST ? "CGST/SGST" : "GST");

    autoTable(doc, {
        // ⭐ startY for the first page is the Y after the Buyer/Consignee block
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
        columnStyles: showCGSTSGST ? {
            0: { halign: "center", cellWidth: 28 }, 
            1: { cellWidth: itemColWidth - 40 },
            2: { halign: "center", cellWidth: 38 }, 
            3: { halign: "right", cellWidth: 32 }, 
            4: { halign: "center", cellWidth: 32 }, 
            5: { halign: "right", cellWidth: 42 }, 
            6: { halign: "right", cellWidth: 52 }, 
            7: { halign: "center", cellWidth: 26 }, 
            8: { halign: "right", cellWidth: 42 }, 
            9: { halign: "center", cellWidth: 26 }, 
            10: { halign: "right", cellWidth: 42 }, 
            11: { halign: "right", cellWidth: 52 }, 
        } : {
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
        head: showCGSTSGST ? [
            [
                { content: "Sr.\nNo.", styles: { cellWidth: 28 } },
                "Name of Product / Service",
                "HSN /\nSAC",
                "Qty",
                "Unit",
                "Rate",
                "Taxable\nValue",
                { content: "CGST", colSpan: 2 },
                { content: "SGST", colSpan: 2 },
                "Total",
            ],
            [
                "", "", "", "", "", "", "",
                "%", "Amount",
                "%", "Amount",
                "",
            ]
        ] : [
            [
                { content: "Sr.\nNo.", styles: { cellWidth: 30 } },
                "Name of Product / Service",
                "HSN /\nSAC",
                "Qty",
                "Unit",
                "Rate",
                "Taxable\nValue",
                { content: gstGroupHeader, colSpan: 2 }, 
                "Total",
            ],
            [
                "", "", "", "", "", "", "", 
                "%", "Amount", 
                "",
            ]
        ],
        body: lines.map((it: DynamicLineItem, i: number) => {
            const src = (itemsWithGST as any[])[i] || {};
            if (showCGSTSGST) {
                const cgstPct = (src.gstRate || 0) / 2;
                const sgstPct = (src.gstRate || 0) / 2;
                return [
                    i + 1,
                    
                    `${it.name || ""}\n${it.description ? it.description.split('\n').join(' / ') : ""}`,
                    it.hsnSac || "N/A",
                    Number(it.quantity).toFixed(2),
                    it.unit || 'PCS',
                    money(it.pricePerUnit),
                    money(it.amount),
                    `${cgstPct.toFixed(2)}`,
                    money(src.cgst || 0),
                    `${sgstPct.toFixed(2)}`,
                    money(src.sgst || 0),
                    money(it.lineTotal),
                ];
            }
            const percent = showIGST ? (src.gstRate || 0) : (it.gstPercentage || 0);
            const amount = showIGST ? (src.igst || 0) : ((it.lineTax || 0));
            return [
            i + 1,
            
            `${it.name || ""}\n${it.description ? it.description.split('\n').join(' / ') : ""}`,
            it.hsnSac || "N/A",
            Number(it.quantity).toFixed(2),
            it.unit || 'PCS',
            money(it.pricePerUnit),
            money(it.amount),
                `${Number(percent).toFixed(2)}`,
                money(amount),
            money(it.lineTotal),
            ];
        }),
        didDrawPage: (data) => {
            // ⭐ Draw frame and the static header on every page
            drawBorderFrame(doc, M);
            const headerBottomY = drawHeaderContent(doc, M, COL_W, invoiceData, getW, fmtDate);
            // ⭐ Draw Buyer/Consignee block on every page, starting right after the header
            drawBuyerConsigneeBlock(doc, M, COL_W, invoiceData, getW, headerBottomY);
            
            // Set page number in footer
            doc.setFontSize(8);
            // jsPDF internal page count starts at 1, so the new page is doc.internal.pages.length
            doc.text(`Page ${data.pageNumber}`, getW() - M - 20, getH() - 10);
        },
        // ⭐ Margin top must be the height of the entire repeating header block
        margin: { left: M, right: M, top: REPEATING_HEADER_HEIGHT + 5 }, // +5pt for spacing
        theme: 'grid',
    });

    let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

    // --- MANUAL TOTAL ROW DRAWING (SHOULD BE RIGHT AFTER AUTOTABLE - CORRECT LOCATION) ---
    
    // Draw total row border
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.1);
    doc.line(M, afterTableY, getW() - M, afterTableY);

    // Increment Y to draw content below the line
    afterTableY += 12; 

    // Draw total row content
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Total", M + 5, afterTableY);
    
    const totalWidthPost = getW() - M * 2;
    const fixedWidthsPost = 380; 
    const itemColWidthPost = totalWidthPost - fixedWidthsPost; 
    const currentX = M;
    const colPositions = [
        currentX + 30 + itemColWidthPost + 40, 
        currentX + 30 + itemColWidthPost + 40 + 30 + 30 + 40, 
        currentX + 30 + itemColWidthPost + 40 + 30 + 30 + 40 + 45, 
        getW() - M - 45, 
    ];

    doc.text(totalQuantity.toFixed(2), colPositions[1] - 110, afterTableY, { align: 'right' }); 
    doc.text(totalTaxableAmount, colPositions[2] - 30, afterTableY, { align: 'right' }); 
    doc.text(finalTotalAmount, getW() - M - 8, afterTableY, { align: 'right' }); 
    
    afterTableY += 13; 
    // ---------------- END MANUAL TOTAL ROW DRAWING ----------------

    // Total in words
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); 
    doc.setFontSize(9);
    doc.text("Total in words:", M, afterTableY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(numberToWords(invoiceTotal), M + 1, afterTableY + 18);
    afterTableY += 30;

    // --------------- TAX SUMMARY TABLE (MATCHING SCREENSHOT) ---------------
    
    // Helper to ensure space and move to next page if needed
    const ensureSpace = (needed: number): number => {
        const H = getH();
        const bottomSafe = H - BOTTOM_OFFSET; 
        if (afterTableY + needed > bottomSafe) {
            doc.addPage();
            
            // ⭐ Manually draw the frame, header, and buyer/consignee block on the new page.
            drawBorderFrame(doc, M);
            const newPageHeaderBottomY = drawHeaderContent(doc, M, COL_W, invoiceData, getW, fmtDate);
            drawBuyerConsigneeBlock(doc, M, COL_W, invoiceData, getW, newPageHeaderBottomY);
            
            // Print Page Number on the new page's footer
            doc.setFontSize(8);
            // jsPDF internal page count starts at 1, so the new page is doc.internal.pages.length
            doc.text(`Page ${doc.internal.pages.length}`, getW() - M - 20, getH() - 10);
            
            // ⭐ Reset afterTableY to be below the entire repeating header block
            return REPEATING_HEADER_HEIGHT + 5; 
        }
        return afterTableY;
    };

    // Ensure space before starting tax summary
    afterTableY = ensureSpace(140);
    let taxSummaryY = afterTableY;
    
    // Build tax summary dynamically grouped by HSN/SAC
    const groupedByHSN: Record<string, any> = {};
    (itemsWithGST as any[]).forEach((it: any) => {
        const key = it.code || 'N/A';
        if (!groupedByHSN[key]) {
            groupedByHSN[key] = { hsn: key, taxable: 0, cgstPct: 0, cgstAmt: 0, sgstPct: 0, sgstAmt: 0, igstPct: 0, igstAmt: 0, total: 0 };
        }
        groupedByHSN[key].taxable += it.taxableValue || 0;
        groupedByHSN[key].cgstPct = showCGSTSGST ? (it.gstRate || 0) / 2 : 0;
        groupedByHSN[key].sgstPct = showCGSTSGST ? (it.gstRate || 0) / 2 : 0;
        groupedByHSN[key].igstPct = showIGST ? (it.gstRate || 0) : 0;
        groupedByHSN[key].cgstAmt += it.cgst || 0;
        groupedByHSN[key].sgstAmt += it.sgst || 0;
        groupedByHSN[key].igstAmt += it.igst || 0;
        groupedByHSN[key].total += it.total || 0;
    });
    const taxSummaryData = Object.values(groupedByHSN);

    autoTable(doc, {
        startY: taxSummaryY,
        body: taxSummaryData.map((d: any) => showIGST ? [
            d.hsn,
            money(d.taxable),
            `${Number(d.igstPct).toFixed(2)}`,
            money(d.igstAmt),
            money(d.total),
        ] : [
            d.hsn,
            money(d.taxable),
            `${Number(d.cgstPct).toFixed(2)}`,
            money(d.cgstAmt),
            `${Number(d.sgstPct).toFixed(2)}`,
            money(d.sgstAmt),
            money(d.total),
        ]),
        head: showIGST
            ? [['HSN / SAC', 'Taxable Value', '%', 'IGST', 'Total']]
            : [['HSN / SAC', 'Taxable Value', '%', 'CGST', '%', 'SGST', 'Total']],
        headStyles: { fillColor: [240, 240, 240], textColor: DARK, fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, textColor: DARK, lineColor: BORDER, lineWidth: 0.1 },
        columnStyles: showIGST ? {
            0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 100 },
            2: { halign: 'center', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 80 },
            4: { halign: 'right', cellWidth: 90 }
        } : { 
            0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 100 }, 
            2: { halign: 'center', cellWidth: 40 }, 3: { halign: 'right', cellWidth: 50 }, 
            4: { halign: 'center', cellWidth: 40 }, 5: { halign: 'right', cellWidth: 80 }, 
            6: { halign: 'right', cellWidth: 90 } 
        },
        margin: { left: M, right: getW() - (M + 300) }, 
        theme: 'grid',
        didDrawPage: (data) => {
            // The main autotable's didDrawPage already handled the full header section. 
            // We only need the frame if this table extends onto a new page.
            drawBorderFrame(doc, M); 
        },
    });

    taxSummaryY = (doc as any).lastAutoTable.finalY;

    // Draw the summary Total row manually
    doc.setDrawColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Total", M + 5, taxSummaryY + 11);
    doc.text(money(subtotal), M + 220, taxSummaryY + 11, { align: 'right' });
    if (showIGST) {
        doc.text(money(totalIGST), M + 360, taxSummaryY + 11, { align: 'right' });
        doc.text(money(subtotal + totalIGST), M + 520, taxSummaryY + 11, { align: 'right' });
    } else {
        doc.text(money(totalCGST), M + 310, taxSummaryY + 11, { align: 'right' });
        doc.text(money(totalSGST), M + 430, taxSummaryY + 11, { align: 'right' });
        doc.text(money(subtotal + totalCGST + totalSGST), M + 520, taxSummaryY + 11, { align: 'right' });
    }
    taxSummaryY += 10;
    
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const totalTaxVal = showIGST ? totalIGST : (totalCGST + totalSGST);
    doc.text(`Total Tax in words: ${numberToWords(invoiceTotal)}`, M, taxSummaryY + 20);
    afterTableY = taxSummaryY + 25;
    
    // --------------- BANK DETAILS & SIGNATURE & TERMS ---------------

    // Ensure space before the entire footer block (Terms, Bank, Signature)
    const neededFooterSpace = 150; 
    afterTableY = ensureSpace(neededFooterSpace);

    doc.setDrawColor(...BORDER);
    doc.line(M, afterTableY, getW() - M, afterTableY);
    afterTableY += 16;
    
    // Change: Logic is slightly different here. If dynamic bank details are provided, use them.
    const bankDetails = (bank && typeof bank === 'object' && (bank as any).bankName) ? {
        
        name: capitalizeWords((bank as any).bankName),
        branch: capitalizeWords((bank as any).branchName || (bank as any).branchAddress || "N/A"),
        accNumber: (bank as any).accountNumber || "N/A",
        ifsc: capitalizeWords((bank as any).ifscCode || "N/A"),
        upiId: (bank as any).upiId || "N/A",
    } : getBankDetails(); // Calls the modified function
    const bankX = M + COL_W ;
    
    let currentBlockY = afterTableY;
    
    // RIGHT HALF: Bank Details & Signature
    let bankDetailY = currentBlockY;
    
    const qrSize = 50;
    const qrX = getW() - M - qrSize - 10;

    // Check if bank details are truly missing before drawing the QR code and details
    const areBankDetailsAvailable = bankDetails.name !== "Bank Details Not Available";
    
    // Draw Bank Details and QR Code on the right half
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("Bank Details", bankX, bankDetailY);
    bankDetailY += 15;

    doc.setFontSize(8);
    const putBankDetail = (label: string, val: string, x: number, y: number) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, x, y);
        doc.setFont("helvetica", "bold");
        doc.text(val, x + 50, y);
    };
    
    if (areBankDetailsAvailable) {
        putBankDetail("Name:", bankDetails.name, bankX, bankDetailY); bankDetailY += 12;
        putBankDetail("Branch:", bankDetails.branch, bankX, bankDetailY); bankDetailY += 12;
        putBankDetail("Acc. Number:", bankDetails.accNumber, bankX, bankDetailY); bankDetailY += 12;
        putBankDetail("IFSC:", bankDetails.ifsc, bankX, bankDetailY); bankDetailY += 12;
        putBankDetail("UPI ID:", bankDetails.upiId, bankX, bankDetailY); bankDetailY += 12;

        // QR Code + Pay using UPI (Only draw if details are present)
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(240, 240, 240);
        doc.rect(qrX, currentBlockY , qrSize, qrSize, 'FD'); // QR Code box placeholder

        doc.setFont("helvetica", "bold");
        doc.text("Pay using UPI", qrX , currentBlockY + qrSize + 12);
        
    } else {
        // ⭐ If bank details are not available, display the message prominently
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text("BANK DETAILS NOT AVAILABLE", bankX, bankDetailY + 20);
        bankDetailY = currentBlockY + 40; // Push Y down to match height roughly
    }
    
    // Signature Block (Drawn regardless of bank details)
    const sigY = bankDetailY + 10;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`For ${capitalizeWords(invoiceData.company.name)}`, qrX - 49, sigY);

    doc.rect(qrX - 80, sigY + 5, 140, 55, 'S'); // Signature box placeholder
    doc.text("Authorised Signatory", qrX - 73 + 20, sigY + 58); 
    
    
    // LEFT HALF: Terms and Conditions
    let termsY = currentBlockY; // Start T&C at the same vertical level as Bank Details
    
    const TERMS_COL_WIDTH = COL_W - 10; // Margin adjusted width for text wrapping

    // Set the T&C Title
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`${termsTitle}:`, M, termsY);
    termsY += 13;

    // Set the T&C body style
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    
    // RENDER LOGIC: Display parsed terms or the "No terms..." message
    if (termsList.length > 0) {
        termsList.forEach((item, index) => {
            // Split line into multiple lines if too long for the left-hand column
            const itemLines = doc.splitTextToSize(`• ${item}`, TERMS_COL_WIDTH); 
            doc.text(itemLines, M, termsY);
            termsY += itemLines.length * 10; // 10pt line height
        });
    } else {
        // Display the specific "No terms..." message
        doc.text("No terms and conditions added yet", M, termsY);
        termsY += 10;
    }

    currentBlockY = sigY + 60; // Keep final Y based on signature block which is usually lowest

    return doc;
};