/**
 * Обложки предложений: реальная фотография (детерминированно по seed) поверх
 * тематического градиента с эмодзи. Если фото не загрузилось (офлайн/ошибка сети) —
 * остаётся надёжный градиент, поэтому вёрстка не «ломается» никогда.
 */
import { useState } from 'react'
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

export function Cover({ seed, emoji, label, className = '', glyphClass = 'text-6xl', photoSeed }: {
  seed: string
  emoji: string
  label?: string
  className?: string
  glyphClass?: string
  photoSeed?: string
}) {
  const h = hueFor(seed)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const style = { backgroundImage: `linear-gradient(135deg, hsl(${h} 68% 54%), hsl(${(h + 42) % 360} 72% 40%))` }
  const src = `https://picsum.photos/seed/voyago-${encodeURIComponent(photoSeed ?? seed)}/600/400`
  return (
    <div className={`relative overflow-hidden ${className}`} style={style} aria-hidden="true">
      <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/15" />
      <div className="absolute -bottom-12 -left-6 w-36 h-36 rounded-full bg-black/10" />
      {!failed && (
        <img src={src} alt="" loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
      )}
      <div className={`absolute inset-0 flex items-center justify-center ${glyphClass} drop-shadow-sm select-none transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}>
        {emoji}
      </div>
      {label && (
        <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent text-white text-sm font-medium">
          {label}
        </div>
      )}
    </div>
  )
}
