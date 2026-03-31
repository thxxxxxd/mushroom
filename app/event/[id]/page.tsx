"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Event, type Registration, ELEMENT_EMOJI, formatCountdown } from "@/lib/supabase";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nickname: "", battle_power: "", days_remaining: "", hours_remaining: "", minutes_remaining: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  async function fetchData() {
    const [{ data: eventData }, { data: regsData }] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),
      supabase
        .from("registrations")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setEvent(eventData);
    setRegistrations(regsData || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("realtime-event-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Tick every 30 seconds for countdown display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-delete event when expired, redirect home
  useEffect(() => {
    if (!event?.expires_at) return;
    if (new Date(event.expires_at).getTime() <= Date.now()) {
      supabase.from("events").delete().eq("id", id).then(() => router.push("/"));
    }
  }, [now, event]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nickname || !form.battle_power) {
      setError("請填寫名字和戰力");
      return;
    }
    const power = parseInt(form.battle_power);
    if (isNaN(power) || power <= 0) {
      setError("戰力請輸入正整數");
      return;
    }
    const days = parseInt(form.days_remaining) || 0;
    const hours = parseInt(form.hours_remaining) || 0;
    const mins = parseInt(form.minutes_remaining) || 0;
    const totalMinutes = days * 24 * 60 + hours * 60 + mins;
    if (totalMinutes <= 0) {
      setError("請填寫蘑菇剩餘時間");
      return;
    }
    const expires_at = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
    setSubmitting(true);
    const [{ error: regErr }, { error: eventErr }] = await Promise.all([
      supabase.from("registrations").insert({ event_id: id, nickname: form.nickname, battle_power: power }),
      supabase.from("events").update({ expires_at }).eq("id", id),
    ]);
    setSubmitting(false);
    if (regErr || eventErr) {
      setError("報名失敗，請重試");
      return;
    }
    setForm({ nickname: "", battle_power: "", days_remaining: "", hours_remaining: "", minutes_remaining: "" });
    setError("");
    fetchData();
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`確定要刪除「${event?.mushroom_name}」蘑菇團嗎？`)) return;
    await supabase.from("events").delete().eq("id", id);
    router.push("/");
  }

  function getGoogleMapsUrl(coords: string) {
    const [lat, lng] = coords.split(",").map((s) => s.trim());
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  if (loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-8 text-center text-green-600">
        載入中...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">
        找不到此蘑菇團
      </main>
    );
  }

  const isFull = registrations.length >= event.spots_needed;
  const remaining = event.spots_needed - registrations.length;
  const totalPower = registrations.reduce((sum, r) => sum + r.battle_power, 0);
  const countdown = formatCountdown(event.expires_at, now);
  const isExpiringSoon =
    event.expires_at &&
    Math.floor((new Date(event.expires_at).getTime() - now) / 60000) <= 5;

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="text-green-600 hover:text-green-800 text-sm mb-6 flex items-center gap-1 cursor-pointer"
      >
        ← 回看板
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {event.element && <span className="mr-2">{ELEMENT_EMOJI[event.element]}</span>}
            {event.mushroom_name}
          </h1>
          {isFull && (
            <span className="shrink-0 text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
              已滿員
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
          <div>
            👥 已報名 {registrations.length} 人
            {!isFull && <span className="text-green-600 ml-2">（還差 {remaining} 人）</span>}
          </div>
          {countdown && (
            <div className={`font-medium ${isExpiringSoon ? "text-red-500" : "text-orange-400"}`}>
              ⏱ 剩 {countdown}
            </div>
          )}
          {totalPower > 0 && (
            <div>⚔️ 總戰力 {totalPower.toLocaleString()}</div>
          )}
          {event.coordinates && (
            <div>
              📍{" "}
              <a
                href={getGoogleMapsUrl(event.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                查看地圖
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 border border-green-300 text-green-700 hover:bg-green-50 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            {copied ? "已複製連結！" : "複製邀請連結"}
          </button>
          <button
            onClick={handleDelete}
            className="border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            刪除
          </button>
        </div>
      </div>

      {registrations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 mb-5">
          <h2 className="font-semibold text-gray-700 mb-3">
            已報名 ({registrations.length} 人)
          </h2>
          <div className="flex flex-col gap-2">
            {registrations.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span className="font-medium text-gray-800">{r.nickname}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ⚔️ {r.battle_power.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFull && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">我要報名</h2>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名字 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="你的暱稱"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                戰力 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="例：12500"
                value={form.battle_power}
                onChange={(e) => setForm({ ...form, battle_power: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                蘑菇剩餘時間 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.days_remaining}
                  onChange={(e) => setForm({ ...form, days_remaining: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-sm text-gray-500 shrink-0">天</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="23"
                  value={form.hours_remaining}
                  onChange={(e) => setForm({ ...form, hours_remaining: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-sm text-gray-500 shrink-0">時</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="59"
                  value={form.minutes_remaining}
                  onChange={(e) => setForm({ ...form, minutes_remaining: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <span className="text-sm text-gray-500 shrink-0">分</span>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {submitting ? "報名中..." : "確認報名"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
