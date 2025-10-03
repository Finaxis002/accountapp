import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Canvas,
  pdf,
} from "@react-pdf/renderer";
import {
  deriveTotals,
  formatCurrency,
} from "./pdf-utils";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode, Key } from "react";
import { template8Styles } from "./pdf-template-styles";

interface Template8PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
}

const Template8PDF: React.FC<Template8PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
}) => {
  const totals = deriveTotals(transaction, company || undefined);
  const totalTaxable = totals.subtotal;
  const totalAmount = totals.invoiceTotal;
  const items = transaction.items || [];
  const totalItems = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Table column widths (approximate percentages of page width)
  const colWidths = [30, 150, 60, 50, 40, 70, 30, 60, 60];

  return (
    <Document>
      <Page size="A4" style={template8Styles.page}>
        {/* Header Section */}
        <View style={template8Styles.header}>
          <Text style={template8Styles.title}>TAX INVOICE</Text>
          <Text style={template8Styles.companyName}>Global Securities</Text>
          
          <View>
           <Text style={template8Styles.addressText}>
              <Text style={template8Styles.boldText}>GSTIN </Text>
            <Text>27AAUFM1756H1ZT </Text>
            </Text>
            <Text style={template8Styles.addressText}>Asmita Garden II,</Text>
            <Text style={template8Styles.addressText}>Shop No 14,</Text>
            <Text style={template8Styles.addressText}>Thane, Maharashtra - 401107</Text>
            <Text style={template8Styles.addressText}>
              <Text style={template8Styles.boldText}>Phone </Text>
              <Text>8109251887</Text>
            </Text>
          </View>
        </View>

        {/* Logo - Using Canvas for simple shapes */}
        <Canvas
          paint={(painter) => {
            painter
              .fillColor("#0066cc")
              .circle(674, 40, 40) // x, y, radius
              .fill();
            painter
              .fillColor("#ffffff")
              .moveTo(654, 54) // x1, y1
              .lineTo(694, 54) // x2, y2
              .lineTo(674, 78) // x3, y3
              .fill();
            return null;
          }}
        />

        <View style={template8Styles.divider} />

        {/* Three Column Section */}
        <View style={template8Styles.threeColumn}>
          {/* Customer Details */}
          <View style={template8Styles.column}>
            <Text style={template8Styles.columnTitle}>Customer Details:</Text>
            <Text style={template8Styles.normalText}>{party?.name || "Jay Enterprises"}</Text>
            <Text style={[template8Styles.normalText, { fontSize: 9 }]}>
              {party?.address || "B-426, Sumel Business Park-7, Near Soni Ni Chali, Ahmedabad, Gujarat - 401107"}
            </Text>
            <Text style={template8Styles.boldText}>GSTIN: {party?.gstin || "24CORPP3239M1ZA"}</Text>
            <Text style={template8Styles.boldText}>PAN: {party?.pan || "AAUFM1756H"}</Text>
            <Text style={template8Styles.normalText}>State: {party?.state || "Gujarat ( 24 )"}</Text>
            <Text style={template8Styles.normalText}>Place of Supply: {party?.state || "Gujarat ( 24 )"}</Text>
          </View>

          {/* Shipping Address */}
          <View style={template8Styles.column}>
            <Text style={template8Styles.columnTitle}>Shipping address:</Text>
            <Text style={template8Styles.normalText}>{shippingAddress?.label || "Global Securities"}</Text>
            <Text style={[template8Styles.normalText, { fontSize: 9 }]}>
              {shippingAddress?.address || "B-426, Sumel Business Park-7 Near Soni Ni Chali, Gujarat, India, Gujarat, India - 380023"}
            </Text>
            <Text style={template8Styles.normalText}>State: {shippingAddress?.state || "Gujarat ( 24 )"}</Text>
          </View>

          {/* Invoice Details */}
          <View style={template8Styles.lastColumn}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={template8Styles.boldText}>Invoice #:</Text>
              <Text style={template8Styles.normalText}>{transaction?.invoiceNumber?.toString() || "2"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={template8Styles.boldText}>Invoice Date:</Text>
              <Text style={template8Styles.normalText}>
                {transaction?.date ? new Date(transaction.date).toLocaleDateString("en-GB") : "14-Oct-2022"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={template8Styles.boldText}>P.O. No.:</Text>
              <Text style={template8Styles.normalText}>{(transaction as any)?.poNumber || "PO/253/22-23"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={template8Styles.boldText}>P.O. Date:</Text>
              <Text style={template8Styles.normalText}>
                {(transaction as any)?.poDate ? new Date((transaction as any).poDate).toLocaleDateString("en-GB") : "10-Oct-2022"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={template8Styles.boldText}>E-Way No.:</Text>
              <Text style={template8Styles.normalText}>{(transaction as any)?.ewayNumber || "1987494"}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={template8Styles.table}>
          {/* Table Header */}
          <View style={template8Styles.tableHeader}>
            <Text style={[template8Styles.tableCell, { width: colWidths[0], textAlign: "center" }]}>Sr. No.</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[1], textAlign: "center" }]}>Name of Product / Service</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[2], textAlign: "center" }]}>HSN / SAC</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[3], textAlign: "center" }]}>Rate</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[4], textAlign: "center" }]}>Qty</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[5], textAlign: "center" }]}>Taxable Value</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[6], textAlign: "center" }]}>IGST %</Text>
            <Text style={[template8Styles.tableCell, { width: colWidths[7], textAlign: "center" }]}>IGST Amount</Text>
            <Text style={[template8Styles.tableCellLast, { width: colWidths[8], textAlign: "center" }]}>Total</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={index} style={template8Styles.tableRow}>
              <Text style={[template8Styles.tableCell, { width: colWidths[0], textAlign: "center" }]}>{index + 1}</Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[1] }]}>
                {item.name}
                {item.serialNumbers?.map((sn: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined, snIndex: Key | null | undefined) => (
                  <Text key={snIndex} style={{ fontSize: 7 }}>
                    {"\n"}SR/No: {sn}
                  </Text>
                ))}
              </Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[2], textAlign: "center" }]}>{item.hsn || ""}</Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[3], textAlign: "right" }]}>{formatCurrency(item.rate)}</Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[4], textAlign: "center" }]}>
                {item.quantity} {item.unit || ""}
              </Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[5], textAlign: "right" }]}>{formatCurrency(item.taxableValue)}</Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[6], textAlign: "center" }]}>{item.igstPercent.toFixed(2)}</Text>
              <Text style={[template8Styles.tableCell, { width: colWidths[7], textAlign: "right" }]}>{formatCurrency(item.igstAmount)}</Text>
              <Text style={[template8Styles.tableCellLast, { width: colWidths[8], textAlign: "right" }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={template8Styles.totalsSection}>
          <View style={template8Styles.totalsLeft}>
            <Text>Total Items / Qty : {totalItems} / {totalQty.toFixed(2)}</Text>
          </View>
          <View style={template8Styles.totalsRight}>
            <View style={template8Styles.totalsRow}>
              <Text style={template8Styles.boldText}>Taxable Amount</Text>
              <Text>₹{totalTaxable.toFixed(2)}</Text>
            </View>
            <View style={template8Styles.totalsRow}>
              <Text style={template8Styles.boldText}>Total Amount</Text>
              <Text>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={template8Styles.divider} />

        {/* Payment Section */}
        <View style={template8Styles.paymentSection}>
          <View>
            <Text style={template8Styles.boldText}>Pay using UPI:</Text>
            <View style={{ width: 80, height: 80, border: "0.5px solid #666", backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
              <Text style={{ fontSize: 6 }}>QR Code</Text>
            </View>
          </View>
          
          <View>
            <Text style={template8Styles.boldText}>Bank Details:</Text>
            <Text style={template8Styles.normalText}>Name: Kotak Mahindra Bank</Text>
            <Text style={template8Styles.normalText}>Branch: City Center</Text>
            <Text style={template8Styles.normalText}>Acc. Number: 123654789321</Text>
            <Text style={template8Styles.normalText}>IFSC: KKKB0000888</Text>
            <Text style={template8Styles.normalText}>UPI ID: kotaksample@icici</Text>
          </View>

          {/* Stamp */}
          <View style={template8Styles.stamp}>
            <Text style={template8Styles.stampText}>GLOBAL</Text>
            <Text style={template8Styles.stampText}>SECURITIES</Text>
            <Text style={[template8Styles.stampText, { fontSize: 5, marginTop: 2 }]}>AUTHORIZED SIGNATORY</Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={template8Styles.termsSection}>
          <Text style={template8Styles.boldText}>Terms and Conditions:</Text>
          <Text>• Subject to our home Jurisdiction.</Text>
          <Text>• Our Responsibility Ceases as soon as goods leaves our Premises.</Text>
          <Text>• Goods once sold will not taken back.</Text>
          <Text>• Delivery Ex-Premises.</Text>
        </View>
      </Page>
    </Document>
  );
};

// Update your generatePdfForTemplate8 function
export const generatePdfForTemplate8 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): Promise<Blob> => {
  // React PDF generates the PDF directly
  const pdfDoc = pdf(<Template8PDF
    transaction={transaction}
    company={company}
    party={party}
    shippingAddress={shippingAddress}
  />);

  return await pdfDoc.toBlob();
};