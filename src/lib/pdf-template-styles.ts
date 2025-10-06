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

  grayColor:{
    color:"#262626"
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
  divider:{
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
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2583C6",
    color: "#FFFFFF",
    paddingLeft:0,
    paddingRight:0,
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
  tableCellSize7:{
    fontSize:7
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
  fontFamily: 'YourChosenFont', // Use fonts like NotoSans, Roboto, etc.
},
smallRs: {
  fontSize: 8, // Adjust size as needed
  // You can also add other styling if needed
  // fontWeight: 'normal',
  // color: '#666',
}
  
});
