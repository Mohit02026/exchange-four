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
    fontSize: 12,
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
    marginVertical: 14,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 5,
    marginTop: 12,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 5,
  },
  signatureBlock: {
    marginTop: 24,
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
}

export function PoliciesTemplate({ employeeName }: Props) {
  const today = new Date().toLocaleDateString('en-GB')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>EXCHANGE FOUR — COMPANY POLICIES &amp; EMPLOYEE HANDBOOK</Text>
        <Text style={styles.subHeader}>Please read carefully. Acknowledgment is required before commencing employment.</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Employee:</Text>
          <Text style={styles.metaValue}>{employeeName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date:</Text>
          <Text style={styles.metaValue}>{today}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>1. Code of Conduct</Text>
        <Text style={styles.body}>
          All employees are expected to behave with integrity, professionalism, and respect at all times — whether
          interacting with colleagues, clients, or the public. Harassment, discrimination, dishonesty, or any behaviour
          that damages the reputation of Exchange Four will not be tolerated and may result in immediate termination.
        </Text>

        <Text style={styles.sectionTitle}>2. Work Hours &amp; Attendance</Text>
        <Text style={styles.body}>
          Employees are expected to be punctual and to maintain consistent attendance. Any planned absence must be
          communicated to your direct supervisor in advance. Unplanned absences must be reported as early as possible
          on the day. Repeated unexplained absences will be subject to disciplinary review. Standard hours are as
          communicated by your supervisor and may vary by role or department.
        </Text>

        <Text style={styles.sectionTitle}>3. Communication Standards</Text>
        <Text style={styles.body}>
          All internal and external communications must be professional, clear, and respectful. Exchange Four
          communication channels — including email, Slack, and any other approved platforms — are to be used for
          legitimate business purposes only. Employees must not share confidential company information through
          unapproved channels. All written communications may be subject to review.
        </Text>

        <Text style={styles.sectionTitle}>4. Data &amp; Confidentiality</Text>
        <Text style={styles.body}>
          Employees must handle all company, client, and personnel data with care and in accordance with applicable
          data protection laws. Access to systems and data is granted on a need-to-know basis. Employees must not
          share login credentials, access sensitive records outside their remit, or retain company data on personal
          devices without authorisation. A full Non-Disclosure Agreement governs your obligations regarding
          Confidential Information.
        </Text>

        <Text style={styles.sectionTitle}>5. Disciplinary Process</Text>
        <Text style={styles.body}>
          Exchange Four operates a structured disciplinary process: (1) Verbal Warning — documented conversation
          regarding the concern; (2) Written Warning — formal notice with specific corrective actions required;
          (3) Final Warning — last formal notice before escalation; (4) Termination — where corrective action
          has failed or the conduct is sufficiently serious. In cases of gross misconduct, immediate termination
          without prior warnings may apply. All disciplinary matters will be handled in confidence by the
          Director of Personnel.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureText}>
            I, {employeeName}, confirm that I have read and understood the Exchange Four Company Policies and
            Employee Handbook in full, and I agree to abide by them throughout my employment.
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Employee Signature &amp; Date</Text>
        </View>
      </Page>
    </Document>
  )
}
