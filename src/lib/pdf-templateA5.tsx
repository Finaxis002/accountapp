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
} from "./pdf-utils";

import { templateA5Styles } from "./pdf-template-styles";
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

const TemplateA5PDF: React.FC<TemplateA5PDFProps> = ({
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

     const itemsPerPage = 6;
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
    "12%",
    "15%",
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
    

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A5" orientation="landscape" style={templateA5Styles.page}>
            {/* Header */}
            <View style={templateA5Styles.header}>
              <View style={templateA5Styles.headerLeft}>
                <Image
                  src="/assets/invoice-logos/R.png"
                  style={templateA5Styles.logo}
                />
              </View>
              <View style={templateA5Styles.headerRight}>
                <Text style={templateA5Styles.companyName}>
                  {company?.businessName ||
                    company?.companyName ||
                    "Company Name"}
                </Text>
                <Text style={templateA5Styles.address}>
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
                <View style={templateA5Styles.contactInfo}>
                  <Text style={templateA5Styles.contactLabel}>Name : </Text>
                  <Text style={templateA5Styles.contactValue}>
                    {getClientName(client)}
                  </Text>
                  <Text style={templateA5Styles.contactLabel}> | Phone : </Text>
                  <Text style={templateA5Styles.contactValue}>
                    {company?.mobileNumber || company?.Telephone || "Phone"}
                  </Text>
                </View>
              </View>
            </View>
            {/* Body - Items Table */}
            <View style={templateA5Styles.section}>
              {/* table header  */}
              <View style={templateA5Styles.tableHeader}>
                {company?.gstin && (
                  <View style={templateA5Styles.gstRow}>
                    <Text style={templateA5Styles.gstLabel}>GSTIN : </Text>
                    <Text style={templateA5Styles.gstValue}>
                      {" "}
                      {company.gstin}{" "}
                    </Text>
                  </View>
                )}

                <View style={templateA5Styles.invoiceTitleRow}>
                  <Text style={templateA5Styles.invoiceTitle}>TAX INVOICE</Text>
                </View>

                <View style={templateA5Styles.recipientRow}>
                  <Text style={templateA5Styles.recipientText}>
                    ORIGINAL FOR RECIPIENT
                  </Text>
                </View>
              </View>
              {/* table three columns */}
              <View style={templateA5Styles.threeColSection}>
                {/* Column 1 - Details of Buyer */}
                <View style={[templateA5Styles.column, { borderLeft: "none" }]}>
                  <View style={templateA5Styles.columnHeader}>
                    <Text style={templateA5Styles.threecoltableHeader}>
                      Details of Buyer | Billed to:
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Name</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Address</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {getBillingAddress(party)}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.contactNumber || "-"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>PAN</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.pan || "-"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>
                      Place of Supply
                    </Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.state
                        ? `${party.state} (${getStateCode(party.state) || "-"})`
                        : "-"}
                    </Text>
                  </View>
                </View>

                {/* Column 2 - Details of Consigned */}
                <View style={templateA5Styles.column}>
                  <View style={templateA5Styles.columnHeader}>
                    <Text style={templateA5Styles.threecoltableHeader}>
                      Details of Consigned | Shipped to:
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Name</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {shippingAddress?.label || party?.name || "N/A"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Address</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {getShippingAddress(
                        shippingAddress,
                        getBillingAddress(party)
                      )}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Country</Text>
                    <Text style={templateA5Styles.tableValue}>India</Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {shippingAddress?.contactNumber ||
                        party?.contactNumber ||
                        "-"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5Styles.dataRow}>
                    <Text style={templateA5Styles.tableLabel}>State</Text>
                    <Text style={templateA5Styles.tableValue}>
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
                  style={[templateA5Styles.column, { borderRight: "none" }]}
                >
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}>Invoice No.</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {transaction.invoiceNumber || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}>
                      Invoice Date
                    </Text>
                    <Text style={templateA5Styles.tableValue}>
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}>Due Date</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {new Date(transaction.dueDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}>P.O. No.</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {transaction.voucher || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}>E-Way No.</Text>
                    <Text style={templateA5Styles.tableValue}>
                      {transaction.referenceNumber || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}></Text>
                    <Text style={templateA5Styles.tableValue}></Text>
                  </View>
                  <View
                    style={[
                      templateA5Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5Styles.tableLabel}></Text>
                    <Text style={templateA5Styles.tableValue}></Text>
                  </View>
                </View>
              </View>
              {/* Items Table */}
              <View style={templateA5Styles.itemsTable}>
                {/* Table Header */}
                <View style={templateA5Styles.itemsTableHeader}>
                  <Text
                    style={[
                      templateA5Styles.srNoHeader,
                      { width: colWidths[0] },
                    ]}
                  >
                    Sr. No.
                  </Text>
                  <Text
                    style={[
                      templateA5Styles.productHeader,
                      { width: colWidths[1] },
                    ]}
                  >
                    Name of Product/Service
                  </Text>
                  <Text
                    style={[
                      templateA5Styles.hsnHeader,
                      { width: colWidths[2] },
                    ]}
                  >
                    HSN/SAC
                  </Text>
                  <Text
                    style={[
                      templateA5Styles.qtyHeader,
                      { width: colWidths[3] },
                    ]}
                  >
                    Qty
                  </Text>
                  <Text
                    style={[
                      templateA5Styles.rateHeader,
                      { width: colWidths[4] },
                    ]}
                  >
                    Rate
                  </Text>
                  <Text
                    style={[
                      templateA5Styles.taxableHeader,
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
                        templateA5Styles.igstHeader,
                        { width: colWidths[6] },
                      ]}
                    >
                      <Text style={templateA5Styles.igstMainHeader}>IGST</Text>
                      <View style={templateA5Styles.igstSubHeader}>
                        <Text style={[templateA5Styles.igstSubPercentage,{borderRight:"1px solid #0371C1"}]}>%</Text>
                        <Text style={templateA5Styles.igstSubText}>Amount</Text>
                      </View>
                    </View>
                  ) : showCGSTSGST ? (
                    // Intrastate - Show CGST/SGST columns
                    <>
                      <View
                        style={[
                          templateA5Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={templateA5Styles.igstMainHeader}>
                          CGST
                        </Text>
                        <View style={templateA5Styles.igstSubHeader}>
                          <Text style={[templateA5Styles.igstSubPercentage ,{borderRight:"1px solid #0371C1"}]}>%</Text>
                          <Text style={templateA5Styles.igstSubText}>
                            Amount
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          templateA5Styles.igstHeader,
                          { width: colWidths[7] },
                        ]}
                      >
                        <Text style={templateA5Styles.igstMainHeader}>
                          SGST
                        </Text>
                        <View style={templateA5Styles.igstSubHeader}>
                          <Text style={[templateA5Styles.igstSubPercentage,{borderRight:"1px solid #0371C1"}]}>%</Text>
                          <Text style={templateA5Styles.igstSubText}>
                            Amount
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}

                  {/* Total Column */}
                  <Text
                    style={[
                      templateA5Styles.totalHeader,
                      { width: colWidths[totalColumnIndex] },
                    ]}
                  >
                    Total
                  </Text>
                </View>

                {pageItems.map((item, index) => (
                  <View key={index} style={templateA5Styles.itemsTableRow}>
                    <Text style={[templateA5Styles.srNoCell, {width:colWidths[0]} ]}>
                      {pageIndex * itemsPerPage + index + 1}
                    </Text>
                    <Text style={[templateA5Styles.productCell, { width: colWidths[1] },]}>
                      {item.name}
                    </Text>
                    <Text style={[templateA5Styles.hsnCell, {width: colWidths[2]}]}>
                      {item.code || "-"}
                    </Text>
                    <Text style={[templateA5Styles.qtyCell , {width: colWidths[3]}]}>
                      {item.quantity || 0} {item.unit}
                    </Text>
                    <Text style={[templateA5Styles.rateCell, {width: colWidths[4]}]}>
                      {formatCurrency(item.pricePerUnit || 0)}
                    </Text>
                    <Text style={[templateA5Styles.taxableCell , {width: colWidths[5]}]}>
                      {formatCurrency(item.taxableValue)}
                    </Text>
                    {showIGST ? (
                      <View style={[templateA5Styles.igstCell, { width: colWidths[6] },]}>
                        <Text style={templateA5Styles.igstPercent}>
                          {item.gstRate}
                        </Text>
                        <Text style={templateA5Styles.igstAmount}>
                          {formatCurrency(item.igst)}
                        </Text>
                      </View>
                    ) : showCGSTSGST ? (
                      <>
                        <View style={[templateA5Styles.igstCell , { width: colWidths[6] },]}>
                          <Text style={templateA5Styles.igstPercent}>
                            {(item.gstRate / 2)}
                          </Text>
                          <Text style={templateA5Styles.igstAmount}>
                            {formatCurrency(item.cgst)}
                          </Text>
                        </View>
                        <View style={[templateA5Styles.igstCell , { width: colWidths[7] },]}>
                          <Text style={templateA5Styles.igstPercent}>
                            {(item.gstRate / 2)}
                          </Text>
                          <Text style={templateA5Styles.igstAmount}>
                            {formatCurrency(item.sgst)}
                          </Text>
                        </View>
                      </>
                    ) : null}
                    <Text style={[templateA5Styles.totalCell, { width: colWidths[totalColumnIndex] }]}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}

                {isLastPage && (
                  <View style={templateA5Styles.itemsTableTotalRow}>
                    <Text style={[templateA5Styles.totalLabel, { width: colWidths[0] }]}></Text>
                    <Text style={[templateA5Styles.totalEmpty, { width: colWidths[1] }]}></Text>
                    <Text style={[templateA5Styles.totalEmpty, { width: colWidths[2] , borderRight:"1px solid #0371C1" }]}>Total</Text>
                    <Text style={[templateA5Styles.totalQty, { width: colWidths[3], borderRight:"1px solid #0371C1" }]}>
                      {totalQty.toFixed(2)}
                    </Text>
                    <Text style={[templateA5Styles.totalEmpty, { width: colWidths[4]}]}></Text>
                    <Text style={[templateA5Styles.totalTaxable, { width: colWidths[5] , borderRight:"1px solid #0371C1", borderLeft:"1px solid #0371C1" }]}>
                      {formatCurrency(totalTaxable)}
                    </Text>
                    {showIGST ? (
                      <View style={[templateA5Styles.igstTotal, { width: colWidths[6] }]}>
                        <Text style={[templateA5Styles.totalEmpty ,{width:"30%"} ]}></Text>
                        <Text style={[templateA5Styles.totalIgstAmount,{  borderRight:"1px solid #0371C1",}]}>
                          {formatCurrency(totalIGST)}
                        </Text>
                      </View>
                    ) : showCGSTSGST ? (
                      <>
                        <View style={[templateA5Styles.igstTotal, { width: colWidths[6] }]}>
                          <Text style={[templateA5Styles.totalEmpty, {width:"30%"}]}></Text>
                          <Text style={[templateA5Styles.totalIgstAmount, ]}>
                            {formatCurrency(totalCGST)}
                          </Text>
                        </View>
                        <View style={[templateA5Styles.igstTotal, { width: colWidths[7] }]}>
                          <Text style={[templateA5Styles.totalEmpty, {width:"30%"}]}></Text>
                          <Text style={[templateA5Styles.totalIgstAmount,{  borderRight:"1px solid #0371C1",}]}>
                            {formatCurrency(totalSGST)}
                          </Text>
                        </View>
                      </>
                    ) : null}
                    <Text style={[templateA5Styles.grandTotal, { width: colWidths[totalColumnIndex] }]}>
                      {formatCurrency(totalAmount)}
                    </Text>
                  </View>
                )}
              </View>

              {isLastPage && (
                <View style={templateA5Styles.bottomSection}>
                  {/* Left Column: Total in words + Terms */}
                  <View style={templateA5Styles.leftSection}>
                    <Text style={templateA5Styles.totalInWords}>
                      Total in words : {numberToWords(totalAmount)}
                    </Text>

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
                          <View style={templateA5Styles.termsBox}>
                            <Text style={[templateA5Styles.termLine, { fontWeight: "bold" }]}>
                              {title}
                            </Text>
                            {listItems.map((item, index) => (
                              <Text
                                key={index}
                                style={templateA5Styles.termLine}
                              >
                                • {item}
                              </Text>
                            ))}
                          </View>
                        );
                      })()
                    ) : (
                      <View style={templateA5Styles.termsBox}>
                        <Text style={templateA5Styles.termLine}>
                          No terms and conditions added yet
                        </Text>
                      </View>
                    )}

                    {/* QR Code + Label */}
                    {/* <View style={templateA5Styles.qrContainer}>
                      <Image src="/path/to/qr.png" style={templateA5Styles.qrImage} />
                      <Text style={templateA5Styles.qrText}>Pay using UPI</Text>
                    </View> */}
                  </View>

                  {/* Right Column: Totals */}
                  <View style={templateA5Styles.rightSection}>
                    <View style={templateA5Styles.totalRow}>
                      <Text style={templateA5Styles.label}>Taxable Amount</Text>
                      <Text style={templateA5Styles.value}>{formatCurrency(totalTaxable)}</Text>
                    </View>

                    <View style={templateA5Styles.totalRow}>
                      <Text style={templateA5Styles.label}>Total Tax</Text>
                      <Text style={templateA5Styles.value}>
                        {formatCurrency(showIGST ? totalIGST : totalCGST + totalSGST)}
                      </Text>
                    </View>

                    <View style={[templateA5Styles.totalRow, templateA5Styles.highlightRow]}>
                      <Text style={templateA5Styles.labelBold}>Total Amount After Tax</Text>
                      <Text style={templateA5Styles.valueBold}>
                        {/* <Text style={templateA5Styles.currencySymbol}></Text> */}
                        {formatCurrency(totalAmount)}
                      </Text>
                    </View>

                    <View style={templateA5Styles.totalRow}>
                      <Text style={templateA5Styles.label}>
                        For {company?.businessName || company?.companyName || "Company Name"}
                      </Text>
                      <Text style={templateA5Styles.value}>(E & O.E.)</Text>
                    </View>

                   
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

export const generatePdfForTemplateA5 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <TemplateA5PDF
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

export default TemplateA5PDF;

