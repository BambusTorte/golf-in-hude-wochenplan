import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PdfPlanData } from "./data";

const BRAND = "#094d3b";
const BRAND_DARK = "#053024";
const ACCENT = "#57c184";
const BORDER = "#d6e0db";
const ZEBRA = "#f2f7f4";
const INK = "#0b3529";
const MUTED = "#5f7d72";

// Spaltenbreiten (Summe = 100) – entspricht der gedruckten Vorlage.
const COLS = {
  weekday: "11%",
  event: "29%",
  course: "13%",
  start: "9%",
  holes: "7%",
  tee: "9%",
  tn: "8%",
  art: "14%",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 42,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 46, height: 46, borderRadius: 23 },
  title: { fontSize: 18, fontWeight: 700, color: BRAND },
  subtitle: { fontSize: 10, color: MUTED, marginTop: 2 },
  claim: { fontSize: 12, fontWeight: 700, color: ACCENT, textAlign: "right" },
  claimSub: { fontSize: 8, color: MUTED, textAlign: "right", marginTop: 2 },

  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 4 },
  theadRow: { flexDirection: "row", backgroundColor: BRAND },
  th: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    minHeight: 22,
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  cellBorderLeft: { borderLeftWidth: 1, borderLeftColor: BORDER },
  weekdayText: { fontWeight: 700, color: BRAND },
  eventTitle: { fontWeight: 700 },
  muted: { color: MUTED },
  legend: {
    marginTop: 12,
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
  },
});

function HeaderCell({
  label,
  width,
  first,
}: {
  label: string;
  width: string;
  first?: boolean;
}) {
  return (
    <Text style={[styles.th, { width }, first ? {} : styles.cellBorderLeft]}>
      {label}
    </Text>
  );
}

function Cell({
  children,
  width,
  first,
  zebra,
  center,
}: {
  children: React.ReactNode;
  width: string;
  first?: boolean;
  zebra?: boolean;
  center?: boolean;
}) {
  return (
    <View
      style={[
        styles.cell,
        { width },
        first ? {} : styles.cellBorderLeft,
        zebra ? { backgroundColor: ZEBRA } : {},
        center ? { alignItems: "center" } : {},
      ]}
    >
      {children}
    </View>
  );
}

interface RowData {
  weekdayLabel: string;
  event: {
    title: string;
    course: string;
    startTime: string;
    holes: string;
    tee: string;
    participants: string;
    playType: string;
  } | null;
  zebra: boolean;
}

/** Flacht die Tag-Gruppen zu Tabellenzeilen ab (Wochentag nur in der 1. Zeile). */
function toRows(data: PdfPlanData): RowData[] {
  const rows: RowData[] = [];
  data.days.forEach((day, dayIdx) => {
    const zebra = dayIdx % 2 === 1;
    if (day.events.length === 0) {
      rows.push({ weekdayLabel: day.label, event: null, zebra });
    } else {
      day.events.forEach((event, i) => {
        rows.push({
          weekdayLabel: i === 0 ? day.label : "",
          event,
          zebra,
        });
      });
    }
  });
  return rows;
}

export function WochenplanDocument({
  data,
  logo,
}: {
  data: PdfPlanData;
  logo?: string;
}) {
  const rows = toRows(data);
  return (
    <Document
      title={data.title}
      author="Golf in Hude e. V."
      creator="Golf in Hude Wochenplan"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {/* react-pdf Image (kein DOM-<img>, kein alt-Attribut) */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={logo} style={styles.logo} /> : null}
            <View>
              <Text style={styles.title}>{data.title}</Text>
              {data.subtitle ? (
                <Text style={styles.subtitle}>{data.subtitle}</Text>
              ) : null}
            </View>
          </View>
          <View>
            <Text style={styles.claim}>Golf. In Hude!</Text>
            <Text style={styles.claimSub}>www.golfinhude.de</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.theadRow} fixed>
            <HeaderCell label="Wochentag" width={COLS.weekday} first />
            <HeaderCell label="Turnier / Event" width={COLS.event} />
            <HeaderCell label="Platz" width={COLS.course} />
            <HeaderCell label="Startzeit" width={COLS.start} />
            <HeaderCell label="Löcher" width={COLS.holes} />
            <HeaderCell label="Tee" width={COLS.tee} />
            <HeaderCell label="TN" width={COLS.tn} />
            <HeaderCell label="Spielart" width={COLS.art} />
          </View>

          {rows.map((r, idx) => (
            <View key={idx} style={styles.row} wrap={false}>
              <Cell width={COLS.weekday} first zebra={r.zebra}>
                <Text style={styles.weekdayText}>{r.weekdayLabel}</Text>
              </Cell>
              <Cell width={COLS.event} zebra={r.zebra}>
                {r.event ? (
                  <Text style={styles.eventTitle}>{r.event.title}</Text>
                ) : (
                  <Text style={styles.muted}>keine Veranstaltung</Text>
                )}
              </Cell>
              <Cell width={COLS.course} zebra={r.zebra}>
                <Text>{r.event ? r.event.course : ""}</Text>
              </Cell>
              <Cell width={COLS.start} zebra={r.zebra} center>
                <Text>{r.event ? r.event.startTime : ""}</Text>
              </Cell>
              <Cell width={COLS.holes} zebra={r.zebra} center>
                <Text>{r.event ? r.event.holes : ""}</Text>
              </Cell>
              <Cell width={COLS.tee} zebra={r.zebra} center>
                <Text>{r.event ? r.event.tee : ""}</Text>
              </Cell>
              <Cell width={COLS.tn} zebra={r.zebra} center>
                <Text>{r.event ? r.event.participants : ""}</Text>
              </Cell>
              <Cell width={COLS.art} zebra={r.zebra}>
                <Text>{r.event ? r.event.playType : ""}</Text>
              </Cell>
            </View>
          ))}
        </View>

        <Text style={styles.legend}>{data.legend}</Text>
        <Text style={[styles.legend, { fontWeight: 700 }]}>
          Änderungen vorbehalten!
        </Text>

        <View style={styles.footer} fixed>
          <Text>Golf in Hude e. V.</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Seite ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
