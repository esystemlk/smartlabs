import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const NAVY = '#0D1B35';
const NAVY_MID = '#132240';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';
const GOLD_BRIGHT = '#F5D978';
const WHITE = '#FFFFFF';
const WHITE_DIM = 'rgba(255,255,255,0.75)';
const WHITE_FAINT = 'rgba(255,255,255,0.45)';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: NAVY,
    padding: 0,
    fontFamily: 'Helvetica',
    position: 'relative',
  },

  // Double gold border
  borderOuter: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 2.5,
    borderColor: GOLD,
    borderStyle: 'solid',
  },
  borderInner: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 0.75,
    borderColor: GOLD_LIGHT,
    borderStyle: 'solid',
    opacity: 0.6,
  },

  // Corner ornaments
  cornerTL: { position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: GOLD_BRIGHT, borderStyle: 'solid' },
  cornerTR: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: GOLD_BRIGHT, borderStyle: 'solid' },
  cornerBL: { position: 'absolute', bottom: 10, left: 10, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: GOLD_BRIGHT, borderStyle: 'solid' },
  cornerBR: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: GOLD_BRIGHT, borderStyle: 'solid' },

  // Content
  content: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 40,
  },

  // Header
  orgLabel: {
    fontSize: 9,
    color: GOLD,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  logoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoText: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    letterSpacing: 2,
  },
  logoTextAccent: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: GOLD_BRIGHT,
    letterSpacing: 2,
  },

  dividerGold: {
    height: 1.5,
    backgroundColor: GOLD,
    width: 180,
    marginVertical: 10,
    opacity: 0.8,
  },
  dividerThin: {
    height: 0.5,
    backgroundColor: GOLD_LIGHT,
    width: 120,
    opacity: 0.5,
    marginBottom: 6,
  },

  certTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: GOLD_LIGHT,
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginBottom: 18,
  },

  // Body
  certifyText: {
    fontSize: 10.5,
    color: WHITE_DIM,
    marginBottom: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica',
  },

  studentNameWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 12,
  },
  studentName: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    color: GOLD_BRIGHT,
    letterSpacing: 2,
    textAlign: 'center',
  },
  nameLine: {
    height: 1,
    backgroundColor: GOLD,
    width: 320,
    marginTop: 6,
    opacity: 0.7,
  },

  completionText: {
    fontSize: 10,
    color: WHITE_DIM,
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.5,
    lineHeight: 1.6,
  },
  programName: {
    fontSize: 14.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
  },
  programSub: {
    fontSize: 9.5,
    color: GOLD_LIGHT,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 18,
    opacity: 0.85,
  },

  // Footer row
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: GOLD,
    borderTopStyle: 'solid',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 7,
    color: WHITE_FAINT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 9,
    color: GOLD_LIGHT,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },

  // Signature block
  sigBlock: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 4,
  },
  sigLine: {
    height: 1,
    width: 140,
    backgroundColor: GOLD,
    opacity: 0.6,
    marginBottom: 5,
  },
  sigName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sigTitle: {
    fontSize: 8,
    color: GOLD_LIGHT,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1,
    opacity: 0.85,
  },

  // Watermark strip
  watermarkStrip: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 7,
    color: GOLD,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.35,
  },
});

interface CertificateDocumentProps {
  studentName: string;
  certificateNumber: string;
  issueDate: string;
}

export function CertificateDocument({ studentName, certificateNumber, issueDate }: CertificateDocumentProps) {
  return (
    <Document title={`Smart Labs Certificate – ${studentName}`} author="Smart Labs LK">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.borderOuter} />
        <View style={styles.borderInner} />

        {/* Corner ornaments */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        {/* Main content */}
        <View style={styles.content}>
          {/* Org label */}
          <Text style={styles.orgLabel}>Smart Labs LK — Est. 2020</Text>

          {/* Logo wordmark */}
          <View style={styles.logoBar}>
            <Text style={styles.logoText}>SMART</Text>
            <Text style={styles.logoTextAccent}>LABS</Text>
          </View>

          <View style={styles.dividerGold} />
          <View style={styles.dividerThin} />

          <Text style={styles.certTitle}>Certificate of Completion</Text>

          <Text style={styles.certifyText}>This is to certify that</Text>

          {/* Student name */}
          <View style={styles.studentNameWrapper}>
            <Text style={styles.studentName}>{studentName}</Text>
            <View style={styles.nameLine} />
          </View>

          <Text style={styles.completionText}>
            has successfully completed the
          </Text>

          <Text style={styles.programName}>PTE Academic Training Programme</Text>
          <Text style={styles.programSub}>conducted by Smart Labs LK</Text>

          <View style={styles.dividerGold} />

          {/* Footer */}
          <View style={styles.footerRow}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>Issue Date</Text>
              <Text style={styles.footerValue}>{issueDate}</Text>
            </View>

            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>Lahiruka Weeraratne</Text>
              <Text style={styles.sigTitle}>Lecturer · Smart Labs LK</Text>
            </View>

            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>Certificate No.</Text>
              <Text style={styles.footerValue}>{certificateNumber}</Text>
            </View>
          </View>
        </View>

        {/* Bottom watermark */}
        <View style={styles.watermarkStrip}>
          <Text style={styles.watermarkText}>
            www.smartlabs.lk · Authentic Document · {certificateNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
