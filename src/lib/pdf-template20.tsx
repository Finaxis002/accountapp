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
  numberToWords, // ASSUMED IMPORT from pdf-utils, as used in original A5 template
} from "./pdf-utils";

// --- Constants and Styles Definition (template20.tsx) ---

const PRIMARY_BLUE = "#0070c0";
const LIGHT_GRAY = "#f0f0f0";
const DARK_TEXT = "#333333";

const template20Styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: DARK_TEXT,
  },

  // --- Header & Company Details ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: PRIMARY_BLUE,
    paddingBottom: 5,
  },
  logoAndNameBlock: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
  },
  logoContainer: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "extrabold",
    color: PRIMARY_BLUE,
  },
  companyDetailsBlock: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: LIGHT_GRAY,
  },
  gstin: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 9.5,
    lineHeight: 1.2,
    color: DARK_TEXT,
  },

  // --- Invoice Info & Title ---
  invoiceInfoBlock: {
    width: "30%",
    textAlign: "right",
  },
  taxInvoiceTitle: {
    fontSize: 18,
    fontWeight: "extrabold",
    color: PRIMARY_BLUE,
    marginBottom: 5,
    textDecoration: "underline",
  },
  invoiceDateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    marginRight: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 9,
    width: 80,
    textAlign: "left",
    fontWeight: "bold",
    marginLeft: 35,
  },
  value: {
    fontSize: 9,
    width: 100,
    textAlign: "right",
  },

  // --- Billed To / Shipped To ---
  partySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    paddingVertical: 10,
  },
  partyBlock: {
    width: "48%",
    paddingRight: 5,
  },
  partyHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 5,
    paddingBottom: 2,
  },
  partyName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  // --- Items Table ---
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#999",
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PRIMARY_BLUE,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    alignItems: "stretch",
  },
  tableCellHeader: {
    borderRightColor: "white",
    borderRightWidth: 1,
    padding: 4,
  },
  tableCell: {
    borderRightColor: "#999",
    borderRightWidth: 1,
    padding: 4,
    fontSize: 7,
    textAlign: "right",
  },
  tableCellLeft: {
    textAlign: "left",
    paddingLeft: 6,
  },
  tableCellCenter: {
    textAlign: "center",
  },

  // --- Totals and Amount in Words ---
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    marginTop: 5,
    marginBottom: 10,
    paddingBottom: 5,
  },
  totalsLeft: {
    width: "70 %", // Adjusted width to give more space for totalsRight
    marginRight: 10,
    paddingTop: 5,
    fontSize: 8,
    alignSelf: "flex-end",

    // Note: We don't add full border here, we add it to a wrapper inside the render function.
  },
  totalsRight: {
    width: "35 %",
    // borderStyle: "solid",
    // borderWidth: 1,
    // borderColor: PRIMARY_BLUE,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 3,
    // borderBottomColor: LIGHT_GRAY,
    // borderBottomWidth: 1,
    fontSize: 9,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: LIGHT_GRAY,
    fontWeight: "bold",
    fontSize: 10,
  },

  // --- Footer / Bank / Terms ---
  bankTermsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  bankDetailsBlock: {
    width: "45%",
    padding: 5,
    // borderStyle: "solid",
    // borderWidth: 1,
    // borderColor: "#999",
  },
  bankHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 9,
  },
  bankLabel: {
    width: 65,
    fontWeight: "bold",
    marginRight: 5,
  },
  termsSection: {
    width: "100%",
    marginTop: 10,
    borderColor: PRIMARY_BLUE, // Added border for clarity, adjust as needed
    padding: 8,
    borderStyle: "solid",
    borderWidth: 1,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.3,
  },

  // --- Reusable Styles ---
  smallText: {
    fontSize: 9,
  },
  boldText: {
    fontWeight: "bold",
   
  },
  ammountInWords: {
    fontSize: 6,
    fontStyle: "italic",
    marginTop: 2,
  },
});

const logo = "/assets/invoice-logos/R.png";

interface Template20PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

const Template20PDF: React.FC<Template20PDFProps> = ({
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

  const itemsPerPage = 12; // Number of items per page
  const pages: typeof itemsWithGST[] = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }

  const IGST_COL_WIDTHS = [30, 150, 50, 60, 40, 80, 40, 60, 80];
  const NON_GST_COL_WIDTHS = [30, 190, 70, 70, 50, 90, 90];
  const CGST_SGST_COL_WIDTHS = [30, 100, 50, 50, 40, 60, 30, 50, 30, 50, 100];

  const getColWidths = () => {
    if (!isGSTApplicable || showNoTax) {
      return NON_GST_COL_WIDTHS;
    } else if (showIGST) {
      return IGST_COL_WIDTHS;
    } else {
      return CGST_SGST_COL_WIDTHS;
    }
  };

  const colWidths = getColWidths();
  const getTotalColumnIndex = () => {
    if (!isGSTApplicable || showNoTax) return 6;
    if (showIGST) return 8;
    return 10;
  };
  const totalColumnIndex = getTotalColumnIndex();

  const getAddressLines = (address: string) =>
    address ? address.split("\n").filter((line) => line.trim() !== "") : [];

  const bankData: Bank = bank || ({} as Bank);

  // Check if any bank detail is available
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.branchAddress ||
    bankData?.accountNumber ||
    bankData?.upiId;

  // Calculate amount in words
  const amountInWords = numberToWords(Math.round(totalAmount));

  // Extended Transaction type for optional fields
  const extendedTransaction = transaction as Transaction & {
    poNumber?: string;
    poDate?: string;
    ewayNumber?: string;
  };

  /**
   * Extracts terms and conditions from a potentially HTML-formatted 'notes' string.
   * Logic copied from pdf-templateA5.tsx.
   *
   * @param notes An optional string containing HTML-formatted notes (e.g., from a rich text editor).
   * @returns An object with the extracted title and an array of term items.
   */
  const getTermsAndConditions = (notes?: string) => {
    if (!notes) return { title: "Terms and Conditions", items: ["No terms and conditions added yet"] };

    // --- Dynamic Title Extraction ---
    // Look for a title formatted with '<span class="ql-size-large">...</span>'
    const titleMatch = notes.match(/<span class="ql-size-large">(.*?)<\/span>/);
    // Use the matched title or a default. Replace HTML entities.
    let title = titleMatch
      ? titleMatch[1].replace(/&/g, "&")
      : "Terms and Conditions";

    // --- Dynamic List Item Extraction ---
    const listItems: string[] = [];
    // Regex to find all list items: '<li>...</li>'
    const liRegex = /<li[^>]*>(.*?)<\/li>/g;
    let match;

    while ((match = liRegex.exec(notes)) !== null) {
      const cleanItem = match[1]
        // Remove any nested HTML tags (e.g., <b>, <i>) within the list item
        .replace(/<[^>]*>/g, "")
        // Decode HTML entities
        .replace(/&/g, "&");
      listItems.push(cleanItem);
    }

    // --- Final Return ---
    // If list items were successfully parsed, use them. Otherwise, include a default.
    return { 
        title, 
        items: listItems.length > 0 ? listItems : ["No terms and conditions added yet"] 
    };
  };

  const termsData = getTermsAndConditions(transaction?.notes);


  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A4" style={template20Styles.page}>
            {/* --- Header Section (Appears on every page) --- */}
            <View style={template20Styles.headerContainer}>
              <View style={template20Styles.logoAndNameBlock}>
                <View style={template20Styles.logoContainer}>
                  <Text
                    style={{ fontSize: 18, color: "white", fontWeight: "bold" }}
                  >
                    GS
                  </Text>
                </View>

                <View style={{ width: "auto" }}>
                  <Text style={template20Styles.companyName}>
                    {company?.businessName || company?.companyName || ""}
                  </Text>

                  <View style={template20Styles.companyDetailsBlock}>
                    {company?.gstin && (
                      <Text style={template20Styles.gstin}>
                        GSTIN:{" "}
                        <Text style={{ fontWeight: "normal" }}>
                          {company.gstin}
                        </Text>
                      </Text>
                    )}
                    <Text style={template20Styles.addressText}>
                      {company?.address || ""}
                    </Text>
                    <Text style={template20Styles.addressText}>
                      {company?.addressState}{" "}
                      {company?.Pincode ? `- ${company.Pincode}` : ""}
                    </Text>
                    <Text style={template20Styles.addressText}>
                      <Text style={template20Styles.boldText}>Phone:</Text>{" "}
                      {company?.mobileNumber || company?.Telephone || ""}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Invoice Title & Number/Date */}
              <View style={template20Styles.invoiceInfoBlock}>
                <Text style={template20Styles.taxInvoiceTitle}>
                  {isGSTApplicable ? "TAX INVOICE" : "INVOICE"}
                </Text>
                <View style={template20Styles.invoiceDateRow}>
                  <Text style={template20Styles.label}>Invoice #:</Text>
                  <Text
                    style={[template20Styles.value, { fontWeight: "bold" }]}
                  >
                    {transaction?.invoiceNumber?.toString() || ""}
                  </Text>
                </View>
                <View style={template20Styles.invoiceDateRow}>
                  <Text style={template20Styles.label}>Invoice Date:</Text>
                  <Text
                    style={[template20Styles.value, { fontWeight: "bold" }]}
                  >
                    {transaction?.date
                      ? new Date(transaction.date).toLocaleDateString("en-GB")
                      : ""}
                  </Text>
                </View>
              </View>
            </View>

            {/* --- Address Block (Appears on every page) --- */}
            <View style={template20Styles.partySection}>
              {/* Left Side - Billed To */}
              <View style={template20Styles.partyBlock}>
                <Text style={template20Styles.partyHeader}>
                  Details of Buyer | Billed to :
                </Text>
                <Text style={template20Styles.partyName}>
                  {party?.name || ""}
                </Text>
                {getAddressLines(getBillingAddress(party)).map((line, idx) => (
                  <Text
                    key={`bill-addr-${idx}`}
                    style={template20Styles.addressText}
                  >
                    {line}
                  </Text>
                ))}

                {isGSTApplicable && party?.gstin && (
                  <Text style={template20Styles.addressText}>
                    <Text style={template20Styles.boldText}>GSTIN:</Text>{" "}
                    {party.gstin}
                  </Text>
                )}

                {party?.pan && (
                  <Text style={template20Styles.addressText}>
                    <Text style={template20Styles.boldText}>PAN:</Text>{" "}
                    {party.pan}
                  </Text>
                )}

                {party?.state && (
                  <Text style={template20Styles.addressText}>
                    <Text style={template20Styles.boldText}>State:</Text>{" "}
                    {party.state}
                  </Text>
                )}
                <Text style={template20Styles.partyHeader}>
                  Details of Consignee | Shipped to :
                </Text>
                <Text style={template20Styles.partyName}>
                  {shippingAddress?.label || party?.name || ""}
                </Text>
                {getAddressLines(
                  getShippingAddress(shippingAddress, getBillingAddress(party))
                ).map((line, idx) => (
                  <Text
                    key={`ship-addr-${idx}`}
                    style={template20Styles.addressText}
                  >
                    {line}
                  </Text>
                ))}

                {shippingAddress?.state && (
                  <Text style={template20Styles.addressText}>
                    <Text style={template20Styles.boldText}>State:</Text>{" "}
                    {shippingAddress.state}
                  </Text>
                )}
              </View>

              {/* Right Side - Shipped To & Transaction Details */}
              <View style={template20Styles.partyBlock}>
                {/* Spacing before transaction details */}
                <View
                  style={{
                    marginTop: -9,
                    marginLeft: 100,
                    borderTopWidth: 0.5,
                    borderTopColor: LIGHT_GRAY,
                    paddingTop: 5,
                  }}
                >
                  <Text
                    style={[template20Styles.addressText, { marginBottom: 3 }]}
                  >
                    <Text style={template20Styles.boldText}>P.O. No.:</Text>{" "}
                    {extendedTransaction?.poNumber || "-"}
                  </Text>

                  <Text
                    style={[template20Styles.addressText, { marginBottom: 3 }]}
                  >
                    <Text style={template20Styles.boldText}>P.O. Date:</Text>{" "}
                    {extendedTransaction?.poDate
                      ? new Date(extendedTransaction.poDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "-"}
                  </Text>

                  <Text
                    style={[template20Styles.addressText, { marginBottom: 3 }]}
                  >
                    <Text style={template20Styles.boldText}>E-Way No:</Text>{" "}
                    {extendedTransaction?.ewayNumber || "-"}
                  </Text>

                  <Text style={template20Styles.addressText}>
                    <Text style={template20Styles.boldText}>
                      Place of Supply:
                    </Text>{" "}
                    {shippingAddress?.state || party?.state || "-"}
                  </Text>
                </View>
              </View>
            </View>

            {/* --- Items Table (The main content that splits across pages) --- */}
            <View style={template20Styles.table}>
              {/* Table Header (Repeats on every page due to being inside pages.map) */}
              <View style={template20Styles.tableHeader}>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    { width: colWidths[0] },
                  ]}
                >
                  Sr. No.
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellLeft,
                    { width: colWidths[1] },
                  ]}
                >
                  Name of Product / Service
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[2] },
                  ]}
                >
                  HSN / SAC
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[3] },
                  ]}
                >
                  Rate
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[4] },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[5] },
                  ]}
                >
                  Taxable Value
                </Text>

                {showIGST ? (
                  <>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[6] },
                      ]}
                    >
                      IGST %
                    </Text>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[7] },
                      ]}
                    >
                      IGST Amt
                    </Text>
                  </>
                ) : showCGSTSGST ? (
                  <>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[6] },
                      ]}
                    >
                      CGST %
                    </Text>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[7] },
                      ]}
                    >
                      CGST Amt
                    </Text>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[8] },
                      ]}
                    >
                      SGST %
                    </Text>
                    <Text
                      style={[
                        template20Styles.tableCellHeader,
                        template20Styles.tableCellCenter,
                        { width: colWidths[9] },
                      ]}
                    >
                      SGST Amt
                    </Text>
                  </>
                ) : null}

                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    { width: colWidths[totalColumnIndex], borderRightWidth: 0 },
                  ]}
                >
                  Total
                </Text>
              </View>

              {/* Table Rows (Renders items for the current page) */}
              {pageItems.map((item, index) => (
                <View
                  key={`${pageIndex}-${index}`}
                  style={template20Styles.tableRow}
                >
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[0] },
                    ]}
                  >
                    {pageIndex * itemsPerPage + index + 1}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellLeft,
                      { width: colWidths[1] },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[2] },
                    ]}
                  >
                    {item.code || ""}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      { width: colWidths[3] },
                    ]}
                  >
                    {formatCurrency(item.pricePerUnit || 0)}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[4] },
                    ]}
                  >
                    {item.quantity || 0} {item.unit}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      { width: colWidths[5] },
                    ]}
                  >
                    {formatCurrency(item.taxableValue)}
                  </Text>

                  {showIGST ? (
                    <>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          template20Styles.tableCellCenter,
                          { width: colWidths[6] },
                        ]}
                      >
                        {item.gstRate.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          { width: colWidths[7] },
                        ]}
                      >
                        {formatCurrency(item.igst)}
                      </Text>
                    </>
                  ) : showCGSTSGST ? (
                    <>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          template20Styles.tableCellCenter,
                          { width: colWidths[6] },
                        ]}
                      >
                        {(item.gstRate / 2).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          { width: colWidths[7] },
                        ]}
                      >
                        {formatCurrency(item.cgst)}
                      </Text>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          template20Styles.tableCellCenter,
                          { width: colWidths[8] },
                        ]}
                      >
                        {(item.gstRate / 2).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template20Styles.tableCell,
                          { width: colWidths[9] },
                        ]}
                      >
                        {formatCurrency(item.sgst)}
                      </Text>
                    </>
                  ) : null}

                  <Text
                    style={[
                      template20Styles.tableCell,
                      {
                        width: colWidths[totalColumnIndex],
                        borderRightWidth: 0,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))}
            </View>

            {/* --- Footer and Totals (Rendered only if this is the last page) --- */}
            {isLastPage && (
              <>
                {/* Totals Calculation Block */}
                <View style={template20Styles.totalsSection}>
                  <View style={template20Styles.totalsLeft}>
                    <View
                      style={{
                        paddingBottom: 80, // Increased padding for more space below text
                        marginBottom: -10, // Increased margin to push the line further down
                        borderBottomWidth: 1,
                        borderBottomColor: PRIMARY_BLUE,
                        width: "155%", // Ensures the line spans the full width of totalsLeft (65%)
                      }}
                    >
                      <Text>
                        Total Items / Qty :{" "}
                        <Text style={template20Styles.boldText}>
                          {totalItems} / {totalQty.toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <View style={template20Styles.totalsRight}>
                    <View style={template20Styles.totalsRow}>
                      <Text>Taxable Amount</Text>
                      <Text>{formatCurrency(totalTaxable)}</Text>
                    </View>

                    {isGSTApplicable && (
                      <>
                        {showIGST && (
                          <View style={template20Styles.totalsRow}>
                            <Text>IGST</Text>
                            <Text>{formatCurrency(totalIGST)}</Text>
                          </View>
                        )}
                        {showCGSTSGST && (
                          <>
                            <View style={template20Styles.totalsRow}>
                              <Text>CGST</Text>
                              <Text>{formatCurrency(totalCGST)}</Text>
                            </View>
                            <View style={template20Styles.totalsRow}>
                              <Text>SGST</Text>
                              <Text>{formatCurrency(totalSGST)}</Text>
                            </View>
                          </>
                        )}
                      </>
                    )}

                    <View style={template20Styles.totalAmountRow}>
                      <Text>Total Amount</Text>
                      <Text>{formatCurrency(totalAmount)}</Text>
                    </View>

                    {/* Amount in Words is here */}
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        marginTop: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9.5,
                        }}
                      >
                        Total amount (in words):
                      </Text>
                      <Text style={template20Styles.ammountInWords}>
                        {amountInWords}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* --- MODIFIED Footer (UPI, Bank, Terms) --- */}
                <View style={template20Styles.bankTermsSection}>
                  
                  {isBankDetailAvailable ? (
                    <>
                      {/* UPI Section (Left Column) - QR Code is back! */}
                      <View
                        style={{
                          width: "30%",
                          padding: 5,
                          marginRight: 5,
                        }}
                      >
                        <Text style={template20Styles.boldText}>
                          Pay using UPI:
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            marginTop: 5,
                            alignItems: "center",
                          }}
                        >
                          {/* QR Code Placeholder */}
                          <View
                            style={{
                              width: 60,
                              height: 60,
                              borderStyle: "solid",
                              borderWidth: 0.5,
                              borderColor: "#666",
                              backgroundColor: "#f5f5f5",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 10,
                            }}
                          >
                            <Text style={{ fontSize: 6 }}>QR Code</Text>
                          </View>

                          {/* Dynamic UPI/Account Details Snippet */}
                          <View style={{ fontSize: 7 }}>
                            {bankData?.upiId && (
                              <Text>
                                <Text style={template20Styles.boldText}>
                                  UPI ID:
                                </Text>{" "}
                                {bankData.upiId}
                              </Text>
                            )}
                            {bankData?.accountNumber && (
                              <Text>
                                <Text style={template20Styles.boldText}>
                                  Acc. Number:
                                </Text>{" "}
                                {bankData.accountNumber}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Bank Details Section (Middle Column) */}
                      <View style={template20Styles.bankDetailsBlock}>
                        <Text style={template20Styles.bankHeader}>
                          Bank Details:
                        </Text>
                        <View style={{ marginTop: 4 }}>
                          {bankData?.bankName && (
                            <View style={template20Styles.bankRow}>
                              <Text style={template20Styles.bankLabel}>
                                Bank Name:
                              </Text>
                              <Text style={template20Styles.smallText}>
                                {bankData.bankName}
                              </Text>
                            </View>
                          )}
                          {bankData?.ifscCode && (
                            <View style={template20Styles.bankRow}>
                              <Text style={template20Styles.bankLabel}>
                                IFSC Code:
                              </Text>
                              <Text style={template20Styles.smallText}>
                                {bankData.ifscCode}
                              </Text>
                            </View>
                          )}
                          {bankData?.branchAddress && (
                            <View style={template20Styles.bankRow}>
                              <Text style={template20Styles.bankLabel}>
                                Branch:
                              </Text>
                              <Text style={template20Styles.smallText}>
                                {bankData.branchAddress}
                              </Text>
                            </View>
                          )}
                          <View style={template20Styles.bankRow}>
                            <Text style={template20Styles.bankLabel}>
                              Acc. Number:
                            </Text>
                            <Text style={template20Styles.smallText}>
                              {bankData?.accountNumber || "-"}
                            </Text>
                          </View>
                          <View style={template20Styles.bankRow}>
                            <Text style={template20Styles.bankLabel}>UPI ID:</Text>
                            <Text style={template20Styles.smallText}>
                              {bankData?.upiId || "-"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  ) : (
                    /* --- Bank Details Not Available View (Split to maintain column widths) --- */
                    <>
                      {/* UPI/QR Placeholder Block (30% width) - Keeps the space reserved */}
                      <View
                        style={{
                          width: "30%",
                          padding: 5,
                          marginRight: 5,
                        }}
                      >
                        <Text style={template20Styles.boldText}>
                          Pay using UPI:
                        </Text>
                        <View style={{
                              width: 60,
                              height: 60,
                              borderStyle: "dashed",
                              borderWidth: 0.5,
                              borderColor: "#eee",
                              backgroundColor: "#fcfcfc",
                              marginTop: 5,
                            }}>
                              <Text style={{ fontSize: 6, textAlign: 'center', marginTop: 25, color: '#999',}}>N/A</Text>
                        </View>
                      </View>
                      
                      {/* Bank Details Not Available Block (45% width) */}
                      <View style={template20Styles.bankDetailsBlock}>
                        <Text style={template20Styles.bankHeader}>
                          Bank Details:
                        </Text>
                        <Text
                            style={[template20Styles.boldText, {fontSize: 9.5, marginTop: 5, color: '#cc0000'}]}
                        >
                          BANK DETAILS NOT AVAILABLE
                        </Text>
                      </View>
                    </>
                  )}
                  {/* END OF CONDITIONAL BANK DETAILS BLOCK */}


                  {/* Stamp/Signature Section */}
                  <View
                    style={{
                      width: "20%",
                      textAlign: "right",
                      alignItems: "flex-end",
                      paddingTop: 10,
                    }}
                  >
                    {/* Placeholder for Stamp */}
                    <View
                      style={{
                        height: 80,
                        width: 80,
                        borderStyle: "dashed",
                        borderWidth: 1,
                        borderColor: "#999",
                        marginBottom: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          textAlign: "center",
                          marginTop: 30,
                        }}
                      >
                        For GLOBAL
                      </Text>
                      <Text style={{ fontSize: 7, textAlign: "center" }}>
                        SECURITIES
                      </Text>
                    </View>
                    <Text style={{ fontSize: 7, marginTop: 5 }}>
                      AUTHORISED SIGNATORY
                    </Text>
                  </View>
                </View>

                {/* Terms and Conditions Section (UPDATED) */}
                <View style={template20Styles.termsSection}>
                  <Text
                    style={[
                      template20Styles.boldText,
                      { fontSize: 9, color: PRIMARY_BLUE, marginBottom: 4 },
                    ]}
                  >
                    {termsData.title}:
                  </Text>
                  {termsData.items.map((item, index) => (
                    <Text key={index} style={template20Styles.termsText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </Page>
        );
      })}
    </Document>
  );
};

// --- PDF Generation Function (Export) ---

export const generatePdfForTemplate20 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template20PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};