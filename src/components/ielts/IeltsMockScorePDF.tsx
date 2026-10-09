import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { IeltsCriterion } from '@/types/ielts-essay';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';

/* ─── Palette (IELTS = crimson theme) ─── */
const NAVY = '#0F172A';
const CRIMSON = '#DC2626';
const SLATE = '#334155';
const MUTED = '#64748B';
const LIGHT_BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const WHITE = '#FFFFFF';
const GREEN = '#059669';

export interface MockPDFMeta {
  studentName: string;
  studentEmail?: string;
  date: string;
}

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 10, color: SLATE, fontFamily: 'Helvetica', lineHeight: 1.5 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: NAVY },
  brandSub: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 },
  brandRight: { alignItems: 'flex-end' },
  reportTag: { fontSize: 8, color: CRIMSON, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  web: { fontSize: 8, color: MUTED, marginTop: 2 },
  rule: { height: 2, backgroundColor: CRIMSON, marginBottom: 12, borderRadius: 1 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: LIGHT_BG, borderRadius: 6, padding: 10, marginBottom: 14, border: `1 solid ${BORDER}` },
  metaCell: { width: '50%', marginBottom: 4 },
  metaLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 10, color: NAVY, fontFamily: 'Helvetica-Bold' },
  bandHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 8, padding: 16, marginBottom: 14 },
  bandBig: { fontSize: 40, fontFamily: 'Helvetica-Bold', color: WHITE },
  bandOf: { fontSize: 12, color: '#94A3B8', marginLeft: 2 },
  bandLabel: { fontSize: 13, color: WHITE, fontFamily: 'Helvetica-Bold' },
  bandExpl: { fontSize: 9, color: '#CBD5E1', marginTop: 2 },
  skillRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  skillCard: { flex: 1, border: `1 solid ${BORDER}`, borderRadius: 6, padding: 10, alignItems: 'center' },
  skillName: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  skillBand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: CRIMSON, marginVertical: 2 },
  skillSub: { fontSize: 8, color: SLATE },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  critCard: { border: `1 solid ${BORDER}`, borderRadius: 6, padding: 9, marginBottom: 7 },
  critHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  critName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  critBand: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: CRIMSON },
  critReason: { fontSize: 9, color: SLATE, marginBottom: 3 },
  subLabel: { fontSize: 7.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3, marginBottom: 1 },
  bullet: { flexDirection: 'row', marginBottom: 1.5 },
  bulletDot: { width: 8, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9 },
  taskHdr: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4, marginTop: 2 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderTop: `1 solid ${BORDER}`, paddingTop: 6 },
  disclaimer: { fontSize: 7.5, color: MUTED, marginTop: 6, fontStyle: 'italic' },
});

function Bullets({ items, color = SLATE }: { items?: string[]; color?: string }) {
  if (!items?.length) return null;
  return <View>{items.map((it, i) => <View style={s.bullet} key={i}><Text style={[s.bulletDot, { color }]}>•</Text><Text style={s.bulletText}>{it}</Text></View>)}</View>;
}

function CriterionCard({ c }: { c: IeltsCriterion }) {
  return (
    <View style={s.critCard} wrap={false}>
      <View style={s.critHead}><Text style={s.critName}>{c.name}</Text><Text style={s.critBand}>{c.band}<Text style={{ fontSize: 8, color: MUTED }}> / 9</Text></Text></View>
      {!!c.reason && <Text style={s.critReason}>{c.reason}</Text>}
      {!!c.strengths?.length && (<><Text style={s.subLabel}>Strengths</Text><Bullets items={c.strengths} color={GREEN} /></>)}
      {!!c.weaknesses?.length && (<><Text style={s.subLabel}>Weaknesses</Text><Bullets items={c.weaknesses} color={CRIMSON} /></>)}
    </View>
  );
}

export function IeltsMockScorePDF({ meta, result }: { meta: MockPDFMeta; result: IeltsMockResult }) {
  return (
    <Document title={`SmartLabs IELTS Mock Report — ${meta.studentName}`} author="Smart Labs">
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <View>
            <Text style={s.brand}>SMART LABS</Text>
            <Text style={s.brandSub}>IELTS Academic · Mock Test Report</Text>
          </View>
          <View style={s.brandRight}>
            <Text style={s.reportTag}>Band Report</Text>
            <Text style={s.web}>smartlabs.lk</Text>
            <Text style={s.web}>contact@smartlabs.lk · 070 691 4652</Text>
          </View>
        </View>
        <View style={s.rule} />

        <View style={s.metaGrid}>
          <View style={s.metaCell}><Text style={s.metaLabel}>Student</Text><Text style={s.metaValue}>{meta.studentName}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Date</Text><Text style={s.metaValue}>{meta.date}</Text></View>
          {!!meta.studentEmail && <View style={s.metaCell}><Text style={s.metaLabel}>Email</Text><Text style={s.metaValue}>{meta.studentEmail}</Text></View>}
          <View style={s.metaCell}><Text style={s.metaLabel}>Mock test</Text><Text style={s.metaValue}>{result.title}</Text></View>
        </View>

        <View style={s.bandHero}>
          <Text style={s.bandBig}>{result.overall}</Text>
          <Text style={s.bandOf}>/ 9</Text>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={s.bandLabel}>Overall Band · {result.overallLabel}</Text>
            <Text style={s.bandExpl}>(Listening {result.listening.band} + Reading {result.reading.band} + Writing {result.writing.band}) ÷ 3. Speaking is assessed in person.</Text>
          </View>
        </View>

        <View style={s.skillRow}>
          <View style={s.skillCard}><Text style={s.skillName}>Listening</Text><Text style={s.skillBand}>{result.listening.band}</Text><Text style={s.skillSub}>{result.listening.raw}/{result.listening.total} correct</Text></View>
          <View style={s.skillCard}><Text style={s.skillName}>Reading</Text><Text style={s.skillBand}>{result.reading.band}</Text><Text style={s.skillSub}>{result.reading.raw}/{result.reading.total} correct</Text></View>
          <View style={s.skillCard}><Text style={s.skillName}>Writing</Text><Text style={s.skillBand}>{result.writing.band}</Text><Text style={s.skillSub}>T1 {result.writing.task1Band} · T2 {result.writing.task2Band}</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Writing feedback</Text>
          <Text style={s.taskHdr}>Task 1 · Band {result.writing.task1Band}</Text>
          {(result.writing.task1.criteria || []).map((c, i) => <CriterionCard c={c} key={`t1${i}`} />)}
          <Text style={s.taskHdr}>Task 2 · Band {result.writing.task2Band}</Text>
          {(result.writing.task2.criteria || []).map((c, i) => <CriterionCard c={c} key={`t2${i}`} />)}
        </View>

        <Text style={s.disclaimer}>This is an estimated band report generated by Smart Labs for practice purposes and is not an official IELTS result.</Text>

        <View style={s.footer} fixed>
          <Text>Smart Labs · smartlabs.lk · AI IELTS Mock Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
