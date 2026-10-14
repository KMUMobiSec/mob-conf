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
import { SEAL_PATH } from "./certificate-assets";

// Keep hyphenated names (e.g. "Berners-Lee") and long titles from being split across lines.
Font.registerHyphenationCallback((word) => [word]);

// Serif certificate typography using react-pdf's built-in Times family (no vendored fonts needed).
const SERIF = "Times-Roman";
const SERIF_BOLD = "Times-Bold";

const styles = StyleSheet.create({
  page: {
    padding: 72, // 1 inch margin
    backgroundColor: "#ffffff",
  },
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topSection: {
    width: "100%",
    marginHorizontal: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  titleContainer: { textAlign: "center", width: "100%" },
  certificateTitle: {
    fontSize: 32,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 15,
  },
  eventDetails: {
    fontSize: 14,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    lineHeight: 1.2,
    marginBottom: 15,
    letterSpacing: 1.5,
  },
  dateContainer: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    width: "100%",
    textAlign: "right",
  },
  dateText: { fontSize: 12, fontFamily: SERIF, color: "#000000", textAlign: "right" },
  middleSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 40,
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
  },
  recipientName: {
    fontSize: 20,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 5,
  },
  affiliation: {
    fontSize: 20,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 25,
  },
  appreciationText: {
    fontSize: 14,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  paperTitle: {
    fontSize: 14,
    fontFamily: SERIF_BOLD,
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
    maxWidth: "80%",
  },
  recognitionText: {
    fontSize: 14,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
  },
  conferenceContext: {
    fontSize: 14,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
  },
  bottomSection: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: 10,
  },
  eventInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    textAlign: "right",
  },
  eventName: {
    fontSize: 12,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "right",
    lineHeight: 1.2,
    marginBottom: 4,
    maxWidth: 300,
  },
  eventLocation: {
    fontSize: 10,
    fontFamily: SERIF,
    color: "#000000",
    textAlign: "right",
    marginBottom: 2,
  },
  eventDates: { fontSize: 10, fontFamily: SERIF, color: "#000000", textAlign: "right" },
  sealContainer: { display: "flex", justifyContent: "center", alignItems: "center" },
  seal: { width: 80, height: 80 },
});

interface CertificateEventInfo {
  fullEventName: string;
  eventLocation: string;
  eventDates: string;
  certificateDate: string;
}

/** Derive the certificate's event strings from the year's conference config. */
function certificateEventInfo(year: ValidYear): CertificateEventInfo {
  const config = YEAR_CONFIG[year];
  return {
    // Line break groups the (MOBISEC ####) acronym under the full symposium name, as on the print design.
    fullEventName: `The ${year} KIISC International Conference on Mobile Internet Security\n(MOBISEC ${year})`,
    eventLocation: `${config.venue}, ${config.location}`,
    eventDates: config.dates,
    // Issued date = last conference day, formatted "####. MM. DD" to match the print certificates.
    certificateDate: config.endDate.replaceAll("-", ". "),
  };
}

export type CertificateInput =
  | {
      kind: "participant";
      year: ValidYear;
      recipientName: string;
      affiliation: string;
      /** Role acknowledged, e.g. "Participant", "Keynote Speaker", "Session Chair". */
      recognitionTitle: string;
    }
  | {
      kind: "author";
      year: ValidYear;
      recipientName: string;
      affiliation: string;
      paperTitle: string;
    };

function EventFooter({ info }: { info: CertificateEventInfo }) {
  return (
    <View style={styles.bottomSection}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} wrap={false}>
          {info.fullEventName}
        </Text>
        <Text style={styles.eventLocation}>{info.eventLocation}</Text>
        <Text style={styles.eventDates}>{info.eventDates}</Text>
      </View>
      {SEAL_PATH && (
        <View style={styles.sealContainer}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={SEAL_PATH} style={styles.seal} />
        </View>
      )}
    </View>
  );
}

function CertificateDocument({ input }: { input: CertificateInput }) {
  const info = certificateEventInfo(input.year);
  const heldLine = `held in ${info.eventLocation.split(",")[0]}, ${info.eventDates}`;

  return (
    <Document>
      <Page size={[595, 842]} style={styles.page}>
        <View style={styles.container}>
          <View style={styles.topSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.certificateTitle}>Certificate of Appreciation</Text>
              <Text style={styles.eventDetails}>{info.fullEventName}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>Date: {info.certificateDate}</Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            <Text style={styles.confirmationText}>We hereby confirm that</Text>
            <Text style={styles.recipientName}>{input.recipientName}</Text>
            {input.affiliation ? <Text style={styles.affiliation}>{input.affiliation}</Text> : null}

            {input.kind === "author" ? (
              <>
                <Text style={styles.appreciationText}>
                  in recognition as the{" "}
                  {/,| and /i.test(input.recipientName) ? "Authors" : "Author"} of the paper
                  entitled
                </Text>
                <Text style={styles.paperTitle}>&ldquo;{input.paperTitle}&rdquo;</Text>
                <Text style={styles.recognitionText}>
                  presented at the {input.year} KIISC International Conference on Mobile Internet
                  Security
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.appreciationText}>
                  in recognition as the {input.recognitionTitle}
                </Text>
                <Text style={styles.recognitionText}>
                  to the success of the {input.year} KIISC International Conference on Mobile
                  Internet Security
                </Text>
              </>
            )}

            <Text style={styles.conferenceContext}>{heldLine}</Text>
          </View>

          <EventFooter info={info} />
        </View>
      </Page>
    </Document>
  );
}

/** Render a certificate PDF to a Buffer (both download route and email attachment use this). */
export function renderCertificate(input: CertificateInput): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument input={input} />);
}

/** File-safe certificate filename, e.g. "mobisec-2026-certificate-Ada_Lovelace.pdf". */
export function certificateFilename(year: ValidYear, recipientName: string): string {
  const safeName = recipientName.trim().replace(/[^a-zA-Z0-9]/g, "_") || "participant";
  return `mobisec-${year}-certificate-${safeName}.pdf`;
}
