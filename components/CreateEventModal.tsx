"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateEventModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    mushroom_name: "",
    spots_needed: "3",
    coordinates: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.mushroom_name || !form.spots_needed) {
      setError("請填寫必填欄位");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from("events").insert({
      mushroom_name: form.mushroom_name,
      spots_needed: parseInt(form.spots_needed),
      coordinates: form.coordinates || null,
    });
    setSubmitting(false);
    if (err) {
      setError("新增失敗，請重試");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">新增蘑菇團</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              蘑菇名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例：巨大蘑菇、紫色蘑菇"
              value={form.mushroom_name}
              onChange={(e) => setForm({ ...form, mushroom_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              還差幾個人 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.spots_needed}
              onChange={(e) => setForm({ ...form, spots_needed: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              座標（選填）
            </label>
            <input
              type="text"
              placeholder="例：25.0478, 121.5319"
              value={form.coordinates}
              onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <p className="text-xs text-gray-400 mt-1">格式：緯度, 經度</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? "新增中..." : "建立蘑菇團"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
