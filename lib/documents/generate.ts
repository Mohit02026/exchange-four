import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { NDATemplate } from './templates/nda'
import { ContractTemplate } from './templates/contract'
import { PoliciesTemplate } from './templates/policies'

type BaseProps = {
  employeeName: string
  position: string
  startDate: string
}

// renderToBuffer requires ReactElement<DocumentProps> — our components wrap <Document>
// internally so we cast through unknown to satisfy the overload.
function asDocElement(el: ReactElement): ReactElement<DocumentProps> {
  return el as unknown as ReactElement<DocumentProps>
}

export async function generateNDA(props: BaseProps): Promise<Buffer> {
  return renderToBuffer(asDocElement(createElement(NDATemplate, props))) as Promise<Buffer>
}

export async function generateContract(props: BaseProps): Promise<Buffer> {
  return renderToBuffer(asDocElement(createElement(ContractTemplate, props))) as Promise<Buffer>
}

export async function generatePolicies({ employeeName }: { employeeName: string }): Promise<Buffer> {
  return renderToBuffer(asDocElement(createElement(PoliciesTemplate, { employeeName }))) as Promise<Buffer>
}
