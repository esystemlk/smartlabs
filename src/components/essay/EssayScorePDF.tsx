import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/* ─── Brand palette ─────────────────────────────────────────────────────── */
const NAVY = '#0F172A';
const AMBER = '#F59E0B';
const AMBER_LIGHT = '#FBBF24';
const SLATE = '#334155';
const MUTED = '#64748B';
const LIGHT_BG = '#F8FAFC';
const BORDER = '#E2E8F0';
const WHITE = '#FFFFFF';
const GREEN = '#059669';
const GREEN_BG = '#ECFDF5';
const GREEN_BORDER = '#A7F3D0';
const RED = '#DC2626';
const RED_BG = '#FEF2F2';
const ORANGE = '#C2410C';
const ORANGE_BG = '#FFF7ED';
const ORANGE_BORDER = '#FED7AA';
const BLUE = '#2563EB';

/* ─── Data shapes (mirror of the page's AIResponse) ─────────────────────── */
export interface EssayPDFMeta {
  studentName: string;
  studentEmail?: string;
  date: string;
  topic: string;
  wordCount: number;
  timeTaken: string;
  targetScore?: number | null;
}

export interface EssayPDFResult {
  overallBand: number;
  bandLabel: string;
  summaryTitle: string;
  summaryText: string;
  criteria: { name: string; score: number; max: number; comment: string }[];
  strengths: string[];
  improvements: string[];
  structureAnalysis?: string;
  modelEssay?: string;
  actionableFeedback?: { issue: string; howToFix: string }[];
  vocabUpgrades?: { basic: string; better: string }[];
  contentAnalysis?: { score: number; reason: string };
  structureDetail?: {
    paragraphCount: number;
    paragraphCountCorrect: boolean;
    introduction: string;
    bodyParagraph1: string;
    bodyParagraph2: string;
    conclusion: string;
    overallBalance: string;
    followsIdealStrategy: boolean;
  };
  coherenceAnalysis?: {
    oneIdeaPerParagraph: boolean;
    logicalFlow: string;
    paragraphUnity: string;
    sentenceConnection: string;
    transitionQuality: string;
    breakPoints: string[];
  };
  thesisDevelopment?: {
    clarityOfThesis: string;
    consistencyOfArguments: string;
    bodySupportsThesis: boolean;
    conclusionProvesThesis: boolean;
    overallAnalysis: string;
  };
  argumentativeQuality?: {
    explanationDepth: string;
    logicQuality: string;
    exampleSupport: string;
    relevanceOfIdeas: string;
    criticalThinking: string;
    weakArguments: string[];
    howToImprove: string[];
  };
  vocabularyCollocations?: {
    strongVocabulary: string[];
    collocationsUsed: { collocation: string; evaluation: string }[];
    repetitiveVocabulary: string[];
    impreciseWords: string[];
    awkwardPhrases: string[];
    memorizedLanguage: string[];
  };
  grammarAnalysis?: {
    mistakes: { original: string; corrected: string; explanation: string }[];
    punctuationMistakes: string[];
    awkwardSentences: string[];
    sentenceVariety: string;
  };
  improvementPlan?: {
    top5Weaknesses: string[];
    sentenceCorrections: { original: string; improved: string }[];
    strategicTips: string[];
  };
  wouldScore79Plus?: { answer: boolean; explanation: string };
  targetScoreAnalysis?: {
    achieved: boolean;
    gap: number;
    primaryReasons: string[];
    criteriaGaps: { criterion: string; currentScore: number; targetApprox: number; whatToDo: string }[];
    studyPriority: string;
    realisticTimeline: string;
  } | null;
  essayText?: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: WHITE,
    fontFamily: 'Helvetica',
    paddingBottom: 52,  // reserves space for the fixed footer
    fontSize: 9,
    color: SLATE,
    lineHeight: 1.45,
  },

  /* Repeating header — flowing `fixed` element reserves its own space each page */
  header: { width: '100%' },
  headerInner: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingTop: 26,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: { fontSize: 19, fontFamily: 'Helvetica-Bold', color: WHITE, letterSpacing: 1 },
  brandAccent: { color: AMBER_LIGHT },
  tagline: { fontSize: 7, color: AMBER, letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 },
  reportType: { fontSize: 9, color: WHITE, opacity: 0.85, textAlign: 'right' },
  reportDate: { fontSize: 8, color: WHITE, opacity: 0.6, textAlign: 'right', marginTop: 2 },
  amberLine: { height: 3, backgroundColor: AMBER },

  /* Body wrapper (header/footer are full-bleed; body has its own side padding) */
  body: { paddingHorizontal: 40, paddingTop: 18 },

  /* Fixed footer — absolute Texts pinned to page bottom */
  footerLine: { position: 'absolute', left: 40, right: 40, bottom: 34, height: 1, backgroundColor: BORDER },
  footerLeft: { position: 'absolute', left: 40, bottom: 20, fontSize: 7, color: MUTED },
  footerRight: { position: 'absolute', right: 40, bottom: 20, fontSize: 7, color: MUTED, textAlign: 'right' },

  /* Student meta */
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  metaBlock: { flexDirection: 'column', maxWidth: '52%' },
  metaLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  metaSub: { fontSize: 8, color: MUTED, marginTop: 1 },

  /* Score banner */
  scoreBanner: {
    flexDirection: 'row',
    backgroundColor: LIGHT_BG, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 16, alignItems: 'center',
  },
  scoreCircle: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 4, borderColor: AMBER,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE, marginRight: 18,
  },
  scoreNum: { fontSize: 30, fontFamily: 'Helvetica-Bold', color: AMBER },
  scoreMax: { fontSize: 7, color: MUTED, marginTop: 1 },
  scoreInfo: { flex: 1 },
  bandLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  summaryText: { fontSize: 9, color: SLATE, lineHeight: 1.5 },
  statRow: { flexDirection: 'row', marginTop: 9, gap: 16 },
  statText: { fontSize: 8, color: MUTED },
  statStrong: { fontFamily: 'Helvetica-Bold', color: NAVY },

  /* Section */
  section: { marginBottom: 16 },
  sectionAccent: { width: 22, height: 3, backgroundColor: AMBER, marginBottom: 7 },
  sectionTitle: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  /* Boxes */
  box: { borderRadius: 8, padding: 11, marginBottom: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: WHITE },
  noteTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 },

  /* Criteria */
  critRow: { flexDirection: 'row', marginBottom: 7, paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  critLeft: { width: '30%', paddingRight: 8 },
  critName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY },
  critScore: { fontSize: 10, color: AMBER, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  critComment: { fontSize: 8.5, color: SLATE, lineHeight: 1.4, width: '70%' },

  /* Key-value */
  kv: { flexDirection: 'row', marginBottom: 5 },
  kvLabel: { width: '34%', fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY, paddingRight: 6 },
  kvValue: { width: '66%', fontSize: 8.5, color: SLATE, lineHeight: 1.4 },

  /* Lists */
  listItem: { flexDirection: 'row', marginBottom: 4 },
  bullet: { fontSize: 8.5, marginRight: 5, width: 8 },
  listText: { fontSize: 8.5, color: SLATE, lineHeight: 1.45, flex: 1 },

  /* Two columns */
  twoCol: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  col: { flex: 1 },

  /* Chips */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip: { fontSize: 7.5, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, borderWidth: 1 },

  /* Correction blocks */
  corr: { marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  corrOld: { fontSize: 8.5, color: RED },
  corrNew: { fontSize: 8.5, color: GREEN, marginTop: 1 },
  corrNote: { fontSize: 8, color: MUTED, marginTop: 1, lineHeight: 1.4 },

  /* Essay text */
  essayText: { fontSize: 8.5, color: SLATE, lineHeight: 1.5 },
});

/* ─── Reusable bits ──────────────────────────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionAccent} minPresenceAhead={50} />
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const KV: React.FC<{ label: string; value?: string }> = ({ label, value }) =>
  value ? (
    <View style={styles.kv} wrap={false}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  ) : null;

const Bullet: React.FC<{ children: React.ReactNode; color?: string; symbol?: string }> = ({ children, color = AMBER, symbol = '•' }) => (
  <View style={styles.listItem} wrap={false}>
    <Text style={[styles.bullet, { color }]}>{symbol}</Text>
    <Text style={styles.listText}>{children}</Text>
  </View>
);

const YesNo: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <Text
    style={[
      styles.chip,
      ok
        ? { color: GREEN, backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }
        : { color: RED, backgroundColor: RED_BG, borderColor: '#FECACA' },
    ]}
  >
    {label}: {ok ? 'Yes' : 'No'}
  </Text>
);

const Chips: React.FC<{ items?: string[]; color: string; bg: string; border: string }> = ({ items, color, bg, border }) =>
  items && items.length > 0 ? (
    <View style={styles.chipRow}>
      {items.map((it, i) => (
        <Text key={i} style={[styles.chip, { color, backgroundColor: bg, borderColor: border }]}>{it}</Text>
      ))}
    </View>
  ) : null;

/* ─── Document ───────────────────────────────────────────────────────────── */
export function EssayScorePDF({ meta, result }: { meta: EssayPDFMeta; result: EssayPDFResult }) {
  const tsa = result.targetScoreAnalysis;
  return (
    <Document
      title={`PTE Essay Report — ${meta.studentName}`}
      author="Smart Labs"
      subject="PTE Essay Evaluation Report"
    >
      <Page size="A4" style={styles.page}>
        {/* Repeating header — flowing fixed element (reserves space on every page) */}
        <View style={styles.header} fixed>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.brand}>SMART<Text style={styles.brandAccent}>LABS</Text></Text>
              <Text style={styles.tagline}>AI Essay Scoring · PTE Academic</Text>
            </View>
            <View>
              <Text style={styles.reportType}>Essay Evaluation Report</Text>
              <Text style={styles.reportDate}>{meta.date}</Text>
            </View>
          </View>
          <View style={styles.amberLine} />
        </View>

        {/* Fixed footer — absolute, pinned to bottom of every page */}
        <View style={styles.footerLine} fixed />
        <Text style={styles.footerLeft} fixed>Generated by Smart Labs AI Essay Scorer · smartlabs.lk</Text>
        <Text style={styles.footerRight} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />

        {/* ── Body ── */}
        <View style={styles.body}>
        {/* Student meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Student</Text>
            <Text style={styles.metaValue}>{meta.studentName}</Text>
            {meta.studentEmail ? <Text style={styles.metaSub}>{meta.studentEmail}</Text> : null}
          </View>
          <View style={[styles.metaBlock, { alignItems: 'flex-end' }]}>
            <Text style={styles.metaLabel}>Essay Topic</Text>
            <Text style={[styles.metaSub, { textAlign: 'right' }]}>{meta.topic}</Text>
          </View>
        </View>

        {/* Score banner */}
        <View style={styles.scoreBanner} wrap={false}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNum}>{result.overallBand}</Text>
            <Text style={styles.scoreMax}>/ 90</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.bandLabel}>{result.bandLabel}</Text>
            <Text style={styles.summaryText}>{result.summaryText}</Text>
            <View style={styles.statRow}>
              <Text style={styles.statText}>Word Count: <Text style={styles.statStrong}>{meta.wordCount}</Text></Text>
              <Text style={styles.statText}>Time Taken: <Text style={styles.statStrong}>{meta.timeTaken}</Text></Text>
            </View>
          </View>
        </View>

        {/* Would score 79+ verdict */}
        {result.wouldScore79Plus && (
          <View
            style={[
              styles.box,
              result.wouldScore79Plus.answer
                ? { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }
                : { backgroundColor: ORANGE_BG, borderColor: ORANGE_BORDER },
            ]}
            wrap={false}
          >
            <Text style={[styles.noteTitle, { color: result.wouldScore79Plus.answer ? GREEN : ORANGE }]}>
              {result.wouldScore79Plus.answer ? 'Would likely score 79+' : 'Not yet at 79+ level'}
            </Text>
            <Text style={styles.essayText}>{result.wouldScore79Plus.explanation}</Text>
          </View>
        )}

        {/* Target score analysis */}
        {meta.targetScore != null && tsa && (
          <Section title={`Target Score Analysis (Band ${meta.targetScore})`}>
            <View
              style={[
                styles.box,
                tsa.achieved
                  ? { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }
                  : { backgroundColor: ORANGE_BG, borderColor: ORANGE_BORDER },
              ]}
            >
              <Text style={[styles.noteTitle, { color: tsa.achieved ? GREEN : ORANGE }]}>
                {tsa.achieved
                  ? `Band ${meta.targetScore} target achieved`
                  : `Band ${meta.targetScore} not yet reached — gap of ${tsa.gap} pts`}
              </Text>
              <Text style={styles.essayText}>
                Target: {meta.targetScore}   ·   Current: {result.overallBand}
              </Text>
            </View>

            {tsa.primaryReasons?.length > 0 && (
              <>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 4, color: ORANGE }]}>Primary reasons</Text>
                {tsa.primaryReasons.map((r, i) => <Bullet key={i} color={ORANGE} symbol="-">{r}</Bullet>)}
              </>
            )}

            {tsa.criteriaGaps?.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 4 }]}>Criteria to improve</Text>
                {tsa.criteriaGaps.map((g, i) => (
                  <View key={i} style={styles.box} wrap={false}>
                    <Text style={styles.critName}>
                      {g.criterion}  —  Now: {g.currentScore}  →  Need: {g.targetApprox}+
                    </Text>
                    <Text style={[styles.essayText, { marginTop: 2 }]}>{g.whatToDo}</Text>
                  </View>
                ))}
              </View>
            )}

            <KV label="Top priority" value={tsa.studyPriority} />
            <KV label="Realistic timeline" value={tsa.realisticTimeline} />
          </Section>
        )}

        {/* Scoring criteria */}
        {result.criteria?.length > 0 && (
          <Section title="Scoring Criteria">
            {result.criteria.map((c, i) => (
              <View key={i} style={styles.critRow} wrap={false}>
                <View style={styles.critLeft}>
                  <Text style={styles.critName}>{c.name}</Text>
                  <Text style={styles.critScore}>{c.score} / {c.max}</Text>
                </View>
                <Text style={styles.critComment}>{c.comment}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Content analysis */}
        {result.contentAnalysis && (
          <Section title="Content Analysis">
            <KV label="Content score" value={`${result.contentAnalysis.score} / 90`} />
            <Text style={styles.essayText}>{result.contentAnalysis.reason}</Text>
          </Section>
        )}

        {/* Structure */}
        {(result.structureDetail || result.structureAnalysis) && (
          <Section title="Structure Analysis">
            {result.structureAnalysis ? <Text style={[styles.essayText, { marginBottom: 6 }]}>{result.structureAnalysis}</Text> : null}
            {result.structureDetail && (
              <>
                <View style={styles.chipRow}>
                  <YesNo ok={result.structureDetail.paragraphCountCorrect} label="Paragraph count" />
                  <YesNo ok={result.structureDetail.followsIdealStrategy} label="Ideal strategy" />
                  <Text style={[styles.chip, { color: NAVY, backgroundColor: LIGHT_BG, borderColor: BORDER }]}>
                    Paragraphs: {result.structureDetail.paragraphCount}
                  </Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <KV label="Introduction" value={result.structureDetail.introduction} />
                  <KV label="Body paragraph 1" value={result.structureDetail.bodyParagraph1} />
                  <KV label="Body paragraph 2" value={result.structureDetail.bodyParagraph2} />
                  <KV label="Conclusion" value={result.structureDetail.conclusion} />
                  <KV label="Overall balance" value={result.structureDetail.overallBalance} />
                </View>
              </>
            )}
          </Section>
        )}

        {/* Coherence */}
        {result.coherenceAnalysis && (
          <Section title="Coherence & Cohesion">
            <View style={styles.chipRow}>
              <YesNo ok={result.coherenceAnalysis.oneIdeaPerParagraph} label="One idea / paragraph" />
            </View>
            <View style={{ marginTop: 6 }}>
              <KV label="Logical flow" value={result.coherenceAnalysis.logicalFlow} />
              <KV label="Paragraph unity" value={result.coherenceAnalysis.paragraphUnity} />
              <KV label="Sentence connection" value={result.coherenceAnalysis.sentenceConnection} />
              <KV label="Transition quality" value={result.coherenceAnalysis.transitionQuality} />
            </View>
            {result.coherenceAnalysis.breakPoints?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Break points</Text>
                {result.coherenceAnalysis.breakPoints.map((b, i) => <Bullet key={i} color={RED} symbol="!">{b}</Bullet>)}
              </View>
            )}
          </Section>
        )}

        {/* Thesis */}
        {result.thesisDevelopment && (
          <Section title="Thesis Development">
            <View style={styles.chipRow}>
              <YesNo ok={result.thesisDevelopment.bodySupportsThesis} label="Body supports thesis" />
              <YesNo ok={result.thesisDevelopment.conclusionProvesThesis} label="Conclusion proves thesis" />
            </View>
            <View style={{ marginTop: 6 }}>
              <KV label="Clarity of thesis" value={result.thesisDevelopment.clarityOfThesis} />
              <KV label="Consistency" value={result.thesisDevelopment.consistencyOfArguments} />
              <KV label="Overall" value={result.thesisDevelopment.overallAnalysis} />
            </View>
          </Section>
        )}

        {/* Argumentative quality */}
        {result.argumentativeQuality && (
          <Section title="Argumentative Quality">
            <KV label="Explanation depth" value={result.argumentativeQuality.explanationDepth} />
            <KV label="Logic quality" value={result.argumentativeQuality.logicQuality} />
            <KV label="Example support" value={result.argumentativeQuality.exampleSupport} />
            <KV label="Relevance of ideas" value={result.argumentativeQuality.relevanceOfIdeas} />
            <KV label="Critical thinking" value={result.argumentativeQuality.criticalThinking} />
            {result.argumentativeQuality.weakArguments?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Weak arguments</Text>
                {result.argumentativeQuality.weakArguments.map((w, i) => <Bullet key={i} color={RED} symbol="-">{w}</Bullet>)}
              </View>
            )}
            {result.argumentativeQuality.howToImprove?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>How to improve</Text>
                {result.argumentativeQuality.howToImprove.map((w, i) => <Bullet key={i} color={GREEN} symbol="+">{w}</Bullet>)}
              </View>
            )}
          </Section>
        )}

        {/* Vocabulary & collocations */}
        {result.vocabularyCollocations && (
          <Section title="Vocabulary & Collocations">
            {result.vocabularyCollocations.strongVocabulary?.length > 0 && (
              <View style={{ marginBottom: 5 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3, color: GREEN }]}>Strong vocabulary</Text>
                <Chips items={result.vocabularyCollocations.strongVocabulary} color={GREEN} bg={GREEN_BG} border={GREEN_BORDER} />
              </View>
            )}
            {result.vocabularyCollocations.collocationsUsed?.length > 0 && (
              <View style={{ marginBottom: 5 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Collocations used</Text>
                {result.vocabularyCollocations.collocationsUsed.map((c, i) => (
                  <Bullet key={i} color={BLUE} symbol="•">
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{c.collocation}</Text> — {c.evaluation}
                  </Bullet>
                ))}
              </View>
            )}
            {result.vocabularyCollocations.repetitiveVocabulary?.length > 0 && (
              <View style={{ marginBottom: 5 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3, color: ORANGE }]}>Repetitive words</Text>
                <Chips items={result.vocabularyCollocations.repetitiveVocabulary} color={ORANGE} bg={ORANGE_BG} border={ORANGE_BORDER} />
              </View>
            )}
            {result.vocabularyCollocations.impreciseWords?.length > 0 && (
              <View style={{ marginBottom: 5 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3, color: ORANGE }]}>Imprecise words</Text>
                <Chips items={result.vocabularyCollocations.impreciseWords} color={ORANGE} bg={ORANGE_BG} border={ORANGE_BORDER} />
              </View>
            )}
            {result.vocabularyCollocations.awkwardPhrases?.length > 0 && (
              <View style={{ marginBottom: 5 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3, color: RED }]}>Awkward phrases</Text>
                {result.vocabularyCollocations.awkwardPhrases.map((p, i) => <Bullet key={i} color={RED} symbol="!">{p}</Bullet>)}
              </View>
            )}
            {result.vocabularyCollocations.memorizedLanguage?.length > 0 && (
              <View>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Memorized language</Text>
                <Chips items={result.vocabularyCollocations.memorizedLanguage} color={MUTED} bg={LIGHT_BG} border={BORDER} />
              </View>
            )}
          </Section>
        )}

        {/* Grammar */}
        {result.grammarAnalysis && (
          <Section title="Grammar Analysis">
            <KV label="Sentence variety" value={result.grammarAnalysis.sentenceVariety} />
            {result.grammarAnalysis.mistakes?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 4 }]}>Grammar mistakes</Text>
                {result.grammarAnalysis.mistakes.map((m, i) => (
                  <View key={i} style={styles.corr} wrap={false}>
                    <Text style={styles.corrOld}>✗ {m.original}</Text>
                    <Text style={styles.corrNew}>✓ {m.corrected}</Text>
                    <Text style={styles.corrNote}>{m.explanation}</Text>
                  </View>
                ))}
              </View>
            )}
            {result.grammarAnalysis.punctuationMistakes?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Punctuation</Text>
                {result.grammarAnalysis.punctuationMistakes.map((p, i) => <Bullet key={i} color={ORANGE} symbol="-">{p}</Bullet>)}
              </View>
            )}
            {result.grammarAnalysis.awkwardSentences?.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Awkward sentences</Text>
                {result.grammarAnalysis.awkwardSentences.map((p, i) => <Bullet key={i} color={RED} symbol="!">{p}</Bullet>)}
              </View>
            )}
          </Section>
        )}

        {/* Strengths & Improvements */}
        {(result.strengths?.length > 0 || result.improvements?.length > 0) && (
          <View style={styles.twoCol}>
            {result.strengths?.length > 0 && (
              <View style={styles.col}>
                <View style={styles.sectionAccent} minPresenceAhead={40} />
                <Text style={styles.sectionTitle}>Strengths</Text>
                {result.strengths.map((s, i) => <Bullet key={i} color={GREEN} symbol="+">{s}</Bullet>)}
              </View>
            )}
            {result.improvements?.length > 0 && (
              <View style={styles.col}>
                <View style={styles.sectionAccent} minPresenceAhead={40} />
                <Text style={styles.sectionTitle}>Areas to Improve</Text>
                {result.improvements.map((s, i) => <Bullet key={i} color={RED} symbol="-">{s}</Bullet>)}
              </View>
            )}
          </View>
        )}

        {/* Actionable feedback */}
        {result.actionableFeedback && result.actionableFeedback.length > 0 && (
          <Section title="Actionable Feedback">
            {result.actionableFeedback.map((a, i) => (
              <View key={i} style={styles.box} wrap={false}>
                <Text style={[styles.noteTitle, { color: RED }]}>Issue: {a.issue}</Text>
                <Text style={[styles.essayText, { color: GREEN }]}>Fix: {a.howToFix}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Vocabulary upgrades */}
        {result.vocabUpgrades && result.vocabUpgrades.length > 0 && (
          <Section title="Vocabulary Upgrades">
            {result.vocabUpgrades.map((v, i) => (
              <View key={i} style={styles.kv} wrap={false}>
                <Text style={[styles.kvValue, { width: '45%', color: ORANGE }]}>{v.basic}</Text>
                <Text style={{ width: '10%', textAlign: 'center', color: MUTED }}>→</Text>
                <Text style={[styles.kvValue, { width: '45%', color: GREEN, fontFamily: 'Helvetica-Bold' }]}>{v.better}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Improvement plan */}
        {result.improvementPlan && (
          <Section title="Improvement Plan">
            {result.improvementPlan.top5Weaknesses?.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Top weaknesses</Text>
                {result.improvementPlan.top5Weaknesses.map((w, i) => <Bullet key={i} color={RED} symbol={`${i + 1}.`}>{w}</Bullet>)}
              </View>
            )}
            {result.improvementPlan.sentenceCorrections?.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 4 }]}>Sentence corrections</Text>
                {result.improvementPlan.sentenceCorrections.map((s, i) => (
                  <View key={i} style={styles.corr} wrap={false}>
                    <Text style={styles.corrOld}>✗ {s.original}</Text>
                    <Text style={styles.corrNew}>✓ {s.improved}</Text>
                  </View>
                ))}
              </View>
            )}
            {result.improvementPlan.strategicTips?.length > 0 && (
              <View>
                <Text style={[styles.kvLabel, { width: '100%', marginBottom: 3 }]}>Strategic tips</Text>
                {result.improvementPlan.strategicTips.map((t, i) => <Bullet key={i} color={GREEN} symbol="•">{t}</Bullet>)}
              </View>
            )}
          </Section>
        )}

        {/* Model essay */}
        {result.modelEssay ? (
          <Section title="Model Essay">
            <Text style={styles.essayText}>{result.modelEssay}</Text>
          </Section>
        ) : null}

        {/* Submitted essay */}
        {result.essayText ? (
          <Section title="Submitted Essay">
            <Text style={styles.essayText}>{result.essayText}</Text>
          </Section>
        ) : null}
        </View>
      </Page>
    </Document>
  );
}
