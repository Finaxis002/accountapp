
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
import { template8Styles } from "./pdf-template-styles";

const logo = "/assets/invoice-logos/R.png";

interface Template8PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

const Template8PDF: React.FC<Template8PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  const {
    totals,
    totalTaxable,
    totalAmount,
    items,
    totalItems,
    totalQty,
    itemsBody,
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

    const itemsPerPage = 18;
    const pages = [];
    for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
      pages.push(itemsWithGST.slice(i, i + itemsPerPage));
    }

  console.log("bank details" , bank);

  // Define column widths based on GST applicability
  const getColWidths = () => {
    if (!isGSTApplicable) {
      // Non-GST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, Total
      return [35, 150, 60, 60, 50, 100, 135]; // Sum: 590
    } else if (showIGST) {
      // IGST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, IGST%, IGST Amt, Total
      return [35, 120, 50, 80, 80, 80, 40, 70, 115]; // Sum: 590
    } else {
      // CGST/SGST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, CGST%, CGST Amt, SGST%, SGST Amt, Total
      return [
        35, // 0: Sr. No. (Reduced from 40 for space)
        80, // 1: Name of Product / Service (Increased from 100)
        50, // 2: HSN / SAC (Reduced from 60)
        70, // 3: Rate (Increased from 30)
        60, // 4: Qty (Kept at 40)
        70, // 5: Taxable Value
        40, // 6: CGST %
        70, // 7: CGST Amount
        40, // 8: SGST %
        70, // 9: SGST Amount
        70, // 10: Total (This is only for the total column when there is no GST, but I'll use a better index based on the count for the Total column)
      ]; // Sum: 590
    }
  };

  const colWidths = getColWidths();

  // Helper function to get total column index based on GST type
  const getTotalColumnIndex = () => {
    if (!isGSTApplicable) return 6;
    if (showIGST) return 8;
    return 10;
  };

  const totalColumnIndex = getTotalColumnIndex();

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A4" style={template8Styles.page}>
           <View  style={{marginBottom: 4}}>
             {/* Header Section */}
            <View style={template8Styles.header}>
              <Text style={template8Styles.title}>
                {isGSTApplicable ? "TAX INVOICE" : "INVOICE"}
              </Text>
              <Text style={template8Styles.companyName}>
                {company?.businessName ||
                  company?.companyName ||
                  "Company Name"}
              </Text>

              <View>
                {company?.gstin && (
                  <Text
                    style={[
                      template8Styles.addressText,
                      template8Styles.grayColor,
                    ]}
                  >
                    <Text style={[template8Styles.boldText, { fontSize: 10 }]}>
                      GSTIN{" "}
                    </Text>
                    <Text style={{ color: "#3d3d3d", fontWeight: "semibold" }}>
                      {company.gstin}{" "}
                    </Text>
                  </Text>
                )}
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  {company?.address || "Address Line 1"}
                </Text>
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  {company?.City || "City"}
                </Text>
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  {company?.addressState || "State"} -{" "}
                  {company?.Pincode || "Pincode"}
                </Text>
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
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
                right: 40,
                width: 100,
                height: 100,
              }}
            />
            </View>

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

                  {/* GSTIN detail - Only show if GST is applicable and available */}
                  {isGSTApplicable && party?.gstin && (
                    <Text
                      style={[
                        template8Styles.addressText,
                        template8Styles.grayColor,
                      ]}
                    >
                      <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                        GSTIN:{" "}
                      </Text>
                      <Text>{party.gstin}</Text>
                    </Text>
                  )}

                  {/* PAN detail */}
                  <Text
                    style={[
                      template8Styles.addressText,
                      template8Styles.grayColor,
                    ]}
                  >
                    <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                      PAN:{" "}
                    </Text>
                    <Text>{party?.pan || "AAUFM1756H"}</Text>
                  </Text>

                  {/* State detail */}
                  <Text
                    style={[
                      template8Styles.addressText,
                      template8Styles.grayColor,
                    ]}
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
                    {shippingAddress?.label || " "}
                  </Text>
                  <Text
                    style={[
                      template8Styles.addressText,
                      template8Styles.grayColor,
                    ]}
                  >
                    {getShippingAddress(
                      shippingAddress,
                      getBillingAddress(party)
                    )}
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
                      ? new Date(
                          (transaction as any).poDate
                        ).toLocaleDateString("en-GB")
                      : "10-Oct-2022"}
                  </Text>
                </View>
                {isGSTApplicable && (
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
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
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
                    template8Styles.tableCellHeader,
                    { width: colWidths[0], textAlign: "center", padding: 4 },
                  ]}
                >
                  Sr. No.
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    { width: colWidths[1], padding: 4 },
                  ]}
                >
                  Name of Product / Service
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    { width: colWidths[2], textAlign: "center", padding: 4 },
                  ]}
                >
                  HSN / SAC
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    { width: colWidths[3], textAlign: "center", padding: 4 },
                  ]}
                >
                  Rate
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    { width: colWidths[4], textAlign: "center", padding: 4 },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    { width: colWidths[5], textAlign: "center", padding: 4 },
                  ]}
                >
                  Taxable Value
                </Text>

                {/* Dynamic GST columns */}
                {showIGST ? (
                  // Interstate - Show IGST columns
                  <>
                    <Text
                      style={[
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[6],
                          textAlign: "center",
                          padding: 4,
                        },
                      ]}
                    >
                      IGST %
                    </Text>
                    <Text
                      style={[
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[7],
                          textAlign: "center",
                          padding: 4,
                        },
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
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[6],
                          textAlign: "center",
                          padding: 4,
                        },
                      ]}
                    >
                      CGST %
                    </Text>
                    <Text
                      style={[
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[7],
                          textAlign: "center",
                          padding: 4,
                        },
                      ]}
                    >
                      CGST Amount
                    </Text>
                    <Text
                      style={[
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[8],
                          textAlign: "center",
                          padding: 4,
                        },
                      ]}
                    >
                      SGST %
                    </Text>
                    <Text
                      style={[
                        template8Styles.tableCellHeader,
                        {
                          width: colWidths[9],
                          textAlign: "center",
                          padding: 4,
                        },
                      ]}
                    >
                      SGST Amount
                    </Text>
                  </>
                ) : null}

                {/* Total Column */}
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[totalColumnIndex],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  Total
                </Text>
              </View>

              {/* Table Rows */}
              {pageItems.map((item, index) => (
                <View
                  key={`${pageIndex}-${index}`}
                  style={[template8Styles.tableRow, template8Styles.grayColor]}
                >
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      { width: colWidths[0], textAlign: "center", padding: 8 },
                    ]}
                  >
                    {pageIndex * itemsPerPage + index + 1}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      { width: colWidths[1], textAlign: "left", padding: 8 },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      { width: colWidths[2], textAlign: "center", padding: 8 },
                    ]}
                  >
                    {item.code || "-"}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      { width: colWidths[3], textAlign: "center", padding: 8 },
                    ]}
                  >
                    {formatCurrency(item.pricePerUnit || 0)}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      { width: colWidths[4], textAlign: "center", padding: 8 },
                    ]}
                  >
                    {item.quantity || 0} {item.unit}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      { width: colWidths[5], padding: 8 },
                    ]}
                  >
                    {formatCurrency(item.taxableValue)}
                  </Text>

                  {/* Dynamic GST columns */}
                  {showIGST ? (
                    // Interstate - Show IGST columns
                    <>
                      <Text
                        style={[
                          template8Styles.tableCell,
                          template8Styles.tableCellSize7,
                          template8Styles.grayColor,
                          {
                            width: colWidths[6],
                            textAlign: "center",
                            padding: 8,
                          },
                        ]}
                      >
                        {item.gstRate.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template8Styles.tableCell,
                          template8Styles.tableCellSize7,
                          template8Styles.grayColor,
                          { width: colWidths[7], padding: 8 },
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
                          template8Styles.grayColor,
                          {
                            width: colWidths[6],
                            textAlign: "center",
                            padding: 8,
                          },
                        ]}
                      >
                        {(item.gstRate / 2).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template8Styles.tableCell,
                          template8Styles.tableCellSize7,
                          template8Styles.grayColor,
                          { width: colWidths[7], padding: 8 },
                        ]}
                      >
                        {formatCurrency(item.cgst)}
                      </Text>
                      <Text
                        style={[
                          template8Styles.tableCell,
                          template8Styles.tableCellSize7,
                          template8Styles.grayColor,
                          {
                            width: colWidths[8],
                            textAlign: "center",
                            padding: 8,
                          },
                        ]}
                      >
                        {(item.gstRate / 2).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template8Styles.tableCell,
                          template8Styles.tableCellSize7,
                          template8Styles.grayColor,
                          { width: colWidths[9], padding: 8 },
                        ]}
                      >
                        {formatCurrency(item.sgst)}
                      </Text>
                    </>
                  ) : null}

                  {/* Total Column */}
                  <Text
                    style={[
                      template8Styles.tableCellLast,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[totalColumnIndex],
                        textAlign: "center",
                        padding: 8,
                      },
                    ]}
                  >
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>

            {/* If isLastPage, Totals Section and Footer */}
            {isLastPage && (
              <>
                <View style={template8Styles.totalsSection}>
                  <View style={template8Styles.totalsLeft}>
                    <Text>
                      Total Items / Qty : {totalItems} / {totalQty.toFixed(2)}
                    </Text>
                  </View>
                  <View style={template8Styles.totalsRight}>
                    <View style={template8Styles.totalsRow}>
                      <Text style={template8Styles.boldText}>
                        Taxable Amount
                      </Text>
                      <Text>
                        <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                        {totalTaxable.toFixed(2)}
                      </Text>
                    </View>

                    {/* Show GST breakdown only if GST is applicable */}
                    {isGSTApplicable && (
                      <>
                        {showIGST && (
                          <View style={template8Styles.totalsRow}>
                            <Text style={template8Styles.boldText}>IGST</Text>
                            <Text>
                              <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                              {totalIGST.toFixed(2)}
                            </Text>
                          </View>
                        )}
                        {showCGSTSGST && (
                          <>
                            <View style={template8Styles.totalsRow}>
                              <Text style={template8Styles.boldText}>CGST</Text>
                              <Text>
                                <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                                {totalCGST.toFixed(2)}
                              </Text>
                            </View>
                            <View style={template8Styles.totalsRow}>
                              <Text style={template8Styles.boldText}>SGST</Text>
                              <Text>
                                <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                                {totalSGST.toFixed(2)}
                              </Text>
                            </View>
                          </>
                        )}
                      </>
                    )}

                    <View style={template8Styles.totalsRow}>
                      <Text style={template8Styles.boldText}>Total Amount</Text>
                      <Text>
                        <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                        {totalAmount.toFixed(2)}
                      </Text>
                    </View>

                    {/* Total in words */}
                    <View style={template8Styles.totalsRow}>
                      <Text style={{ fontSize: 8 , marginTop:4 , marginRight:8 }}>
                       Total in words : {numberToWords(totalAmount)}
                      </Text>
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
  {bank && typeof bank === 'object' && bank.bankName ? (
    <View style={{ marginTop: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={[template8Styles.normalText, {marginRight:28}]}>Name:</Text>
        <Text style={[template8Styles.normalText, {display:"flex", justifyContent:"flex-start"}]}>{bank.bankName}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={template8Styles.normalText}>Branch:</Text>
        <Text style={[template8Styles.normalText, {display:"flex", justifyContent:"flex-start"}]}>{bank.branchAddress}</Text>
      </View>
      {/* <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={template8Styles.normalText}>Acc. Number:</Text>
        <Text style={template8Styles.normalText}>{bank.accountNumber}</Text>
      </View> */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={template8Styles.normalText}>IFSC:</Text>
        <Text style={[template8Styles.normalText, {display:"flex", justifyContent:"flex-start"}]}>{bank.ifscCode}</Text>
      </View>
      {/* <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={template8Styles.normalText}>UPI ID:</Text>
        <Text style={template8Styles.normalText}>{bank.upiId}</Text>
      </View> */}
    </View>
  ) : (
    <Text style={template8Styles.normalText}>No bank details available</Text>
  )}
</View>

                  {/* Stamp */}
                  {/* <View style={template8Styles.stamp}>
                    <Text style={template8Styles.stampText}>GLOBAL</Text>
                    <Text style={template8Styles.stampText}>SECURITIES</Text>
                    <Text
                      style={[
                        template8Styles.stampText,
                        { fontSize: 5, marginTop: 2 },
                      ]}
                    >
                      AUTHORIZED SIGNATORY
                    </Text>
                  </View> */}
                </View>

                {/* Terms and Conditions */}
                <View style={template8Styles.termsSection}>
                  {transaction?.notes ? (
                    (() => {
                      // Parse HTML notes
                      const notesHtml = transaction.notes;
                      const titleMatch = notesHtml.match(/<span class="ql-size-large">(.*?)<\/span>/);
                      const title = titleMatch ? titleMatch[1].replace(/&/g, '&') : "Terms and Conditions";

                      const listItems = [];
                      const liRegex = /<li[^>]*>(.*?)<\/li>/g;
                      let match;
                      while ((match = liRegex.exec(notesHtml)) !== null) {
                        // Strip HTML tags from item
                        const cleanItem = match[1].replace(/<[^>]*>/g, '').replace(/&/g, '&');
                        listItems.push(cleanItem);
                      }

                      return (
                        <>
                          <Text style={[template8Styles.boldText, { fontSize: 12 }]}>
                            {title}
                          </Text>
                          {listItems.map((item, index) => (
                            <Text key={index} style={{ textAlign: 'left', marginTop: 4, fontSize: 8 }}>
                              • {item}
                            </Text>
                          ))}
                        </>
                      );
                    })()
                  ) : (
                    <>
                      <Text style={template8Styles.boldText}>
                        Terms and Conditions:
                      </Text>
                      <Text>• Subject to our home Jurisdiction.</Text>
                      <Text>
                        • Our Responsibility Ceases as soon as goods leaves our
                        Premises.
                      </Text>
                      <Text>• Goods once sold will not taken back.</Text>
                      <Text>• Delivery Ex-Premises.</Text>
                    </>
                  )}
                </View>
              </>
            )}
          </Page>
        );
      })}
    </Document>
  );
};

// Update your generatePdfForTemplate8 function
export const generatePdfForTemplate8 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  // React PDF generates the PDF directly
  const pdfDoc = pdf(
    <Template8PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};