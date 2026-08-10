import { describe, expect, it } from 'vitest'
import { promoDiscount } from './promo'

describe('promoDiscount', () => {
  it('процентный код даёт скидку от суммы', () => {
    expect(promoDiscount('VOYAGO10', 1000)?.discount).toBe(100)
  })

  it('фиксированный код ограничен суммой заказа', () => {
    expect(promoDiscount('WELCOME', 5000)?.discount).toBe(1000)
    expect(promoDiscount('WELCOME', 700)?.discount).toBe(700)
  })

  it('код нечувствителен к регистру', () => {
    expect(promoDiscount('voyago10', 2000)?.discount).toBe(200)
  })

  it('неизвестный код возвращает null', () => {
    expect(promoDiscount('NOPE', 1000)).toBeNull()
  })
})
