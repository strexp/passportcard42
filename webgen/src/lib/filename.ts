/** Build a safe, human-readable filename stem from the document number. */
export function documentStem(documentNumber: string): string {
  const value = documentNumber
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
  return value || 'passport-card'
}
