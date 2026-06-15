import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: '40 50 40 50',
    color: '#111111',
    lineHeight: 1.5,
  },
  header: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
  },
  subHeader: {
    fontSize: 10,
    textAlign: 'center',
    color: '#555555',
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 100,
  },
  metaValue: {
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 6,
    marginTop: 14,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 6,
  },
  signatureBlock: {
    marginTop: 28,
    padding: '14 16',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 3,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaaaaa',
    marginTop: 24,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#777777',
  },
})

type Props = {
  employeeName: string
  position: string
  startDate: string
}

export function NDATemplate({ employeeName, position, startDate }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>EXCHANGE FOUR — NON-DISCLOSURE AGREEMENT</Text>
        <Text style={styles.subHeader}>Confidential — For Employee Use Only</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date:</Text>
          <Text style={styles.metaValue}>{startDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Employee:</Text>
          <Text style={styles.metaValue}>{employeeName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Position:</Text>
          <Text style={styles.metaValue}>{position}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>1. Definition of Confidential Information</Text>
        <Text style={styles.body}>
          For purposes of this Agreement, "Confidential Information" means any and all technical and non-technical
          information provided by Exchange Four that relates to past, present, or future research, development, or
          business activities, including but not limited to trade secrets, proprietary information, personnel data,
          client lists, financial data, operational processes, software, and any other information designated as
          confidential by Exchange Four in writing or by its nature.
        </Text>

        <Text style={styles.sectionTitle}>2. Obligations of the Employee</Text>
        <Text style={styles.body}>
          The Employee agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose
          Confidential Information to any third party without prior written consent from Exchange Four; (c) use
          Confidential Information solely for the performance of duties as an employee of Exchange Four; (d) notify
          Exchange Four immediately upon discovery of any unauthorised disclosure or use of Confidential Information;
          and (e) return or destroy all materials containing Confidential Information upon request or upon termination
          of employment.
        </Text>

        <Text style={styles.sectionTitle}>3. Duration</Text>
        <Text style={styles.body}>
          The obligations set forth in this Agreement shall remain in effect during the Employee's employment with
          Exchange Four and for a period of two (2) years following termination of employment, regardless of the reason
          for termination. The obligation to protect trade secrets shall survive indefinitely.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureText}>
            I, {employeeName}, acknowledge that I have read, understood, and agree to the terms of this Non-Disclosure
            Agreement in full.
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Employee Signature &amp; Date</Text>
        </View>
      </Page>
    </Document>
  )
}
