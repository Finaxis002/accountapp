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
    padding: 40,
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E74FF",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 16,
  },
  addressText: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
  },
  boldText: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },
  normalText: {
    fontSize: 10,
    marginBottom: 3,
  },
  divider: {
    borderBottom: "0.5px solid #000000",
    marginVertical: 16,
  },
  threeColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  column: {
    flex: 1,
    marginRight: 20,
  },
  lastColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#003399",
    color: "#FFFFFF",
    padding: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #000000",
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    borderRight: "0.5px solid #000000",
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
});
