export type GpxFormat = "standard" | "ghost" | "mocpogo";

interface Point { lat: number; lng: number }

function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().toUpperCase();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }).toUpperCase();
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildStandardGpx(points: Point[]): string {
  const trkpts = points.map(p => `      <trkpt lat="${p.lat}" lon="${p.lng}"></trkpt>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pikmin-GPX-Generator" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Generated Track</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function buildGhostFormat(points: Point[]): string {
  const wpts = points.map((p, i) =>
    `    <wpt lat="${p.lat}" lon="${p.lng}"><name>WP${i + 1}</name></wpt>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx>
    <iToolsData speed="250.0" link="https://www.thinkskysoft.com" loop="0">
        <rights>Copyright (c) 2018, thinkskysoft</rights>
    </iToolsData>

${wpts}
</gpx>`;
}

function buildMocpogoJson(points: Point[]): string {
  const base = 1760000000;
  const distance = points.length > 1
    ? points.slice(1).reduce((sum, p, i) => sum + haversineDistance(points[i].lat, points[i].lng, p.lat, p.lng), 0)
    : 0;

  const coordLines = points.map((p, i) =>
    `        {\n          "lat" : ${p.lat},\n          "lng" : ${p.lng}\n        }${i < points.length - 1 ? "," : ""}`
  ).join("\n");

  return `{
  "routes" : [
    {
      "category" : "multi-point",
      "routeId" : 1,
      "start" : {
        "customName" : "",
        "uniqueID" : "${randomUUID()}",
        "placeId" : 0,
        "lat" : ${points[0].lat},
        "lng" : ${points[0].lng},
        "createTime" : ${base},
        "name" : "A"
      },
      "uniqueID" : "${randomUUID()}",
      "distance" : ${distance},
      "end" : {
        "customName" : "",
        "uniqueID" : "${randomUUID()}",
        "placeId" : 0,
        "lat" : ${points[points.length - 1].lat},
        "lng" : ${points[points.length - 1].lng},
        "createTime" : ${base + 10},
        "name" : "B"
      },
      "coordinates" : [
${coordLines}
      ],
      "name" : "test",
      "createTime" : ${base + 20}
    }
  ],
  "exportDate" : ${base + 30},
  "appName" : "MocPOGO",
  "dataType" : "favorite",
  "places" : [
  ],
  "version" : "1.0"
}`;
}

export function generateGpx(coordsText: string, format: GpxFormat): { content: string; filename: string; mime: string } | null {
  const points: Point[] = coordsText.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[, \t]+/);
      if (parts.length < 2) return null;
      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
      return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
    })
    .filter((p): p is Point => p !== null);

  if (points.length === 0) return null;

  if (format === "standard") {
    return { content: buildStandardGpx(points), filename: "track-standard.gpx", mime: "application/gpx+xml;charset=utf-8" };
  } else if (format === "ghost") {
    return { content: buildGhostFormat(points), filename: "track-ghost.gpx", mime: "application/gpx+xml;charset=utf-8" };
  } else {
    return { content: buildMocpogoJson(points), filename: "route-mocpogo.favorite", mime: "application/json;charset=utf-8" };
  }
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
