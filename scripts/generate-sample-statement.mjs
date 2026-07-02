// Generates a sample CPF statement PDF for testing the upload/parsing feature.
// Dependency-free: emits a minimal but valid single-page PDF by hand, computing
// xref byte offsets programmatically so they can't drift. The text lines mirror
// how a real CPF statement prints account names next to balances — a handy fixture
// for testing the Claude PDF parsing agent end to end.
//
//   node scripts/generate-sample-statement.mjs [outputPath]
//
// Default output: public/sample-cpf-statement.pdf

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(
  __dirname,
  '..',
  process.argv[2] ?? 'public/sample-cpf-statement.pdf',
)

// The statement body, one entry per line. Kept as plain text (no PDF-special
// chars beyond parentheses, which we escape) so extraction is deterministic.
const LINES = [
  'Central Provident Fund Board',
  'CPF Statement of Account',
  'Statement as at 30 Jun 2026',
  '',
  'Member: TAN WEI MING',
  'Age 42',
  '',
  'Account Balances',
  'Ordinary Account (OA)        $82,000.00',
  'Special Account (SA)         $61,500.00',
  'MediSave Account (MA)        $45,250.00',
  'Retirement Account (RA)      $0.00',
  'Total Balance                $188,750.00',
  '',
  'Ordinary Wage (monthly)      $6,000.00',
  '',
  'Recent Contributions',
  '15 Jun 2026   ACME PTE LTD     $1,110.00',
  '15 May 2026   ACME PTE LTD     $1,110.00',
  '15 Apr 2026   ACME PTE LTD     $1,110.00',
  '',
  'This statement is for reference only. Verify figures at cpf.gov.sg.',
]

const escapePdf = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

// Build the page content stream: one text block, 14pt leading, top-down.
const contentLines = ['BT', '/F1 11 Tf', '14 TL', '54 780 Td']
for (const line of LINES) {
  // Emit the text then advance one line (T* uses the leading set above).
  contentLines.push(`(${escapePdf(line)}) Tj`, 'T*')
}
contentLines.push('ET')
const content = contentLines.join('\n')

// Assemble PDF objects. We track the byte offset of each object for the xref.
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
]

let pdf = '%PDF-1.4\n'
const offsets = []
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
})

const xrefStart = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n`
pdf += '0000000000 65535 f \n'
for (const off of offsets) {
  pdf += `${String(off).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

writeFileSync(outPath, pdf, 'latin1')
console.log(`Wrote ${outPath} (${Buffer.byteLength(pdf)} bytes)`)
