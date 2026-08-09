/**
 * Обложки предложений без внешних картинок: тематический градиент по городу + эмодзи.
 * Полностью офлайн и надёжно на GitHub Pages; читается как оформленная «фотография».
 * Чтобы подключить реальные фото — достаточно заменить фон в <Cover> на <img>.
 */
import type { ItemType } from './types'

interface CityStyle { emoji: string; hue: number }

const CITY: Record<string, CityStyle> = {
  'Москва': { emoji: '🏛️', hue: 214 },
  'Санкт-Петербург': { emoji: '🌉', hue: 268 },
  'Сочи': { emoji: '🏖️', hue: 189 },
  'Казань': { emoji: '🕌', hue: 152 },
  'Калининград': { emoji: '⚓', hue: 202 },
  'Екатеринбург': { emoji: '🏔️', hue: 232 },
  'Новосибирск': { emoji: '🌲', hue: 158 },
  'Краснодар': { emoji: '🌻', hue: 44 },
  'Минеральные Воды': { emoji: '⛰️', hue: 27 },
  'Владивосток': { emoji: '🌊', hue: 197 },
  'Мурманск': { emoji: '🌌', hue: 250 },
  'Уфа': { emoji: '🌾', hue: 128 },
}

const KIND_EMOJI: Record<ItemType, string> = { flight: '✈️', hotel: '🏨', tour: '🧭' }
const GALLERY: Record<ItemType, string[]> = {
  flight: ['✈️', '🛫', '🧳'],
  hotel: ['🏨', '🛏️', '🍽️'],
  tour: ['🧭', '🏞️', '📸'],
}

function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export function cityEmoji(city: string): string {
  return CITY[city]?.emoji ?? '📍'
}

function hueFor(seed: string): number {
  return CITY[seed]?.hue ?? hash(seed) % 360
}

export function coverEmoji(kind: ItemType, city?: string): string {
  return city && CITY[city] ? CITY[city].emoji : KIND_EMOJI[kind]
}

export function galleryEmojis(kind: ItemType): string[] {
  return GALLERY[kind]
}

export function Cover({ seed, emoji, label, className = '', glyphClass = 'text-6xl' }: {
  seed: string
  emoji: string
  label?: string
  className?: string
  glyphClass?: string
}) {
  const h = hueFor(seed)
  const style = { backgroundImage: `linear-gradient(135deg, hsl(${h} 68% 54%), hsl(${(h + 42) % 360} 72% 40%))` }
  return (
    <div className={`relative overflow-hidden ${className}`} style={style} aria-hidden="true">
      <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/15" />
      <div className="absolute -bottom-12 -left-6 w-36 h-36 rounded-full bg-black/10" />
      <div className={`absolute inset-0 flex items-center justify-center ${glyphClass} drop-shadow-sm select-none`}>
        {emoji}
      </div>
      {label && (
        <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/55 to-transparent text-white text-sm font-medium">
          {label}
        </div>
      )}
    </div>
  )
}
