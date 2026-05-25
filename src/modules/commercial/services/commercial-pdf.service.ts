import { jsPDF } from 'jspdf'
import type { Client } from '@/types/entities'
import type { CommercialLine } from '@/types/entities'
import { LINE_KIND_LABELS } from '@/types/entities'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { computeLineSubtotal } from '@/modules/commercial/utils/document-totals'

const PAGE_WIDTH = 210
const MARGIN = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export type CommercialPdfKind = 'quote' | 'invoice'

const KIND_TITLES: Record<CommercialPdfKind, string> = {
  quote: 'DEVIS',
  invoice: 'FACTURE',
}

type CommercialPdfDocument = {
  number: string
  title?: string
  notes?: string
  status: string
  lines: CommercialLine[]
  subtotal: number
  vatTotal: number
  total: number
  validUntil?: string
  dueDate?: string
  createdAt: string
}

type CommercialPdfContext = {
  kind: CommercialPdfKind
  document: CommercialPdfDocument
  client: Client
  statusLabel: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function drawHeader(doc: jsPDF, kind: CommercialPdfKind, docNumber: string) {
  doc.setFillColor(10, 18, 32)
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('AT72Manager', MARGIN, 14)

  doc.setTextColor(220, 230, 245)
  doc.setFontSize(10)
  doc.text('Solution SAV professionnelle', MARGIN, 22)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(KIND_TITLES[kind], MARGIN, 32)

  doc.setTextColor(120, 130, 150)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(docNumber, PAGE_WIDTH - MARGIN, 18, { align: 'right' })
  doc.text(`Émis le ${formatDate(new Date().toISOString())}`, PAGE_WIDTH - MARGIN, 26, {
    align: 'right',
  })
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage()
    return 48
  }
  return y
}

function drawLinesTable(doc: jsPDF, lines: CommercialLine[], startY: number): number {
  let y = startY
  const colDesc = MARGIN
  const colQty = MARGIN + 95
  const colUnit = MARGIN + 115
  const colTotal = PAGE_WIDTH - MARGIN

  doc.setFillColor(240, 245, 250)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(60, 70, 90)
  doc.text('Description', colDesc + 2, y + 5.5)
  doc.text('Qté', colQty, y + 5.5)
  doc.text('P.U.', colUnit, y + 5.5)
  doc.text('Total', colTotal - 2, y + 5.5, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 40, 55)

  for (const line of lines) {
    y = ensureSpace(doc, y, 14)
    const kindLabel = LINE_KIND_LABELS[line.kind]
    const desc = `[${kindLabel}] ${line.description || '—'}`
    const descLines = doc.splitTextToSize(desc, 88)
    doc.text(descLines, colDesc + 2, y + 4)
    doc.text(String(line.quantity), colQty, y + 4)
    doc.text(formatPrice(line.unitPrice), colUnit, y + 4)
    doc.text(formatPrice(computeLineSubtotal(line)), colTotal - 2, y + 4, {
      align: 'right',
    })
    y += Math.max(8, descLines.length * 4 + 4)
  }

  return y + 6
}

export async function generateCommercialPdf(ctx: CommercialPdfContext): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { kind, document, client, statusLabel } = ctx

  drawHeader(doc, kind, document.number)

  let y = 50
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 40, 55)
  doc.text('Client', MARGIN, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(getClientFullName(client), MARGIN, y)
  y += 5
  if (client.phone) {
    doc.text(client.phone, MARGIN, y)
    y += 5
  }
  if (client.email) {
    doc.text(client.email, MARGIN, y)
    y += 5
  }

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Statut', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.text(statusLabel, MARGIN + 22, y)
  y += 8

  if (document.title) {
    doc.setFont('helvetica', 'bold')
    doc.text('Objet', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    const titleLines = doc.splitTextToSize(document.title, CONTENT_WIDTH - 24)
    doc.text(titleLines, MARGIN + 22, y)
    y += titleLines.length * 5 + 4
  }

  if (document.validUntil) {
    doc.text(`Valable jusqu'au ${formatDate(document.validUntil)}`, MARGIN, y)
    y += 6
  }
  if (document.dueDate) {
    doc.text(`Échéance : ${formatDate(document.dueDate)}`, MARGIN, y)
    y += 6
  }

  y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Détail', MARGIN, y)
  y += 8

  y = drawLinesTable(doc, document.lines, y)

  y = ensureSpace(doc, y, 30)
  doc.setDrawColor(200, 210, 220)
  doc.line(MARGIN + 100, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  doc.setFontSize(9)
  doc.setTextColor(90, 100, 120)
  doc.text('Sous-total HT', MARGIN + 100, y)
  doc.setTextColor(30, 40, 55)
  doc.text(formatPrice(document.subtotal), PAGE_WIDTH - MARGIN, y, { align: 'right' })
  y += 6
  doc.setTextColor(90, 100, 120)
  doc.text('TVA', MARGIN + 100, y)
  doc.setTextColor(30, 40, 55)
  doc.text(formatPrice(document.vatTotal), PAGE_WIDTH - MARGIN, y, { align: 'right' })
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0, 120, 160)
  doc.text('Total TTC', MARGIN + 100, y)
  doc.text(formatPrice(document.total), PAGE_WIDTH - MARGIN, y, { align: 'right' })

  if (document.notes?.trim()) {
    y += 14
    y = ensureSpace(doc, y, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(60, 70, 90)
    doc.text('Notes', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 40, 55)
    const noteLines = doc.splitTextToSize(document.notes, CONTENT_WIDTH)
    doc.text(noteLines, MARGIN, y)
  }

  doc.setFontSize(7)
  doc.setTextColor(140, 150, 165)
  doc.text(
    'Document généré par AT72Manager — Paiement, signature et envoi mail à venir.',
    MARGIN,
    290,
  )

  return doc.output('blob')
}

export function downloadCommercialPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
