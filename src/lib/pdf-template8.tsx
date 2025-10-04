import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
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
} from "./pdf-utils";
import {
  ReactElement,
  JSXElementConstructor,
  ReactNode,
  ReactPortal,
  AwaitedReactNode,
  Key,
} from "react";
import { template8Styles } from "./pdf-template-styles";

const logo = "/assets/invoice-logos/R.png";

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
  const items = getUnifiedLines(transaction);
  const totalItems = items.length;
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const itemsBody = getItemsBody(transaction);

  // Calculate GST for each item with proper party and shipping address context
  const itemsWithGST = items.map((item) => {
    const taxableValue = item.amount;
    const gstRate = item.gstPercentage || 0;

    const gst = calculateGST(
      taxableValue,
      gstRate,
      transaction,
      company,
      party,
      shippingAddress
    );

    return {
      ...item,
      taxableValue,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      total: taxableValue + gst.cgst + gst.sgst + gst.igst,
      isGSTApplicable: gst.isGSTApplicable,
      isInterstate: gst.isInterstate,
      gstRate,
    };
  });

  // Calculate total GST amounts
  const totalCGST = itemsWithGST.reduce(
    (sum, item) => sum + (item.cgst || 0),
    0
  );
  const totalSGST = itemsWithGST.reduce(
    (sum, item) => sum + (item.sgst || 0),
    0
  );
  const totalIGST = itemsWithGST.reduce(
    (sum, item) => sum + (item.igst || 0),
    0
  );

  // Determine GST type based on actual calculations
  const isGSTApplicable = itemsWithGST.some((item) => item.isGSTApplicable);
  const isInterstate = itemsWithGST.some((item) => item.isInterstate);
  const showIGST = isGSTApplicable && isInterstate;
  const showCGSTSGST = isGSTApplicable && !isInterstate;
  const showNoTax = !isGSTApplicable;

  console.log("GST Debug:", {
    isGSTApplicable,
    isInterstate,
    showIGST,
    showCGSTSGST,
    companyGSTIN: company?.gstin,
    partyGSTIN: party?.gstin,
    totalIGST,
    totalCGST,
    totalSGST,
  });


      {/* Define colWidths for intrastate (CGST/SGST) to ensure a single source of truth for widths */}
// NOTE: I'm assuming the total width for 10 columns needs to sum up to the full table width (e.g., 590 or 600)
// The existing code for colWidths[showCGSTSGST ? 10 : 6] suggests a dynamic array index.
// I'll define a sensible 10-column layout based on the visible data.
const colWidths = [
  30, // 0: Sr. No. (Reduced from 40 for space)
  150, // 1: Name of Product / Service (Increased from 100)
  50, // 2: HSN / SAC (Reduced from 60)
  50, // 3: Rate (Increased from 30)
  40, // 4: Qty (Kept at 40)
  70, // 5: Taxable Value
  40, // 6: CGST %
  70, // 7: CGST Amount
  40, // 8: SGST %
  70, // 9: SGST Amount
  90, // 10: Total (This is only for the total column when there is no GST, but I'll use a better index based on the count for the Total column)
];
const totalColumnIndexCGSTSGST = 10; // The index for the 'Total' column when CGST/SGST are shown.
// const totalColumnIndexIGST = 8; // The index for the 'Total' column when IGST is shown.

// You may need to ensure the sum of the first 10 widths plus the final 'Total' width (let's say 70) 
// equals the total page width of the PDF document minus margins.

  return (
    <Document>
      <Page size="A4" style={template8Styles.page}>
        {/* Header Section */}
        <View style={template8Styles.header}>
          <Text style={template8Styles.title}>TAX INVOICE</Text>
          <Text style={template8Styles.companyName}>
            {company?.businessName || company?.companyName || "Company Name"}
          </Text>

          <View>
            <Text
              style={[template8Styles.addressText, template8Styles.grayColor]}
            >
              <Text style={[template8Styles.boldText, { fontSize: 10 }]}>
                GSTIN{" "}
              </Text>
              <Text style={{ color: "#3d3d3d", fontWeight: "semibold" }}>
                {company?.gstin || "GSTIN"}{" "}
              </Text>
            </Text>
            <Text
              style={[template8Styles.addressText, template8Styles.grayColor]}
            >
              {company?.address || "Address Line 1"}
            </Text>
            <Text
              style={[template8Styles.addressText, template8Styles.grayColor]}
            >
              {company?.City || "City"}
            </Text>
            <Text
              style={[template8Styles.addressText, template8Styles.grayColor]}
            >
              {company?.addressState || "State"} -{" "}
              {company?.Pincode || "Pincode"}
            </Text>
            <Text
              style={[template8Styles.addressText, template8Styles.grayColor]}
            >
              <Text style={[template8Styles.boldText, { fontSize: "9" }]}>
                Phone{" "}
              </Text>
              <Text>
                {company?.mobileNumber || company?.Telephone || "Phone"}
              </Text>
            </Text>
          </View>
        </View>

        {/* Logo */}
        <Image
          src={logo}
          style={{
            position: "absolute",
            top: 30,
            right: 40,
            width: 100,
            height: 100,
          }}
        />

        <View style={template8Styles.dividerBlue} />

        {/* Two Column Section */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          {/* Left Side - Two Address Sections Stacked */}
          <View style={{ flex: 2, paddingRight: 10 }}>
            {/* Customer Details - Top Section */}
            <View style={{ marginBottom: 15 }}>
              <Text
                style={[
                  template8Styles.grayColor,
                  template8Styles.sectionHeader,
                ]}
              >
                Customer Details | Billed to :
              </Text>
              <Text
                style={[
                  template8Styles.companyName,
                  template8Styles.grayColor,
                  { fontSize: 12 },
                ]}
              >
                {party?.name || "Jay Enterprises"}
              </Text>
              <Text
                style={[
                  template8Styles.addressText,
                  template8Styles.grayColor,
                  { width: "70%" },
                ]}
              >
                {getBillingAddress(party)}
              </Text>

              {/* GSTIN detail */}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  GSTIN:{" "}
                </Text>
                <Text>{party?.gstin || "24CORPP3239M1ZA"}</Text>
              </Text>

              {/* PAN detail */}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  PAN:{" "}
                </Text>
                <Text>{party?.pan || "AAUFM1756H"}</Text>
              </Text>

              {/* State detail */}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  State:{" "}
                </Text>
                <Text>{party?.state || "Madhya Pradesh"}</Text>
              </Text>
            </View>

            {/* Shipping Address - Bottom Section */}
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
                {shippingAddress?.label || "Global Securities"}
              </Text>
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                {getShippingAddress(shippingAddress, getBillingAddress(party))}
              </Text>

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  State:{" "}
                </Text>
                <Text>{shippingAddress?.state || "Madhya Pradesh"}</Text>
              </Text>
            </View>
          </View>
          {/* Right Side - Invoice Details */}
          <View style={{ width: "30%", textAlign: "right" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                Invoice #:
              </Text>
              <Text style={{ fontSize: 9 }}>
                {transaction?.invoiceNumber?.toString() || "2"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                Invoice Date:
              </Text>
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                {transaction?.date
                  ? new Date(transaction.date).toLocaleDateString("en-GB")
                  : "14-Oct-2022"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9 }}>P.O. No.:</Text>
              <Text style={{ fontSize: 9 }}>
                {(transaction as any)?.poNumber || "PO/253/22-23"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9 }}>P.O. Date:</Text>
              <Text style={{ fontSize: 9 }}>
                {(transaction as any)?.poDate
                  ? new Date((transaction as any).poDate).toLocaleDateString(
                      "en-GB"
                    )
                  : "10-Oct-2022"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9 }}>E-Way No.:</Text>
              <Text style={{ fontSize: 9 }}>
                {(transaction as any)?.ewayNumber || "1987494"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 9 }}>Place of Supply:</Text>
              <Text style={{ fontSize: 9 }}>
                {shippingAddress?.state || "Madhya Pradesh"}
              </Text>
            </View>
          </View>
        </View>



{/* Items Table */}
<View style={template8Styles.table}>
  {/* Table Header */}
  <View style={template8Styles.tableHeader}>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[0], textAlign: "center" },
      ]}
    >
      Sr. No.
    </Text>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[1], textAlign: "center" },
      ]}
    >
      Name of Product / Service
    </Text>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[2], textAlign: "center" },
      ]}
    >
      HSN / SAC
    </Text>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[3], textAlign: "center" },
      ]}
    >
      Rate
    </Text>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[4], textAlign: "center" },
      ]}
    >
      Qty
    </Text>
    <Text
      style={[
        template8Styles.tableCell,
        { width: colWidths[5], textAlign: "center" },
      ]}
    >
      Taxable Value
    </Text>

    {/* Dynamic GST columns - Show IGST for interstate, CGST/SGST for intrastate, none if no GST */}
    {showIGST ? (
      // Interstate - Show IGST columns
      <>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[6], textAlign: "center" },
          ]}
        >
          IGST %
        </Text>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[7], textAlign: "center" },
          ]}
        >
          IGST Amount
        </Text>
      </>
    ) : showCGSTSGST ? (
      // Intrastate - Show CGST/SGST columns
      <>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[6], textAlign: "center" },
          ]}
        >
          CGST %
        </Text>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[7], textAlign: "center" },
          ]}
        >
          CGST Amount
        </Text>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[8], textAlign: "center" },
          ]}
        >
          SGST %
        </Text>
        <Text
          style={[
            template8Styles.tableCell,
            { width: colWidths[9], textAlign: "center" },
          ]}
        >
          SGST Amount
        </Text>
      </>
    ) : null}

    <Text
      style={[
        template8Styles.tableCell,
        {
          // FIX: Use the calculated index (e.g., colWidths[10]) for the 'Total' column width
          // The total column width is based on the remaining space. Assuming a total of 11 columns in the array.
          // Using a consistent index for the Total column based on the number of columns displayed.
          width: showIGST
            ? colWidths[8] // Use colWidths[8] for total width in IGST scenario
            : showCGSTSGST
            ? colWidths[10] // Use colWidths[10] for total width in CGST/SGST scenario
            : colWidths[6], // Use colWidths[6] for total width in no-GST scenario
          textAlign: "center",
        },
      ]}
    >
      Total
    </Text>
  </View>
  {/* Table Rows */}
  {itemsWithGST.map((item, index) => (
    <View key={index} style={template8Styles.tableRow}>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[0], textAlign: "center" },
        ]}
      >
        {index + 1}
      </Text>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[1], textAlign: "left", paddingLeft: 3 }, // Aligned Product Name to left
        ]}
      >
        {item.name}
      </Text>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[2], textAlign: "center" },
        ]}
      >
        {item.code || "-"}
      </Text>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[3], textAlign: "right", paddingRight: 3 },
        ]}
      >
        {formatCurrency(item.pricePerUnit || 0)}
      </Text>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[4], textAlign: "center" },
        ]}
      >
        {item.quantity || 0} {item.unit}
      </Text>
      <Text
        style={[
          template8Styles.tableCell,
          template8Styles.tableCellSize7,
          { width: colWidths[5], textAlign: "right", paddingRight: 3 },
        ]}
      >
        {formatCurrency(item.taxableValue)}
      </Text>
      {/* Dynamic GST columns - Show IGST for interstate, CGST/SGST for intrastate, none if no GST */}
      {showIGST ? (
        // Interstate - Show IGST columns
        <>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[6], textAlign: "center" },
            ]}
          >
            {item.gstRate.toFixed(2)}
          </Text>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[7], textAlign: "right", paddingRight: 3 },
            ]}
          >
            {formatCurrency(item.igst)}
          </Text>
        </>
      ) : showCGSTSGST ? (
        // Intrastate - Show CGST/SGST columns
        <>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[6], textAlign: "center" },
            ]}
          >
            {(item.gstRate / 2).toFixed(2)}
          </Text>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[7], textAlign: "right", paddingRight: 3 },
            ]}
          >
            {formatCurrency(item.cgst)}
          </Text>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[8], textAlign: "center" },
            ]}
          >
            {(item.gstRate / 2).toFixed(2)}
          </Text>
          <Text
            style={[
              template8Styles.tableCell,
              template8Styles.tableCellSize7,
              { width: colWidths[9], textAlign: "right", paddingRight: 3 },
            ]}
          >
            {formatCurrency(item.sgst)}
          </Text>
        </>
      ) : null}

      <Text
        style={[
          template8Styles.tableCellLast,
          template8Styles.tableCellSize7,
          {
            // FIX: Use the calculated index for the 'Total' column width
            width: showIGST
            ? colWidths[8] // Use colWidths[8] for total width in IGST scenario
            : showCGSTSGST
            ? colWidths[10] // Use colWidths[10] for total width in CGST/SGST scenario
            : colWidths[6], // Use colWidths[6] for total width in no-GST scenario
            textAlign: "right",
            paddingRight: 3,
          },
        ]}
      >
        {formatCurrency(item.total)}
      </Text>
    </View>
  ))}
</View>

{/* NOTE: You need to define the 'colWidths' array *before* the component renders, 
ideally outside the main return or as a dynamically calculated value based on 'showIGST'/'showCGSTSGST' */}

        {/* Totals Section */}
        <View style={template8Styles.totalsSection}>
          <View style={template8Styles.totalsLeft}>
            <Text>
              Total Items / Qty : {totalItems} / {totalQty.toFixed(2)}
            </Text>
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
            <View
              style={{
                width: 80,
                height: 80,
                border: "0.5px solid #666",
                backgroundColor: "#f5f5f5",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 6 }}>QR Code</Text>
            </View>
          </View>

          <View>
            <Text style={template8Styles.boldText}>Bank Details:</Text>
            <Text style={template8Styles.normalText}>
              Name: Kotak Mahindra Bank
            </Text>
            <Text style={template8Styles.normalText}>Branch: City Center</Text>
            <Text style={template8Styles.normalText}>
              Acc. Number: 123654789321
            </Text>
            <Text style={template8Styles.normalText}>IFSC: KKKB0000888</Text>
            <Text style={template8Styles.normalText}>
              UPI ID: kotaksample@icici
            </Text>
          </View>

          {/* Stamp */}
          <View style={template8Styles.stamp}>
            <Text style={template8Styles.stampText}>GLOBAL</Text>
            <Text style={template8Styles.stampText}>SECURITIES</Text>
            <Text
              style={[template8Styles.stampText, { fontSize: 5, marginTop: 2 }]}
            >
              AUTHORIZED SIGNATORY
            </Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={template8Styles.termsSection}>
          <Text style={template8Styles.boldText}>Terms and Conditions:</Text>
          <Text>• Subject to our home Jurisdiction.</Text>
          <Text>
            • Our Responsibility Ceases as soon as goods leaves our Premises.
          </Text>
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
  const pdfDoc = pdf(
    <Template8PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
    />
  );

  return await pdfDoc.toBlob();
};
