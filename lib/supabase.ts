import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Element = '水' | '水晶' | '火' | '毒' | '電'

export const ELEMENT_EMOJI: Record<Element, string> = {
  '水': '💧',
  '水晶': '💎',
  '火': '🔥',
  '毒': '🟣',
  '電': '⚡',
}

export type Event = {
  id: string
  mushroom_name: string
  spots_needed: number
  element: Element | null
  coordinates: string | null
  created_at: string
}

export type Registration = {
  id: string
  event_id: string
  nickname: string
  battle_power: number
  created_at: string
}
