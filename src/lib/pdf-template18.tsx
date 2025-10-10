import type {
    Company,
    Party,
    Transaction,
    ShippingAddress,
    Bank,
} from "@/lib/types";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
    pdf,
} from "@react-pdf/renderer";
import {
    deriveTotals,
    formatCurrency,
    getBillingAddress,
    getShippingAddress,
    getItemsBody,
    calculateGST,
    getUnifiedLines,
    prepareTemplate8Data,
    numberToWords,
} from "./pdf-utils";
// Import template18Styles instead of template8Styles
import { template18Styles } from "./pdf-template-styles";
import { capitalizeWords } from "./utils"; 

const logo = "/assets/invoice-logos/R.png"; // Placeholder logo path

interface Template18PDFProps {
    transaction: Transaction;
    company?: Company | null;
    party?: Party | null;
    shippingAddress?: ShippingAddress | null;
    bank?: Bank | null;
}

// Helper to determine GST Label (IGST or CGST/SGST combined)
const getTaxLabel = (
    showIGST: boolean,
    totalCGST: number,
    totalSGST: number
) => {
    if (showIGST) return "Add: IGST";
    if (totalCGST > 0 || totalSGST > 0) return "Add: Total Tax";
    return "Total Tax";
};

const Template18PDF: React.FC<Template18PDFProps> = ({
    transaction,
    company,
    party,
    shippingAddress,
    bank,
}) => {
    // --- Thermal page sizing helpers ---
    const mmToPt = (mm: number) => (mm * 72) / 25.4;
    const THERMAL_WIDTH_MM = 100; // common 80mm paper; change to 58 if needed
    const thermalPageWidth = mmToPt(THERMAL_WIDTH_MM);
    
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

    // For thermal receipts, render all items on a single page so height grows with content
    const itemsPerPage = itemsWithGST.length || 12;
    const pages = [];
    for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
        pages.push(itemsWithGST.slice(i, i + itemsPerPage));
    }

    // Simplified items breakdown structure for visual appearance, matching the image.
    const itemsBreakdown = itemsWithGST.map((item) => ({
        name: capitalizeWords(item.name),
        qty: item.quantity || 0,
        unit: item.unit || "BDL",
        rate: item.pricePerUnit || 0,
        hsn: item.code || "-",
        gstRate: item.gstRate,
        taxableValue: item.taxableValue,
        total: item.total,
        tax: item.igst || item.cgst + item.sgst,
    }));

    // Use the total tax amount based on GST type
    const totalTaxAmount = totalIGST || totalCGST + totalSGST;
    const taxLabel = getTaxLabel(showIGST, totalCGST, totalSGST);

    return (
        <Document>
            {pages.map((pageItems, pageIndex) => {
                const isLastPage = pageIndex === pages.length - 1;
                const estimatedHeight = pageItems.length * 34 + 420; // Rough estimate for thermal height
                
                return (
                    <Page 
                        key={pageIndex} 
                        size={[thermalPageWidth, estimatedHeight]} 
                        style={template18Styles.page}
                    >
                        <View style={template18Styles.pageContent}>
                            {/* Company Header - Centered */}
                            <View style={template18Styles.companyHeaderSection}>
                                <Text style={template18Styles.companyNameTop}>
                                    {capitalizeWords(company?.businessName ||
                                        company?.companyName ||
                                        "Global Securities")}
                                </Text>
                                <Text style={template18Styles.address}>
                                    {capitalizeWords(getBillingAddress(company as unknown as Party) ||
                                        "Address Line 1")}
                                </Text>
                                {company?.mobileNumber && (
                                    <Text style={template18Styles.gstin}>
                                        Phone no: {company.mobileNumber}
                                    </Text>
                                )}
                                {company?.gstin && (
                                    <Text style={template18Styles.gstin}>
                                        GSTIN: {company.gstin}
                                    </Text>
                                )}
                            </View>

                            {/* TAX INVOICE Header (Centered Text) */}
                            <View style={template18Styles.invoiceTitleContainer}>
                                <Text style={template18Styles.invoiceTitle}>
                                    ========================TAX INVOICE=======================
                                </Text>
                            </View>

                            {/* INVOICE # and DATE (Spread Left/Right) */}
                            <View style={template18Styles.invoiceMetaRow}>
                                <Text style={template18Styles.invoiceMetaTextLeft}>
                                    INVOICE #: {transaction.invoiceNumber || "N/A"}
                                </Text>
                                <Text style={template18Styles.invoiceMetaTextRight}>
                                    DATE:{" "}
                                    {new Date(transaction.date)
                                        .toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })
                                        .toUpperCase()
                                        .replace(/\./g, "-")}
                                </Text>
                            </View>

                            {/* Billed To Section */}
                            <View style={template18Styles.billedToBox}>
                                <Text style={template18Styles.billedToHeader}>
                                    ============================BILLED TO============================
                                </Text>
                                <Text style={template18Styles.billedToText}>
                                    Name : {capitalizeWords(party?.name || "Jay Enterprises")}
                                </Text>
                                {party?.gstin && (
                                    <Text style={template18Styles.billedToText}>
                                        GSTIN : {party.gstin}
                                    </Text>
                                )}
                                {party?.pan && (
                                    <Text style={template18Styles.billedToText}>
                                        PAN : {party.pan}
                                    </Text>
                                )}
                                <Text style={template18Styles.billedToHeader}>
                                    =================================================================
                                </Text>
                            </View>

                            {/* Items Table Header */}
                            <View style={template18Styles.itemsTableHeaderSimple}>
                                <Text
                                    style={[
                                        template18Styles.itemsHeaderColumn,
                                        { width: "33%", textAlign: "left" },
                                    ]}
                                >
                                    Items x Qty
                                </Text>
                                <Text
                                    style={[
                                        template18Styles.itemsHeaderColumn,
                                        { width: "35%", textAlign: "center" },
                                    ]}
                                >
                                    Taxable + GST
                                </Text>
                                <Text
                                    style={[
                                        template18Styles.itemsHeaderColumn,
                                        { width: "32%", textAlign: "right" },
                                    ]}
                                >
                                    Total
                                </Text>
                            </View>
                            
                            <Text>
                                ==========================================================
                            </Text>

                            {/* Items Table Body */}
                            <View style={template18Styles.itemsTableSimple}>
                                {pageItems.map((item, index) => (
                                    <View
                                        key={index}
                                        style={template18Styles.itemsTableRowSimple}
                                    >
                                        {/* Item Details (Name, Qty, HSN, Rate) - Position 1 (50%) */}
                                        <View
                                            style={[
                                                template18Styles.itemDetailsCell,
                                                { width: "50%" },
                                            ]}
                                        >
                                            <Text style={template18Styles.itemNameText}>
                                                {item.name}
                                            </Text>
                                            <Text style={template18Styles.itemSubText}>
                                                {item.quantity || 0} {item.unit || "BDL"}
                                            </Text>
                                            <Text style={template18Styles.itemSubText}>
                                                HSN: {item.code || "-"}
                                            </Text>
                                            <Text style={template18Styles.itemSubText}>
                                                Rate: {formatCurrency(item.pricePerUnit || 0)}
                                            </Text>
                                        </View>

                                        {/* Taxable + GST - Position 2 */}
                                        <View
                                            style={[
                                                template18Styles.taxablePlusGSTCell,
                                                { width: "25%" },
                                            ]}
                                        >
                                            <Text style={template18Styles.taxableValueText}>
                                                {formatCurrency(item.taxableValue)}
                                                + {item.gstRate?.toFixed(2) || "0.00"} %
                                            </Text>
                                            
                                            {/* GST Breakdown per item */}
                                            {showIGST ? (
                                                <Text style={template18Styles.gstRateText}>
                                                    IGST @{" "}
                                                    {(item.gstRate ?? item.gstRate)?.toFixed(2) || "0.00"}
                                                    %:{" "}
                                                    {formatCurrency(
                                                        item.igst ??
                                                        (item.taxableValue *
                                                            (item.gstRate ?? item.gstRate)) /
                                                        100
                                                    )}
                                                </Text>
                                            ) : showCGSTSGST ? (
                                                <>
                                                    <Text style={template18Styles.gstRateText}>
                                                        CGST @{" "}
                                                        {(
                                                            (item.gstRate ?? item.gstRate / 2)
                                                        )?.toFixed(2) || "0.00"}
                                                        %:{" "}
                                                        {formatCurrency(
                                                            item.cgst ??
                                                            (item.taxableValue *
                                                                (item.gstRate ??
                                                                    item.gstRate / 2)) /
                                                            100
                                                        )}
                                                    </Text>
                                                    <Text style={template18Styles.gstRateText}>
                                                        SGST @{" "}
                                                        {(
                                                            (item.gstRate ?? item.gstRate / 2)
                                                        )?.toFixed(2) || "0.00"}
                                                        %:{" "}
                                                        {formatCurrency(
                                                            item.sgst ??
                                                            (item.taxableValue *
                                                                (item.gstRate ??
                                                                    item.gstRate / 2)) /
                                                            100
                                                        )}
                                                    </Text>
                                                </>
                                            ) : null}
                                        </View>

                                        {/* Total - Position 3 */}
                                        <View
                                            style={[
                                                template18Styles.totalCellSimple,
                                                { width: "25%" },
                                            ]}
                                        >
                                            <Text style={template18Styles.taxableValueTextrs}>
                                                {formatCurrency(item.total)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Summary Section (Only on last page) */}
                            {isLastPage && (
                                <View style={template18Styles.summaryContainer}>
                                    <Text style={template18Styles.separatorSummary}></Text>
                                    <View style={template18Styles.summarySection}>
                                        <View style={template18Styles.summaryRow}>
                                            <Text style={template18Styles.summaryLabel}>
                                                Taxable Amount
                                            </Text>
                                            <Text style={template18Styles.summaryValue}>
                                                {formatCurrency(totalTaxable)}
                                            </Text>
                                        </View>

                                        {showIGST && (
                                            <View style={template18Styles.summaryRow}>
                                                <Text style={template18Styles.summaryLabel}>
                                                    Add: IGST
                                                </Text>
                                                <Text style={template18Styles.summaryValue}>
                                                    {formatCurrency(totalIGST)}
                                                </Text>
                                            </View>
                                        )}

                                        {showCGSTSGST && (
                                            <>
                                                <View style={template18Styles.summaryRow}>
                                                    <Text style={template18Styles.summaryLabel}>
                                                        Add: CGST
                                                    </Text>
                                                    <Text style={template18Styles.summaryValue}>
                                                        {formatCurrency(totalCGST)}
                                                    </Text>
                                                </View>
                                                <View style={template18Styles.summaryRow}>
                                                    <Text style={template18Styles.summaryLabel}>
                                                        Add: SGST
                                                    </Text>
                                                    <Text style={template18Styles.summaryValue}>
                                                        {formatCurrency(totalSGST)}
                                                    </Text>
                                                </View>
                                            </>
                                        )}

                                        <View style={template18Styles.summaryRow}>
                                            <Text style={template18Styles.summaryLabel}>
                                                Total Tax
                                            </Text>
                                            <Text style={template18Styles.summaryValue}>
                                                {formatCurrency(totalIGST || totalCGST + totalSGST)}
                                            </Text>
                                        </View>
                                        <View style={template18Styles.summaryRow}>
                                            <Text style={template18Styles.summaryLabel}>
                                                Total Amount After Tax
                                            </Text>
                                            <Text style={template18Styles.summaryValue}>
                                                ₹{formatCurrency(totalAmount).replace("₹", "")}
                                            </Text>
                                        </View>
                                        <View style={template18Styles.summaryRow}>
                                            <Text style={template18Styles.summaryLabel}>
                                                GST Payable on Reverse Charge
                                            </Text>
                                            <Text style={template18Styles.summaryValue}>N.A.</Text>
                                        </View>
                                        <Text style={template18Styles.separatorDouble}></Text>
                                        <View style={template18Styles.summaryRow}>
                                            <Text style={template18Styles.summaryLabelGrand}>
                                                Grand Total
                                            </Text>
                                            <Text style={template18Styles.summaryValueGrand}>
                                                ₹{formatCurrency(totalAmount).replace("₹", "")}
                                            </Text>
                                        </View>
                                        <Text style={template18Styles.separatorDouble}></Text>
                                    </View>

                                    {/* QR Code and UPI Text */}
                                    <View style={template18Styles.qrCodeSection}>
                                        {/* Placeholder for QR Code */}
                                        <View style={template18Styles.qrCodePlaceholder}>
                                            <Text
                                                style={template18Styles.qrCodePlaceholderText}
                                            ></Text>
                                        </View>
                                        <Text style={template18Styles.payUsingUpi}>
                                            Pay using UPI
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Page>
                );
            })}
        </Document>
    );
};

export const generatePdfForTemplate18 = async (
    transaction: Transaction,
    company: Company | null | undefined,
    party: Party | null | undefined,
    serviceNameById?: Map<string, string>,
    shippingAddress?: ShippingAddress | null,
    bank?: Bank | null
): Promise<Blob> => {
    const pdfDoc = pdf(
        <Template18PDF
            transaction={transaction}
            company={company}
            party={party}
            shippingAddress={shippingAddress}
            bank={bank}
        />
    );

    return await pdfDoc.toBlob();
};

export default Template18PDF;