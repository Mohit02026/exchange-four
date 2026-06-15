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

export function ContractTemplate({ employeeName, position, startDate }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>EXCHANGE FOUR — EMPLOYMENT CONTRACT</Text>
        <Text style={styles.subHeader}>This agreement is entered into between Exchange Four and the Employee named below.</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Employee:</Text>
          <Text style={styles.metaValue}>{employeeName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Position:</Text>
          <Text style={styles.metaValue}>{position}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Start Date:</Text>
          <Text style={styles.metaValue}>{startDate}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>1. Position &amp; Duties</Text>
        <Text style={styles.body}>
          The Employee is engaged in the role of {position} at Exchange Four. The Employee agrees to perform all duties
          associated with this role diligently and to the best of their ability. Duties may be reasonably updated from
          time to time by Exchange Four management in accordance with business needs. The Employee agrees to follow all
          lawful and reasonable instructions from their direct supervisor and the Director of Personnel.
        </Text>

        <Text style={styles.sectionTitle}>2. Terms of Employment</Text>
        <Text style={styles.body}>
          Employment with Exchange Four is at-will. Either party may terminate the employment relationship at any time
          and for any lawful reason, with or without cause, subject to applicable notice requirements. Nothing in this
          Agreement creates a guarantee of employment for any specific duration. Compensation, benefits, and other terms
          are subject to the current remuneration schedule communicated separately.
        </Text>

        <Text style={styles.sectionTitle}>3. Confidentiality</Text>
        <Text style={styles.body}>
          The Employee acknowledges that in the course of their employment they will have access to confidential
          and proprietary information belonging to Exchange Four and its clients. The Employee agrees to maintain
          strict confidentiality of all such information both during and following the termination of employment,
          as set forth in the Non-Disclosure Agreement executed in conjunction with this Contract.
        </Text>

        <Text style={styles.sectionTitle}>4. Code of Conduct</Text>
        <Text style={styles.body}>
          The Employee agrees to conduct themselves in a professional, ethical, and respectful manner at all times.
          This includes adherence to the Exchange Four Company Policies and Employee Handbook, which the Employee
          confirms has been reviewed and understood. Violations of the Code of Conduct may result in disciplinary
          action up to and including termination of employment.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureText}>
            I, {employeeName}, acknowledge that I have read, understood, and agree to the terms of this Employment
            Contract and accept the position of {position} at Exchange Four.
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Employee Signature &amp; Date</Text>
        </View>
      </Page>
    </Document>
  )
}
