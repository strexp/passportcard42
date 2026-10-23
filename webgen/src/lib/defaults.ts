import { buildMrz } from '@/lib/mrz'
import type { CardData } from '@/types/card'

export const DEFAULT_CARD_DATA: CardData = {
  surname: 'YOUR',
  givenNames: 'NAME',
  sex: 'X',
  nationality: 'XDN',
  birthDate: '1926-08-17',
  documentNumber: 'D19198100',
  issueDate: '2026-10-22',
  expiryDate: '2036-10-22',
  authority: 'National Immigration Agency',
  issuingOffice: 'NIA-MNT',
  can: '114514',
  signature: 'Your Name',
  countryName: 'UNION OF DISTRIBUTED NETWORKS',
  countryCode: 'XDN',
  documentType: 'E-PASSPORT CARD',
  documentCode: 'IP',
  agencyName: 'NATIONAL IMMIGRATION AGENCY',
  version: 'Version 0.1',
  photoSrc: '',
  photoName: 'Embedded sample portrait',
  signatureMode: 'font',
  signatureImageSrc: '',
  signatureImageName: '',
  signatureImageWidth: 0,
  signatureImageHeight: 0,
}

/** Example MRZ shown as the import placeholder, generated from the defaults. */
export const DEFAULT_MRZ_TEXT = buildMrz(DEFAULT_CARD_DATA).lines.join('\n')
