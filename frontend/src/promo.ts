/** Демо-промокоды: процент или фиксированная скидка на сумму заказа. */
interface PromoDef { label: string; kind: 'pct' | 'fix'; value: number }

const CODES: Record<string, PromoDef> = {
  VOYAGO10: { label: '−10%', kind: 'pct', value: 10 },
  LETO2026: { label: '−7%', kind: 'pct', value: 7 },
  WELCOME: { label: '−1000 ₽', kind: 'fix', value: 1000 },
}

export const PROMO_HINT = 'Попробуйте: VOYAGO10, LETO2026, WELCOME'

export interface AppliedPromo { code: string; label: string; discount: number }

export function promoDiscount(code: string, total: number): AppliedPromo | null {
  const key = code.trim().toUpperCase()
  const def = CODES[key]
  if (!def) return null
  const discount = def.kind === 'pct' ? Math.round((total * def.value) / 100) : Math.min(total, def.value)
  return { code: key, label: def.label, discount }
}
