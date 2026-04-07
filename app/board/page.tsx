"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, type Event, type Element, ELEMENT_EMOJI, parseElements } from "@/lib/supabase";
import CreateEventModal from "@/components/CreateEventModal";
import EventCard from "@/components/EventCard";

export default function Home() {
  const [events, setEvents] = useState<(Event & { registration_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [filterElement, setFilterElement] = useState<Element | null>(null);
  const [filterStatus, setFilterStatus] = useState<"未滿" | "蘑菇未開" | null>(null);
  const [sortByExpiry, setSortByExpiry] = useState(false);

  async function fetchEvents() {
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (!eventsData) {
      setLoading(false);
      return;
    }

    const { data: counts } = await supabase
      .from("registrations")
      .select("event_id")
      .in("event_id", eventsData.map((e) => e.id));

    const countMap: Record<string, number> = {};
    (counts || []).forEach((r) => {
      countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
    });

    setEvents(
      eventsData.map((e) => ({ ...e, registration_count: countMap[e.id] || 0 }))
    );
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("realtime-events")
      .on("postgres_changes", { event: "*", schema: "public" }, fetchEvents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const expired = events.filter(
      (e) => e.expires_at && new Date(e.expires_at).getTime() <= Date.now()
    );
    for (const e of expired) {
      supabase.from("events").delete().eq("id", e.id);
    }
  }, [now, events]);


  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-green-600 hover:text-green-800 text-sm mb-6 flex items-center gap-1">
        ← 回首頁
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-green-800">🍄 皮皮勞工招募中心</h1>
          <p className="text-green-600 text-sm mt-1">目前開放的蘑菇團</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + 新增蘑菇團
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => setSortByExpiry((v) => !v)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
            sortByExpiry
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
          }`}
        >
          ⏱ 哪個快死了?
        </button>
        {(["未滿", "蘑菇未開"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? null : s)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              filterStatus === s
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {(Object.entries(ELEMENT_EMOJI) as [Element, string][]).map(([el, emoji]) => (
          <button
            key={el}
            onClick={() => setFilterElement(filterElement === el ? null : el)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              filterElement === el
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
            }`}
          >
            {emoji} {el}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-green-600">載入中...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🍄</div>
          <p>目前沒有蘑菇團，來新增一個吧！</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events
            .filter((e) => !filterElement || parseElements(e.element).includes(filterElement))
            .filter((e) => {
              if (!filterStatus) return true;
              const remaining = e.spots_needed - e.registration_count;
              if (filterStatus === "未滿") return e.registration_count < e.spots_needed;
              if (filterStatus === "蘑菇未開") return remaining === 5;
              return true;
            })
            .sort((a, b) => {
              if (!sortByExpiry) return 0;
              const ta = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
              const tb = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
              return ta - tb;
            })
            .map((event) => (
              <EventCard key={event.id} event={event} now={now} />
            ))}
        </div>
      )}

      {showModal && (
        <CreateEventModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchEvents();
          }}
        />
      )}
    </main>
  );
}
