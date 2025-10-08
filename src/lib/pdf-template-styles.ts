// Create styles

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
import { Column } from "jspdf-autotable";
import { last } from "pdf-lib";

export const template8Styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 25,
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2583C6",
  },

  grayColor: {
    color: "#262626",
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#232323",
  },
  addressText: {
    fontSize: 9,
    marginBottom: 3,
    lineHeight: 1.2,
  },

  dividerBlue: {
    borderBottom: "3px solid #2583C6",
    marginVertical: 3,
  },
  divider: {
    borderBottom: "3px solid #bfbfbf",
    marginVertical: 3,
  },
  threeColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 180,
  },
  column: {
    flex: 4,
    marginRight: 20,
  },
  lastColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 6,
  },
  normalText: {
    fontSize: 8,
    marginBottom: 2,
  },
  boldText: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  table: {
    marginBottom: 16,
    border:"1px solid #bfbfbf"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2583C6",
    color: "#FFFFFF",
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #b2b2b2",
  },
  tableCellHeader: {
    fontSize: 8,
    borderRight: "0.5px solid #c4c4c4",
  },
  tableCell: {
    padding: 1,
    fontSize: 8,
    // borderRight: "0.5px solid #000000",
  },
  tableCellSize7: {
    fontSize: 7,
  },
  tableCellLast: {
    padding: 4,
    fontSize: 8,
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  totalsLeft: {
    fontSize: 8,
  },
  totalsRight: {
    fontSize: 10,
    textAlign: "right",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 32,
    marginBottom: 4,
  },
  paymentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stamp: {
    width: 80,
    height: 80,
    border: "1px solid blue",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stampText: {
    fontSize: 6,
    fontWeight: "bold",
  },
  termsSection: {
    fontSize: 8,
  },

  sectionHeader: {
    fontSize: 9,
    marginBottom: 3,
  },

  detailText: {
    fontSize: 9,
    lineHeight: 1.1,
  },
  currencyText: {
    fontFamily: "YourChosenFont", // Use fonts like NotoSans, Roboto, etc.
  },
  smallRs: {
    fontSize: 8, // Adjust size as needed
    // You can also add other styling if needed
    // fontWeight: 'normal',
    // color: '#666',
  },
  pageNumber: {
  position: 'absolute',
  bottom: 20, // Distance from bottom of page
  right: 20,  // Distance from right of page
  fontSize: 8,
  textAlign: 'right',
},
});

// A5 specific styles
export const templateA5Styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    // marginBottom: 1,
    // borderBottom: '1px solid #000',
    paddingBottom: 4,
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 3,
    alignItems: "flex-start",
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  contactInfo: {
    fontSize: 10,
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },

  contactLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  contactValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  section: {
    border: "1.5px solid #0371C1",
    padding: 0,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5px solid #0371C1",
  },
  gstRow: {
    flexDirection: "row",
    padding: 4,
  },
  gstLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  gstValue: {
    fontSize: 12,
    fontWeight: "normal",
  },
  invoiceTitleRow: {
    padding: 4,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "extrabold",
    textAlign: "center",
    color: "#0371C1",
  },
  recipientRow: {
    padding: 4,
  },
  recipientText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  threeColSection: {
    flexDirection: "row",
    // marginBottom: 10,
    borderBottom: "2px solid #0371C1",
  },
  column: {
    width: "33.3%",
    paddingHorizontal: 4,
    borderLeft: "1px solid #0371C1",
  },
  columnHeader: {
    marginBottom: 5,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  threecoltableHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "40%", // Fixed width for labels
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValue: {
    fontSize: 8,
    fontWeight: "normal",
    width: "70%", // Fixed width for values
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  },

  // item table style
  itemsTable: {
    // marginTop: 10,
    // border: '1px solid #000',
  },
   tableContainer: {
   position: 'relative',
   width: '100%',
 },
    verticalBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0371C1',
  },
 itemsTableHeader: {
  flexDirection: 'row',
  backgroundColor: 'rgba(3, 113, 193, 0.2)',
  borderBottom: '1px solid #0371C1',
  borderTop:0
},
headerCell: {
  // borderRight: '1px solid #0371C1',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 2,
},
  itemsTableRow: {
    flexDirection: "row",
    // borderBottom: '1px solid #0371C1',
    alignItems: "center",
  },
  itemsTableTotalRow: {
    flexDirection: "row",
    // borderTop: "1px solid #0371C1",
    backgroundColor: "rgba(3, 113, 193, 0.2)",
    alignItems: "center",
  },
  // Header Styles
  srNoHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  productHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "25%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  hsnHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  qtyHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  rateHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  taxableHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  igstHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
  totalHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstMainHeader: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1,
  },
  igstSubHeader: { flexDirection: "row", borderTop: "1px solid #0371C1" },
  igstSubText: {
    fontSize: 6,
    fontWeight: "bold",
    width: "70%",
    textAlign: "center",
    padding: 1,
  },
  igstSubPercentage:{
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
    textAlign: "center",
    padding: 1,
  },

  // Cell Styles
  srNoCell: { fontSize: 7, width: "8%", textAlign: "center", padding: 4 },
  productCell: {
    fontSize: 7,
    width: "25%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    wrap: true,
  },
  hsnCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  qtyCell: {
    fontSize: 7,
    width: "8%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  rateCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  taxableCell: {
    fontSize: 7,
    width: "12%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
igstCell: {
  flexDirection: "row",
  width: "12%",
  display: "flex",
  justifyContent: "center", // horizontally center children
  alignItems: "center", // vertically center children
  gap: 10,
  // borderLeft: "1px solid #0371C1", // optional
  textAlign: "center",
},
igstPercent: {
  fontSize: 7,
  textAlign: "center",
  padding: 1,
  width: "30%", // ensure consistent spacing
},
igstAmount: {
  fontSize: 7,
  textAlign: "center",
  padding: 1,
  width: "70%",
},
  totalCell: {
    fontSize: 7,
    width: "15%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },


  // Total Row Styles
  totalLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
  },
  totalEmpty: { fontSize: 7, width: "25%", padding: 2 ,  textAlign: "center",fontWeight:"bold"},
  totalQty: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  totalTaxable: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstTotal: {
    fontSize: 7,
    width: "12%",
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
  totalIgstAmount: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "right",
    padding: 1,
  },
  grandTotal: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },

  // igstHeader: {
  //   flexDirection: 'row',
  //   width: '12%',
  //   borderLeft: '1px solid #000',
  //   borderRight: '1px solid #000',
  // },
  igstPercentHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
    borderRight: "1px solid #000",
  },
  igstAmountHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
  },

  igstPercentCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "center",
    padding: 2,
    // borderRight: '1px solid #ddd',
  },
  igstAmountCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "center",
    padding: 2,
  },


   bottomSection: {
    flexDirection: "row",
    borderTop: "1px solid #0371C1",
    width: "100%",
    fontSize: 7,
  },

  // Left half
  leftSection: {
    width: "65%",
    borderRight: "1px solid #0371C1",
  },

  totalInWords: {
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #0371C1",
    padding: 4,
    textTransform: "uppercase",
  },

  termsBox: {
    marginTop: 3,
    padding:8
  },
  termLine: {
    fontSize: 7,
    marginBottom: 1,
  },

  qrContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  qrImage: {
    width: 45,
    height: 45,
  },
  qrText: {
    fontSize: 7,
    marginTop: 2,
  },

  // Right half
  rightSection: {
    width: "35%",
    justifyContent: "flex-start",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #0371C1",
    padding: 4,
  },

  label: { fontSize: 8,fontWeight: "bold" },
  value: { fontSize: 8,fontWeight: "bold" },

  labelBold: { fontSize: 8, fontWeight: "bold" },
  valueBold: { fontSize: 8, fontWeight: "bold" },

  highlightRow: {
    backgroundColor: "#EAF4FF",
  },

  currencySymbol: {
    fontSize: 6,
  },
 pageNumber: {
  position: 'absolute',
  bottom: 20, // Distance from bottom of page
  right: 20,  // Distance from right of page
  fontSize: 8,
  textAlign: 'right',
},
});


export const templateA5_3Styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom:0,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    // marginBottom: 1,
    // borderBottom: '1px solid #000',
    paddingBottom: 4,
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 3,
    alignItems: "center",
    marginLeft:10
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  contactInfo: {
    fontSize: 10,
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },

  contactLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  contactValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  section: {
    border: "1.5px solid #0371C1",
    padding: 0,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5px solid #0371C1",
  },
  gstRow: {
    flexDirection: "row",
    padding: 4,
  },
  gstLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  gstValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  invoiceTitleRow: {
    padding: 4,
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: "extrabold",
    textAlign: "center",
    color: "#0371C1",
  },
  recipientRow: {
    padding: 4,
  },
  recipientText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  threeColSection: {
    flexDirection: "row",
    // marginBottom: 10,
    borderBottom: "2px solid #0371C1",
  },
  column: {
    width: "33.3%",
    paddingHorizontal: 4,
    borderLeft: "1px solid #0371C1",
  },
  columnHeader: {
    marginBottom: 5,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  threecoltableHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "40%", // Fixed width for labels
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValue: {
    fontSize: 8,
    fontWeight: "normal",
    width: "70%", // Fixed width for values
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  },

  // item table style
  itemsTable: {
    // marginTop: 10,
    // border: '1px solid #000',
  },
 itemsTableHeader: {
  flexDirection: 'row',
  backgroundColor: 'rgba(3, 113, 193, 0.2)',
  borderBottom: '1px solid #0371C1',
  borderTop:0
},
headerCell: {
  borderRight: '1px solid #0371C1',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 2,
},
  itemsTableRow: {
    flexDirection: "row",
    // borderBottom: '1px solid #0371C1',
    alignItems: "center",
  },
  itemsTableTotalRow: {
    flexDirection: "row",
    // borderTop: "1px solid #0371C1",
    backgroundColor: "rgba(3, 113, 193, 0.2)",
    alignItems: "center",
  },
  // Header Styles
  srNoHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  productHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "25%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  hsnHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  qtyHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  rateHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  taxableHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  igstHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
  totalHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstMainHeader: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1,
  },
  igstSubHeader: { flexDirection: "row", borderTop: "1px solid #0371C1" },
  igstSubText: {
    fontSize: 6,
    fontWeight: "bold",
    width: "70%",
    textAlign: "center",
    padding: 1,
  },
  igstSubPercentage:{
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
    textAlign: "center",
    padding: 1,
  },
Tablecolumn:{
 column: {
    borderRight:"1px solid #0371C1"
  },
},
 tableContainer: {
   position: 'relative',
   width: '100%',
 },
    verticalBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0371C1',
  },
  // Cell Styles
  srNoCell: { fontSize: 7, width: "8%", textAlign: "center", padding: 4 },
  productCell: {
    fontSize: 7,
    width: "25%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    wrap: true,
  },
  hsnCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  qtyCell: {
    fontSize: 7,
    width: "8%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  rateCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  taxableCell: {
    fontSize: 7,
    width: "12%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
igstCell: {
  flexDirection: "row",
  width: "12%",
  display: "flex",
  justifyContent: "center", // horizontally center children
  alignItems: "center", // vertically center children
  gap: 10,
  // borderLeft: "1px solid #0371C1", // optional
  textAlign: "center",
},
igstPercent: {
  fontSize: 7,
  textAlign: "right",
  padding: 1,
  width: "30%", // ensure consistent spacing
},
igstAmount: {
  fontSize: 7,
  textAlign: "center",
  padding: 0,
  width: "70%",
  alignItems:"flex-start",
  display:"flex",
  justifyContent:"flex-start"
},
  totalCell: {
    fontSize: 7,
    width: "15%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },


  // Total Row Styles
  totalLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
  },
  totalEmpty: { fontSize: 7, width: "25%", padding: 2 ,  textAlign: "center",fontWeight:"bold"},
  totalQty: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  totalTaxable: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstTotal: {
    fontSize: 7,
    width: "12%",
    // borderLeft: "1px solid #ddd",
    // borderRight: "1px solid #ddd",
  },
  totalIgstAmount: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "right",
    padding: 1,
  },
  grandTotal: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },

  // igstHeader: {
  //   flexDirection: 'row',
  //   width: '12%',
  //   borderLeft: '1px solid #000',
  //   borderRight: '1px solid #000',
  // },
  igstPercentHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
    borderRight: "1px solid #000",
  },
  igstAmountHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
  },

  igstPercentCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "right",
    padding: 2,
    // borderRight: '1px solid #ddd',
  },
  igstAmountCell: {
    fontSize: 7,
    width: '70%',
    textAlign: "center",
    padding: 2,
  },


   bottomSection: {
    flexDirection: "row",
    borderTop: "1px solid #0371C1",
    width: "100%",
    fontSize: 7,
  },

  // Left half
  leftSection: {
    width: "55%",
    borderRight: "1px solid #0371C1",
  },

  totalInWords: {
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #0371C1",
    padding: 4,
    textTransform: "uppercase",
  },

  termsBox: {
    marginTop: 3,
    padding:8
  },
  termLine: {
    fontSize: 7,
    marginBottom: 1,
  },

  qrContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  qrImage: {
    width: 45,
    height: 45,
  },
  qrText: {
    fontSize: 7,
    marginTop: 2,
  },


//hst summary table

  // Add these styles to your templateA5_3Styles
hsnTaxTable: {
  border: '1px solid #0371C1',
  backgroundColor: '#FFFFFF',
},
hsnTaxTableTitle: {
  backgroundColor: '#0371C1',
  color: '#FFFFFF',
  // padding: 6,
  fontSize: 8,
  fontWeight: 'bold',
  textAlign: 'center',
},
hsnTaxTableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f0f8ff',
  borderBottom: '1px solid #0371C1',
},
hsnTaxHeaderCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '0.5px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableRow: {
  flexDirection: 'row',
  // borderBottom: '0.5px solid #0371C1',
},
hsnTaxCell: {
  padding: 1,
  fontSize: 7,
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableTotalRow: {
  flexDirection: 'row',
  backgroundColor: "rgba(3, 113, 193, 0.2)",
  // borderTop: '1px solid #0371C1',
},
hsnTaxTotalCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},

  // Right half
  rightSection: {
    width: "45%",
    justifyContent: "flex-start",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #0371C1",
    padding: 4,
  },

  label: { fontSize: 8,fontWeight: "bold" },
  value: { fontSize: 8,fontWeight: "bold" },

  labelBold: { fontSize: 8, fontWeight: "bold" },
  valueBold: { fontSize: 8, fontWeight: "bold" },

  highlightRow: {
    backgroundColor: "#EAF4FF",
  },

  currencySymbol: {
    fontSize: 6,
  },
 pageNumber: {
  position: 'absolute',
  bottom: 20, // Distance from bottom of page
  right: 20,  // Distance from right of page
  fontSize: 8,
  textAlign: 'right',
},
});



export const templateA5_4Styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom:0,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    // marginBottom: 1,
    // borderBottom: '1px solid #000',
    paddingBottom: 4,
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 3,
    alignItems: "center",
    marginLeft:10
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  contactInfo: {
    fontSize: 10,
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },

  contactLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  contactValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  section: {
    border: "1.5px solid #0371C1",
    padding: 0,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5px solid #0371C1",
  },
  gstRow: {
    flexDirection: "row",
    padding: 4,
  },
  gstLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  gstValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  invoiceTitleRow: {
    padding: 4,
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: "extrabold",
    textAlign: "center",
    color: "#0371C1",
  },
  recipientRow: {
    padding: 4,
  },
  recipientText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  threeColSection: {
    flexDirection: "row",
    // marginBottom: 10,
    borderBottom: "2px solid #0371C1",
  },
  column: {
    width: "25%",
    paddingHorizontal: 4,
    borderLeft: "1px solid #0371C1",
  },
  columnHeader: {
    marginBottom: 5,
  },
  dataRow: {
    display:"flex",
    // gap:,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  threecoltableHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "30%", // Fixed width for labels
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValue: {
    fontSize: 8,
    fontWeight: "normal",
    width: "70%", // Fixed width for values
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  },

  // item table style
  itemsTable: {
    // marginTop: 10,
    // border: '1px solid #000',
  },
 itemsTableHeader: {
  flexDirection: 'row',
  backgroundColor: 'rgba(3, 113, 193, 0.2)',
  borderBottom: '1px solid #0371C1',
  borderTop:0
},
headerCell: {
  borderRight: '1px solid #0371C1',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 2,
},
  itemsTableRow: {
    flexDirection: "row",
    // borderBottom: '1px solid #0371C1',
    alignItems: "center",
  },
  itemsTableTotalRow: {
    flexDirection: "row",
    // borderTop: "1px solid #0371C1",
    backgroundColor: "rgba(3, 113, 193, 0.2)",
    alignItems: "center",
  },
  // Header Styles
  srNoHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  productHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "25%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  hsnHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  qtyHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  rateHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  taxableHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  igstHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
  totalHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstMainHeader: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1,
  },
  igstSubHeader: { flexDirection: "row", borderTop: "1px solid #0371C1" },
  igstSubText: {
    fontSize: 6,
    fontWeight: "bold",
    width: "70%",
    textAlign: "center",
    padding: 1,
  },
  igstSubPercentage:{
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
    textAlign: "center",
    padding: 1,
  },
Tablecolumn:{
 column: {
    borderRight:"1px solid #0371C1"
  },
},
 tableContainer: {
   position: 'relative',
   width: '100%',
 },
    verticalBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0371C1',
  },
  // Cell Styles
  srNoCell: { fontSize: 7, width: "8%", textAlign: "center", padding: 4 },
  productCell: {
    fontSize: 7,
    width: "25%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    wrap: true,
  },
  hsnCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  qtyCell: {
    fontSize: 7,
    width: "8%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  rateCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  taxableCell: {
    fontSize: 7,
    width: "12%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
     backgroundColor: 'rgba(3, 113, 193, 0.2)',
  },
igstCell: {
  flexDirection: "row",
  width: "12%",
  display: "flex",
  justifyContent: "center", // horizontally center children
  alignItems: "center", // vertically center children
  gap: 10,
  // borderLeft: "1px solid #0371C1", // optional
  textAlign: "center",
},
igstPercent: {
  fontSize: 7,
  textAlign: "right",
  padding: 1,
  width: "30%", // ensure consistent spacing
},
igstAmount: {
  fontSize: 7,
  textAlign: "center",
  padding: 0,
  width: "70%",
  alignItems:"flex-start",
  display:"flex",
  justifyContent:"flex-start"
},
  totalCell: {
    fontSize: 7,
    width: "15%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
     backgroundColor: 'rgba(3, 113, 193, 0.2)',
  },


  // Total Row Styles
  totalLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
  },
  totalEmpty: { fontSize: 7, width: "25%", padding: 2 ,  textAlign: "center",fontWeight:"bold"},
  totalQty: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  totalTaxable: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstTotal: {
    fontSize: 7,
    width: "12%",
    // borderLeft: "1px solid #ddd",
    // borderRight: "1px solid #ddd",
  },
  totalIgstAmount: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "right",
    padding: 1,
  },
  grandTotal: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },

  // igstHeader: {
  //   flexDirection: 'row',
  //   width: '12%',
  //   borderLeft: '1px solid #000',
  //   borderRight: '1px solid #000',
  // },
  igstPercentHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
    borderRight: "1px solid #000",
  },
  igstAmountHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
  },

  igstPercentCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "right",
    padding: 2,
    // borderRight: '1px solid #ddd',
  },
  igstAmountCell: {
    fontSize: 7,
    width: '70%',
    textAlign: "center",
    padding: 2,
  },


   bottomSection: {
    flexDirection: "row",
    borderTop: "1px solid #0371C1",
    width: "100%",
    fontSize: 7,
  },

  // Left half
  leftSection: {
    width: "55%",
    borderRight: "1px solid #0371C1",
  },

  totalInWords: {
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #0371C1",
    padding: 4,
    textTransform: "uppercase",
  },

  termsBox: {
    marginTop: 3,
    padding:8
  },
  termLine: {
    fontSize: 7,
    marginBottom: 1,
  },

  qrContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  qrImage: {
    width: 45,
    height: 45,
  },
  qrText: {
    fontSize: 7,
    marginTop: 2,
  },


  //hst summary table

  // Add these styles to your templateA5_3Styles
hsnTaxTable: {
  border: '1px solid #0371C1',
  backgroundColor: '#FFFFFF',
},
hsnTaxTableTitle: {
  backgroundColor: '#0371C1',
  color: '#FFFFFF',
  // padding: 6,
  fontSize: 8,
  fontWeight: 'bold',
  textAlign: 'center',
},
hsnTaxTableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f0f8ff',
  borderBottom: '1px solid #0371C1',
},
hsnTaxHeaderCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '0.5px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableRow: {
  flexDirection: 'row',
  borderBottom: '0.5px solid #0371C1',
},
hsnTaxCell: {
  padding: 1,
  fontSize: 7,
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableTotalRow: {
  flexDirection: 'row',
  backgroundColor: "rgba(3, 113, 193, 0.2)",
  // borderTop: '1px solid #0371C1',
},
hsnTaxTotalCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},

  // Right half
  rightSection: {
    width: "45%",
    justifyContent: "flex-start",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #0371C1",
    padding: 4,
  },

  label: { fontSize: 8,fontWeight: "bold" },
  value: { fontSize: 8,fontWeight: "bold" },

  labelBold: { fontSize: 8, fontWeight: "bold" },
  valueBold: { fontSize: 8, fontWeight: "bold" },

  highlightRow: {
    backgroundColor: "#EAF4FF",
  },

  currencySymbol: {
    fontSize: 6,
  },
 pageNumber: {
  position: 'absolute',
  bottom: 20, // Distance from bottom of page
  right: 20,  // Distance from right of page
  fontSize: 8,
  textAlign: 'right',
},
  bankdetails:{
    width:"100%",
    borderTop: "1px solid #0371C1",
     padding: 5,
    flexDirection: 'row',
    // fontSize: 10,
    gap:10,
  },
  dataRowBank:{   
    flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 1,
    gap:0,
  },
  tableLabelBank:{
 fontSize: 8,
    fontWeight: "bold",
    // width: "30%", // Fixed width for labels
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValueBank:{
     fontSize: 8,
    fontWeight: "normal",
    // width: "70%", // Fixed width for values
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  }
});



export const template1Styles = StyleSheet.create({
   page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 25,
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    // marginBottom: 1,
    // borderBottom: '1px solid #000',
    paddingBottom: 4,
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 3,
    alignItems: "flex-start",
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  contactInfo: {
    fontSize: 10,
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },

  contactLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  contactValue: {
    fontSize: 10,
    fontWeight: "normal",
  },
  section: {
    border: "1.5px solid #0371C1",
    padding: 0,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5px solid #0371C1",
  },
  gstRow: {
    flexDirection: "row",
    padding: 4,
  },
  gstLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  gstValue: {
    fontSize: 12,
    fontWeight: "normal",
  },
  invoiceTitleRow: {
    padding: 4,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "extrabold",
    textAlign: "center",
    color: "#0371C1",
  },
  recipientRow: {
    padding: 4,
  },
  recipientText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  threeColSection: {
    flexDirection: "row",
    // marginBottom: 10,
    borderBottom: "2px solid #0371C1",
  },
  column: {
    width: "33.3%",
    paddingHorizontal: 4,
    borderLeft: "1px solid #0371C1",
  },
  columnHeader: {
    marginBottom: 5,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  threecoltableHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "40%", // Fixed width for labels
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValue: {
    fontSize: 8,
    fontWeight: "normal",
    width: "70%", // Fixed width for values
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  },

  // item table style
  itemsTable: {
    // marginTop: 10,
    // border: '1px solid #000',
  },
   tableContainer: {
   position: 'relative',
   width: '100%',
 },
    verticalBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0371C1',
  },
 itemsTableHeader: {
  flexDirection: 'row',
  backgroundColor: 'rgba(3, 113, 193, 0.2)',
  borderBottom: '1px solid #0371C1',
  borderTop:0
},
headerCell: {
  // borderRight: '1px solid #0371C1',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 2,
},
  itemsTableRow: {
    flexDirection: "row",
    // borderBottom: '1px solid #0371C1',
    alignItems: "center",
  },
  itemsTableTotalRow: {
    flexDirection: "row",
    // borderTop: "1px solid #0371C1",
    backgroundColor: "rgba(3, 113, 193, 0.2)",
    alignItems: "center",
  },
  // Header Styles
  srNoHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  productHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "25%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  hsnHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  qtyHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  rateHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  taxableHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
    // borderLeft:"1px solid #0371C1"
  },
  igstHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
  totalHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstMainHeader: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1,
  },
  igstSubHeader: { flexDirection: "row", borderTop: "1px solid #0371C1" },
  igstSubText: {
    fontSize: 6,
    fontWeight: "bold",
    width: "70%",
    textAlign: "center",
    padding: 1,
  },
  igstSubPercentage:{
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
    textAlign: "center",
    padding: 1,
  },

  // Cell Styles
  srNoCell: { fontSize: 7, width: "8%", textAlign: "center", padding: 4 },
  productCell: {
    fontSize: 7,
    width: "25%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
    wrap: true,
  },
  hsnCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  qtyCell: {
    fontSize: 7,
    width: "8%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  rateCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },
  taxableCell: {
    fontSize: 7,
    width: "12%",
    textAlign: "center",
    padding: 4,
     backgroundColor: "rgba(3, 113, 193, 0.2)",
    // borderLeft: "1px solid #0371C1",
    // borderRight: "1px solid #0371C1",
  },
igstCell: {
  flexDirection: "row",
  width: "12%",
  display: "flex",
  justifyContent: "center", // horizontally center children
  alignItems: "center", // vertically center children
  gap: 10,
  // borderLeft: "1px solid #0371C1", // optional
  textAlign: "center",
},
igstPercent: {
  fontSize: 7,
  textAlign: "center",
  padding: 1,
  width: "30%", // ensure consistent spacing
},
igstAmount: {
  fontSize: 7,
  textAlign: "center",
  padding: 1,
  width: "70%",
},
  totalCell: {
    fontSize: 7,
    width: "15%",
    textAlign: "center",
    padding: 4,
    // borderLeft: "1px solid #0371C1",
  },


  // Total Row Styles
  totalLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
  },
  totalEmpty: { fontSize: 7, width: "25%", padding: 2 ,  textAlign: "center",fontWeight:"bold"},
  totalQty: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  totalTaxable: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstTotal: {
    fontSize: 7,
    width: "12%",
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
  totalIgstAmount: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "right",
    padding: 1,
  },
  grandTotal: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },

  // igstHeader: {
  //   flexDirection: 'row',
  //   width: '12%',
  //   borderLeft: '1px solid #000',
  //   borderRight: '1px solid #000',
  // },
  igstPercentHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
    borderRight: "1px solid #000",
  },
  igstAmountHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
  },

  igstPercentCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "center",
    padding: 2,
    // borderRight: '1px solid #ddd',
  },
  igstAmountCell: {
    fontSize: 7,
    // width: '50%',
    textAlign: "center",
    padding: 2,
  },


   bottomSection: {
    flexDirection: "row",
    borderTop: "1px solid #0371C1",
    width: "100%",
    fontSize: 7,
  },

  // Left half
  leftSection: {
    width: "65%",
    borderRight: "1px solid #0371C1",
  },

  totalInWords: {
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #0371C1",
    padding: 4,
    textTransform: "uppercase",
  },

  termsBox: {
    marginTop: 3,
    padding:8
  },
  termLine: {
    fontSize: 7,
    marginBottom: 1,
  },

  qrContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  qrImage: {
    width: 45,
    height: 45,
  },
  qrText: {
    fontSize: 7,
    marginTop: 2,
  },

  // Right half
  rightSection: {
    width: "35%",
    justifyContent: "flex-start",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #0371C1",
    padding: 4,
  },

  label: { fontSize: 8,fontWeight: "bold" },
  value: { fontSize: 8,fontWeight: "bold" },

  labelBold: { fontSize: 8, fontWeight: "bold" },
  valueBold: { fontSize: 8, fontWeight: "bold" },

  highlightRow: {
    backgroundColor: "#EAF4FF",
  },

  currencySymbol: {
    fontSize: 6,
  },

  //hst summary table

  // Add these styles to your templateA5_3Styles
hsnTaxTable: {
  // border: '1px solid #0371C1',
  backgroundColor: '#FFFFFF',
},
hsnTaxTableTitle: {
  backgroundColor: '#0371C1',
  color: '#FFFFFF',
  // padding: 6,
  fontSize: 8,
  fontWeight: 'bold',
  textAlign: 'center',
},
hsnTaxTableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f0f8ff',
  borderBottom: '1px solid #0371C1',
},
hsnTaxHeaderCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '0.5px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableRow: {
  flexDirection: 'row',
  borderBottom: '0.5px solid #0371C1',
},
hsnTaxCell: {
  padding: 1,
  fontSize: 7,
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},
hsnTaxTableTotalRow: {
  flexDirection: 'row',
  backgroundColor: "rgba(3, 113, 193, 0.2)",
  // borderTop: '1px solid #0371C1',
},
hsnTaxTotalCell: {
  padding: 1,
  fontSize: 7,
  fontWeight: 'bold',
  borderRight: '1px solid #0371C1',
  textAlign: 'center',
},

 pageNumber: {
  position: 'absolute',
  bottom: 20, // Distance from bottom of page
  right: 20,  // Distance from right of page
  fontSize: 8,
  textAlign: 'right',
},
});




export const template_t3 = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 20,
      fontSize: 9,
      fontFamily: 'Helvetica',
      paddingHorizontal:100
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      alignItems:"center",
    },
    companyInfo: {
      flex: 1,
      alignItems:"center",
      textAlign:"center",
      width:"100%"
    },
    companyName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    companyAddress: {
      fontSize: 9,
      marginBottom: 2,
      lineHeight: 1.2,
    },
    gstin: {
      fontSize: 9,
      fontWeight: 'bold',
      marginTop: 4,
    },
    invoiceNumber: {
      fontSize: 9,
      marginBottom: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 2,
    },
    billedToSection: {
     flexDirection: 'row',
      justifyContent: 'space-between',
      // marginBottom: 10,
      alignItems:"center",
      gap:4
    },
    billedTo: {
      flex: 2,
    },
    invoiceDetails: {
      flex: 1,
      alignItems: 'flex-end',
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    partyInfo: {
      fontSize: 9,
      lineHeight: 1.2,
    },
    itemsTable: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#000',
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      minHeight: 30,
    },
    tableCell: {
      padding: 4,
      borderRightWidth: 1,
      borderRightColor: '#000',
      justifyContent: 'center',
    },
    lastCell: {
      padding: 4,
      justifyContent: 'center',
    },
    srNoCell: {
      width: '5%',
      textAlign: 'center',
    },
    descriptionCell: {
      width: '50%',
    },
    qtyCell: {
      width: '10%',
      textAlign: 'center',
    },
    rateCell: {
      width: '15%',
      textAlign: 'right',
      paddingRight: 8,
    },
    totalCell: {
      width: '20%',
      textAlign: 'right',
      paddingRight: 8,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.2,
    },
    itemCode: {
      fontSize: 8,
      color: '#666',
    },
    hsnCode: {
      fontSize: 8,
      fontWeight: 'bold',
      marginTop: 2,
    },
    totalsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
    },
    totalsTable: {
      width: '40%',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      paddingHorizontal: 8,
    },
    totalLabel: {
      fontWeight: 'bold',
    },
    totalValue: {
      textAlign: 'right',
    },
    footer: {
      marginTop: 20,
      fontSize: 8,
      textAlign: 'center',
      color: '#666',
    },
  });
