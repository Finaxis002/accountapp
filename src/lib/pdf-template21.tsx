import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Item,
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
  numberToWords, // ADDED: Assuming this utility is available
} from "./pdf-utils";

// --- Constants and Styles Definition (template21.tsx) ---

const PRIMARY_BLUE = "#0066cc";
const LIGHT_BLUE = "#e6f2ff";
const LIGHT_GRAY = "#f5f5f5";
const DARK_TEXT = "#000000";
const BORDER_COLOR = "#cccccc";
const TABLE_HEADER_BG = "#0066cc";

const template21Styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: DARK_TEXT,
  },

  // --- Header & Company Details ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 6,
  },
  leftHeaderBlock: {
    width: "65%",
  },
  taxInvoiceTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 2,
  },
  gstin: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
    color: DARK_TEXT,
  },
  addressText: {
    fontSize: 7,
    lineHeight: 1.3,
    color: DARK_TEXT,
  },
  emailText: {
    fontSize: 7,
    lineHeight: 1.3,
    color: DARK_TEXT,
  },

  // --- Logo & Original Text ---
  rightHeaderBlock: {
    width: "35 %",
    alignItems: "flex-end",
    paddingBottom: 10,
  },
  originalForRecipient: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 4,
    textAlign: "right",
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "transparent",
  },

  // --- Invoice Info Section (Keeping original styles for unused block for completeness) ---
  invoiceInfoSection: {
    flexDirection: "row",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  invoiceLeftBlock: {
    width: "50%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  invoiceRightBlock: {
    width: "50%",
    padding: 6,
  },
  invoiceRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 8,
  },
  label: {
    fontSize: 8,
    width: 70,
    fontWeight: "normal",
    color: DARK_TEXT,
  },
  value: {
    fontSize: 8,
    flex: 1,
    fontWeight: "normal",
  },

  // --- Party Section (Keeping original styles for unused block for completeness) ---
  partySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  partyBlock: {
    width: "50%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
    minHeight: 75,
  },
  partyBlockRight: {
    width: "50%",
    padding: 6,
    minHeight: 75,
  },
  partyHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 3,
  },
  partyName: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
    color: DARK_TEXT,
  },

  // --- Items Table ---
  table: {
    width: "auto",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: TABLE_HEADER_BG,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: 0.5,
    minHeight: 16,
  },
  tableCellHeader: {
    borderRightColor: "white",
    borderRightWidth: 0.5,
    padding: 3,
    textAlign: "center",
    justifyContent: "center",
  },
  tableCell: {
    borderRightColor: BORDER_COLOR,
    borderRightWidth: 0.5,
    padding: 2.5,
    fontSize: 7,
    textAlign: "right",
    justifyContent: "center",
  },
  tableCellLeft: {
    textAlign: "left",
    paddingLeft: 3,
  },
  tableCellCenter: {
    textAlign: "center",
  },

  // --- Tax Summary Table ---
  taxSummaryTable: {
    marginTop: 6,
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 6,
  },
  taxHeader: {
    flexDirection: "row",
    backgroundColor: TABLE_HEADER_BG,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 6.5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  taxRow: {
    flexDirection: "row",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: 0.5,
  },
  taxCell: {
    padding: 2.5,
    fontSize: 6.5,
    textAlign: "right",
    borderRightColor: BORDER_COLOR,
    borderRightWidth: 0.5,
  },

  // --- Footer / Bank / Terms ---
  footerSection: {
    marginTop: 6,
  },
  qrBankSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    minHeight: 90,
  },
  qrBlock: {
    width: "25%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
    alignItems: "center",
  },
  bankBlock: {
    width: "55%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  signatureBlock: {
    width: "20%",
    padding: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 3,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    fontSize: 7,
  },
  bankLabel: {
    width: 55,
    fontWeight: "bold",
    marginRight: 4,
  },
  termsSection: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 5,
  },
  termsText: {
    fontSize: 6.5,
    lineHeight: 1.3,
    marginBottom: 1,
  },

  // --- Reusable Styles ---
  smallText: {
    fontSize: 7,
  },
  boldText: {
    fontWeight: "bold",
  },
  amountInWords: {
    fontSize: 8,
    marginBottom: 5,
    backgroundColor: LIGHT_GRAY,
    padding: 3,
  },

  grayColor: {
    color: "#262626",
  },

  sectionHeader: {
    fontSize: 9,
    marginBottom: 3,
  },
});

// Types for calculated data (as used in Template8PDF logic)
interface Template8Data {
  totals: any;
  totalTaxable: number;
  totalAmount: number;
  items: ItemWithCalculations[];
  itemsWithGST: ItemWithCalculations[];
  totalItems: number;
  totalQty: number;
  itemsBody: any;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  isGSTApplicable: boolean;
  isInterstate: boolean;
  showIGST: boolean;
  showCGSTSGST: boolean;
  showNoTax: boolean;
}

type ItemWithCalculations = Item & {
  code?: string;
  unit?: string;
  taxableValue: number;
  gstRate: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
  details?: string[];
};

interface TaxSummaryItem {
  hsn: string;
  taxableValue: number;
  rate: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

// Interface Definitions
interface Template21PDFProps {
  company?: (Company & { logoUrl?: string; emailId?: string }) | null;
  party?: Party | null;
  transaction: Transaction;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

// Helper: Terms and Conditions extraction logic from Template8PDF
const getTermsAndConditions = (notes?: string) => {
  const defaultTerms = [
    "Subject to our home Jurisdiction.",
    "Our Responsibility Ceases as soon as goods leaves our Premises.",
    "Goods once sold will not taken back.",
    "Delivery Ex-Premises.",
  ];

  if (!notes)
    return { title: "Terms & Conditions:", items: defaultTerms.slice(0, 4) };

  const notesHtml = notes;
  const titleMatch = notesHtml.match(
    /<span class="ql-size-large">(.*?)<\/span>/
  );
  const title = titleMatch
    ? titleMatch[1].replace(/&amp;/g, "&")
    : "Terms & Conditions:";

  const listItems = [];
  const liRegex = /<li[^>]*>(.*?)<\/li>/g;
  let match;
  while ((match = liRegex.exec(notesHtml || "")) !== null) {
    // Strip HTML tags from item and replace HTML entities
    const cleanItem = match[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
    listItems.push(cleanItem);
  }

  return {
    title: title,
    items: listItems.length > 0 ? listItems : defaultTerms.slice(0, 4),
  };
};

const Template21PDF: React.FC<Template21PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  // FIX: Using 'as unknown as Template8Data' to satisfy TypeScript compiler
  const preparedData: Template8Data = prepareTemplate8Data(
    transaction,
    company,
    party,
    shippingAddress
  ) as unknown as Template8Data; // <-- FIX APPLIED HERE

  const {
    totalTaxable,
    totalAmount,
    items: allItems, // Rename to avoid conflict with `items` in scope
    totalItems,
    totalQty,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    showIGST,
    showCGSTSGST,
  } = preparedData;

  // Use itemsWithGST if it exists and contains the calculated fields, otherwise fall back to items.
  const typedItems: ItemWithCalculations[] = (preparedData.itemsWithGST ||
    allItems) as ItemWithCalculations[];

  const itemsPerPage = 12; // Number of items per page
  const pages: ItemWithCalculations[][] = [];
  for (let i = 0; i < typedItems.length; i += itemsPerPage) {
    pages.push(typedItems.slice(i, i + itemsPerPage));
  }

  // --- Column Width Definitions (Adjusted for fixed width based on GST columns) ---
  const COL_WIDTH_SR_NO = 22;
  const COL_WIDTH_NAME = showIGST ? 140 : showCGSTSGST ? 110 : 195;
  const COL_WIDTH_HSN = 45;
  const COL_WIDTH_QTY = 35;
  const COL_WIDTH_RATE = 55;
  const COL_WIDTH_TAXABLE = 65;
  const COL_WIDTH_GST_PCT_HALF = 25; // For CGST/SGST %
  const COL_WIDTH_GST_AMT_HALF = 50; // For CGST/SGST Amt
  const COL_WIDTH_IGST_PCT = 40;
  const COL_WIDTH_IGST_AMT = 60;
  const COL_WIDTH_TOTAL = 65;

  const getColWidths = () => {
    let widths = [
      COL_WIDTH_SR_NO,
      COL_WIDTH_NAME,
      COL_WIDTH_HSN,
      COL_WIDTH_QTY,
      COL_WIDTH_RATE,
      COL_WIDTH_TAXABLE,
    ];

    if (showIGST) {
      widths.push(COL_WIDTH_IGST_PCT, COL_WIDTH_IGST_AMT);
    } else if (showCGSTSGST) {
      widths.push(
        COL_WIDTH_GST_PCT_HALF,
        COL_WIDTH_GST_AMT_HALF,
        COL_WIDTH_GST_PCT_HALF,
        COL_WIDTH_GST_AMT_HALF
      );
    }
    widths.push(COL_WIDTH_TOTAL);

    return widths;
  };

  const colWidths = getColWidths();
  const totalColumnIndex = colWidths.length - 1; // Index of the 'Total' column

  // Calculate the combined width of the columns preceding the 'Total Amount' label in the summary row
  const calculateTotalLabelWidth = () => {
    if (showIGST) {
      // SR_NO + Name + HSN + Qty + Rate + Taxable Value + IGST% + IGST Amt
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE +
        COL_WIDTH_IGST_PCT +
        COL_WIDTH_IGST_AMT
      );
    } else if (showCGSTSGST) {
      // SR_NO + Name + HSN + Qty + Rate + Taxable Value + CGST% + CGST Amt + SGST% + SGST Amt
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE +
        COL_WIDTH_GST_PCT_HALF * 2 +
        COL_WIDTH_GST_AMT_HALF * 2
      );
    } else {
      // SR_NO + Name + HSN + Qty + Rate + Taxable Value
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE
      );
    }
  };

  const getAddressLines = (address: string | undefined) =>
    address ? address.split("\n").filter((line) => line.trim() !== "") : [];

  const bankData: Bank = bank || ({} as Bank);
  // Using the imported numberToWords utility
  const totalAmountRounded = Math.round(totalAmount);
  const amountInWords = numberToWords(totalAmountRounded);

  const extendedTransaction = transaction as Transaction & {
    poNumber?: string;
    poDate?: string;
    ewayNumber?: string;
  };

  // --- Tax Summary Data Grouped by HSN/SAC ---
  const taxSummary = typedItems.reduce((acc, item) => {
    const key = `${item.code || "-"}-${item.gstRate || 0}`;

    if (!acc[key]) {
      acc[key] = {
        hsn: item.code || "-",
        taxableValue: 0,
        rate: item.gstRate || 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        total: 0,
      };
    }

    acc[key].taxableValue += item.taxableValue || 0;
    acc[key].igst += item.igst || 0;
    acc[key].cgst += item.cgst || 0;
    acc[key].sgst += item.sgst || 0;
    // Sum of all tax for the HSN row
    acc[key].total += (item.igst || 0) + (item.cgst || 0) + (item.sgst || 0);

    return acc;
  }, {} as Record<string, TaxSummaryItem>);

  const taxSummaryArray: TaxSummaryItem[] = Object.values(taxSummary);
  const { title: termsTitle, items: termsItems } = getTermsAndConditions(
    transaction?.notes
  );

  return (
    <Document>
      {pages.map((pageItems: ItemWithCalculations[], pageIndex: number) => {
        const isLastPage = pageIndex === pages.length - 1;

        const companyName =
          company?.businessName || company?.companyName || "-";
        const partyAddress = getBillingAddress(party);
        const shippingAddressString = getShippingAddress(
          shippingAddress,
          partyAddress
        );

        return (
          <Page key={pageIndex} size="A4" style={template21Styles.page}>
            {/* --- Header Section --- */}
            <View style={template21Styles.headerContainer}>
              {/* Left Side: Tax Invoice & Company Details */}
              <View style={template21Styles.leftHeaderBlock}>
                <Text style={template21Styles.taxInvoiceTitle}>
                  {transaction.type === "proforma"
                    ? "PROFORMA INVOICE"
                    : isGSTApplicable
                    ? "TAX INVOICE"
                    : "INVOICE"}
                </Text>

                <Text style={template21Styles.companyName}>{companyName}</Text>

                {company?.gstin && (
                  <Text style={template21Styles.gstin}>
                    GSTIN: {company.gstin}
                  </Text>
                )}
                {getAddressLines(company?.address).map((line, idx) => (
                  <Text
                    key={`comp-addr-${idx}`}
                    style={template21Styles.addressText}
                  >
                    {line}
                  </Text>
                ))}
                {company?.addressState && (
                  <Text style={template21Styles.addressText}>
                    {company.addressState}
                    {company?.Pincode ? ` - ${company.Pincode}` : ""}
                  </Text>
                )}
                <Text style={template21Styles.addressText}>
                  Phone: {company?.mobileNumber || company?.Telephone || "- "}
                </Text>
                {company?.emailId && (
                  <Text style={template21Styles.emailText}>
                    Email: {company.emailId}
                  </Text>
                )}
              </View>

              {/* Right Side: Original Text & Logo */}
              <View style={template21Styles.rightHeaderBlock}>
                <Text style={template21Styles.originalForRecipient}>
                  ORIGINAL FOR RECIPIENT
                </Text>

                <View style={template21Styles.logoContainer}>
                  {company?.logo ? (
                    <Image
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`}
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        backgroundColor: "#e6f2ff",
                        borderRadius: 40,
                      }}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Two Column Section */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              {/* NEW: Full-width blue line added at the very top */}
              <View
                style={{
                  position: "absolute",
                  top: -15,
                  left: -20,
                  right: -20,
                  height: 1.5,
                  backgroundColor: "#007AFF",
                }}
              />
              {/* End of NEW: Blue line */}

              {/* Left Side - Two Address Sections Stacked */}
              <View style={{ flex: 2, paddingRight: 10 }}>
                {/* Customer Details - Top Section (Billed to) */}
                <View style={{ marginBottom: 15 }}>
                  <Text
                    style={[
                      template21Styles.grayColor,
                      template21Styles.sectionHeader,
                      { fontSize: 11 },
                    ]}
                  >
                    Customer Details |
                  </Text>
                  <Text
                    style={[
                      template21Styles.companyName,
                      template21Styles.grayColor,
                      { fontSize: 14 },
                    ]}
                  >
                    {party?.name || "-"}
                  </Text>
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { width: "70%", fontSize: 10 },
                    ]}
                  >
                    {partyAddress || "-"}
                  </Text>

                  {/* GSTIN detail - Only show if GST is applicable and available */}
                  {isGSTApplicable && party?.gstin && (
                    <Text
                      style={[
                        template21Styles.addressText,
                        template21Styles.grayColor,
                        { fontSize: 10 },
                      ]}
                    >
                      <Text
                        style={[template21Styles.boldText, { fontSize: 10 }]}
                      >
                        GSTIN:{" "}
                      </Text>
                      <Text>{party.gstin}</Text>
                    </Text>
                  )}

                  {/* PAN detail */}
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 10 }]}>
                      PAN:{" "}
                    </Text>
                    <Text>{party?.pan || "-"}</Text>
                  </Text>

                  {/* State detail */}
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 10 }]}>
                      State:{" "}
                    </Text>
                    <Text>{party?.state || "-"}</Text>
                  </Text>
                </View>
              </View>

              {/* Center  */}
              <View style={{ flex: 2, paddingRight: 10 }}>
                {/* Shipping Address - Bottom Section (Shipped to) */}
                <View>
                  <Text
                    style={[
                      template21Styles.sectionHeader,
                      template21Styles.grayColor,
                      { fontSize: 11 },
                    ]}
                  >
                    Details of Consignee | Shipped to :
                  </Text>
                  <Text
                    style={[
                      template21Styles.companyName,
                      template21Styles.grayColor,
                      { fontSize: 14 },
                    ]}
                  >
                    {shippingAddress?.label || party?.name || " "}
                  </Text>
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10 },
                    ]}
                  >
                    {shippingAddressString || "-"}
                  </Text>

                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 10 }]}>
                      State:{" "}
                    </Text>
                    <Text>{shippingAddress?.state|| "-"}</Text>
                  </Text>
                </View>
              </View>

              {/* Right Side - Invoice Details */}
              <View style={{ width: "30%", textAlign: "right" }}>
                {/* Invoice # */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                    Invoice #:
                  </Text>
                  <Text style={{ fontSize: 10 }}>
                    {transaction?.invoiceNumber?.toString() || "-"}
                  </Text>
                </View>
                {/* Invoice Date */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                    Invoice Date:
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "bold" }}>
                    {transaction?.date
                      ? new Date(transaction.date).toLocaleDateString("en-GB")
                      : "-"}
                  </Text>
                </View>
                {/* P.O. No. */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 10 }}>P.O. No.:</Text>
                  <Text style={{ fontSize: 10 }}>
                    {extendedTransaction?.poNumber || "-"}
                  </Text>
                </View>
                {/* P.O. Date */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 10 }}>P.O. Date:</Text>
                  <Text style={{ fontSize: 10 }}>
                    {extendedTransaction?.poDate
                      ? new Date(extendedTransaction.poDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "-"}
                  </Text>
                </View>
                {/* E-Way No. - Only show if GST is applicable */}
                {isGSTApplicable && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10 }}>E-Way No.:</Text>
                    <Text style={{ fontSize: 10 }}>
                      {extendedTransaction?.ewayNumber || "-"}
                    </Text>
                  </View>
                )}
                
              </View>
            </View>

            {/* --- Items Table --- */}
            <View style={template21Styles.table}>
              {/* Table Header */}
              <View style={template21Styles.tableHeader}>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[0] },
                  ]}
                >
                  Sr.{"\n"}No.
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    template21Styles.tableCellLeft,
                    { width: colWidths[1] },
                  ]}
                >
                  Name of Product / Service
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[2] },
                  ]}
                >
                  HSN/{"\n"}SAC
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[3] },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[4] },
                  ]}
                >
                  Rate
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[5] },
                  ]}
                >
                  Taxable{"\n"}Value
                </Text>

                {showIGST ? (
                  <>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[6] },
                      ]}
                    >
                      IGST{"\n"}%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[7] },
                      ]}
                    >
                      IGST{"\n"}Amt
                    </Text>
                  </>
                ) : showCGSTSGST ? (
                  <>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[6] },
                      ]}
                    >
                      CGST{"\n"}%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[7] },
                      ]}
                    >
                      CGST{"\n"}Amt
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[8] },
                      ]}
                    >
                      SGST{"\n"}%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[9] },
                      ]}
                    >
                      SGST{"\n"}Amt
                    </Text>
                  </>
                ) : null}

                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[totalColumnIndex], borderRightWidth: 0 },
                  ]}
                >
                  Total
                </Text>
              </View>

              {/* Table Rows */}
              {pageItems.map((item, index: number) => {
                const isLastItemInPage = index === pageItems.length - 1;

                return (
                  <View
                    key={`${pageIndex}-${index}`}
                    style={[
                      template21Styles.tableRow,
                      isLastItemInPage && !isLastPage
                        ? { borderBottomWidth: 0 }
                        : {},
                    ]}
                  >
                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[0], padding: 4 },
                      ]}
                    >
                      {pageIndex * itemsPerPage + index + 1}
                    </Text>

                    <View
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellLeft,
                        { width: colWidths[1], padding: 3 },
                      ]}
                    >
                      <Text style={template21Styles.smallText}>
                        {item.name}
                      </Text>
                      {(item.details || []).map((detail, dIdx) => (
                        <Text
                          key={dIdx}
                          style={[
                            template21Styles.smallText,
                            { fontSize: 6, color: "#666", marginTop: 0.5 },
                          ]}
                        >
                          {detail}
                        </Text>
                      ))}
                    </View>

                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[2], padding: 4 },
                      ]}
                    >
                      {item.code || ""}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[3], padding: 4 },
                      ]}
                    >
                      {item.quantity || 0} {item.unit || ""}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        { width: colWidths[4], padding: 4 },
                      ]}
                    >
                      {formatCurrency(item.pricePerUnit || 0)}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        { width: colWidths[5], padding: 4 },
                      ]}
                    >
                      {formatCurrency(item.taxableValue || 0)}
                    </Text>

                    {showIGST ? (
                      <>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[6], padding: 4 },
                          ]}
                        >
                          {(item.gstRate || 0).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[7], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.igst || 0)}
                        </Text>
                      </>
                    ) : showCGSTSGST ? (
                      <>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[6], padding: 4 },
                          ]}
                        >
                          {((item.gstRate || 0) / 2).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[7], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.cgst || 0)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[8], padding: 4 },
                          ]}
                        >
                          {((item.gstRate || 0) / 2).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[9], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.sgst || 0)}
                        </Text>
                      </>
                    ) : null}

                    <Text
                      style={[
                        template21Styles.tableCell,
                        {
                          width: colWidths[totalColumnIndex],
                          fontWeight: "bold",
                          borderRightWidth: 0,
                          padding: 4,
                        },
                      ]}
                    >
                      {formatCurrency(item.total || 0)}
                    </Text>
                  </View>
                );
              })}

              {/* Total Row (Last Page Only) */}
              {isLastPage && (
                <View
                  style={[
                    template21Styles.tableRow,
                    { backgroundColor: LIGHT_GRAY, borderBottomWidth: 0 },
                  ]}
                >
                  {/* Left part for Total Items / Qty */}
                  <Text
                    style={[
                      template21Styles.tableCell,
                      template21Styles.tableCellLeft,
                      {
                        width:
                          calculateTotalLabelWidth() -
                          colWidths[4] -
                          colWidths[5],
                        fontWeight: "bold",
                        paddingLeft: 3,
                        borderRightWidth: 0.5,
                      },
                    ]}
                  >
                    Total Items / Qty: {totalItems} / {totalQty.toFixed(2)}
                  </Text>
                  {/* Taxable Value Label/Amount */}
                  <Text
                    style={[
                      template21Styles.tableCell,
                      {
                        width: colWidths[4] + colWidths[5],
                        fontWeight: "bold",
                        textAlign: "right",
                        paddingRight: 5,
                        borderRightWidth: isGSTApplicable ? 0.5 : 0,
                      },
                    ]}
                  >
                    Taxable Total:
                  </Text>
                  <Text
                    style={[
                      template21Styles.tableCell,
                      {
                        width: colWidths[totalColumnIndex],
                        fontWeight: "bold",
                        borderRightWidth: 0,
                      },
                    ]}
                  >
                    {formatCurrency(totalTaxable)}
                  </Text>
                </View>
              )}
            </View>

            {/* --- Footer and Totals (Last page only) --- */}
            {isLastPage && (
              <>
                {/* Tax Summary Totals (Just showing a simple total) */}
                <View style={[template21Styles.amountInWords]}>
                  <Text style={template21Styles.boldText}>
                    GRAND TOTAL: {formatCurrency(totalAmount)}
                  </Text>
                </View>

                {/* Amount in Words */}
                <View style={template21Styles.amountInWords}>
                  <Text>
                    Total Amount (in words):{" "}
                    <Text style={template21Styles.boldText}>
                      {amountInWords}
                    </Text>
                  </Text>
                </View>

                {/* --- Tax Summary Table (HSN Wise) --- */}
                {isGSTApplicable && taxSummaryArray.length > 0 && (
                  <View style={template21Styles.taxSummaryTable}>
                    {/* Tax Header */}
                    <View style={template21Styles.taxHeader}>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 100,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        HSN/SAC
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 150,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        Taxable Value
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 50,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        %
                      </Text>
                      {showIGST ? (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 120,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            IGST
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 135, borderRightWidth: 0 },
                            ]}
                          >
                            Total
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 90,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            CGST
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 90,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            SGST
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 75, borderRightWidth: 0 },
                            ]}
                          >
                            Total
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Tax Rows */}
                    {taxSummaryArray.map((summary, index) => (
                      <View
                        key={index}
                        style={[
                          template21Styles.taxRow,
                          index === taxSummaryArray.length - 1
                            ? { borderBottomWidth: 0 }
                            : {},
                        ]}
                      >
                        <Text
                          style={[
                            template21Styles.taxCell,
                            { width: 100, textAlign: "center" },
                          ]}
                        >
                          {summary.hsn}
                        </Text>
                        <Text
                          style={[template21Styles.taxCell, { width: 150 }]}
                        >
                          {formatCurrency(summary.taxableValue)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.taxCell,
                            { width: 50, textAlign: "center" },
                          ]}
                        >
                          {summary.rate.toFixed(2)}
                        </Text>
                        {showIGST ? (
                          <>
                            <Text
                              style={[template21Styles.taxCell, { width: 120 }]}
                            >
                              {formatCurrency(summary.igst)}
                            </Text>
                            <Text
                              style={[
                                template21Styles.taxCell,
                                { width: 135, borderRightWidth: 0 },
                              ]}
                            >
                              {formatCurrency(summary.total)}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text
                              style={[template21Styles.taxCell, { width: 90 }]}
                            >
                              {formatCurrency(summary.cgst)}
                            </Text>
                            <Text
                              style={[template21Styles.taxCell, { width: 90 }]}
                            >
                              {formatCurrency(summary.sgst)}
                            </Text>
                            <Text
                              style={[
                                template21Styles.taxCell,
                                { width: 75, borderRightWidth: 0 },
                              ]}
                            >
                              {formatCurrency(summary.total)}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}

                    {/* Tax Total Row */}
                    <View
                      style={[
                        template21Styles.taxRow,
                        { backgroundColor: LIGHT_GRAY, borderBottomWidth: 0 },
                      ]}
                    >
                      <Text
                        style={[
                          template21Styles.taxCell,
                          { width: 100, fontWeight: "bold", textAlign: "left" },
                        ]}
                      >
                        Total Tax
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          { width: 150, fontWeight: "bold" },
                        ]}
                      >
                        {formatCurrency(totalTaxable)}
                      </Text>
                      <Text style={[template21Styles.taxCell, { width: 50 }]}>
                        {" "}
                      </Text>
                      {showIGST ? (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 120, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 135,
                                fontWeight: "bold",
                                borderRightWidth: 0,
                              },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 90, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalCGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 90, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalSGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 75,
                                fontWeight: "bold",
                                borderRightWidth: 0,
                              },
                            ]}
                          >
                            {formatCurrency(totalCGST + totalSGST)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* --- Footer Section (QR, Bank, Signature) --- */}
                <View style={template21Styles.qrBankSection}>
                  {/* QR Code Block */}
                  <View style={template21Styles.qrBlock}>
                    <Text style={template21Styles.sectionTitle}>
                      Pay using UPI:
                    </Text>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderWidth: 0.5,
                        borderColor: "#999",
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 3,
                      }}
                    >
                      <Text style={{ fontSize: 6, color: "#999" }}>
                        QR Code
                      </Text>
                    </View>
                  </View>

                  {/* Bank Details Block */}
                  <View style={template21Styles.bankBlock}>
                    <Text style={template21Styles.sectionTitle}>
                      Bank Details:
                    </Text>
                    <View style={{ marginTop: 2 }}>
                      {bankData?.bankName && (
                        <View style={template21Styles.bankRow}>
                          <Text style={template21Styles.bankLabel}>Name:</Text>
                          <Text style={template21Styles.smallText}>
                            {bankData.bankName}
                          </Text>
                        </View>
                      )}
                      {bankData?.branchAddress && (
                        <View style={template21Styles.bankRow}>
                          <Text style={template21Styles.bankLabel}>
                            Branch:
                          </Text>
                          <Text style={template21Styles.smallText}>
                            {bankData.branchAddress}
                          </Text>
                        </View>
                      )}
                      {bankData?.accountNumber && (
                        <View style={template21Styles.bankRow}>
                          <Text style={template21Styles.bankLabel}>
                            Acc. Number:
                          </Text>
                          <Text style={template21Styles.smallText}>
                            {bankData.accountNumber}
                          </Text>
                        </View>
                      )}
                      {bankData?.ifscCode && (
                        <View style={template21Styles.bankRow}>
                          <Text style={template21Styles.bankLabel}>IFSC:</Text>
                          <Text style={template21Styles.smallText}>
                            {bankData.ifscCode}
                          </Text>
                        </View>
                      )}
                      {bankData?.upiId && (
                        <View style={template21Styles.bankRow}>
                          <Text style={template21Styles.bankLabel}>
                            UPI ID:
                          </Text>
                          <Text style={template21Styles.smallText}>
                            {bankData.upiId}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Signature Block */}
                  <View style={template21Styles.signatureBlock}>
                    <Text
                      style={[
                        template21Styles.sectionTitle,
                        { textAlign: "center", fontSize: 7 },
                      ]}
                    >
                      For {companyName}
                    </Text>

                    <View
                      style={{
                        height: 40,
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Signature image placeholder */}
                    </View>

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: BORDER_COLOR,
                        width: "100%",
                        paddingTop: 2,
                      }}
                    >
                      <Text style={{ fontSize: 6, textAlign: "center" }}>
                        Authorised Signatory
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Terms and Conditions Section */}
                <View style={template21Styles.termsSection}>
                  <Text
                    style={[template21Styles.sectionTitle, { marginBottom: 2 }]}
                  >
                    {termsTitle}
                  </Text>
                  {termsItems.map((item, index) => (
                    <Text key={index} style={template21Styles.termsText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </>
            )}
            {/* Page Number */}
            <Text
              style={{
                position: "absolute",
                bottom: 5,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 7,
                color: "#666",
              }}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages} Page`
              }
            />
          </Page>
        );
      })}
    </Document>
  );
};

// --- PDF Generation Function (Export) ---

export const generatePdfForTemplate21 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template21PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};
