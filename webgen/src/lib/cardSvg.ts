import { format, parseISO } from 'date-fns'

import backRaw from '@/assets/card-back.svg?raw'
import frontRaw from '@/assets/card-front.svg?raw'
import type { CardData, CardSide } from '@/types/card'

const PORTRAIT = { x: 2.6, y: 11.9, width: 26, height: 32.5 } as const
const SIGNATURE_BOX = { left: 32.7, bottom: 51.15, width: 47.5, height: 5.4 } as const
const BACK_PREFIX = 'b-'

function patchCardSvg(raw: string): string {
  return raw.replace(/<\?xml[^>]*\?>\s*/i, '').replace(/Noto Sans Mono/g, 'OCRB')
}

function namespaceIds(raw: string, prefix: string): string {
  const ids = new Set([...raw.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1] as string))
  return raw
    .replace(/\bid="([^"]+)"/g, (_match, id: string) => `id="${prefix}${id}"`)
    .replace(/#([A-Za-z_][\w:.-]*)/g, (match, id: string) =>
      ids.has(id) ? `#${prefix}${id}` : match,
    )
}

export const CARD_SVG_MARKUP: Record<CardSide, string> = {
  front: patchCardSvg(frontRaw),
  back: namespaceIds(patchCardSvg(backRaw), BACK_PREFIX),
}

export const EMBEDDED_PORTRAIT_HREF = (() => {
  const doc = new DOMParser().parseFromString(CARD_SVG_MARKUP.front, 'image/svg+xml')
  return doc.querySelector('#portrait-photo')?.getAttribute('href') ?? ''
})()

function formatCardDate(value: string): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'dd MMM yyyy').toUpperCase()
  } catch {
    return '—'
  }
}

function textElement(svg: SVGSVGElement, id: string): SVGTextElement | null {
  return svg.querySelector<SVGTextElement>(`#${CSS.escape(id)}`)
}

function setFittedText(
  svg: SVGSVGElement,
  targetId: string,
  parentId: string,
  value: string,
  maxWidth: number,
): void {
  const target = svg.querySelector<SVGElement>(`#${CSS.escape(targetId)}`)
  const parent = textElement(svg, parentId)
  if (!target || !parent) return

  target.textContent = value
  parent.removeAttribute('textLength')
  const width = parent.getComputedTextLength()
  if (width > maxWidth) {
    parent.setAttribute('textLength', String(maxWidth))
    parent.setAttribute('lengthAdjust', 'spacingAndGlyphs')
  }
}

function setPlainText(svg: SVGSVGElement, id: string, value: string): void {
  const element = textElement(svg, id)
  if (element) element.textContent = value
}

function fitPlainText(svg: SVGSVGElement, id: string, value: string, maxWidth: number): void {
  const element = textElement(svg, id)
  if (!element) return
  element.textContent = value
  element.removeAttribute('textLength')
  if (element.getComputedTextLength() > maxWidth) {
    element.setAttribute('textLength', String(maxWidth))
    element.setAttribute('lengthAdjust', 'spacingAndGlyphs')
  }
}

function updatePortrait(svg: SVGSVGElement, data: CardData): void {
  const image = svg.querySelector<SVGImageElement>('#portrait-photo')
  if (!image) return

  const href = data.photoSrc || EMBEDDED_PORTRAIT_HREF
  if (href) image.setAttribute('href', href)
  image.setAttribute('preserveAspectRatio', 'xMidYMid slice')
  image.setAttribute('x', String(PORTRAIT.x))
  image.setAttribute('y', String(PORTRAIT.y))
  image.setAttribute('width', String(PORTRAIT.width))
  image.setAttribute('height', String(PORTRAIT.height))
  image.removeAttribute('transform')
}

function updateSignature(svg: SVGSVGElement, data: CardData): void {
  const signature = textElement(svg, 'signature')
  if (!signature) return

  let image = svg.querySelector<SVGImageElement>('#signature-image')
  if (!image) {
    image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    image.setAttribute('id', 'signature-image')
    signature.parentNode?.appendChild(image)
  }

  const useImage = data.signatureMode === 'image' && Boolean(data.signatureImageSrc)
  if (!useImage) {
    signature.removeAttribute('display')
    image.setAttribute('display', 'none')
    return
  }

  const naturalWidth = data.signatureImageWidth || 4
  const naturalHeight = data.signatureImageHeight || 1
  const scale = Math.min(SIGNATURE_BOX.width / naturalWidth, SIGNATURE_BOX.height / naturalHeight)
  const width = naturalWidth * scale
  const height = naturalHeight * scale

  signature.setAttribute('display', 'none')
  image.removeAttribute('display')
  image.setAttribute('href', data.signatureImageSrc)
  image.setAttribute('x', String(SIGNATURE_BOX.left))
  image.setAttribute('y', String(SIGNATURE_BOX.bottom - height))
  image.setAttribute('width', String(width))
  image.setAttribute('height', String(height))
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  image.setAttribute('transform', 'rotate(-1.4 32.6 50.35)')
}

export function updateCardSvg(
  svg: SVGSVGElement,
  side: CardSide,
  data: CardData,
  mrzLines: readonly string[],
): void {
  svg.setAttribute('data-card-side', side)
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', `Passport card ${side} preview`)

  if (side === 'front') {
    fitPlainText(svg, 'front-country-name', data.countryName.toUpperCase(), 66)
    fitPlainText(svg, 'front-document-type', data.documentType.toUpperCase(), 66)
    setFittedText(svg, 'value-surname-text', 'value-surname', data.surname.toUpperCase(), 24.6)
    setFittedText(
      svg,
      'value-given-names-text',
      'value-given-names',
      data.givenNames.toUpperCase(),
      24.6,
    )
    fitPlainText(svg, 'value-sex', data.sex, 8.5)
    fitPlainText(svg, 'value-nationality', data.nationality.toUpperCase(), 17)
    fitPlainText(svg, 'value-date-of-birth', formatCardDate(data.birthDate), 24.6)
    fitPlainText(svg, 'value-date-of-issue', formatCardDate(data.issueDate), 26)
    fitPlainText(svg, 'value-date-of-expiry', formatCardDate(data.expiryDate), 24.6)
    fitPlainText(svg, 'value-authority', data.authority.toUpperCase(), 35.4)
    fitPlainText(svg, 'value-issuing-office', data.issuingOffice.toUpperCase(), 35.4)
    fitPlainText(svg, 'front-document-no', data.documentNumber.toUpperCase(), 26)
    fitPlainText(svg, 'can-number', data.can, 15.4)
    setPlainText(svg, 'signature', data.signature)
    updatePortrait(svg, data)
    updateSignature(svg, data)
    return
  }

  fitPlainText(svg, `${BACK_PREFIX}back-agency`, data.agencyName.toUpperCase(), 68)
  fitPlainText(svg, `${BACK_PREFIX}back-document-type`, data.documentType.toUpperCase(), 38)
  fitPlainText(svg, `${BACK_PREFIX}back-version`, data.version, 25)
  fitPlainText(svg, `${BACK_PREFIX}back-document-no`, data.documentNumber.toUpperCase(), 26)

  mrzLines.slice(0, 3).forEach((line, index) => {
    setPlainText(svg, `${BACK_PREFIX}mrz-line-${index + 1}`, line)
  })
}
