import type { CardData, MrzBuildResult, MrzParseResult, Sex } from '@/types/card'

const WEIGHTS = [7, 3, 1] as const
const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const

const SPECIAL_ASCII: Record<string, string> = {
  ß: 'SS',
  Æ: 'AE',
  Ø: 'O',
  Đ: 'D',
  Ð: 'D',
  Ł: 'L',
  Þ: 'TH',
  Œ: 'OE',
  İ: 'I',
  ı: 'I',
}

export function charValue(character: string): number {
  if (character >= '0' && character <= '9') return Number(character)
  if (character >= 'A' && character <= 'Z') return character.charCodeAt(0) - 55
  return 0
}

export function checkDigit(value: string): number {
  let sum = 0
  for (let index = 0; index < value.length; index += 1) {
    sum += charValue(value[index] ?? '<') * WEIGHTS[index % WEIGHTS.length]!
  }
  return sum % 10
}

/** Convert a value to the restricted OCR-B / MRZ character repertoire. */
export function toMrzCharacters(value: string): string {
  const replaced = [...value.normalize('NFD')]
    .map((character) => SPECIAL_ASCII[character] ?? character)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  return replaced
    .replace(/[^A-Z0-9< ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toMrzField(value: string, length: number): string {
  return toMrzCharacters(value)
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, length)
    .padEnd(length, '<')
}

export function toMrzName(value: string): string {
  return toMrzCharacters(value).replace(/[^A-Z0-9]/g, '')
}

export function isoToMrzDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return '<<<<<<'
  return `${match[1]!.slice(2)}${match[2]}${match[3]}`
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export function mrzDateToIso(value: string, kind: 'birth' | 'expiry'): string {
  if (!/^\d{6}$/.test(value)) return ''
  const yearPart = Number(value.slice(0, 2))
  const month = value.slice(2, 4)
  const day = value.slice(4, 6)
  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  let year: number

  if (kind === 'birth') {
    year = currentCentury + yearPart
    if (year > currentYear + 1) year -= 100
  } else {
    year = currentCentury + yearPart
    if (year < currentYear - 30) year += 100
  }

  const iso = `${String(year).padStart(4, '0')}-${month}-${day}`
  return isValidIsoDate(iso) ? iso : ''
}

export function formatDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return '—'
  const month = MONTHS[Number(match[2]) - 1]
  if (!month) return '—'
  return `${match[3]} ${month} ${match[1]}`
}

export function formatShortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return '—'
  return `${match[3]}.${match[2]}.${match[1]}`
}

export function buildMrz(data: CardData): MrzBuildResult {
  const warnings: string[] = []
  const documentCode = toMrzField(data.documentCode || 'IP', 2)
  const countryCode = toMrzField(data.countryCode, 3)
  const documentNumber = toMrzField(data.documentNumber, 9)
  const birthDate = isoToMrzDate(data.birthDate)
  const expiryDate = isoToMrzDate(data.expiryDate)
  const nationality = toMrzField(data.nationality, 3)
  const sex: Sex = ['F', 'M', 'X'].includes(data.sex) ? data.sex : 'X'

  if (data.documentNumber.replace(/[^A-Za-z0-9]/g, '').length > 9) {
    warnings.push('Document number exceeds 9 characters; only the first 9 are used in the MRZ.')
  }
  if (!isValidIsoDate(data.birthDate)) {
    warnings.push('The date of birth is not valid.')
  }
  if (!isValidIsoDate(data.expiryDate)) {
    warnings.push('The expiry date is not valid.')
  }
  if (!/^[A-Za-z]{3}$/.test(data.countryCode)) {
    warnings.push('The country code must contain three Latin letters.')
  }
  if (!/^[A-Za-z]{3}$/.test(data.nationality)) {
    warnings.push('The nationality must contain three Latin letters.')
  }
  if (data.expiryDate && data.issueDate && data.expiryDate <= data.issueDate) {
    warnings.push('The expiry date is before the issue date.')
  }

  const nameLineRaw = `${toMrzName(data.surname)}<<${toMrzName(data.givenNames)}`
  const nameLine = nameLineRaw.padEnd(30, '<').slice(0, 30)
  if (nameLineRaw.length > 30) {
    warnings.push('The name exceeds 30 MRZ characters and was truncated.')
  }

  const line1 = `${documentCode}${countryCode}${documentNumber}${checkDigit(documentNumber)}${'<'.repeat(15)}`
  const line2Body = `${birthDate}${checkDigit(birthDate)}${sex}${expiryDate}${checkDigit(expiryDate)}${nationality}${'<'.repeat(11)}`
  const composite = checkDigit(
    line1.slice(5) + line2Body.slice(0, 7) + line2Body.slice(8, 15) + line2Body.slice(18, 29),
  )
  const line2 = `${line2Body}${composite}`

  return {
    lines: [line1, line2, nameLine],
    checks: {
      documentNumber: checkDigit(documentNumber),
      birthDate: checkDigit(birthDate),
      expiryDate: checkDigit(expiryDate),
      composite,
    },
    warnings,
  }
}

export function testCheckDigit(value: string, expected: number): boolean {
  return checkDigit(value) === expected
}

export function parseMrz(raw: string): MrzParseResult {
  const issues: string[] = []
  const checks: MrzParseResult['checks'] = {
    documentNumber: { expected: 0, actual: null },
    birthDate: { expected: 0, actual: null },
    expiryDate: { expected: 0, actual: null },
    composite: { expected: 0, actual: null },
  }

  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd().toUpperCase())
    .filter((line) => line.length > 0)

  if (lines.length !== 3) {
    issues.push(`Expected 3 MRZ lines, received ${lines.length}.`)
  }

  const normalized = lines.slice(0, 3).map((line) => line.padEnd(30, '<'))
  for (const [index, line] of normalized.entries()) {
    if (line.length > 30) issues.push(`Line ${index + 1} exceeds 30 characters.`)
    if (!/^[A-Z0-9<]+$/.test(line)) {
      issues.push(`Line ${index + 1} contains characters outside the MRZ repertoire.`)
    }
  }

  const [line1 = ''.padEnd(30, '<'), line2 = ''.padEnd(30, '<'), line3 = ''.padEnd(30, '<')] =
    normalized

  const documentCode = line1.slice(0, 2).replace(/</g, '')
  const countryCode = line1.slice(2, 5).replace(/</g, '')
  const documentNumberRaw = line1.slice(5, 14)
  const documentNumber = documentNumberRaw.replace(/</g, '')
  const birthRaw = line2.slice(0, 6)
  const expiryRaw = line2.slice(8, 14)
  const nationality = line2.slice(15, 18).replace(/</g, '')
  const sexRaw = line2[7]
  const sex: Sex = sexRaw === 'F' || sexRaw === 'M' || sexRaw === 'X' ? sexRaw : 'X'

  checks.documentNumber = {
    expected: checkDigit(documentNumberRaw),
    actual: /^\d$/.test(line1[14] ?? '') ? Number(line1[14]) : null,
  }
  checks.birthDate = {
    expected: checkDigit(birthRaw),
    actual: /^\d$/.test(line2[6] ?? '') ? Number(line2[6]) : null,
  }
  checks.expiryDate = {
    expected: checkDigit(expiryRaw),
    actual: /^\d$/.test(line2[14] ?? '') ? Number(line2[14]) : null,
  }
  checks.composite = {
    expected: checkDigit(
      line1.slice(5) + line2.slice(0, 7) + line2.slice(8, 15) + line2.slice(18, 29),
    ),
    actual: /^\d$/.test(line2[29] ?? '') ? Number(line2[29]) : null,
  }

  if (checks.documentNumber.actual !== checks.documentNumber.expected) {
    issues.push('The document number check digit does not match.')
  }
  if (checks.birthDate.actual !== checks.birthDate.expected) {
    issues.push('The birth date check digit does not match.')
  }
  if (checks.expiryDate.actual !== checks.expiryDate.expected) {
    issues.push('The expiry date check digit does not match.')
  }
  if (checks.composite.actual !== checks.composite.expected) {
    issues.push('The composite check digit does not match.')
  }

  const birthDate = mrzDateToIso(birthRaw, 'birth')
  const expiryDate = mrzDateToIso(expiryRaw, 'expiry')
  if (!birthDate) issues.push('Could not parse the birth date.')
  if (!expiryDate) issues.push('Could not parse the expiry date.')

  const nameParts = line3.split('<<')
  const surname = (nameParts[0] ?? '').replace(/</g, ' ').trim()
  const givenNames = nameParts.slice(1).join(' ').replace(/</g, ' ').replace(/\s+/g, ' ').trim()

  if (!surname) issues.push('No surname was found on line 3.')

  return {
    ok: issues.length === 0,
    issues,
    checks,
    data: {
      documentCode,
      countryCode,
      documentNumber,
      birthDate,
      expiryDate,
      nationality,
      sex,
      surname: surname || undefined,
      givenNames: givenNames || undefined,
    },
  }
}

export function mrzToText(lines: readonly string[]): string {
  return `${lines.join('\n')}\n`
}
