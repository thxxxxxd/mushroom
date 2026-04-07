export type GpxFormat = "standard" | "ghost" | "mocpogo" | "all";
export type GpxMode = "straight" | "diamond" | "flash";

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

function computeRouteDistance(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return total;
}

function expandPointsDiamond(points: Point[], z: number): Point[] {
  const out: Point[] = [];
  const epsilon = 0.000001;
  points.forEach(p => {
    const A = { lat: p.lat,     lng: p.lng + z };
    const B = { lat: p.lat + z, lng: p.lng     };
    const C = { lat: p.lat,     lng: p.lng - z };
    const D = { lat: p.lat - z, lng: p.lng     };
    out.push({ lat: p.lat, lng: p.lng }, A, B, C, D, { lat: A.lat + epsilon, lng: A.lng });
  });
  return out;
}

function expandPointsFlash(points: Point[], z: number): Point[] {
  const out: Point[] = [];
  points.forEach(p => {
    const A = { lat: p.lat,     lng: p.lng + z };
    const B = { lat: p.lat + z, lng: p.lng     };
    const C = { lat: p.lat,     lng: p.lng - z };
    const D = { lat: p.lat - z, lng: p.lng     };
    out.push(A, D, B, C);
  });
  return out;
}

function applyClosedRoute(points: Point[], closed: boolean): Point[] {
  if (!closed || points.length === 0) return points;
  const epsilon = 0.000001;
  const first = points[0];
  return [...points, { lat: first.lat + epsilon, lng: first.lng + epsilon }];
}

function buildStandardGpx(points: Point[]): string {
  const trkpts = points.map(p => `      <trkpt lat="${p.lat}" lon="${p.lng}"></trkpt>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pikmin-GPX-Generator" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
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

function kv(key: string, value: string | number, indent: number, isLast: boolean, isString: boolean): string {
  const v = isString ? `"${value}"` : value;
  return `${" ".repeat(indent)}"${key}" : ${v}${isLast ? "" : ","}`;
}

function buildMocpogoJson(points: Point[], name: string): string {
  const baseSec = 1760000000;
  const distance = computeRouteDistance(points);
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  const coordLines = points.map((p, idx) => {
    const isLast = idx === points.length - 1;
    return ["        {", kv("lat", p.lat, 10, false, false), kv("lng", p.lng, 10, true, false), `        }${isLast ? "" : ","}`].join("\n");
  }).join("\n");

  const routeStr = [
    "    {",
    kv("category", "multi-point", 6, false, true),
    kv("routeId", 1, 6, false, false),
    '      "start" : {',
    kv("customName", "", 8, false, true),
    kv("uniqueID", randomUUID(), 8, false, true),
    kv("placeId", 0, 8, false, false),
    kv("lat", startPoint.lat, 8, false, false),
    kv("lng", startPoint.lng, 8, false, false),
    kv("createTime", baseSec, 8, false, false),
    kv("name", "A", 8, true, true),
    "      },",
    kv("uniqueID", randomUUID(), 6, false, true),
    kv("distance", distance, 6, false, false),
    '      "end" : {',
    kv("customName", "", 8, false, true),
    kv("uniqueID", randomUUID(), 8, false, true),
    kv("placeId", 0, 8, false, false),
    kv("lat", endPoint.lat, 8, false, false),
    kv("lng", endPoint.lng, 8, false, false),
    kv("createTime", baseSec + 10, 8, false, false),
    kv("name", "B", 8, true, true),
    "      },",
    '      "coordinates" : [',
    coordLines,
    "      ],",
    kv("name", name || "test", 6, false, true),
    kv("createTime", baseSec + 20, 6, true, false),
    "    }"
  ].join("\n");

  return [
    "{",
    '  "routes" : [',
    routeStr,
    "  ],",
    kv("exportDate", baseSec + 30, 2, false, false),
    kv("appName", "MocPOGO", 2, false, true),
    kv("dataType", "favorite", 2, false, true),
    '  "places" : [',
    "  ],",
    kv("version", "1.0", 2, true, true),
    "}"
  ].join("\n");
}

export function parseCoords(text: string): Point[] {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[, \t]+/);
      if (parts.length < 2) return null;
      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
      return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
    })
    .filter((p): p is Point => p !== null);
}

export interface GpxOptions {
  format: GpxFormat;
  mode: GpxMode;
  z: number;
  filename: string;
  closedRoute: boolean;
}

export interface GpxResult {
  content: string;
  filename: string;
  mime: string;
}

export function generateGpx(coordsText: string, options: GpxOptions): GpxResult[] | null {
  const rawPoints = parseCoords(coordsText);
  if (rawPoints.length === 0) return null;

  let points: Point[];
  if (options.mode === "diamond") {
    points = expandPointsDiamond(rawPoints, options.z);
  } else if (options.mode === "flash") {
    points = expandPointsFlash(rawPoints, options.z);
  } else {
    points = rawPoints;
  }
  points = applyClosedRoute(points, options.closedRoute);

  const base = options.filename || "route";
  const gpxMime = "application/gpx+xml;charset=utf-8";
  const favMime = "application/octet-stream";

  const results: GpxResult[] = [];

  if (options.format === "standard" || options.format === "all") {
    results.push({ content: buildStandardGpx(points), filename: `${base}_js.gpx`, mime: gpxMime });
  }
  if (options.format === "ghost" || options.format === "all") {
    results.push({ content: buildGhostFormat(points), filename: `${base}_ghost.gpx`, mime: gpxMime });
  }
  if (options.format === "mocpogo" || options.format === "all") {
    results.push({ content: buildMocpogoJson(points, base), filename: `${base}_mocpogo.favorite`, mime: favMime });
  }

  return results.length > 0 ? results : null;
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
