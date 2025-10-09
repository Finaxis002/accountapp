// pdf-templateA5.tsx
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Client,
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
  deriveTotals,
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  getItemsBody,
  calculateGST,
  getUnifiedLines,
  prepareTemplate8Data,
  getStateCode,
  numberToWords,
  getHsnSummary,
} from "./pdf-utils";
import { capitalizeWords } from "./utils";

import { template1Styles } from "./pdf-template-styles";
const getClientName = (client: any) => {
  if (!client) return "Client Name";
  if (typeof client === "string") return client;
  return client.companyName || client.contactName || "Client Name";
};
console.log("client name", getClientName);

const logo = "/assets/invoice-logos/R.png";

interface TemplateA5PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

const Template1: React.FC<TemplateA5PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
  client,
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

  // For IGST (Interstate)
  const colWidthsIGST = ["4%", "25%", "10%", "8%", "10%", "15%", "20%", "12%"];
  const totalColumnIndexIGST = 7;

  const itemsPerPage = 30;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }
  // For CGST/SGST (Intrastate)
  const colWidthsCGSTSGST = [
    "4%",
    "20%",
    "10%",
    "8%",
    "10%",
    "12%",
    "13%",
    "13%",
    "20%",
  ];
  const totalColumnIndexCGSTSGST = 8;

  // For No Tax
  const colWidthsNoTax = ["4%", "25%", "10%", "8%", "10%", "15%", "20%"];
  const totalColumnIndexNoTax = 6;

  // Use based on condition
  const colWidths = showIGST
    ? colWidthsIGST
    : showCGSTSGST
    ? colWidthsCGSTSGST
    : colWidthsNoTax;
  const totalColumnIndex = showIGST
    ? totalColumnIndexIGST
    : showCGSTSGST
    ? totalColumnIndexCGSTSGST
    : totalColumnIndexNoTax;

  // Calculate table width in points (A5: 420pt width, padding 20pt each side, section border 1.5pt each side)
  const tableWidth = showCGSTSGST ? 491 : showIGST ? 520 : 540;

  // Calculate vertical border positions
  const borderPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    cumulative += parseFloat(colWidths[i]);
    borderPositions.push((cumulative / 100) * tableWidth);
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A4" style={template1Styles.page}>
            {/* Header */}
            <View style={template1Styles.header}>
              <View style={template1Styles.headerLeft}>
                <Image
                  src="/assets/invoice-logos/R.png"
                  style={template1Styles.logo}
                />
              </View>
              <View style={template1Styles.headerRight}>
                <Text style={template1Styles.companyName}>
                  {capitalizeWords(company?.businessName ||
                    company?.companyName ||
                    "Company Name")}
                </Text>
                <Text style={template1Styles.address}>
                  {capitalizeWords([
                    company?.address,
                    company?.City,
                    company?.addressState,
                    company?.Country,
                    company?.Pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address Line 1")}
                </Text>
                <View style={template1Styles.contactInfo}>
                  <Text style={template1Styles.contactLabel}>Name : </Text>
                  <Text style={template1Styles.contactValue}>
                    {capitalizeWords(getClientName(client))}
                  </Text>
                  <Text style={template1Styles.contactLabel}> | Phone : </Text>
                  <Text style={template1Styles.contactValue}>
                    {company?.mobileNumber || company?.Telephone || "Phone"}
                  </Text>
                </View>
              </View>
            </View>
            {/* Body - Items Table */}
            <View style={template1Styles.section}>
              {/* table header  */}
              <View style={template1Styles.tableHeader}>
                {company?.gstin && (
                  <View style={template1Styles.gstRow}>
                    <Text style={template1Styles.gstLabel}>GSTIN : </Text>
                    <Text style={template1Styles.gstValue}>
                      {"-"}
                      {company.gstin}
                      {"-"}
                    </Text>
                  </View>
                )}

                <View style={template1Styles.invoiceTitleRow}>
                  <Text style={template1Styles.invoiceTitle}>TAX INVOICE</Text>
                </View>

                <View style={template1Styles.recipientRow}>
                  <Text style={template1Styles.recipientText}>
                    ORIGINAL FOR RECIPIENT
                  </Text>
                </View>
              </View>
              {/* table three columns */}
              <View style={template1Styles.threeColSection}>
                {/* Column 1 - Details of Buyer */}
                <View style={[template1Styles.column, { borderLeft: "none" }]}>
                  <View style={template1Styles.columnHeader}>
                    <Text style={template1Styles.threecoltableHeader}>
                      Details of Buyer | Billed to:
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Name</Text>
                    <Text style={template1Styles.tableValue}>
                      {capitalizeWords(party?.name || "N/A")}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Address</Text>
                    <Text style={template1Styles.tableValue}>
                      {capitalizeWords(getBillingAddress(party))}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Phone</Text>
                    <Text style={template1Styles.tableValue}>
                      {party?.contactNumber || "-"}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>GSTIN</Text>
                    <Text style={template1Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>PAN</Text>
                    <Text style={template1Styles.tableValue}>
                      {party?.pan || "-"}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>
                      Place of Supply
                    </Text>
                    <Text style={template1Styles.tableValue}>
                      {party?.state
                        ? `${party.state} (${getStateCode(party.state) || "-"})`
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* Column 2 - Details of Consigned */}
                <View style={template1Styles.column}>
                  <View style={template1Styles.columnHeader}>
                    <Text style={template1Styles.threecoltableHeader}>
                      Details of Consigned | Shipped to:
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Name</Text>
                    <Text style={template1Styles.tableValue}>
                      {capitalizeWords(shippingAddress?.label || party?.name || "N/A")}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Address</Text>
                    <Text style={template1Styles.tableValue}>
                      {capitalizeWords(getShippingAddress(
                        shippingAddress,
                        getBillingAddress(party)
                      ))}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Country</Text>
                    <Text style={template1Styles.tableValue}>India</Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>Phone</Text>
                    <Text style={template1Styles.tableValue}>
                      {shippingAddress?.contactNumber ||
                        party?.contactNumber ||
                        "-"}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>GSTIN</Text>
                    <Text style={template1Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={template1Styles.dataRow}>
                    <Text style={template1Styles.tableLabel}>State</Text>
                    <Text style={template1Styles.tableValue}>
                      {shippingAddress?.state
                        ? `${shippingAddress.state} (${
                            getStateCode(shippingAddress.state) || "-"
                          })`
                        : party?.state
                        ? `${party.state} (${getStateCode(party.state) || "-"})`
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* Column 3 - Invoice Details */}
                <View style={[template1Styles.column, { borderRight: "none" }]}>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}>Invoice No.</Text>
                    <Text style={template1Styles.tableValue}>
                      {transaction.invoiceNumber || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}>Invoice Date</Text>
                    <Text style={template1Styles.tableValue}>
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}>Due Date</Text>
                    <Text style={template1Styles.tableValue}>
                      {new Date(transaction.dueDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}>P.O. No.</Text>
                    <Text style={template1Styles.tableValue}>
                      {transaction.voucher || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}>E-Way No.</Text>
                    <Text style={template1Styles.tableValue}>
                      {transaction.referenceNumber || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}></Text>
                    <Text style={template1Styles.tableValue}></Text>
                  </View>
                  <View
                    style={[
                      template1Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={template1Styles.tableLabel}></Text>
                    <Text style={template1Styles.tableValue}></Text>
                  </View>
                </View>
              </View>
              {/* Items Table */}
              <View style={template1Styles.tableContainer}>
                <View style={template1Styles.itemsTable}>
                  {/* Table Header */}
                  <View style={template1Styles.itemsTableHeader}>
                    <Text
                      style={[
                        template1Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        template1Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        template1Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        template1Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        template1Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate
                    </Text>
                    <Text
                      style={[
                        template1Styles.taxableHeader,
                        { width: colWidths[5] },
                      ]}
                    >
                      Taxable Value
                    </Text>

                    {/* Dynamic GST columns */}
                    {showIGST ? (
                      // Interstate - Show IGST columns
                      <View
                        style={[
                          template1Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={template1Styles.igstMainHeader}>IGST</Text>
                        <View style={template1Styles.igstSubHeader}>
                          <Text
                            style={[
                              template1Styles.igstSubPercentage,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={template1Styles.igstSubText}>
                            Amount
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            template1Styles.igstHeader,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={template1Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View style={template1Styles.igstSubHeader}>
                            <Text
                              style={[
                                template1Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={template1Styles.igstSubText}>
                              Amount
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            template1Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={template1Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={template1Styles.igstSubHeader}>
                            <Text
                              style={[
                                template1Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={template1Styles.igstSubText}>
                              Amount
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        template1Styles.totalHeader,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      Total
                    </Text>
                  </View>

                  {pageItems.map((item, index) => (
                    <View key={index} style={template1Styles.itemsTableRow}>
                      <Text
                        style={[
                          template1Styles.srNoCell,
                          { width: colWidths[0] },
                        ]}
                      >
                        {pageIndex * itemsPerPage + index + 1}
                      </Text>
                      <Text
                        style={[
                          template1Styles.productCell,
                          { width: colWidths[1] },
                        ]}
                      >
                        {capitalizeWords(item.name)}
                      </Text>
                      <Text
                        style={[
                          template1Styles.hsnCell,
                          { width: colWidths[2] },
                        ]}
                      >
                        {item.code || "-"}
                      </Text>
                      <Text
                        style={[
                          template1Styles.qtyCell,
                          { width: colWidths[3] },
                        ]}
                      >
                        {item.quantity || 0} {item.unit}
                      </Text>
                      <Text
                        style={[
                          template1Styles.rateCell,
                          { width: colWidths[4] },
                        ]}
                      >
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                      <Text
                        style={[
                          template1Styles.taxableCell,
                          { width: colWidths[5] },
                        ]}
                      >
                        {formatCurrency(item.taxableValue)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            template1Styles.igstCell,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={template1Styles.igstPercent}>
                            {item.gstRate}
                          </Text>
                          <Text style={template1Styles.igstAmount}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              template1Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={template1Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={template1Styles.igstAmount}>
                              {formatCurrency(item.cgst)}
                            </Text>
                          </View>
                          <View
                            style={[
                              template1Styles.igstCell,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={template1Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={template1Styles.igstAmount}>
                              {formatCurrency(item.sgst)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          template1Styles.totalCell,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}

                  {isLastPage && (
                    <View style={template1Styles.itemsTableTotalRow}>
                      <Text
                        style={[
                          template1Styles.totalLabel,
                          { width: colWidths[0] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          { width: colWidths[1] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          {
                            width: colWidths[2],
                            borderRight: "1px solid #0371C1",
                          },
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          template1Styles.totalQty,
                          {
                            width: colWidths[3],
                            borderRight: "1px solid #0371C1",
                          },
                        ]}
                      >
                        {totalQty.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          { width: colWidths[4] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalTaxable,
                          {
                            width: colWidths[5],
                            borderRight: "1px solid #0371C1",
                            borderLeft: "1px solid #0371C1",
                          },
                        ]}
                      >
                        {formatCurrency(totalTaxable)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            template1Styles.igstTotal,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text
                            style={[
                              template1Styles.totalEmpty,
                              { width: "30%" },
                            ]}
                          ></Text>
                          <Text
                            style={[
                              template1Styles.totalIgstAmount,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              template1Styles.igstTotal,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text
                              style={[
                                template1Styles.totalEmpty,
                                { width: "30%" },
                              ]}
                            ></Text>
                            <Text style={[template1Styles.totalIgstAmount]}>
                              {formatCurrency(totalCGST)}
                            </Text>
                          </View>
                          <View
                            style={[
                              template1Styles.igstTotal,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text
                              style={[
                                template1Styles.totalEmpty,
                                { width: "30%" },
                              ]}
                            ></Text>
                            <Text
                              style={[
                                template1Styles.totalIgstAmount,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              {formatCurrency(totalSGST)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          template1Styles.grandTotal,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(totalAmount)}
                      </Text>
                    </View>
                  )}

                  {/* Vertical borders */}
                  {borderPositions.map((pos, index) => (
                    <View
                      key={index}
                      style={[template1Styles.verticalBorder, { left: pos }]}
                    />
                  ))}
                </View>
              </View>

              {isLastPage && (
                <>
                  <View
                    style={[
                      template1Styles.bottomSection,
                      { flexDirection: "column" },
                    ]}
                  >
                    <Text style={template1Styles.totalInWords}>
                      Total in words : {numberToWords(totalAmount)}
                    </Text>
                    {/* HSN/SAC Tax Table */}
                    {isGSTApplicable && (
                      <View style={template1Styles.hsnTaxTable}>
                        {/* Define specific column widths for HSN table */}
                        {(() => {
                          // Define column widths specifically for HSN table
                          const hsnColWidths = showIGST
                            ? ["25%", "20%", "30%", "25%"] // HSN, Taxable Value, IGST, Total
                            : showCGSTSGST
                            ? ["18%", "20%", "22%", "22%", "20%"] // HSN, Taxable Value, CGST, SGST, Total
                            : ["40%", "30%", "30%"]; // HSN, Taxable Value, Total (No Tax)

                          const hsnTotalColumnIndex = showIGST
                            ? 3
                            : showCGSTSGST
                            ? 4
                            : 2;

                          return (
                            <>
                              {/* Table Header */}
                              <View
                                style={template1Styles.hsnTaxTableHeader}
                              >
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  HSN / SAC
                                </Text>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    { width: hsnColWidths[1] },
                                  ]}
                                >
                                  Taxable Value
                                </Text>

                                {/* Dynamic GST columns */}
                                {showIGST ? (
                                  // Interstate - Show IGST columns
                                  <View
                                    style={[
                                      template1Styles.igstHeader,
                                      { width: hsnColWidths[2] },
                                    ]}
                                  >
                                    <Text
                                      style={template1Styles.igstMainHeader}
                                    >
                                      IGST
                                    </Text>
                                    <View
                                      style={template1Styles.igstSubHeader}
                                    >
                                      <Text
                                        style={[
                                          template1Styles.igstSubPercentage,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        %
                                      </Text>
                                      <Text
                                        style={template1Styles.igstSubText}
                                      >
                                        Amount
                                      </Text>
                                    </View>
                                  </View>
                                ) : showCGSTSGST ? (
                                  // Intrastate - Show CGST/SGST columns separately
                                  <>
                                    <View
                                      style={[
                                        template1Styles.igstHeader,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          template1Styles.igstMainHeader
                                        }
                                      >
                                        CGST
                                      </Text>
                                      <View
                                        style={template1Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            template1Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={template1Styles.igstSubText}
                                        >
                                          Amount
                                        </Text>
                                      </View>
                                    </View>
                                    <View
                                      style={[
                                        template1Styles.igstHeader,
                                        { width: hsnColWidths[3] },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          template1Styles.igstMainHeader
                                        }
                                      >
                                        SGST
                                      </Text>
                                      <View
                                        style={template1Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            template1Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                              borderLeft: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={template1Styles.igstSubText}
                                        >
                                          Amount
                                        </Text>
                                      </View>
                                    </View>
                                  </>
                                ) : null}

                                {/* Total Column */}
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    {
                                      width: hsnColWidths[hsnTotalColumnIndex],
                                      borderLeft: "1px solid #0371C1",
                                      borderRight: "none",
                                    },
                                  ]}
                                >
                                  Total
                                </Text>
                              </View>

                              {/* Table Rows */}
                              {getHsnSummary(
                                itemsWithGST,
                                showIGST,
                                showCGSTSGST
                              ).map((hsnItem, index) => (
                                <View
                                  key={index}
                                  style={template1Styles.hsnTaxTableRow}
                                >
                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      { width: hsnColWidths[0] },
                                    ]}
                                  >
                                    {hsnItem.hsnCode}
                                  </Text>
                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      { width: hsnColWidths[1] },
                                    ]}
                                  >
                                    {formatCurrency(hsnItem.taxableValue)}
                                  </Text>

                                  {showIGST ? (
                                    <View
                                      style={[
                                        template1Styles.igstCell,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={template1Styles.igstPercent}
                                      >
                                        {hsnItem.taxRate}
                                      </Text>
                                      <Text
                                        style={template1Styles.igstAmount}
                                      >
                                        {formatCurrency(hsnItem.taxAmount)}
                                      </Text>
                                    </View>
                                  ) : showCGSTSGST ? (
                                    <>
                                      <View
                                        style={[
                                          template1Styles.igstCell,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                          { width: hsnColWidths[2] },
                                        ]}
                                      >
                                        <Text
                                          style={template1Styles.igstPercent}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={[
                                            template1Styles.igstAmount,
                                          ]}
                                        >
                                          {formatCurrency(hsnItem.cgstAmount)}
                                        </Text>
                                      </View>
                                      <View
                                        style={[
                                          template1Styles.igstCell,
                                          { width: hsnColWidths[3] },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            template1Styles.igstPercent,
                                          ]}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={template1Styles.igstAmount}
                                        >
                                          {formatCurrency(hsnItem.sgstAmount)}
                                        </Text>
                                      </View>
                                    </>
                                  ) : null}

                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      {
                                        width:
                                          hsnColWidths[hsnTotalColumnIndex],
                                        borderLeft: "1px solid #0371C1",
                                        borderRight: "none",
                                      },
                                    ]}
                                  >
                                    {formatCurrency(hsnItem.total)}
                                  </Text>
                                </View>
                              ))}

                              {/* Total Row */}
                              <View
                                style={template1Styles.hsnTaxTableTotalRow}
                              >
                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  Total
                                </Text>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[1] },
                                  ]}
                                >
                                  {formatCurrency(totalTaxable)}
                                </Text>

                                {showIGST ? (
                                  <View
                                    style={[
                                      template1Styles.igstTotal,
                                      { width: hsnColWidths[2] },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        template1Styles.totalEmpty,
                                        { width: "30%" },
                                      ]}
                                    ></Text>
                                    <Text
                                      style={[
                                        template1Styles.totalIgstAmount,
                                        // { borderRight: "1px solid #0371C1" },
                                      ]}
                                    >
                                      {formatCurrency(totalIGST)}
                                    </Text>
                                  </View>
                                ) : showCGSTSGST ? (
                                  <>
                                    <View
                                      style={[
                                        template1Styles.igstTotal,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          template1Styles.totalEmpty,
                                          { width: "30%" },
                                        ]}
                                      ></Text>
                                      <Text
                                        style={[
                                          template1Styles.totalIgstAmount,
                                        ]}
                                      >
                                        {formatCurrency(totalCGST)}
                                      </Text>
                                    </View>
                                    <View
                                      style={[
                                        template1Styles.igstTotal,
                                        { width: hsnColWidths[3] },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          template1Styles.totalEmpty,
                                          { width: "30%" },
                                        ]}
                                      ></Text>
                                      <Text
                                        style={[
                                          template1Styles.totalIgstAmount,
                                         
                                        ]}
                                      >
                                        {formatCurrency(totalSGST)}
                                      </Text>
                                    </View>
                                  </>
                                ) : null}

                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    {
                                      width: hsnColWidths[hsnTotalColumnIndex],
                                      borderRight: "none",
                                    },
                                  ]}
                                >
                                  {formatCurrency(totalAmount)}
                                </Text>
                              </View>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                  <View style={template1Styles.bottomSection}>
                    {/* Left Column: Total in words + Terms */}
                    <View style={template1Styles.leftSection}>
                     

                      {transaction?.notes ? (
                        (() => {
                          // Parse HTML notes
                          const notesHtml = transaction.notes;
                          const titleMatch = notesHtml.match(
                            /<span class="ql-size-large">(.*?)<\/span>/
                          );
                          const title = titleMatch
                            ? titleMatch[1].replace(/&/g, "&")
                            : "Terms and Conditions";

                          const listItems = [];
                          const liRegex = /<li[^>]*>(.*?)<\/li>/g;
                          let match;
                          while ((match = liRegex.exec(notesHtml)) !== null) {
                            // Strip HTML tags from item
                            const cleanItem = match[1]
                              .replace(/<[^>]*>/g, "")
                              .replace(/&/g, "&");
                            listItems.push(cleanItem);
                          }

                          return (
                            <View style={template1Styles.termsBox}>
                              <Text
                                style={[
                                  template1Styles.termLine,
                                  { fontWeight: "bold" },
                                ]}
                              >
                                {title}
                              </Text>
                              {listItems.map((item, index) => (
                                <Text
                                  key={index}
                                  style={template1Styles.termLine}
                                >
                                  • {item}
                                </Text>
                              ))}
                            </View>
                          );
                        })()
                      ) : (
                        <View style={template1Styles.termsBox}>
                          <Text style={template1Styles.termLine}>
                            No terms and conditions added yet
                          </Text>
                        </View>
                      )}

                      {/* QR Code + Label */}
                      {/* <View style={template1Styles.qrContainer}>
                               <Image src="/path/to/qr.png" style={template1Styles.qrImage} />
                               <Text style={template1Styles.qrText}>Pay using UPI</Text>
                             </View> */}
                    </View>

                    {/* Right Column: Totals */}
                    <View style={template1Styles.rightSection}>
                      <View style={template1Styles.totalRow}>
                        <Text style={template1Styles.label}>
                          Taxable Amount
                        </Text>
                        <Text style={template1Styles.value}>
                          {formatCurrency(totalTaxable)}
                        </Text>
                      </View>

                      {isGSTApplicable && (
                        <View style={template1Styles.totalRow}>
                          <Text style={template1Styles.label}>Total Tax</Text>
                          <Text style={template1Styles.value}>
                            {formatCurrency(
                              showIGST ? totalIGST : totalCGST + totalSGST
                            )}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          template1Styles.totalRow,
                          isGSTApplicable ? template1Styles.highlightRow : {},
                        ]}
                      >
                        <Text
                          style={
                            isGSTApplicable
                              ? template1Styles.labelBold
                              : template1Styles.label
                          }
                        >
                          {isGSTApplicable
                            ? "Total Amount After Tax"
                            : "Total Amount"}
                        </Text>
                        <Text
                          style={
                            isGSTApplicable
                              ? template1Styles.valueBold
                              : template1Styles.value
                          }
                        >
                          {/* <Text style={template1Styles.currencySymbol}></Text> */}
                          {formatCurrency(totalAmount)}
                        </Text>
                      </View>

                      <View style={template1Styles.totalRow}>
                        <Text style={template1Styles.label}>
                          For{"-"}
                          {capitalizeWords(company?.businessName ||
                            company?.companyName ||
                            "Company Name")}
                        </Text>
                        <Text style={template1Styles.value}>(E & O.E.)</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
            {/* Page Number */}
            <Text style={template1Styles.pageNumber}>
              {pageIndex + 1} / {pages.length} page
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export const generatePdfForTemplate1 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template1
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

export default Template1;
