"use client";

import { useEffect, useState } from "react";
import { supabase, type Event } from "@/lib/supabase";
import CreateEventModal from "@/components/CreateEventModal";
import EventCard from "@/components/EventCard";

export default function Home() {
  const [events, setEvents] = useState<(Event & { registration_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(() => Date.now());

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-green-800">🍄 魔法使公會菇菇看板</h1>
          <p className="text-green-600 text-sm mt-1">目前開放的蘑菇團</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + 新增蘑菇團
        </button>
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
          {events.map((event) => (
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
