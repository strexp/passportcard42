import type { ExportRequest } from '@/types/card'
import { EXPORT_FONTS, FONT_FAMILIES } from '@/lib/fontConfig'

const SVG_NS = 'http://www.w3.org/2000/svg'

const FONT_CACHE = new Map<string, Promise<ArrayBuffer>>()
const BASE64_CACHE = new Map<string, Promise<string>>()

function fetchFont(url: string): Promise<ArrayBuffer> {
  const cached = FONT_CACHE.get(url)
  if (cached) return cached
  const promise = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error('Could not load a card font.')
    return response.arrayBuffer()
  })
  FONT_CACHE.set(url, promise)
  return promise
}

function fontUrl(family: string, weight: string): string {
  const font = EXPORT_FONTS.find((item) => item.family === family && item.weight === weight)
  if (!font) throw new Error(`Missing card font ${family} ${weight}.`)
  return font.url
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return btoa(binary)
}

function fontBase64(url: string): Promise<string> {
  const cached = BASE64_CACHE.get(url)
  if (cached) return cached
  const promise = fetchFont(url).then(arrayBufferToBase64)
  BASE64_CACHE.set(url, promise)
  return promise
}

async function fontFaceCss(): Promise<string> {
  const rules = await Promise.all(
    EXPORT_FONTS.map(async ({ family, weight, url, format }) => {
      const base64 = await fontBase64(url)
      const mime = format === 'woff' ? 'font/woff' : 'font/ttf'
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:${mime};base64,${base64}) format('${format}');}`
    }),
  )
  return rules.join('\n')
}

function cloneSvg(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', SVG_NS)
  clone.setAttribute('width', '85.6mm')
  clone.setAttribute('height', '53.98mm')
  clone.setAttribute('viewBox', '0 0 85.6 53.98')
  clone.removeAttribute('style')
  clone.removeAttribute('class')

  return clone
}

function addStyle(clone: SVGSVGElement, css: string): void {
  const existing = clone.querySelector('style')
  if (existing) {
    existing.textContent = `${existing.textContent ?? ''}\n${css}`
    return
  }
  const style = document.createElementNS(SVG_NS, 'style')
  style.setAttribute('type', 'text/css')
  style.textContent = css
  clone.insertBefore(style, clone.firstChild)
}

export function serializeSvg(svg: SVGSVGElement): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}\n`
}

async function buildSvgText(
  svg: SVGSVGElement,
  options: { embedFonts: boolean; outlined: boolean; keepHiddenLayers?: boolean },
): Promise<string> {
  await document.fonts.ready

  if (options.outlined) {
    return serializeSvg(await outlineSvg(svg))
  }

  const clone = cloneSvg(svg)
  if (!options.keepHiddenLayers) {
    stripHiddenLayers(clone)
  }
  if (options.embedFonts) {
    addStyle(clone, await fontFaceCss())
  }
  return serializeSvg(clone)
}

function stripHiddenLayers(svg: SVGSVGElement): void {
  svg
    .querySelectorAll('[id$="-zone-guides"], [id$="-uv-security"]')
    .forEach((element) => element.remove())
}

export async function exportSvg(svg: SVGSVGElement, request: ExportRequest): Promise<Blob> {
  const source = await buildSvgText(svg, {
    embedFonts: request.embedFonts,
    outlined: request.format === 'svg-outlined',
  })
  return new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
}

/**
 * Build an editable template for offline editors.
 *
 * Unlike the artwork exports, the template keeps the hidden guide and UV
 * layers so they can still be toggled in Inkscape or Illustrator, and the card
 * fonts are always embedded so the file renders consistently on its own.
 */
export async function exportTemplateSvg(svg: SVGSVGElement): Promise<Blob> {
  const source = await buildSvgText(svg, {
    embedFonts: true,
    outlined: false,
    keepHiddenLayers: true,
  })
  return new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
}

export async function exportRaster(svg: SVGSVGElement, request: ExportRequest): Promise<Blob> {
  const source = await buildSvgText(svg, { embedFonts: false, outlined: true })
  const image = await svgTextToImage(source)
  const pixelWidth = Math.round((85.6 / 25.4) * request.dpi)
  const pixelHeight = Math.round((53.98 / 25.4) * request.dpi)
  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth
  canvas.height = pixelHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported in this browser.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  if (!request.transparent) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, pixelWidth, pixelHeight)
  }
  context.drawImage(image, 0, 0, pixelWidth, pixelHeight)

  const mime = request.format === 'webp' ? 'image/webp' : 'image/png'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, mime === 'image/webp' ? 0.94 : undefined)
  })
  if (!blob) throw new Error('Could not encode the image.')
  return blob
}

function svgTextToImage(source: string): Promise<HTMLImageElement> {
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not render the SVG.'))
    }
    image.src = url
  })
}

interface OutlineFontSet {
  sans: import('opentype.js').Font
  sansBold: import('opentype.js').Font
  mrz: import('opentype.js').Font
  signature: import('opentype.js').Font
  Path: typeof import('opentype.js').Path
}

let outlineFontsPromise: Promise<OutlineFontSet> | null = null

function loadOutlineFonts(): Promise<OutlineFontSet> {
  if (outlineFontsPromise) return outlineFontsPromise
  outlineFontsPromise = (async () => {
    const opentype = await import('opentype.js')
    const [sans, sansBold, mrz, signature] = await Promise.all([
      fetchFont(fontUrl(FONT_FAMILIES.sans, '400')).then((buffer) => opentype.parse(buffer)),
      fetchFont(fontUrl(FONT_FAMILIES.sans, '700')).then((buffer) => opentype.parse(buffer)),
      fetchFont(fontUrl(FONT_FAMILIES.mrz, '400')).then((buffer) => opentype.parse(buffer)),
      fetchFont(fontUrl(FONT_FAMILIES.signature, '400')).then((buffer) => opentype.parse(buffer)),
    ])
    return { sans, sansBold, mrz, signature, Path: opentype.Path }
  })()
  return outlineFontsPromise
}

function chooseFont(fonts: OutlineFontSet, family: string, weight: string) {
  if (family.includes(FONT_FAMILIES.signature) || family.includes('Caveat')) {
    return fonts.signature
  }
  if (family.includes(FONT_FAMILIES.mrz) || family.includes('OCR')) {
    return fonts.mrz
  }
  return Number.parseInt(weight, 10) >= 600 ? fonts.sansBold : fonts.sans
}

function measureText(
  font: import('opentype.js').Font,
  text: string,
  fontSize: number,
  letterSpacing: number,
): number {
  const characters = [...text]
  let width = 0
  characters.forEach((character, index) => {
    const glyph = font.charToGlyph(character)
    width += ((glyph.advanceWidth ?? font.unitsPerEm * 0.5) / font.unitsPerEm) * fontSize
    if (index < characters.length - 1) width += letterSpacing
  })
  return width
}

function textToPath(
  font: import('opentype.js').Font,
  PathCtor: typeof import('opentype.js').Path,
  text: string,
  fontSize: number,
  letterSpacing: number,
): string {
  const path = new PathCtor()
  let cursor = 0
  for (const character of [...text]) {
    const glyph = font.charToGlyph(character)
    path.extend(glyph.getPath(cursor, 0, fontSize, { kerning: false }))
    cursor +=
      ((glyph.advanceWidth ?? font.unitsPerEm * 0.5) / font.unitsPerEm) * fontSize + letterSpacing
  }
  return path.toPathData(4)
}

interface TextPiece {
  text: string
  x: number
  y: number
  fontSize: number
  letterSpacing: number
  fontFamily: string
  fontWeight: string
  fill: string
  opacity: number
  textLength: number
  textAnchor: string
}

function readTextPiece(element: Element, parent: Element): TextPiece {
  const style = getComputedStyle(element)
  const parentStyle = getComputedStyle(parent)
  const parse = (value: string | null) => {
    if (!value) return null
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  const x = parse(element.getAttribute('x')) ?? parse(parent.getAttribute('x')) ?? 0
  const y = parse(element.getAttribute('y')) ?? parse(parent.getAttribute('y')) ?? 0
  const textLength =
    parse(element.getAttribute('textLength')) ?? parse(parent.getAttribute('textLength')) ?? 0
  const letterSpacingAttribute =
    element.getAttribute('letter-spacing') ?? parent.getAttribute('letter-spacing')
  const computedLetterSpacing = Number.parseFloat(style.letterSpacing)

  return {
    text: (element.textContent ?? '').replace(/\s+$/g, ''),
    x,
    y,
    fontSize: Number.parseFloat(style.fontSize) || 2,
    letterSpacing: Number.isFinite(computedLetterSpacing)
      ? computedLetterSpacing
      : (parse(letterSpacingAttribute) ?? 0),
    fontFamily: style.fontFamily || parentStyle.fontFamily,
    fontWeight: style.fontWeight || '400',
    fill: style.fill || '#000000',
    opacity: Number.parseFloat(style.opacity) * Number.parseFloat(style.fillOpacity || '1') || 1,
    textLength,
    textAnchor: style.textAnchor || element.getAttribute('text-anchor') || 'start',
  }
}

function buildPathElement(piece: TextPiece, fonts: OutlineFontSet): SVGPathElement | null {
  if (!piece.text) return null
  const font = chooseFont(fonts, piece.fontFamily, piece.fontWeight)
  const naturalWidth = measureText(font, piece.text, piece.fontSize, piece.letterSpacing)
  if (naturalWidth <= 0) return null

  const width = piece.textLength > 0 ? piece.textLength : naturalWidth
  const scaleX = piece.textLength > 0 ? piece.textLength / naturalWidth : 1
  let translateX = piece.x
  if (piece.textAnchor === 'middle') translateX -= width / 2
  if (piece.textAnchor === 'end') translateX -= width

  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute(
    'd',
    textToPath(font, fonts.Path, piece.text, piece.fontSize, piece.letterSpacing),
  )
  path.setAttribute('fill', piece.fill)
  if (piece.opacity < 1) path.setAttribute('opacity', String(piece.opacity))
  path.setAttribute(
    'transform',
    `translate(${translateX.toFixed(4)} ${piece.y.toFixed(4)}) scale(${scaleX.toFixed(6)} 1)`,
  )
  return path
}

async function outlineSvg(svg: SVGSVGElement): Promise<SVGSVGElement> {
  const fonts = await loadOutlineFonts()
  const clone = cloneSvg(svg)
  const sourceTexts = Array.from(svg.querySelectorAll('text'))
  const clonedTexts = Array.from(clone.querySelectorAll('text'))

  sourceTexts.forEach((source, index) => {
    const target = clonedTexts[index]
    if (!target) return

    if (getComputedStyle(source).display === 'none') {
      target.remove()
      return
    }

    const sourcePieces =
      source.querySelectorAll(':scope > tspan').length > 0
        ? Array.from(source.querySelectorAll(':scope > tspan'))
        : [source]
    const group = document.createElementNS(SVG_NS, 'g')

    for (const sourcePiece of sourcePieces) {
      const piece = readTextPiece(sourcePiece, source)
      const path = buildPathElement(piece, fonts)
      if (path) group.appendChild(path)
    }

    if (!group.children.length) {
      target.remove()
      return
    }

    const transform = source.getAttribute('transform')
    if (transform) group.setAttribute('transform', transform)
    target.replaceWith(group)
  })

  stripHiddenLayers(clone)
  return clone
}
