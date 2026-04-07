"use client";

import { useState } from "react";
import Link from "next/link";
import { generateGpx, downloadFile, type GpxFormat, type GpxMode } from "@/lib/gpx";

export default function GpxPage() {
  const [coords, setCoords] = useState("");
  const [format, setFormat] = useState<GpxFormat>("standard");
  const [mode, setMode] = useState<GpxMode>("straight");
  const [zValue, setZValue] = useState("0.0003");
  const [filename, setFilename] = useState("route");
  const [closedRoute, setClosedRoute] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  function handleGenerate() {
    setError("");
    const z = parseFloat(zValue) || 0.0003;
    const results = generateGpx(coords, {
      format,
      mode,
      z,
      filename: filename.trim() || "route",
      closedRoute,
    });
    if (!results) {
      setError("沒有找到任何有效座標，請檢查輸入。");
      setPreview("");
      return;
    }
    results.forEach(r => downloadFile(r.filename, r.content, r.mime));
    setPreview(results[results.length - 1].content);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-green-600 hover:text-green-800 text-sm mb-6 flex items-center gap-1">
        ← 回首頁
      </Link>
      <h1 className="text-2xl font-extrabold text-gray-800 tracking-wide mb-2">
        Pikmin GPX Generator
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        輸入格式：每行一組 <code className="bg-gray-100 px-1 rounded">lat,lon</code>，例如：
        <code className="bg-gray-100 px-1 rounded ml-1">-15.89547,-52.259943</code>
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">座標列表：</label>
          <textarea
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            placeholder={"-15.89547,-52.259943\n-15.896349,-52.25998"}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">輸出格式：</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as GpxFormat)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
          >
            <option value="standard">JS</option>
            <option value="ghost">魅影</option>
            <option value="mocpogo">MocPOGO</option>
            <option value="all">我全都要!</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">路線模式：</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as GpxMode)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
          >
            <option value="straight">我就懶! 我要走直線!</option>
            <option value="diamond">愛的魔力轉圈圈</option>
            <option value="flash">煞氣a閃電跑法</option>
          </select>
        </div>

        {(mode === "diamond" || mode === "flash") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              圈圈要多大（轉圈圈模式才需要）：
            </label>
            <input
              type="number"
              step="0.000001"
              value={zValue}
              onChange={(e) => setZValue(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">檔名要叫啥：</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={closedRoute}
            onChange={(e) => setClosedRoute(e.target.checked)}
            className="cursor-pointer"
          />
          請帶我回家
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleGenerate}
          className="self-start bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          產生並下載
        </button>

        {preview && (
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1">輸出預覽</h2>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-80">
              {preview}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
