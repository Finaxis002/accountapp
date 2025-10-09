// src/lib/pdf-template12.tsx
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
    Image,
    pdf,
} from "@react-pdf/renderer";
import {
    formatCurrency,
    getBillingAddress,
    getShippingAddress,
    prepareTemplate8Data,
} from "./pdf-utils";
import { template8Styles } from "./pdf-template-styles";
import { capitalizeWords } from "./utils";
const convertNumberToWords = (num: number): string => {
    if (num === 0) return "Zero";

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const inWords = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000)
            return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
        if (n < 100000)
            return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
        if (n < 10000000)
            return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    };

    return inWords(num);
};

// Styles
const styles = StyleSheet.create({
    page: {
        fontSize: 9,
        padding: 20,
        fontFamily: "Helvetica",
        color: "#000",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    companyDetails: {
        textAlign: "right",
        flex: 1,
    },
    companyName: {
        fontSize: 12,
        fontWeight: "bold",
    },
    title: {
        textAlign: "center",
        fontSize: 11,
        fontWeight: "bold",
        marginVertical: 6,
        color: "#1976d2",
    },
    divider: {
        borderBottom: "1px solid #1976d2",
        marginVertical: 4,
    },
    sectionHeader: {
        fontSize: 9,
        fontWeight: "bold",
        marginBottom: 2,
    },
    addressText: {
        fontSize: 8,
        marginBottom: 2,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    table: {
        border: "0.5px solid #000",
        marginTop: 8,
    },
    tableRow: {
        flexDirection: "row",
    },
    th: {
        fontSize: 8,
        fontWeight: "bold",
        padding: 4,
        borderRight: "0.5px solid #1976d2",
        borderBottom: "0.5px solid #1976d2",
        backgroundColor: "#1976d2",
        color: "#fff",
    },
    td: {
        fontSize: 8,
        padding: 4,
        borderRight: "0.5px solid #1976d2",
        borderBottom: "0.5px solid #1976d2",
    },
    totals: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 6,
    },
    bankDetails: {
        marginTop: 10,
        fontSize: 8,
    },
    footer: {
        marginTop: 8,
        fontSize: 8,
    },
});

interface Template12PDFProps {
    transaction: Transaction;
    company?: Company | null;
    party?: Party | null;
    shippingAddress?: ShippingAddress | null;
    bank?: Bank | null;
}

const Template12PDF: React.FC<Template12PDFProps> = ({
    transaction,
    company,
    party,
    shippingAddress,
    bank,
}) => {
    console.log("Shipping Address in tem 12:", shippingAddress);
    const {
        totalTaxable,
        totalAmount,
        totalCGST,
        totalSGST,
        isGSTApplicable,
        items,
        totalItems,
        totalQty,
    } = prepareTemplate8Data(transaction, company, party, shippingAddress);
      const logoSrc = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;
    const billing = capitalizeWords(getBillingAddress(party));
    let shippingLabel = "";
    let shippingState = "N/A";

    if (shippingAddress && typeof shippingAddress !== "string") {
        shippingLabel = getShippingAddress(shippingAddress);
        shippingState = shippingAddress.state || "N/A";
    }
    console.log("Resolved Shipping State:", shippingState);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                     {logoSrc && (
                <Image
                  src={logoSrc}
                   style={{ width: 80, height: 80, marginRight: 15 }}
                />
              )}
                    
                    <View style={[styles.companyDetails, { marginLeft: 10 }]}>
                        <Text style={[styles.companyName, { marginBottom: 5 }]}>
                            {capitalizeWords(company?.businessName)}
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            {capitalizeWords(company?.address)}
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            {capitalizeWords(company?.City)},{" "}
                            {capitalizeWords(company?.addressState)} -{" "}
                            {company?.Pincode}
                        </Text>
                        {company?.gstin && <Text>GSTIN {company.gstin}</Text>}
                    </View>
                </View>

                <Text style={styles.title}>
                    {transaction.type === "proforma"
                      ? "PROFORMA INVOICE"
                      : isGSTApplicable
                      ? "TAX INVOICE"
                      : "INVOICE"}
                </Text>
                <View style={styles.divider} />
                {/* Buyer / Consignee / Invoice Info in One Row */}
                <View style={[styles.row, { marginTop: 6, alignItems: "stretch" }]}>

                    {/* Buyer */}
                    <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={styles.sectionHeader}>Details of Buyer | Billed to :</Text>
                        <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                            {capitalizeWords(party?.name || "Jay Enterprises")}
                        </Text>
                        <Text style={styles.addressText}>{billing}</Text>
                        {party?.gstin && <Text style={styles.addressText}>GSTIN: {party.gstin}</Text>}
                        {party?.pan && <Text style={styles.addressText}>PAN: {party.pan}</Text>}
                        <Text style={styles.addressText}>
                            State: {party?.state || "N/A"}
                        </Text>
                        <Text style={styles.addressText}>
                            Place of Supply: {party?.state || "N/A"}
                        </Text>
                    </View>

                    {/* Consignee (Shipped to) */}
                    {shippingAddress && typeof shippingAddress !== "string" && (
                        <View style={{ flex: 1, marginRight: 6 }}>
                            <View>
                                <Text
                                    style={[
                                        template8Styles.sectionHeader,
                                        template8Styles.grayColor,
                                    ]}
                                >
                                    Details of Consignee | Shipped to :
                                </Text>
                                <Text
                                    style={[
                                        template8Styles.companyName,
                                        template8Styles.grayColor,
                                        { fontSize: 12 },
                                    ]}
                                >
                                    {capitalizeWords(shippingAddress?.label || " ")}
                                </Text>
                                <Text
                                    style={[
                                        template8Styles.addressText,
                                        template8Styles.grayColor,
                                    ]}
                                >
                                    {capitalizeWords(getShippingAddress(
                                        shippingAddress,
                                        getBillingAddress(party)
                                    ))}
                                </Text>

                                <Text
                                    style={[
                                        template8Styles.addressText,
                                        template8Styles.grayColor,
                                    ]}
                                >
                                    <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                                        State:{" "}
                                    </Text>
                                    <Text>{shippingAddress?.state || "Madhya Pradesh"}</Text>
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Invoice Info Box */}
                    <View
                        style={{
                            flex: 0.8,
                            padding: 6,
                            fontSize: 8,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Text>Invoice #: {transaction?.invoiceNumber || "24"}</Text>
                        <Text>
                            Invoice Date:{" "}
                            {transaction?.date
                                ? new Date(transaction.date).toLocaleDateString("en-GB")
                                : "31-May-2024"}
                        </Text>
                        <Text>Due Date: {transaction?.dueDate ? new Date(transaction.dueDate).toLocaleDateString("en-GB") : "N/A"}</Text>
                        <Text>Payment Received: 0.00</Text>
                        <Text>Total Outstanding: {formatCurrency(totalAmount)}</Text>
                    </View>

                </View>
                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        {["Sr. No", "Name of Product / Service", "HSN/SAC", "Qty", "Rate", "Taxable Value"].map((h, i) => (
                            <Text key={i} style={[styles.th, { flex: i === 1 ? 2 : 1 }]}>
                                {h}
                            </Text>
                        ))}
                    </View>
                    {items.map((item, idx) => {
                        const taxableValue = item.amount;
                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.td, { flex: 1 }]}>{idx + 1}</Text>
                                <Text style={[styles.td, { flex: 2 }]}>{capitalizeWords(item.name)}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{item.code || "-"}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{item.quantity || "-"}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{item.pricePerUnit || "-"}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{taxableValue}</Text>
                            </View>
                        );
                    })}
                </View>


                {/* Totals */}
                <View style={styles.totals}>
                    <View>

                        <Text>Taxable Amount: {formatCurrency(totalTaxable)}</Text>
                        <Text>CGST: {formatCurrency(totalCGST)}</Text>
                        <Text>SGST: {formatCurrency(totalSGST)}</Text>
                        <Text>Total Amount: {formatCurrency(totalAmount)}</Text>
                    </View>
                </View>
                <View style={{ marginTop: 8 }}>
                    <Text>Total Items / Qty: {totalItems} / {totalQty}</Text>
                    <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                        Total (in words): {convertNumberToWords(totalAmount)} only
                    </Text>
                </View>
                {/* GST Summary Table */}
                <View style={[styles.table, { marginTop: 12 }]}>
                    <View style={styles.tableRow}>
                        {["HSN/SAC", "Taxable Value", "CGST %", "CGST Amt", "SGST %", "SGST Amt", "Total"].map(
                            (h, i) => (
                                <Text key={i} style={[styles.th, { flex: 1 }]}>{h}</Text>
                            )
                        )}
                    </View>
                    {items.map((item, idx) => {
                        const taxableValue = item.amount || 0;
                        const gst = item.gstPercentage || 0;
                        const cgstRate = gst / 2;
                        const sgstRate = gst / 2;
                        const cgstAmt = (item.lineTax || 0) / 2;
                        const sgstAmt = (item.lineTax || 0) / 2;
                        const total = item.lineTotal ?? taxableValue + (item.lineTax || 0);

                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.td, { flex: 1 }]}>{item.code || "-"}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{taxableValue}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{cgstRate}%</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{cgstAmt}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{sgstRate}%</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{sgstAmt}</Text>
                                <Text style={[styles.td, { flex: 1 }]}>{total}</Text>
                            </View>
                        );
                    })}
                    {/* TOTAL row in GST Summary */}
                    <View style={styles.tableRow}>
                        <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>TOTAL</Text>
                        <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>{totalTaxable}</Text>
                        <Text style={[styles.td, { flex: 1 }]}></Text>
                        <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>{totalCGST}</Text>
                        <Text style={[styles.td, { flex: 1 }]}></Text>
                        <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>{totalSGST}</Text>
                        <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>{(totalAmount)}</Text>
                    </View>
                </View>


                {/* Bank Details + Signatory Row */}
                <View style={{ flexDirection: "row", marginTop: 20 }}>
                    {/* Bank Details (Left) */}
                    <View style={{ flex: 1 }}>
                        <Text style={template8Styles.boldText}>Bank Details:</Text>
                        {bank && typeof bank === 'object' && bank.bankName ? (
                            <View style={{ marginTop: 4 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={[template8Styles.normalText, { marginRight: 28 }]}>Name:</Text>
                                    <Text style={[template8Styles.normalText, { display: "flex", justifyContent: "flex-start" }]}>{capitalizeWords(bank.bankName)}</Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={template8Styles.normalText}>Branch:</Text>
                                    <Text style={[template8Styles.normalText, { display: "flex", justifyContent: "flex-start" }]}>{capitalizeWords(bank.branchAddress)}</Text>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                    <Text style={template8Styles.normalText}>IFSC:</Text>
                                    <Text style={[template8Styles.normalText, { display: "flex", justifyContent: "flex-start" }]}>{capitalizeWords(bank.ifscCode)}</Text>
                                </View>
                            </View>
                        ) : (
                            <Text style={template8Styles.normalText}>No bank details available</Text>
                        )}
                    </View>

                    {/* Signatory (Right) */}
                    <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "flex-end" }}>
                        <Text style={{ fontSize: 9, fontWeight: "bold" }}>For Global Security</Text>
                        <Text style={{ fontSize: 8, marginTop: 25 }}>Authorised Signatory</Text>
                    </View>
                </View>
                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Terms and Conditions:</Text>
                    <Text>• Subject to our home Jurisdiction.</Text>
                    <Text>• Responsibility ceases as soon as goods leave our premises.</Text>
                    <Text>• Goods once sold will not be taken back.</Text>
                    <Text>• Delivery Ex-Premises.</Text>

                    <Text style={{ marginTop: 8 }}>
                        Declaration: Composition Taxable Person Not Eligible To Collect Taxes On Supplies
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export const generatePdfForTemplate12 = async (
transaction: Transaction, company: Company | null, party: Party | null, serviceNameById: Map<string, string> | undefined, shippingAddress?: ShippingAddress | null, bank?: Bank | null): Promise<Blob> => {
    const pdfDoc = pdf(
        <Template12PDF
            transaction={transaction}
            company={company}
            party={party}
            shippingAddress={shippingAddress}
            bank={bank}
        />
    );
    return await pdfDoc.toBlob();
};
