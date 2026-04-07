import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Element = '水' | '水晶' | '火' | '毒' | '電' | '活動' | '泡菜菇' | '美片'

export const ELEMENT_EMOJI: Record<Element, string> = {
  '水': '💧',
  '水晶': '💎',
  '火': '🔥',
  '毒': '💀',
  '電': '⚡',
  '活動': '🎉',
  '泡菜菇': '🇰🇷',
  '美片': '🌸',
}

export const BASE_ELEMENTS: Element[] = ['水', '水晶', '火', '毒', '電', '活動']
export const EXTRA_ELEMENTS: Element[] = ['泡菜菇', '美片']

export function parseElements(element: string | null): Element[] {
  if (!element) return []
  return element.split('|') as Element[]
}

export type Event = {
  id: string
  mushroom_name: string
  spots_needed: number
  element: Element | null
  coordinates: string | null
  expires_at: string | null
  created_at: string
}

export type Registration = {
  id: string
  event_id: string
  nickname: string
  battle_power: number
  created_at: string
}

export function formatCountdown(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const totalMins = Math.floor((new Date(expiresAt).getTime() - now) / 60000);
  if (totalMins <= 0) return "即將到期";
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小時`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}分`);
  return parts.join('');
}
