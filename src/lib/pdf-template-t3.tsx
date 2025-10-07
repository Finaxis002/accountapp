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

import { template_t3 } from "./pdf-template-styles";

const logo = "/assets/invoice-logos/R.png";

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
  bank,
  client,
}) => {

  // Sample data based on your image
  const sampleItems = [
    {
      srNo: 1,
      description: "Wireless Security\nAjorn System\n64 WD\n22336655441\nIC 555\n234SC904509",
      hsn: "HSN : 830ZII",
      qty: "100 BOX",
      rate: "4,236.44",
      total: "4,998.00"
    },
    {
      srNo: 2,
      description: "Wireless Security\nComera SMP\nS6/We\n45666456654\n36/We\n45666456653",
      hsn: "HSN : 830ZII",
      qty: "3.00 PCS",
      rate: "2,824.84",
      total: "8,999.83"
    },
    {
      srNo: 3,
      description: "Dollar high\nDoubly cable",
      hsn: "HSN : 823655",
      qty: "4.00 BDL",
      rate: "1,000.00",
      total: "4,200.00"
    }
  ];

  const calculateGrandTotal = () => {
    return sampleItems.reduce((sum, item) => {
      const total = parseFloat(item.total.replace(/,/g, ''));
      return sum + total;
    }, 0);
  };

  const grandTotal = calculateGrandTotal();

  return (
    <Document>
      <Page size="A5" style={template_t3.page}>
        {/* Header */}
        <View style={template_t3.header}>
          <View style={template_t3.companyInfo}>
            <Text style={template_t3.companyName}>Global Securities</Text>
            <Text style={template_t3.companyAddress}>Aarinta Quotient</Text>
            <Text style={template_t3.companyAddress}>Shop No 1a</Text>
            <Text style={template_t3.companyAddress}>Thana, Maharashtra - 40107</Text>
            <Text style={template_t3.gstin}>GSTIN : 272MJHMT56HLT</Text>
            <Text style={template_t3.companyAddress}>44324</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ marginVertical: 2 , alignItems:"center"}} >
          <Text>=======================================</Text>
            </View>

        {/* Invoice Title */}
        <Text style={template_t3.title}>TAX INVOICE</Text>
        <View style={{ marginVertical: 2 , alignItems:"center"}} >
          <Text>=======================================</Text>
            </View>

        {/* Billed To Section */}
        <View style={template_t3.billedToSection}>
          <View style={template_t3.billedTo}>
            <Text style={template_t3.sectionTitle}>BILLED TO</Text>
            <Text style={template_t3.partyInfo}>Joy EnterPrices</Text>
            <Text style={template_t3.partyInfo}>24CORPP3239MIZA</Text>
            <Text style={template_t3.partyInfo}>AAUPMJ756H</Text>
          </View>
          <View style={template_t3.invoiceDetails}>
            <Text style={template_t3.invoiceNumber}>INVOICE #: 2</Text>
            <Text style={template_t3.invoiceNumber}>DATE: 24-Apr-2025</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={template_t3.itemsTable}>
          {/* Table Header */}
          <View style={template_t3.tableHeader}>
            <View style={[template_t3.tableCell, template_t3.srNoCell]}>
              <Text>#</Text>
            </View>
            <View style={[template_t3.tableCell, template_t3.descriptionCell]}>
              <Text>Items</Text>
            </View>
            <View style={[template_t3.tableCell, template_t3.qtyCell]}>
              <Text>Qty.</Text>
            </View>
            <View style={[template_t3.tableCell, template_t3.rateCell]}>
              <Text>Rate</Text>
            </View>
            <View style={[template_t3.lastCell, template_t3.totalCell]}>
              <Text>Total</Text>
            </View>
          </View>

          {/* Table Rows */}
          {sampleItems.map((item, index) => (
            <View key={index} style={template_t3.tableRow}>
              <View style={[template_t3.tableCell, template_t3.srNoCell]}>
                <Text>{item.srNo}</Text>
              </View>
              <View style={[template_t3.tableCell, template_t3.descriptionCell]}>
                <Text style={template_t3.itemDescription}>{item.description}</Text>
                <Text style={template_t3.hsnCode}>{item.hsn}</Text>
              </View>
              <View style={[template_t3.tableCell, template_t3.qtyCell]}>
                <Text>{item.qty}</Text>
              </View>
              <View style={[template_t3.tableCell, template_t3.rateCell]}>
                <Text>{item.rate}</Text>
              </View>
              <View style={[template_t3.lastCell, template_t3.totalCell]}>
                <Text>{item.total}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={template_t3.totalsSection}>
          <View style={template_t3.totalsTable}>
            <View style={template_t3.totalRow}>
              <Text style={template_t3.totalLabel}>Grand Total:</Text>
              <Text style={template_t3.totalValue}>{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={template_t3.footer}>
          <Text>This is a computer generated invoice</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generatePdfForTemplatet3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
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