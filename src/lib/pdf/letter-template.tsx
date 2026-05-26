import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const NAVY = '#0D1B35';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';
const DARK_TEXT = '#1A1A2E';
const BODY_TEXT = '#2D2D3A';
const MUTED = '#6B7280';
const WHITE = '#FFFFFF';
const LIGHT_BG = '#F8F9FA';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: WHITE,
    fontFamily: 'Helvetica',
    padding: 0,
  },

  // Header banner
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: 50,
    paddingTop: 32,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  orgName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  orgNameAccent: {
    color: GOLD_LIGHT,
  },
  orgTagline: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  contactLine: {
    fontSize: 8,
    color: WHITE,
    opacity: 0.75,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerGoldLine: {
    height: 3,
    backgroundColor: GOLD,
    width: '100%',
    marginTop: 2,
  },

  // Ref band
  refBand: {
    backgroundColor: LIGHT_BG,
    paddingHorizontal: 50,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  refItem: {
    flexDirection: 'column',
  },
  refLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  refValue: {
    fontSize: 8.5,
    color: DARK_TEXT,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.3,
  },

  // Body
  body: {
    paddingHorizontal: 50,
    paddingTop: 28,
    paddingBottom: 20,
    flex: 1,
  },
  date: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  addressBlock: {
    marginBottom: 20,
  },
  addressTo: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 9,
    color: BODY_TEXT,
    lineHeight: 1.5,
  },

  subjectLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  subjectBar: {
    width: 3,
    height: 24,
    backgroundColor: GOLD,
    marginRight: 10,
    borderRadius: 1,
  },
  subjectText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 0.3,
  },

  para: {
    fontSize: 10,
    color: BODY_TEXT,
    lineHeight: 1.7,
    marginBottom: 12,
    textAlign: 'justify',
  },
  nameHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
  },

  // Signature section
  sigSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
  },
  sigOpening: {
    fontSize: 10,
    color: BODY_TEXT,
    marginBottom: 40,
  },
  sigLine: {
    height: 1,
    backgroundColor: NAVY,
    width: 160,
    opacity: 0.4,
    marginBottom: 6,
  },
  sigName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    marginBottom: 2,
  },
  sigRole: {
    fontSize: 8.5,
    color: MUTED,
    letterSpacing: 0.5,
  },
  sigOrg: {
    fontSize: 8.5,
    color: GOLD,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    backgroundColor: NAVY,
    paddingHorizontal: 50,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: WHITE,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  footerGold: {
    fontSize: 7.5,
    color: GOLD,
    letterSpacing: 0.5,
    opacity: 0.85,
  },
});

interface LetterDocumentProps {
  studentName: string;
  certificateNumber: string;
  issueDate: string;
}

export function LetterDocument({ studentName, certificateNumber, issueDate }: LetterDocumentProps) {
  return (
    <Document title={`Smart Labs Completion Letter – ${studentName}`} author="Smart Labs LK">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.orgName}>
              SMART<Text style={styles.orgNameAccent}>LABS</Text> LK
            </Text>
            <Text style={styles.orgTagline}>PTE Academic Training Centre</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.contactLine}>www.smartlabs.lk</Text>
            <Text style={styles.contactLine}>077 453 3233</Text>
            <Text style={styles.contactLine}>info@smartlabs.lk</Text>
          </View>
        </View>
        <View style={styles.headerGoldLine} />

        {/* Reference band */}
        <View style={styles.refBand}>
          <View style={styles.refItem}>
            <Text style={styles.refLabel}>Reference No.</Text>
            <Text style={styles.refValue}>{certificateNumber}</Text>
          </View>
          <View style={styles.refItem}>
            <Text style={styles.refLabel}>Date of Issue</Text>
            <Text style={styles.refValue}>{issueDate}</Text>
          </View>
          <View style={styles.refItem}>
            <Text style={styles.refLabel}>Document Type</Text>
            <Text style={styles.refValue}>Completion Letter</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.date}>{issueDate}</Text>

          <View style={styles.addressBlock}>
            <Text style={styles.addressTo}>To Whom It May Concern,</Text>
          </View>

          {/* Subject */}
          <View style={styles.subjectLine}>
            <View style={styles.subjectBar} />
            <Text style={styles.subjectText}>
              RE: Confirmation of PTE Academic Training Completion
            </Text>
          </View>

          <Text style={styles.para}>
            This letter is to confirm that{' '}
            <Text style={styles.nameHighlight}>{studentName}</Text>{' '}
            has successfully completed the PTE Academic Training Programme conducted by
            Smart Labs LK. The programme encompasses comprehensive preparation for the
            Pearson Test of English (PTE) Academic examination, covering all four core
            competencies: Speaking, Writing, Reading, and Listening.
          </Text>

          <Text style={styles.para}>
            Throughout the training, the participant demonstrated consistent dedication
            and effort in developing the academic English language skills required for
            success in the PTE Academic examination. The curriculum delivered by our
            qualified instructors includes structured lessons, AI-powered practice
            assessments, and personalised feedback sessions designed to meet
            international English proficiency standards.
          </Text>

          <Text style={styles.para}>
            Smart Labs LK is a recognised PTE training centre committed to providing
            high-quality English language education. We are pleased to recommend{' '}
            <Text style={styles.nameHighlight}>{studentName}</Text>{' '}
            to any institution or organisation that may require evidence of PTE training
            completion.
          </Text>

          <Text style={styles.para}>
            Should you require any further information or verification regarding this
            letter, please do not hesitate to contact us at the details provided above.
          </Text>

          {/* Signature */}
          <View style={styles.sigSection}>
            <Text style={styles.sigOpening}>Yours sincerely,</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Lahiruka Weeraratne</Text>
            <Text style={styles.sigRole}>Lecturer — PTE Academic Training</Text>
            <Text style={styles.sigOrg}>Smart Labs LK</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Smart Labs LK · www.smartlabs.lk · 077 453 3233
          </Text>
          <Text style={styles.footerGold}>Ref: {certificateNumber}</Text>
          <Text style={styles.footerText}>
            This is an official document issued by Smart Labs LK.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
