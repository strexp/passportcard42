import { FONT_FAMILIES, OCRB_FONT_URL } from '@/lib/fontConfig'

let fontsPromise: Promise<boolean> | null = null

async function loadFontFace(
  family: string,
  url: string,
  descriptors: FontFaceDescriptors,
): Promise<boolean> {
  try {
    const face = new FontFace(family, `url("${url}")`, descriptors)
    const loaded = await face.load()
    document.fonts.add(loaded)
    return true
  } catch (error) {
    console.warn(`[fonts] Failed to load ${family}`, error)
    return false
  }
}

/** Load the card fonts from the local bundle before rendering the SVG. */
export function loadCardFonts(): Promise<boolean> {
  if (fontsPromise) return fontsPromise

  fontsPromise = (async () => {
    const ocrbLoaded = await loadFontFace(FONT_FAMILIES.mrz, OCRB_FONT_URL, {
      weight: '400',
      style: 'normal',
    })

    const [notoRegular, notoBold, caveat] = await Promise.all([
      document.fonts.load(`400 16px "${FONT_FAMILIES.sans}"`),
      document.fonts.load(`700 16px "${FONT_FAMILIES.sans}"`),
      document.fonts.load(`400 16px "${FONT_FAMILIES.signature}"`),
    ])

    await document.fonts.ready
    return ocrbLoaded && notoRegular.length > 0 && notoBold.length > 0 && caveat.length > 0
  })()

  return fontsPromise
}
