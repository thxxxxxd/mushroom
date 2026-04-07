import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-green-800 mb-2">🌈 彩虹戰隊</h1>
      <p className="text-gray-500 text-sm mb-10">請選擇要使用的工具</p>
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
        <Link
          href="/board"
          className="flex-1 bg-white border border-green-200 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-green-400 transition-all"
        >
          <span className="text-5xl">🍄</span>
          <span className="font-bold text-gray-800 text-lg">皮皮勞工招募中心</span>
          <span className="text-sm text-gray-400 text-center">蘑菇團招募、報名</span>
        </Link>
        <Link
          href="/gpx"
          className="flex-1 bg-white border border-blue-200 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-400 transition-all"
        >
          <span className="text-5xl">🗺️</span>
          <span className="font-bold text-gray-800 text-lg">GPX 產生器</span>
          <span className="text-sm text-gray-400 text-center">產生各種 GPS 路線格式</span>
        </Link>
      </div>
    </main>
  );
}
