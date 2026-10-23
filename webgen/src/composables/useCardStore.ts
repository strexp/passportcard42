import { computed, reactive, ref, watch } from 'vue'

import { loadCardFonts } from '@/lib/fonts'
import { prepareSignature } from '@/lib/signature'
import { DEFAULT_CARD_DATA } from '@/lib/defaults'
import { buildMrz, formatDisplayDate, parseMrz } from '@/lib/mrz'
import type { CardData, MrzBuildResult, Sex, SignatureMode } from '@/types/card'

const STORAGE_KEY = 'passcard42:v3'
const LEGACY_STORAGE_KEYS = ['passport-card-studio:v3']
const STORAGE_VERSION = 3

interface PersistedState {
  version: number
  data: CardData
  savedAt: number
}

function loadPersistedState(): PersistedState | null {
  // Read the pre-rename key too, so existing local autosaves are not lost.
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      if (parsed.version !== STORAGE_VERSION || !parsed.data) continue
      return {
        version: STORAGE_VERSION,
        data: { ...DEFAULT_CARD_DATA, ...parsed.data },
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      }
    } catch (error) {
      console.warn(`[storage] Could not restore saved card from ${key}`, error)
    }
  }
  return null
}

const restored = loadPersistedState()

export const cardData = reactive<CardData>({ ...DEFAULT_CARD_DATA, ...restored?.data })

export const ready = ref(false)
export const fontsReady = ref(false)
export const isSaving = ref(false)
export const savedAt = ref<number | null>(restored?.savedAt ?? null)
export const saveError = ref<string | null>(null)

export const mrzResult = computed<MrzBuildResult>(() => buildMrz(cardData))
export const mrzText = computed(() => `${mrzResult.value.lines.join('\n')}\n`)
export const mrzReady = computed(
  () =>
    mrzResult.value.lines.every((line) => line.length === 30) &&
    mrzResult.value.warnings.length === 0,
)
export const birthDateLabel = computed(() => formatDisplayDate(cardData.birthDate))
export const issueDateLabel = computed(() => formatDisplayDate(cardData.issueDate))
export const expiryDateLabel = computed(() => formatDisplayDate(cardData.expiryDate))
export const fullName = computed(
  () => [cardData.givenNames, cardData.surname].filter(Boolean).join(' ') || 'Unnamed holder',
)

let persistenceStarted = false
let saveTimer: number | undefined

function persistNow(): void {
  isSaving.value = true
  try {
    const state: PersistedState = {
      version: STORAGE_VERSION,
      data: { ...cardData },
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    savedAt.value = state.savedAt
    saveError.value = null
  } catch (error) {
    saveError.value =
      error instanceof DOMException && error.name === 'QuotaExceededError'
        ? 'Local storage is full. Export the card to keep your edits.'
        : 'Autosave failed. Export the card to keep your edits.'
  } finally {
    window.setTimeout(() => {
      isSaving.value = false
    }, 240)
  }
}

function scheduleSave(): void {
  if (!persistenceStarted) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(persistNow, 350)
}

export function startPersistence(): void {
  if (persistenceStarted) return
  persistenceStarted = true
  watch(cardData, scheduleSave, { deep: true })
}

export async function initializeCardStore(): Promise<void> {
  fontsReady.value = await loadCardFonts()
  ready.value = true
  startPersistence()
  persistNow()
}

export function applyPortraitImage(dataUrl: string, name: string): void {
  cardData.photoSrc = dataUrl
  cardData.photoName = name
}

export function restoreSamplePortrait(): void {
  cardData.photoSrc = DEFAULT_CARD_DATA.photoSrc
  cardData.photoName = DEFAULT_CARD_DATA.photoName
}

export async function applySignatureFile(file: File): Promise<void> {
  const signature = await prepareSignature(file)
  cardData.signatureMode = 'image'
  cardData.signatureImageSrc = signature.dataUrl
  cardData.signatureImageName = signature.name
  cardData.signatureImageWidth = signature.width
  cardData.signatureImageHeight = signature.height
}

export function clearSignatureImage(): void {
  cardData.signatureImageSrc = DEFAULT_CARD_DATA.signatureImageSrc
  cardData.signatureImageName = DEFAULT_CARD_DATA.signatureImageName
  cardData.signatureImageWidth = DEFAULT_CARD_DATA.signatureImageWidth
  cardData.signatureImageHeight = DEFAULT_CARD_DATA.signatureImageHeight
}

export function setSignatureMode(mode: SignatureMode): void {
  cardData.signatureMode = mode
}

export function resetCard(): void {
  Object.assign(cardData, DEFAULT_CARD_DATA)
}

export function setSex(value: Sex): void {
  cardData.sex = value
}

export function setDate(
  field: 'birthDate' | 'issueDate' | 'expiryDate',
  value: string | null,
): void {
  if (value) cardData[field] = value
}

export function applyMrzText(raw: string): ReturnType<typeof parseMrz> {
  const result = parseMrz(raw)
  Object.assign(cardData, result.data)
  return result
}

export function normalizeCodeField(field: 'countryCode' | 'nationality', value: string): void {
  cardData[field] = value
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
}

export function normalizeDocumentCode(value: string): void {
  cardData.documentCode = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 2)
}

export function normalizeCan(value: string): void {
  cardData.can = value.replace(/\D/g, '').slice(0, 6)
}

export function normalizeDocumentNumber(value: string): void {
  cardData.documentNumber = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
}

export function persistImmediately(): void {
  persistNow()
}
