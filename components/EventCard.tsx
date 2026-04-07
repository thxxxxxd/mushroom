"use client";

import Link from "next/link";
import { type Event, ELEMENT_EMOJI, formatCountdown } from "@/lib/supabase";

type Props = {
  event: Event & { registration_count: number };
  now: number;
};

export default function EventCard({ event, now }: Props) {
  const isFull = event.registration_count >= event.spots_needed;
  const remaining = event.spots_needed - event.registration_count;
  const countdown = formatCountdown(event.expires_at, now);
  const isExpiringSoon =
    event.expires_at &&
    Math.floor((new Date(event.expires_at).getTime() - now) / 60000) <= 5;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {event.element && (
            <span className="text-xl">{ELEMENT_EMOJI[event.element]}</span>
          )}
          <span className="text-lg font-bold text-gray-800">{event.mushroom_name}</span>
          {event.element && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {event.element}
            </span>
          )}
          {remaining === 5 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              蘑菇未開
            </span>
          )}
          {isFull && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              已滿
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
          {isFull ? (
            <span>👥 {event.registration_count} 人已報名</span>
          ) : (
            <span>👥 還差 {remaining} 人</span>
          )}
          {countdown && (
            <span className={isExpiringSoon ? "text-red-500 font-medium" : "text-orange-400"}>
              ⏱ 剩 {countdown}
            </span>
          )}
          {event.coordinates && <span>📍 有座標</span>}
        </div>
      </div>
      <Link
        href={`/event/${event.id}`}
        className={`shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
          isFull
            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {isFull ? "查看" : "報名"}
      </Link>
    </div>
  );
}
