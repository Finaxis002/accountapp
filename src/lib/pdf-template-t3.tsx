// pdf-template-t3.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Client,
} from "@/lib/types";
import {
  prepareTemplate8Data,
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  getStateCode,
  numberToWords,
} from "./pdf-utils";

// Register a monospace font for proper alignment
Font.register({
  family: "Courier",
  fonts: [
    { src: "https://fonts.cdnfonts.com/s/63309/CourierPrime-Regular.ttf" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontSize: 8,
    padding: 10,
    width: 280, // approx 80mm roll width
  },
  center: { textAlign: "center" },
  line: { marginVertical: 2 },
  section: { marginBottom: 5 },
  tableHeader: {
    flexDirection: "row",
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 9,
  },
  tableRow: { 
    flexDirection: "row", 
    fontSize: 7, 
    marginTop: 2,
    alignItems: "flex-start",
  },
  colItem: { width: "40%" },
  colGst: { width: "35%", paddingLeft: 5 },
  colTotal: { width: "25%", textAlign: "right" },
  bold: { fontWeight: "bold" },
  borderLine: {
    textAlign: "center",
    marginVertical: 2,
  },
  gstLine: {
    marginBottom: 1,
  },
});

interface Template_t3Props {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

const Template_t3: React.FC<Template_t3Props> = ({
  transaction,
  company,
  party,
  shippingAddress,
}) => {
  const {
    totals,
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

  return (
    <Document>
      <Page size={{ width: 280, height: "1000" }} style={styles.page}>
        <View style={styles.center}>
          <Text>{company?.businessName || company?.companyName || "Company Name"}</Text>
          <Text>{[company?.address, company?.City, company?.addressState].filter(Boolean).join(", ")}</Text>
          <Text>{company?.Country || "India"} - {company?.Pincode || ""}</Text>
          <Text>{company?.mobileNumber || company?.Telephone || ""}</Text>
        </View>

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>
        <Text style={[styles.center, styles.bold]}>TAX INVOICE</Text>
        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        <View style={styles.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {/* Left side - Billed To section */}
            <View style={{ flexDirection: "column", gap: 4 }}>
              <Text style={styles.bold}>BILLED TO</Text>
              <Text>{party?.name || "N/A"}</Text>
              <Text>{party?.contactNumber || "N/A"}</Text>
              <Text>{party?.gstin || "N/A"}</Text>
            </View>

            {/* Right side - Invoice # and Date */}
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "column", gap: 4 }}>
                <Text>
                  <Text style={styles.bold}>INVOICE # :</Text> {transaction.invoiceNumber || "N/A"}
                </Text>
                <Text>
                  <Text style={styles.bold}>DATE :</Text> {new Date(transaction.date).toLocaleDateString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>
        
        {/* Updated Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>Item</Text>
          <Text style={styles.colGst}>GST</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        
        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        {/* Updated Table Rows */}
        {itemsWithGST.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            {/* Item Column */}
            <View style={styles.colItem}>
              <Text>{item.name}</Text>
              <Text>HSN: {item.code || "-"}</Text>
              <Text>{item.quantity || 0} {item.unit} @ {formatCurrency(item.pricePerUnit || 0)}</Text>
            </View>

            {/* GST Column - Apply same logic as A5 template */}
            <View style={styles.colGst}>
              {isGSTApplicable ? (
                <>
                  {showIGST ? (
                    <Text style={styles.gstLine}>
                      IGST-{item.gstRate}%: {formatCurrency(item.igst || 0).replace('Rs. ', '')}
                    </Text>
                  ) : showCGSTSGST ? (
                    <>
                      <Text style={styles.gstLine}>
                        CGST-{(item.gstRate || 0) / 2}%: {formatCurrency(item.cgst || 0).replace('Rs. ', '')}
                      </Text>
                      <Text style={styles.gstLine}>
                        SGST-{(item.gstRate || 0) / 2}%: {formatCurrency(item.sgst || 0).replace('Rs. ', '')}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.gstLine}>No Tax Applicable</Text>
                  )}
                </>
              ) : (
                <Text style={styles.gstLine}>No Tax</Text>
              )}
            </View>

            {/* Total Column */}
            <View style={styles.colTotal}>
              <Text>{formatCurrency(item.total || 0)}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        {/* Totals Section - Apply same GST logic as A5 template */}
        <View style={styles.section}>
          <Text style={[styles.center, styles.bold]}>TOTAL AMOUNT</Text>
          <Text style={[styles.borderLine, { fontSize: 10 }]}>
            =============================================
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(totalTaxable)}</Text>
          </View>
          
          {isGSTApplicable && (
            <>
              {showIGST && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
                  <Text>IGST:</Text>
                  <Text>{formatCurrency(totalIGST)}</Text>
                </View>
              )}
              {showCGSTSGST && (
                <>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
                    <Text>CGST:</Text>
                    <Text>{formatCurrency(totalCGST)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
                    <Text>SGST:</Text>
                    <Text>{formatCurrency(totalSGST)}</Text>
                  </View>
                </>
              )}
            </>
          )}
          
          <Text style={[styles.borderLine, { fontSize: 10 }]}>
            =============================================
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
            <Text style={styles.bold}>
              {isGSTApplicable ? "Total Amount After Tax" : "Total Amount"}:
            </Text>
            <Text style={styles.bold}>{formatCurrency(totalAmount)}</Text>
          </View>
          <Text style={[styles.center, { marginTop: 4 }]}>
            {numberToWords(totalAmount)}
          </Text>
        </View>

        {/* Footer with company name */}
        <View style={[styles.section, { marginTop: 10 }]}>
          <Text style={[styles.center, { fontSize: 7 }]}>
            For {company?.businessName || company?.companyName || "Company Name"} (E & O.E.)
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export const generatePdfForTemplatet3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template_t3
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
      client={client}
    />
  );
  return await pdfDoc.toBlob();
};

export default Template_t3;