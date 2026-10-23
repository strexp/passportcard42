export type CardSide = 'front' | 'back'

export type Sex = 'F' | 'M' | 'X'

export type SignatureMode = 'font' | 'image'

export interface CardData {
  surname: string
  givenNames: string
  sex: Sex
  nationality: string
  birthDate: string
  documentNumber: string
  issueDate: string
  expiryDate: string
  authority: string
  issuingOffice: string
  can: string
  signature: string
  countryName: string
  countryCode: string
  documentType: string
  documentCode: string
  agencyName: string
  version: string
  photoSrc: string
  photoName: string
  signatureMode: SignatureMode
  signatureImageSrc: string
  signatureImageName: string
  signatureImageWidth: number
  signatureImageHeight: number
}

export interface MrzChecks {
  documentNumber: number
  birthDate: number
  expiryDate: number
  composite: number
}

export interface MrzBuildResult {
  lines: [string, string, string]
  checks: MrzChecks
  warnings: string[]
}

export interface MrzParseResult {
  ok: boolean
  data: Partial<CardData>
  issues: string[]
  checks: {
    documentNumber: { expected: number; actual: number | null }
    birthDate: { expected: number; actual: number | null }
    expiryDate: { expected: number; actual: number | null }
    composite: { expected: number; actual: number | null }
  }
}

export type ExportFormat = 'svg' | 'svg-outlined' | 'png' | 'webp'

export interface ExportRequest {
  format: ExportFormat
  side: CardSide
  dpi: number
  embedFonts: boolean
  transparent: boolean
}
