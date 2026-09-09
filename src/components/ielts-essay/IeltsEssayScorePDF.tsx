import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { IeltsEssayResult, IeltsCriterion } from '@/types/ielts-essay';

/* ─── Palette (IELTS = crimson theme) ───────────────────────────────────── */
const NAVY = '#0F172A';
const CRIMSON = '#DC2626';
const SLATE = '#334155';
const MUTED = '#64748B';
const LIGHT_BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const WHITE = '#FFFFFF';
const GREEN = '#059669';
const GREEN_BG = '#ECFDF5';
const RED = '#DC2626';
const RED_BG = '#FEF2F2';
const CRIMSON_BG = '#FEF2F2';

export interface IeltsPDFMeta {
  studentName: string;
  studentEmail?: string;
  date: string;
  topic: string;
  wordCount: number;
  targetBand?: number | null;
}
export type IeltsPDFResult = IeltsEssayResult & { essayText?: string };

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 10, color: SLATE, fontFamily: 'Helvetica', lineHeight: 1.5 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY },
  brandSub: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  reportTag: { fontSize: 8, color: CRIMSON, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  rule: { height: 2, backgroundColor: CRIMSON, marginBottom: 12, borderRadius: 1 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: LIGHT_BG, borderRadius: 6, padding: 10, marginBottom: 14, border: `1 solid ${BORDER}` },
  metaCell: { width: '50%', marginBottom: 4 },
  metaLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 10, color: NAVY, fontFamily: 'Helvetica-Bold' },
  bandHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, borderRadius: 8, padding: 14, marginBottom: 14 },
  bandBig: { fontSize: 34, fontFamily: 'Helvetica-Bold', color: WHITE },
  bandOf: { fontSize: 12, color: '#94A3B8', marginLeft: 2 },
  bandLabel: { fontSize: 12, color: WHITE, fontFamily: 'Helvetica-Bold' },
  bandExpl: { fontSize: 9, color: '#CBD5E1', marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  essayBox: { backgroundColor: WHITE, border: `1 solid ${BORDER}`, borderRadius: 6, padding: 10 },
  essayText: { fontSize: 9.5, color: SLATE, lineHeight: 1.6 },
  critCard: { border: `1 solid ${BORDER}`, borderRadius: 6, padding: 10, marginBottom: 8 },
  critHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  critName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY },
  critBand: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: CRIMSON },
  critReason: { fontSize: 9, color: SLATE, marginBottom: 4 },
  subLabel: { fontSize: 7.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3, marginBottom: 1 },
  bullet: { flexDirection: 'row', marginBottom: 1.5 },
  bulletDot: { width: 8, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  box: { borderRadius: 6, padding: 9, marginBottom: 8 },
  boxTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED, borderTop: `1 solid ${BORDER}`, paddingTop: 6 },
});

function Bullets({ items, color = SLATE }: { items?: string[]; color?: string }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((it, i) => (
        <View style={s.bullet} key={i}>
          <Text style={[s.bulletDot, { color }]}>•</Text>
          <Text style={s.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}
function ErrList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View>
      <Text style={s.subLabel}>{label}</Text>
      <Bullets items={items} color={RED} />
    </View>
  );
}

function CriterionCard({ c }: { c: IeltsCriterion }) {
  return (
    <View style={s.critCard} wrap={false}>
      <View style={s.critHead}>
        <Text style={s.critName}>{c.name}</Text>
        <Text style={s.critBand}>{c.band}<Text style={{ fontSize: 8, color: MUTED }}> / 9</Text></Text>
      </View>
      {!!c.reason && <Text style={s.critReason}>{c.reason}</Text>}
      {!!c.strengths?.length && (<><Text style={s.subLabel}>Strengths</Text><Bullets items={c.strengths} color={GREEN} /></>)}
      {!!c.weaknesses?.length && (<><Text style={s.subLabel}>Weaknesses</Text><Bullets items={c.weaknesses} color={CRIMSON} /></>)}
      <ErrList label="Vocabulary errors" items={c.vocabularyErrors} />
      <ErrList label="Collocation errors" items={c.collocationErrors} />
      <ErrList label="Spelling errors" items={c.spellingErrors} />
      <ErrList label="Sentence-structure errors" items={c.sentenceStructureErrors} />
      <ErrList label="Grammar errors" items={c.grammarErrors} />
      <ErrList label="Punctuation errors" items={c.punctuationErrors} />
      {!!c.goodVocabulary?.length && (<><Text style={s.subLabel}>Good vocabulary used</Text><Bullets items={c.goodVocabulary} color={GREEN} /></>)}
    </View>
  );
}

export function IeltsEssayScorePDF({ meta, result }: { meta: IeltsPDFMeta; result: IeltsPDFResult }) {
  const tba = result.targetBandAnalysis;
  return (
    <Document title={`SmartLabs IELTS Essay Report — ${meta.studentName}`} author="Smart Labs">
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <View>
            <Text style={s.brand}>SMART LABS</Text>
            <Text style={s.brandSub}>IELTS Writing Task 2 · Essay Report</Text>
          </View>
          <Text style={s.reportTag}>Examiner-style report</Text>
        </View>
        <View style={s.rule} />

        {/* Meta */}
        <View style={s.metaGrid}>
          <View style={s.metaCell}><Text style={s.metaLabel}>Student</Text><Text style={s.metaValue}>{meta.studentName}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Date</Text><Text style={s.metaValue}>{meta.date}</Text></View>
          {!!meta.studentEmail && <View style={s.metaCell}><Text style={s.metaLabel}>Email</Text><Text style={s.metaValue}>{meta.studentEmail}</Text></View>}
          <View style={s.metaCell}><Text style={s.metaLabel}>Question type</Text><Text style={s.metaValue}>{result.questionType || '—'}</Text></View>
          <View style={s.metaCell}><Text style={s.metaLabel}>Word count</Text><Text style={s.metaValue}>{meta.wordCount}</Text></View>
          {meta.targetBand != null && <View style={s.metaCell}><Text style={s.metaLabel}>Target band</Text><Text style={s.metaValue}>{meta.targetBand}</Text></View>}
        </View>

        {/* Overall band */}
        <View style={s.bandHero}>
          <Text style={s.bandBig}>{result.overallBand}</Text>
          <Text style={s.bandOf}>/ 9</Text>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={s.bandLabel}>{result.bandLabel}</Text>
            {!!result.overallExplanation && <Text style={s.bandExpl}>{result.overallExplanation}</Text>}
          </View>
        </View>

        {/* Question */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Question</Text>
          <View style={s.essayBox}><Text style={s.essayText}>{meta.topic}</Text></View>
        </View>

        {/* Student's answer */}
        {!!result.essayText && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Student&apos;s Answer</Text>
            <View style={s.essayBox}><Text style={s.essayText}>{result.essayText}</Text></View>
          </View>
        )}

        {/* Criteria */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Criteria breakdown (0–9)</Text>
          {(result.criteria || []).map((c, i) => <CriterionCard c={c} key={i} />)}
        </View>

        {/* Major errors */}
        {!!result.majorErrors?.length && (
          <View style={[s.box, { backgroundColor: RED_BG, border: `1 solid ${BORDER}` }]} wrap={false}>
            <Text style={[s.boxTitle, { color: CRIMSON }]}>Major errors</Text>
            <Bullets items={result.majorErrors} color={CRIMSON} />
          </View>
        )}

        {/* Improvement advice */}
        {!!result.bandImprovementAdvice?.length && (
          <View style={[s.box, { backgroundColor: LIGHT_BG, border: `1 solid ${BORDER}` }]} wrap={false}>
            <Text style={[s.boxTitle, { color: NAVY }]}>How to reach the next band</Text>
            <Bullets items={result.bandImprovementAdvice} color={CRIMSON} />
          </View>
        )}

        {/* Band 9 suggestions */}
        {result.band9Suggestions && (
          <View style={[s.box, { backgroundColor: GREEN_BG, border: `1 solid ${BORDER}` }]} wrap={false}>
            <Text style={[s.boxTitle, { color: GREEN }]}>Towards Band 9</Text>
            <Text style={s.subLabel}>Vocabulary</Text><Text style={s.bulletText}>{result.band9Suggestions.vocabulary}</Text>
            <Text style={s.subLabel}>Grammar</Text><Text style={s.bulletText}>{result.band9Suggestions.grammar}</Text>
            <Text style={s.subLabel}>Idea development</Text><Text style={s.bulletText}>{result.band9Suggestions.ideaDevelopment}</Text>
            <Text style={s.subLabel}>Organization</Text><Text style={s.bulletText}>{result.band9Suggestions.organization}</Text>
          </View>
        )}

        {/* Target band analysis */}
        {tba && (
          <View style={[s.box, { backgroundColor: CRIMSON_BG, border: `1 solid ${BORDER}` }]} wrap={false}>
            <Text style={[s.boxTitle, { color: CRIMSON }]}>
              Target band {meta.targetBand} · {tba.achieved ? 'Achieved' : `Gap of ${tba.gap} band(s)`}
            </Text>
            {!!tba.primaryReasons?.length && (<><Text style={s.subLabel}>Primary reasons</Text><Bullets items={tba.primaryReasons} color={CRIMSON} /></>)}
            {!!tba.studyPriority && (<><Text style={s.subLabel}>Study priority</Text><Text style={s.bulletText}>{tba.studyPriority}</Text></>)}
            {!!tba.realisticTimeline && (<><Text style={s.subLabel}>Realistic timeline</Text><Text style={s.bulletText}>{tba.realisticTimeline}</Text></>)}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>Smart Labs · AI IELTS Essay Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
