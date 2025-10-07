// pdf-templateA5-3.tsx
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

import { templateA5_3Styles } from "./pdf-template-styles";
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

const TemplateA5_3PDF: React.FC<TemplateA5PDFProps> = ({
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

  const itemsPerPage = 10;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }
  // For CGST/SGST (Intrastate)
  const colWidthsCGSTSGST = [
    "4%",
    "20%",
    "15%",
    "8%",
    "10%",
    "12%",
    "12%",
    "15%",
    "18%",
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
  const tableWidth = showCGSTSGST ? 330 : showIGST ? 362 : 375;

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
          <Page key={pageIndex} size="A5" style={templateA5_3Styles.page}>
            {/* Header */}
            <View style={templateA5_3Styles.header}>
              <View style={templateA5_3Styles.headerLeft}>
                <Image
                  src="/assets/invoice-logos/R.png"
                  style={templateA5_3Styles.logo}
                />
              </View>
              <View style={templateA5_3Styles.headerRight}>
                <Text style={templateA5_3Styles.companyName}>
                  {company?.businessName ||
                    company?.companyName ||
                    "Company Name"}
                </Text>
                <Text style={[templateA5_3Styles.address, { width: "60%" }]}>
                  {[
                    company?.address,
                    company?.City,
                    company?.addressState,
                    company?.Country,
                    company?.Pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address Line 1"}
                </Text>
                <View style={templateA5_3Styles.contactInfo}>
                  <Text style={templateA5_3Styles.contactLabel}>Name : </Text>
                  <Text style={templateA5_3Styles.contactValue}>
                    {getClientName(client)}
                  </Text>
                  <Text style={templateA5_3Styles.contactLabel}>
                    {" "}
                    | Phone :{" "}
                  </Text>
                  <Text style={templateA5_3Styles.contactValue}>
                    {company?.mobileNumber || company?.Telephone || "Phone"}
                  </Text>
                </View>
              </View>
            </View>
            {/* Body - Items Table */}
            <View style={templateA5_3Styles.section}>
              {/* table header  */}
              <View style={templateA5_3Styles.tableHeader}>
                {company?.gstin && (
                  <View style={templateA5_3Styles.gstRow}>
                    <Text style={templateA5_3Styles.gstLabel}>GSTIN : </Text>
                    <Text style={templateA5_3Styles.gstValue}>
                      {" "}
                      {company.gstin}{" "}
                    </Text>
                  </View>
                )}

                <View style={templateA5_3Styles.invoiceTitleRow}>
                  <Text style={templateA5_3Styles.invoiceTitle}>
                    TAX INVOICE
                  </Text>
                </View>

                <View style={templateA5_3Styles.recipientRow}>
                  <Text style={templateA5_3Styles.recipientText}>
                    ORIGINAL FOR RECIPIENT
                  </Text>
                </View>
              </View>
              {/* table three columns */}
              <View style={templateA5_3Styles.threeColSection}>
                {/* Column 1 - Details of Buyer */}
                <View
                  style={[templateA5_3Styles.column, { borderLeft: "none" }]}
                >
                  <View style={templateA5_3Styles.columnHeader}>
                    <Text style={templateA5_3Styles.threecoltableHeader}>
                      Details of Buyer | Billed to:
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Name</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Address</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {getBillingAddress(party)}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.contactNumber || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>PAN</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.pan || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>
                      Place of Supply
                    </Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.state
                        ? `${party.state} (${getStateCode(party.state) || "-"})`
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* Column 2 - Details of Consigned */}
                <View style={templateA5_3Styles.column}>
                  <View style={templateA5_3Styles.columnHeader}>
                    <Text style={templateA5_3Styles.threecoltableHeader}>
                      Details of Consigned | Shipped to:
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Name</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {shippingAddress?.label || party?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Address</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {getShippingAddress(
                        shippingAddress,
                        getBillingAddress(party)
                      )}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Country</Text>
                    <Text style={templateA5_3Styles.tableValue}>India</Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {shippingAddress?.contactNumber ||
                        party?.contactNumber ||
                        "-"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_3Styles.dataRow}>
                    <Text style={templateA5_3Styles.tableLabel}>State</Text>
                    <Text style={templateA5_3Styles.tableValue}>
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
                <View
                  style={[templateA5_3Styles.column, { borderRight: "none" }]}
                >
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}>
                      Invoice No.
                    </Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {transaction.invoiceNumber || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}>
                      Invoice Date
                    </Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}>Due Date</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {new Date(transaction.dueDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}>P.O. No.</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {transaction.voucher || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}>E-Way No.</Text>
                    <Text style={templateA5_3Styles.tableValue}>
                      {transaction.referenceNumber || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}></Text>
                    <Text style={templateA5_3Styles.tableValue}></Text>
                  </View>
                  <View
                    style={[
                      templateA5_3Styles.dataRow,
                      { display: "flex" },
                    ]}
                  >
                    <Text style={templateA5_3Styles.tableLabel}></Text>
                    <Text style={templateA5_3Styles.tableValue}></Text>
                  </View>
                </View>
              </View>
              {/* Items Table */}
              <View style={templateA5_3Styles.tableContainer}>
                {/* Vertical borders */}
                {borderPositions.map((pos, index) => (
                  <View
                    key={index}
                    style={[templateA5_3Styles.verticalBorder, { left: pos }]}
                  />
                ))}

                <View style={templateA5_3Styles.itemsTable}>
                  {/* Table Header */}
                  <View style={templateA5_3Styles.itemsTableHeader}>
                    <Text
                      style={[
                        templateA5_3Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.taxableHeader,
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
                          templateA5_3Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={templateA5_3Styles.igstMainHeader}>
                          IGST
                        </Text>
                        <View style={templateA5_3Styles.igstSubHeader}>
                          <Text
                            style={[
                              templateA5_3Styles.igstSubPercentage,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={templateA5_3Styles.igstSubText}>
                            Amount
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            templateA5_3Styles.igstHeader,
                            { width: colWidths[6] },
                            // { borderRight: "1px solid #0371C1" },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View style={templateA5_3Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_3Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_3Styles.igstSubText}>
                              Amount
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            templateA5_3Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={templateA5_3Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_3Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_3Styles.igstSubText}>
                              Amount
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        templateA5_3Styles.totalHeader,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      Total
                    </Text>
                  </View>

                  {pageItems.map((item, index) => (
                    <View key={index} style={templateA5_3Styles.itemsTableRow}>
                      <Text
                        style={[
                          templateA5_3Styles.srNoCell,
                          { width: colWidths[0] },
                        ]}
                      >
                        {pageIndex * itemsPerPage + index + 1}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.productCell,
                          { width: colWidths[1] },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.hsnCell,
                          { width: colWidths[2] },
                        ]}
                      >
                        {item.code || "-"}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.qtyCell,
                          { width: colWidths[3] },
                        ]}
                      >
                        {item.quantity || 0} {item.unit}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.rateCell,
                          { width: colWidths[4] },
                        ]}
                      >
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.taxableCell,
                          { width: colWidths[5] },
                        ]}
                      >
                        {formatCurrency(item.taxableValue)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            templateA5_3Styles.igstCell,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstPercent}>
                            {item.gstRate}
                          </Text>
                          <Text style={templateA5_3Styles.igstAmount}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              templateA5_3Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={templateA5_3Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_3Styles.igstAmount}>
                              {formatCurrency(item.cgst)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5_3Styles.igstCell,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={templateA5_3Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_3Styles.igstAmount}>
                              {formatCurrency(item.sgst)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5_3Styles.totalCell,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}
                </View>

                {isLastPage && (
                  <View style={templateA5_3Styles.itemsTableTotalRow}>
                    <Text
                      style={[
                        templateA5_3Styles.totalLabel,
                        { width: colWidths[0] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        { width: colWidths[1] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        {
                          width: colWidths[2],
                          // borderRight: "1px solid #0371C1",
                        },
                      ]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalQty,
                        {
                          width: colWidths[3],
                          // borderRight: "1px solid #0371C1",
                        },
                      ]}
                    >
                      {totalQty.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        { width: colWidths[4] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalTaxable,
                        {
                          width: colWidths[5],
                          // borderRight: "1px solid #0371C1",
                          // borderLeft: "1px solid #0371C1",
                        },
                      ]}
                    >
                      {formatCurrency(totalTaxable)}
                    </Text>
                    {showIGST ? (
                      <View
                        style={[
                          templateA5_3Styles.igstTotal,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text
                          style={[
                            templateA5_3Styles.totalEmpty,
                            { width: "30%" },
                          ]}
                        ></Text>
                        <Text
                          style={[
                            templateA5_3Styles.totalIgstAmount,
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
                            templateA5_3Styles.igstTotal,
                            { width: colWidths[6] },
                          ]}
                        >
                          
                          <Text style={[templateA5_3Styles.totalIgstAmount]}>
                            {formatCurrency(totalCGST)}
                          </Text>
                        </View>
                        <View
                          style={[
                            templateA5_3Styles.igstTotal,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text
                            style={[
                              templateA5_3Styles.totalEmpty,
                             
                            ]}
                          ></Text>
                          <Text
                            style={[
                              templateA5_3Styles.totalIgstAmount,
                              // { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            {formatCurrency(totalSGST)}
                          </Text>
                        </View>
                      </>
                    ) : null}
                    <Text
                      style={[
                        templateA5_3Styles.grandTotal,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      {formatCurrency(totalAmount)}
                    </Text>
                  </View>
                )}
              </View>

              {isLastPage && (
                <>
                  <View style={[templateA5_3Styles.bottomSection,{flexDirection:"column"}]}>
                    <Text style={templateA5_3Styles.totalInWords}>
                      Total in words : {numberToWords(totalAmount)}
                    </Text>
                    {/* HSN/SAC Tax Table */}
                    {isGSTApplicable && (
                      <View style={templateA5_3Styles.hsnTaxTable}>
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
                                style={templateA5_3Styles.hsnTaxTableHeader}
                              >
                                <Text
                                  style={[
                                    templateA5_3Styles.hsnTaxHeaderCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  HSN / SAC
                                </Text>
                                <Text
                                  style={[
                                    templateA5_3Styles.hsnTaxHeaderCell,
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
                                      templateA5_3Styles.igstHeader,
                                      { width: hsnColWidths[2] },
                                    ]}
                                  >
                                    <Text
                                      style={templateA5_3Styles.igstMainHeader}
                                    >
                                      IGST
                                    </Text>
                                    <View
                                      style={templateA5_3Styles.igstSubHeader}
                                    >
                                      <Text
                                        style={[
                                          templateA5_3Styles.igstSubPercentage,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        %
                                      </Text>
                                      <Text
                                        style={templateA5_3Styles.igstSubText}
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
                                        templateA5_3Styles.igstHeader,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          templateA5_3Styles.igstMainHeader
                                        }
                                      >
                                        CGST
                                      </Text>
                                      <View
                                        style={templateA5_3Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            templateA5_3Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={templateA5_3Styles.igstSubText}
                                        >
                                          Amount
                                        </Text>
                                      </View>
                                    </View>
                                    <View
                                      style={[
                                        templateA5_3Styles.igstHeader,
                                        { width: hsnColWidths[3] },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          templateA5_3Styles.igstMainHeader
                                        }
                                      >
                                        SGST
                                      </Text>
                                      <View
                                        style={templateA5_3Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            templateA5_3Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                              borderLeft: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={templateA5_3Styles.igstSubText}
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
                                    templateA5_3Styles.hsnTaxHeaderCell,
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
                                  style={templateA5_3Styles.hsnTaxTableRow}
                                >
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxCell,
                                      { width: hsnColWidths[0] },
                                    ]}
                                  >
                                    {hsnItem.hsnCode}
                                  </Text>
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxCell,
                                      { width: hsnColWidths[1] },
                                    ]}
                                  >
                                    {formatCurrency(hsnItem.taxableValue)}
                                  </Text>

                                  {showIGST ? (
                                    <View
                                      style={[
                                        templateA5_3Styles.igstCell,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={templateA5_3Styles.igstPercent}
                                      >
                                        {hsnItem.taxRate}
                                      </Text>
                                      <Text
                                        style={templateA5_3Styles.igstAmount}
                                      >
                                        {formatCurrency(hsnItem.taxAmount)}
                                      </Text>
                                    </View>
                                  ) : showCGSTSGST ? (
                                    <>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstCell,
                                          {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          { width: hsnColWidths[2] },
                                        ]}
                                      >
                                        <Text
                                          style={templateA5_3Styles.igstPercent}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={[
                                            templateA5_3Styles.igstAmount,
                                            
                                          ]}
                                        >
                                          {formatCurrency(hsnItem.cgstAmount)}
                                        </Text>
                                      </View>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstCell,
                                          { width: hsnColWidths[3] },
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            templateA5_3Styles.igstPercent,
                                          ]}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={templateA5_3Styles.igstAmount}
                                        >
                                          {formatCurrency(hsnItem.sgstAmount)}
                                        </Text>
                                      </View>
                                    </>
                                  ) : null}

                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxCell,
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
                                style={templateA5_3Styles.hsnTaxTableTotalRow}
                              >
                                <Text
                                  style={[
                                    templateA5_3Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  Total
                                </Text>
                                <Text
                                  style={[
                                    templateA5_3Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[1] },
                                  ]}
                                >
                                  {formatCurrency(totalTaxable)}
                                </Text>

                                {showIGST ? (
                                  <View
                                    style={[
                                      templateA5_3Styles.igstTotal,
                                      { width: hsnColWidths[2] },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        templateA5_3Styles.totalEmpty,
                                        { width: "30%" },
                                      ]}
                                    ></Text>
                                    <Text
                                      style={[
                                        templateA5_3Styles.totalIgstAmount,
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
                                        templateA5_3Styles.igstTotal,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          templateA5_3Styles.totalEmpty,
                                          { width: "30%" },
                                        ]}
                                      ></Text>
                                      <Text
                                        style={[
                                          templateA5_3Styles.totalIgstAmount,
                                        ]}
                                      >
                                        {formatCurrency(totalCGST)}
                                      </Text>
                                    </View>
                                    <View
                                      style={[
                                        templateA5_3Styles.igstTotal,
                                        { width: hsnColWidths[3] },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          templateA5_3Styles.totalEmpty,
                                          { width: "30%" },
                                        ]}
                                      ></Text>
                                      <Text
                                        style={[
                                          templateA5_3Styles.totalIgstAmount,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        {formatCurrency(totalSGST)}
                                      </Text>
                                    </View>
                                  </>
                                ) : null}

                                <Text
                                  style={[
                                    templateA5_3Styles.hsnTaxTotalCell,
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
                  <View style={templateA5_3Styles.bottomSection}>
                    {/* Left Column: Total in words + Terms */}
                    <View style={templateA5_3Styles.leftSection}>
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
                            <View style={templateA5_3Styles.termsBox}>
                              <Text
                                style={[
                                  templateA5_3Styles.termLine,
                                  { fontWeight: "bold" },
                                ]}
                              >
                                {title}
                              </Text>
                              {listItems.map((item, index) => (
                                <Text
                                  key={index}
                                  style={templateA5_3Styles.termLine}
                                >
                                  • {item}
                                </Text>
                              ))}
                            </View>
                          );
                        })()
                      ) : (
                        <View style={templateA5_3Styles.termsBox}>
                          <Text style={templateA5_3Styles.termLine}>
                            No terms and conditions added yet
                          </Text>
                        </View>
                      )}

                      {/* QR Code + Label */}
                      {/* <View style={templateA5_3Styles.qrContainer}>
                      <Image src="/path/to/qr.png" style={templateA5_3Styles.qrImage} />
                      <Text style={templateA5_3Styles.qrText}>Pay using UPI</Text>
                    </View> */}
                    </View>

                    {/* Right Column: Totals */}
                    <View style={templateA5_3Styles.rightSection}>
                      <View style={templateA5_3Styles.totalRow}>
                        <Text style={templateA5_3Styles.label}>
                          Taxable Amount
                        </Text>
                        <Text style={templateA5_3Styles.value}>
                          {formatCurrency(totalTaxable)}
                        </Text>
                      </View>

                      {isGSTApplicable && (
                        <View style={templateA5_3Styles.totalRow}>
                          <Text style={templateA5_3Styles.label}>
                            Total Tax
                          </Text>
                          <Text style={templateA5_3Styles.value}>
                            {formatCurrency(
                              showIGST ? totalIGST : totalCGST + totalSGST
                            )}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          templateA5_3Styles.totalRow,
                          isGSTApplicable
                            ? templateA5_3Styles.highlightRow
                            : {},
                        ]}
                      >
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5_3Styles.labelBold
                              : templateA5_3Styles.label
                          }
                        >
                          {isGSTApplicable
                            ? "Total Amount After Tax"
                            : "Total Amount"}
                        </Text>
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5_3Styles.valueBold
                              : templateA5_3Styles.value
                          }
                        >
                          {/* <Text style={templateA5_3Styles.currencySymbol}></Text> */}
                          {formatCurrency(totalAmount)}
                        </Text>
                      </View>

                      <View style={templateA5_3Styles.totalRow}>
                        <Text style={templateA5_3Styles.label}>
                          For{" "}
                          {company?.businessName ||
                            company?.companyName ||
                            "Company Name"}
                        </Text>
                        <Text style={templateA5_3Styles.value}>(E & O.E.)</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

             
            </View>
             {/* Page Number */}
              <Text style={templateA5_3Styles.pageNumber}>
                {pageIndex + 1} / {pages.length} Page
              </Text>
          </Page>
        );
      })}
    </Document>
  );
};

export const generatePdfForTemplateA5_3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <TemplateA5_3PDF
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

export default TemplateA5_3PDF;
