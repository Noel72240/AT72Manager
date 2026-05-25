import { jsPDF } from 'jspdf'
import type { Client } from '@/types/entities'
import type { Intervention } from '@/types/entities/intervention.types'
import type { InterventionPdfKind } from '@/modules/interventions/field/types/field.types'
import { PDF_KIND_LABELS } from '@/modules/interventions/field/types/field.types'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { getDeviceSummary } from '@/modules/interventions/utils/intervention-labels'

const PAGE_WIDTH = 210
const MARGIN = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

type PdfContext = {
  intervention: Intervention
  client: Client
  kind: InterventionPdfKind
}

function formatPrice(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function drawHeader(doc: jsPDF, kind: InterventionPdfKind) {
  doc.setFillColor(10, 18, 32)
  doc.rect(0, 0, PAGE_WIDTH, 36, 'F')

  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('AT72Manager', MARGIN, 14)

  doc.setTextColor(220, 230, 245)
  doc.setFontSize(10)
  doc.text('Solution SAV professionnelle', MARGIN, 22)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.text(PDF_KIND_LABELS[kind], MARGIN, 30)

  doc.setTextColor(120, 130, 150)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Généré le ${formatDate(new Date().toISOString())}`, PAGE_WIDTH - MARGIN, 30, {
    align: 'right',
  })
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(0, 212, 255)
  doc.rect(MARGIN, y, 3, 6, 'F')
  doc.setTextColor(30, 40, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, MARGIN + 6, y + 5)
  return y + 12
}

function drawKeyValue(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(90, 100, 120)
  doc.text(label, MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 40, 55)
  const lines = doc.splitTextToSize(value || '—', CONTENT_WIDTH)
  doc.text(lines, MARGIN, y + 5)
  return y + 5 + lines.length * 5 + 4
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage()
    return 20
  }
  return y
}

function addImageFit(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): number {
  const format = dataUrl.includes('image/png') ? 'PNG' : 'JPEG'
  doc.addImage(dataUrl, format, x, y, maxW, maxH, undefined, 'FAST')
  return maxH
}

export async function generateInterventionPdf(ctx: PdfContext): Promise<Blob> {
  const { intervention, client, kind } = ctx
  const media = normalizeInterventionMedia(intervention.media)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, kind)
  let y = 44

  y = drawSectionTitle(doc, 'Client', y)
  y = drawKeyValue(doc, 'Nom', getClientFullName(client), y)
  y = drawKeyValue(doc, 'Téléphone', client.phone ?? '—', y)
  y = drawKeyValue(doc, 'E-mail', client.email ?? '—', y)
  y = drawKeyValue(doc, 'Adresse', client.address ?? '—', y)

  y = ensureSpace(doc, y, 40)
  y = drawSectionTitle(doc, 'Appareil', y)
  y = drawKeyValue(doc, 'Description', getDeviceSummary(intervention), y)
  y = drawKeyValue(doc, 'IMEI / Série', intervention.imeiOrSerial ?? '—', y)

  y = ensureSpace(doc, y, 50)
  y = drawSectionTitle(doc, 'Intervention', y)
  y = drawKeyValue(doc, 'Référence', intervention.id.slice(0, 8).toUpperCase(), y)
  y = drawKeyValue(doc, 'Statut', STATUS_LABELS[intervention.status], y)
  y = drawKeyValue(doc, 'Panne signalée', intervention.reportedIssue, y)
  y = drawKeyValue(doc, 'Diagnostic', intervention.diagnostic ?? '—', y)
  if (kind === 'sav_report') {
    y = drawKeyValue(doc, 'Notes technicien', intervention.technicianNotes ?? '—', y)
  }
  y = drawKeyValue(doc, 'Prix estimé', formatPrice(intervention.estimatedPrice), y)
  y = drawKeyValue(doc, 'Prix final', formatPrice(intervention.finalPrice), y)
  y = drawKeyValue(doc, 'Date création', formatDate(intervention.createdAt), y)

  const signatures = [
    { label: 'Signature client', data: media.clientSignature },
    { label: 'Signature technicien', data: media.technicianSignature },
  ].filter((item) => item.data)

  if (signatures.length > 0) {
    y = ensureSpace(doc, y, 50)
    y = drawSectionTitle(doc, 'Signatures', y)
    const sigW = (CONTENT_WIDTH - 8) / 2
    signatures.forEach((sig, index) => {
      const x = MARGIN + index * (sigW + 8)
      doc.setFontSize(8)
      doc.setTextColor(90, 100, 120)
      doc.text(sig.label, x, y)
      if (sig.data) {
        addImageFit(doc, sig.data, x, y + 3, sigW, 22)
      }
    })
    y += 32
  }

  const photos = media.photos ?? []
  if (photos.length > 0) {
    y = ensureSpace(doc, y, 30)
    y = drawSectionTitle(doc, 'Photos', y)
    const photoW = (CONTENT_WIDTH - 8) / 2
    const photoH = 40
    let col = 0
    for (const photo of photos) {
      y = ensureSpace(doc, y, photoH + 10)
      const x = MARGIN + col * (photoW + 8)
      doc.setFontSize(7)
      doc.setTextColor(120, 130, 150)
      doc.text(photo.name, x, y)
      addImageFit(doc, photo.dataUrl, x, y + 3, photoW, photoH)
      col += 1
      if (col >= 2) {
        col = 0
        y += photoH + 12
      }
    }
    if (col !== 0) y += photoH + 12
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(140, 150, 165)
    doc.text(
      `AT72Manager · ${PDF_KIND_LABELS[kind]} · Page ${page}/${pageCount}`,
      PAGE_WIDTH / 2,
      290,
      { align: 'center' },
    )
  }

  return doc.output('blob')
}

export function downloadInterventionPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
