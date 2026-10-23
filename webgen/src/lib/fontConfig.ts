import caveatRegular from '@fontsource/caveat/files/caveat-latin-400-normal.woff?url'
import notoSansRegular from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import notoSansBold from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url'

export const FONT_FAMILIES = {
  sans: 'Noto Sans',
  mrz: 'OCRB',
  signature: 'Caveat',
} as const

export const OCRB_FONT_URL = new URL(
  `${import.meta.env.BASE_URL}fonts/OCRB-Regular.ttf`,
  document.baseURI,
).href

export interface ExportFont {
  family: string
  weight: string
  url: string
  format: 'woff' | 'truetype'
}

export const EXPORT_FONTS: ExportFont[] = [
  { family: FONT_FAMILIES.sans, weight: '400', url: notoSansRegular, format: 'woff' },
  { family: FONT_FAMILIES.sans, weight: '700', url: notoSansBold, format: 'woff' },
  { family: FONT_FAMILIES.signature, weight: '400', url: caveatRegular, format: 'woff' },
  { family: FONT_FAMILIES.mrz, weight: '400', url: OCRB_FONT_URL, format: 'truetype' },
]
