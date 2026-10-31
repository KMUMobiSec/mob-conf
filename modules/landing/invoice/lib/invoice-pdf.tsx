import {
  Document,
  Font,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { type ValidYear, YEAR_CONFIG } from "@/constants/config";
import type { RegistrationOrder } from "@/db/schema";
import { SEAL_PATH } from "@/modules/admin/certificates/lib/certificate-assets";

Font.registerHyphenationCallback((word) => [word]);

const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";

// Layout matches the society's own MOBISEC receipt template (see public/assets/invoice/ex-receipt.pdf):
// centered title, a small receipt-no/date box, a plain "To" block, a two-column fee table, and a
// centered conference footer beside the official red seal.
const styles = StyleSheet.create({
  page: { padding: 64, backgroundColor: "#ffffff", fontFamily: SERIF, fontSize: 11 },
  title: { fontSize: 28, fontFamily: SERIF_BOLD, textAlign: "center", letterSpacing: 2 },
  subtitle: {
    fontSize: 13,
    fontFamily: SERIF_BOLD,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 1.4,
  },
  metaBox: {
    alignSelf: "flex-end",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#121212",
  },
  metaRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#121212",
  },
  metaRowLast: { display: "flex", flexDirection: "row" },
  metaLabel: {
    width: 90,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#121212",
    backgroundColor: "#f3f3f3",
  },
  metaValue: { width: 110, padding: 5 },
  statusBadge: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 9,
    fontFamily: SERIF_BOLD,
    color: "#777777",
  },
  toBlock: { marginTop: 28 },
  line: { marginBottom: 2 },
  table: { marginTop: 24, borderWidth: 1, borderColor: "#121212" },
  tableHeaderRow: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    borderBottomWidth: 1,
    borderBottomColor: "#121212",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#121212",
  },
  tableRowLast: { display: "flex", flexDirection: "row" },
  descCell: { flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: "#121212" },
  descHeaderCell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#121212",
    fontFamily: SERIF_BOLD,
    textAlign: "center",
  },
  amountCell: { width: 110, padding: 8, textAlign: "right" },
  amountHeaderCell: { width: 110, padding: 6, fontFamily: SERIF_BOLD, textAlign: "center" },
  totalLabelCell: { flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: "#121212" },
  footer: {
    marginTop: 64,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  footerText: { textAlign: "center" },
  footerTitle: { fontSize: 13, fontFamily: SERIF_BOLD, textAlign: "center", lineHeight: 1.3 },
  footerMeta: { fontSize: 10, color: "#333333", textAlign: "center", marginTop: 4 },
  seal: { width: 72, height: 72 },
});

export interface InvoicePdfInput {
  order: RegistrationOrder;
  year: ValidYear;
}

/** "MobiSec{yy}-{4 hex}" — a stable, readable reference derived from the invoice token. */
function receiptNo(order: RegistrationOrder): string {
  const yy = String(order.year).slice(2);
  return `MobiSec${yy}-${order.invoiceToken.slice(0, 4).toUpperCase()}`;
}

function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}. ${date.getUTCMonth() + 1}. ${date.getUTCDate()}`;
}

function InvoiceDocument({ order, year }: InvoicePdfInput) {
  const config = YEAR_CONFIG[year];
  const isPaid = order.status === "paid";
  const docTitle = isPaid ? "RECEIPT" : "INVOICE";
  const issueDate = formatDate(order.paidAt ?? order.createdAt);
  const fullName = `${order.firstName} ${order.lastName}`.trim();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{docTitle}</Text>
        <Text style={styles.subtitle}>
          {`The ${config.edition} International Conference on\nMobile Internet Security (MobiSec ${year})`}
        </Text>

        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Receipt No.</Text>
            <Text style={styles.metaValue}>{receiptNo(order)}</Text>
          </View>
          <View style={styles.metaRowLast}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{issueDate}</Text>
          </View>
        </View>
        <Text style={styles.statusBadge}>{isPaid ? "PAID" : "UNPAID — PAYMENT PENDING"}</Text>

        <View style={styles.toBlock}>
          <Text style={styles.line}>To</Text>
          <Text style={[styles.line, { fontFamily: SERIF_BOLD }]}>{fullName}</Text>
          <Text style={styles.line}>{order.affiliation}</Text>
          <Text style={styles.line}>e-mail: {order.email}</Text>
          {order.billingOrganization && (
            <Text style={styles.line}>{order.billingOrganization}</Text>
          )}
          {order.billingAddress && <Text style={styles.line}>{order.billingAddress}</Text>}
          {(order.billingCity || order.billingState || order.billingZipCode) && (
            <Text style={styles.line}>
              {[order.billingCity, order.billingState, order.billingZipCode]
                .filter(Boolean)
                .join(", ")}
            </Text>
          )}
          {order.billingVatNumber && <Text style={styles.line}>VAT: {order.billingVatNumber}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.descHeaderCell}>Description</Text>
            <Text style={styles.amountHeaderCell}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.descCell}>
              {`MobiSec ${year} ${order.categoryName}`}
              {order.paperTitle ? `\n“${order.paperTitle}”` : ""}
            </Text>
            <Text style={styles.amountCell}>{Number(order.subtotal).toFixed(0)} USD</Text>
          </View>
          {Number(order.discount) > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.descCell}>Discount</Text>
              <Text style={styles.amountCell}>-{Number(order.discount).toFixed(0)} USD</Text>
            </View>
          )}
          <View style={styles.tableRowLast}>
            <Text style={[styles.totalLabelCell, { fontFamily: SERIF_BOLD }]}>Total Amount</Text>
            <Text style={[styles.amountCell, { fontFamily: SERIF_BOLD }]}>
              {Number(order.total).toFixed(0)} USD
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerText}>
            <Text style={styles.footerTitle}>
              {`The ${config.edition} International Conference on\nMobile Internet Security (MobiSec ${year})`}
            </Text>
            <Text style={styles.footerMeta}>
              {config.venue}, {config.location}
            </Text>
            <Text style={styles.footerMeta}>{config.dates}</Text>
          </View>
          {SEAL_PATH && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={SEAL_PATH} style={styles.seal} />
          )}
        </View>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...input} />);
}

export function invoiceFilename(order: RegistrationOrder): string {
  const kind = order.status === "paid" ? "receipt" : "invoice";
  return `mobisec-${order.year}-${kind}-${order.invoiceToken.slice(0, 8)}.pdf`;
}
