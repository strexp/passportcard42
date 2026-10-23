import type { CardSide } from '@/types/card'

const cardSvgs = new Map<CardSide, SVGSVGElement>()

/** Register a rendered card face so export code does not depend on DOM order. */
export function registerCardSvg(side: CardSide, element: SVGSVGElement): void {
  cardSvgs.set(side, element)
}

export function unregisterCardSvg(side: CardSide, element: SVGSVGElement): void {
  if (cardSvgs.get(side) === element) cardSvgs.delete(side)
}

export function getCardSvg(side: CardSide): SVGSVGElement {
  const element = cardSvgs.get(side)
  if (!element) throw new Error(`The ${side} card artwork is not ready.`)
  return element
}
