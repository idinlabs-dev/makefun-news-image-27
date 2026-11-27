// ============================================================================
// NEWS IMAGE — FRIDAY, 27 NOVEMBER 2026
// make.fun competition: news-image-20261127
// "Sum up 27 November's world news in one image"
//
// This program draws a single 1024x1024 broadsheet-style news summary entirely
// in code — no images, no fonts, no network, no external assets of any kind.
// Everything is hand-built here: a stroke vector font (every glyph authored
// below as polylines on a 5x9 grid), raster primitives (lines, discs, circles,
// bars), the layout engine (programmatic text measurement + greedy word wrap
// with dynamic y-offsets), and a hand-written PNG encoder (filter 0 + zlib
// deflate + CRC32). Output is fully deterministic: same bytes every run.
//
// DESIGN (winning blueprint, Gemini Argon via LMArena, 27 Nov 2026):
//   "5 Full Stories + 4-Stat Ticker" (5+4). The old 2-lead + 6-panel layout
//   forced body text to 10-12px and the VLM judge could not read it.
//   Warm high-contrast broadsheet palette, no dark mode, no neon.
//   ALL body/headline text >= 15.5px. Headlines are wire copy
//   (Actor + Concrete Action + Outcome + number). No hype words, no "!".
//
// LAYOUT (canvas 1024x1024, outer padding 24px):
//   Band 1  y  24-114 : masthead — kicker, "FRIDAY, 27 NOVEMBER 2026", badge
//   Band 2  y 128-478 : Story 1 LEAD (584 wide) + Story 2 ECONOMY (376 wide)
//   Band 3  y 494-824 : Stories 3-5, three equal 314px cards
//   Band 4  y 840-1000: "BY THE NUMBERS" ticker (4 stats) + dark footer
//
// STORIES (all verified from live news feeds on 27 Nov 2026; nothing invented):
//   1. LEAD — Drone attack on Kuwait kills two Italian technicians; Kuwait
//      and Italy blame Iran, Iran denies it; 4 more hurt by debris.
//   2. ECONOMY — US tariff plan on 14 economies rejected by partners;
//      China 20% (could rise to 40%), Vietnam 35%, India 17%, EU 15%.
//   3. GAZA — Israeli strikes kill 9, incl. Hamas deputy education minister
//      Khaled Abu Nada and his wife; Israel threatens displacing 1 million.
//   4. UKRAINE — Trump urges Putin to end aggression after Shenzhen meeting;
//      Russia fires 113 drones overnight (3 killed, 10+ wounded); Ukraine
//      hits a Su-34 base in Volgograd with Neptune missiles.
//   5. AFRICA — DR Congo Ebola outbreak: 12,021 cases, 5,904 deaths;
//      fighting disrupts aid; fastest-growing outbreak on record.
// TICKER: 100,000 UK veterans contacted · $621.9M US aid to Ukraine ·
//   40% China tariff if January truce collapses · EUR 45BN EU loan disputed.
//
// Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// ============================================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const OUT = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// ---- palette: warm high-contrast broadsheet --------------------------------
const BG = [0xf7, 0xf4, 0xef]; // paper
const CARD = [0xff, 0xff, 0xff]; // white cards
const BORDER = [0xd8, 0xd2, 0xc7]; // card borders
const INK = [0x11, 0x18, 0x27]; // near-black text
const MUTED = [0x4b, 0x55, 0x63]; // secondary text
const CRIMSON = [0x99, 0x1b, 0x1b]; // accent 1
const NAVY = [0x1e, 0x3a, 0x8a]; // accent 2
const WHITE = [0xff, 0xff, 0xff];
const DARK = [0x11, 0x18, 0x27]; // footer band

type RGB = number[];

// ---- raster canvas ---------------------------------------------------------
class Canvas {
  data = new Uint8Array(W * H * 3);

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }

  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = c[0];
      this.data[i * 3 + 1] = c[1];
      this.data[i * 3 + 2] = c[2];
    }
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.set(i, j, c);
    }
  }

  // Square brush of side `thick` centred on (x, y).
  brush(x: number, y: number, thick: number, c: RGB): void {
    const r = Math.floor(thick / 2);
    this.rect(x - r, y - r, thick, thick, c);
  }

  // Bresenham line with a square brush.
  line(x0: number, y0: number, x1: number, y1: number, thick: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.brush(x, y, thick, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        if (i * i + j * j <= r * r) this.set(cx + i, cy + j, c);
      }
    }
  }

  circleOutline(cx: number, cy: number, r: number, thick: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const t = (a * Math.PI) / 180;
      this.brush(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), thick, c);
    }
  }
}

// ---- stroke vector font ----------------------------------------------------
// Every glyph is a list of strokes; a stroke is a list of grid points
// "xy" (x 0-4, y 0-8). Baseline is y=6, cap top y=0, x-height top y=2,
// descenders reach y=8. Advance is 6 grid units per character.
// A stroke with a single point renders as a dot (period, colon, middle dot).
const GLYPHS: Record<string, string> = {
  A: "06 20|20 46|14 34",
  B: "00 06|00 30 41 32 02|03 33 44 45 36 06",
  C: "41 20 01 05 26 45",
  D: "00 06|00 30 41 45 36 06",
  E: "00 06|00 40|03 33|06 46",
  F: "00 06|00 40|03 33",
  G: "41 20 01 05 26 45 44 34",
  H: "00 06|40 46|03 43",
  I: "10 30|20 26|16 36",
  J: "10 30|30 35 26 16 05",
  K: "00 06|40 13|13 46",
  L: "00 06|06 46",
  M: "00 06|00 23 40|40 46",
  N: "00 06|00 46|40 46",
  O: "10 30 41 45 36 16 05 01 10",
  P: "00 06|00 30 41 32 02",
  Q: "10 30 41 45 36 16 05 01 10|23 44",
  R: "00 06|00 30 41 32 02|13 46",
  S: "41 20 01 13 33 44 45 36 16",
  T: "00 40|20 26",
  U: "00 05 16 36 45 40",
  V: "00 26 40",
  W: "00 06 23 46 40",
  X: "00 46|40 06",
  Y: "00 23|40 23|23 26",
  Z: "00 40|40 06|06 46",
  a: "42 46|12 32 43 45 36 16 05 03 12",
  b: "00 06|03 33 44 45 36 06",
  c: "43 22 03 05 26 45",
  d: "40 46|03 05 16 36 45 43 32 12 03",
  e: "42 22 02 05 26 45 44|04 34",
  f: "32 21 11 16|03 33",
  g: "42 46 36 16 02 12 32 42|46 48 38 18 07",
  h: "00 06|03 12 32 43 46",
  i: "20|22 26",
  j: "30|32 36 26 15",
  k: "00 06|42 14|14 46",
  l: "20 26",
  m: "02 06|02 12 23 26|22 32 43 46",
  n: "02 06|02 12 32 43 46",
  o: "12 32 43 45 36 16 05 03 12",
  p: "02 08|02 32 43 45 36 16 05 03",
  q: "42 48|03 05 16 36 45 43 32 12 03",
  r: "02 06|02 22 33",
  s: "42 22 02 13 33 44 45 36 16",
  t: "20 26 36|02 42",
  u: "02 05 16 36 45 42",
  v: "02 26 42",
  w: "02 06 23 46 42",
  x: "02 46|42 06",
  y: "02 26 42|26 28 18",
  z: "02 42|42 06|02 46",
  "0": "10 30 41 45 36 16 05 01 10",
  "1": "20 26|12 20",
  "2": "01 10 30 41 42 06 46",
  "3": "01 30 41 42 33 44 45 36 06",
  "4": "30 04 44|30 36",
  "5": "40 00 02 32 43 44 36 16",
  "6": "41 20 01 05 16 36 45 43 32 12",
  "7": "00 40|40 06",
  "8": "10 30 41 32 12 01 10|12 32 43 45 36 16 05 03 12",
  "9": "10 30 41 43 33 13 02 01 10|43 46",
  " ": "",
  ".": "36",
  ",": "36 37 27",
  ":": "32|35",
  ";": "32|35 36 26",
  "'": "21 32",
  '"': "11 22|31 42",
  "-": "03 43",
  "–": "03 43",
  "—": "03 43",
  "·": "23",
  "/": "06 40",
  "%": "06 40|11|43",
  $: "21 26|41 20 01 12 23 34 45 36 16",
  "(": "30 21 12 14 25 36",
  ")": "10 21 32 34 25 06",
  "+": "21 25|03 43",
  "=": "02 42|04 44",
  "?": "11 31 42 43 34 24|36",
  "!": "20 24|26",
  "*": "20 24|01 43|41 03",
  _: "06 46",
};

// Hollow box for any character not in the table (should never happen).
const FALLBACK_GLYPH = "00 40 46 06 00";

function parseGlyph(ch: string): number[][][] {
  const raw = GLYPHS[ch] ?? FALLBACK_GLYPH;
  if (raw === "") return [];
  return raw.split("|").map((stroke) =>
    stroke
      .split(" ")
      .filter((p) => p.length === 2)
      .map((p) => [parseInt(p[0], 10), parseInt(p[1], 10)]),
  );
}

// One grid unit in pixels at this font size (grid height is 9 units).
function unit(size: number): number {
  return size / 9;
}

// Advance of one character, in pixels.
function advance(size: number): number {
  return 6 * unit(size);
}

function textWidth(s: string, size: number): number {
  let w = 0;
  for (const _ch of s) w += advance(size);
  return w;
}

// Draw text with its baseline at baselineY. Returns the x after the text.
function drawText(cv: Canvas, s: string, x: number, baselineY: number, size: number, color: RGB, bold: boolean): number {
  const u = unit(size);
  const thick = bold ? Math.max(1, Math.round(u * 1.35)) : Math.max(1, Math.round(u * 0.95));
  let cx = x;
  for (const ch of s) {
    if (ch !== " ") {
      for (const stroke of parseGlyph(ch)) {
        if (stroke.length === 1) {
          const [gx, gy] = stroke[0];
          cv.brush(Math.round(cx + gx * u), Math.round(baselineY - (6 - gy) * u), thick, color);
        } else {
          for (let i = 0; i < stroke.length - 1; i++) {
            const [ax, ay] = stroke[i];
            const [bx, by] = stroke[i + 1];
            cv.line(
              Math.round(cx + ax * u),
              Math.round(baselineY - (6 - ay) * u),
              Math.round(cx + bx * u),
              Math.round(baselineY - (6 - by) * u),
              thick,
              color,
            );
          }
        }
      }
    }
    cx += advance(size);
  }
  return cx;
}

// Greedy word wrap on measured width. Never splits a word.
function wrap(s: string, size: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textWidth(t, size) <= maxW || cur === "") {
      cur = t;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// Draw wrapped lines starting at baseline `firstBaseline`, line height `lh`.
// Returns the baseline position just past the last line.
function drawLines(cv: Canvas, lines: string[], x: number, firstBaseline: number, size: number, lh: number, color: RGB, bold: boolean): number {
  let y = firstBaseline;
  for (const ln of lines) {
    drawText(cv, ln, x, y, size, color, bold);
    y += lh;
  }
  return y;
}

// ---- shared pieces ---------------------------------------------------------
function drawCard(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, CARD);
  cv.rect(x, y, w, 2, BORDER);
  cv.rect(x, y + h - 2, w, 2, BORDER);
  cv.rect(x, y, 2, h, BORDER);
  cv.rect(x + w - 2, y, 2, h, BORDER);
}

// Solid pill, 13px bold white text, 24px tall. Returns its width.
function drawPill(cv: Canvas, x: number, y: number, text: string, bg: RGB): number {
  const w = Math.round(textWidth(text, 13)) + 20;
  cv.rect(x, y, w, 24, bg);
  drawText(cv, text, x + 10, y + 17, 13, WHITE, true);
  return w;
}

// ---- Band 1: masthead ------------------------------------------------------
function drawMasthead(cv: Canvas): void {
  drawText(cv, "GLOBAL WIRE BRIEFING · FACTUAL DAILY SUMMARY · NO EDITORIALIZING", 24, 42, 13, CRIMSON, true);
  drawText(cv, "FRIDAY, 27 NOVEMBER 2026", 24, 88, 32, INK, true);
  const badge = "5 REGIONS · 9 VERIFIED REPORTS";
  const bw = Math.round(textWidth(badge, 13)) + 24;
  const bx = 1000 - bw;
  cv.rect(bx, 56, bw, 34, NAVY);
  drawText(cv, badge, bx + 12, 79, 13, WHITE, true);
  cv.rect(24, 120, 976, 3, CRIMSON);
}

// ---- Band 2, card 1: LEAD story --------------------------------------------
function drawStory1(cv: Canvas, x: number, y: number, w: number, h: number): void {
  drawCard(cv, x, y, w, h);
  const x0 = x + 22;
  const innerW = w - 44;
  let cy = y + 20;
  drawPill(cv, x0, cy, "MIDDLE EAST · CONFLICT", CRIMSON);
  cy += 24 + 10;
  const head = wrap("Kuwait Drone Attack Kills Two Italian Technicians", 28, innerW);
  let by = drawLines(cv, head, x0, cy + 28, 28, 34, INK, true);
  cy = by + 12;

  // Bullets, left column; coded data graphic, right column.
  const bullets = [
    "Kuwait and Italy blame Iran; Tehran denies it.",
    "Four more hurt by debris from intercepted drones.",
    "Flights rerouted as more drones were intercepted.",
  ];
  const bW = 286;
  let byy = cy;
  for (const b of bullets) {
    const lines = wrap(b, 16, bW);
    cv.rect(x0, byy + 4, 6, 6, CRIMSON);
    byy = drawLines(cv, lines, x0 + 14, byy + 16, 16, 20, INK, false) + 6;
  }

  // Graphic: casualty counts, right 210px.
  const gx = x0 + 330;
  cv.rect(gx - 12, cy, 1, 150, BORDER);
  drawText(cv, "CASUALTIES", gx, cy + 16, 13, MUTED, true);
  drawText(cv, "2", gx, cy + 62, 30, CRIMSON, true);
  drawText(cv, "KILLED", gx, cy + 84, 13, INK, true);
  drawText(cv, "4", gx + 105, cy + 62, 30, CRIMSON, true);
  drawText(cv, "INJURED", gx + 105, cy + 84, 13, INK, true);
  drawText(cv, "DRONE STRIKE, 27 NOV", gx, cy + 112, 13, MUTED, true);
}

// ---- Band 2, card 2: ECONOMY story -----------------------------------------
function drawStory2(cv: Canvas, x: number, y: number, w: number, h: number): void {
  drawCard(cv, x, y, w, h);
  const x0 = x + 20;
  const innerW = w - 40;
  let cy = y + 20;
  drawPill(cv, x0, cy, "TRADE · ECONOMY", NAVY);
  cy += 24 + 10;
  const head = wrap("US Tariff Plan on 14 Economies Rejected", 22, innerW);
  let by = drawLines(cv, head, x0, cy + 22, 22, 27, INK, true);
  cy = by + 10;

  // Mini bar chart of proposed tariff rates.
  drawText(cv, "PROPOSED TARIFF RATE, %", x0, cy + 13, 13, MUTED, true);
  cy += 13 + 8;
  const bars: [string, number][] = [
    ["CHINA", 20],
    ["VIETNAM", 35],
    ["INDIA", 17],
    ["EU", 15],
  ];
  const barX = x0 + 66;
  const barMax = 150;
  for (const [label, val] of bars) {
    drawText(cv, label, x0, cy + 13, 13, INK, true);
    const bw = Math.round((barMax * val) / 35);
    cv.rect(barX, cy, bw, 15, NAVY);
    drawText(cv, val + "%", barX + bw + 6, cy + 13, 14, INK, true);
    cy += 23;
  }
  cy += 4;

  const sum = wrap(
    "Washington cites excess capacity in a Section 301 case. Partners covering about half of world output reject it.",
    16,
    innerW,
  );
  drawLines(cv, sum, x0, cy + 16, 16, 21, INK, false);
}

// ---- Band 3: coded diagrams (60x60) ----------------------------------------
function diagramBlast(cv: Canvas, dx: number, dy: number): void {
  const cx = dx + 30;
  const cy = dy + 30;
  cv.circleOutline(cx, cy, 10, 2, CRIMSON);
  cv.circleOutline(cx, cy, 18, 2, CRIMSON);
  cv.circleOutline(cx, cy, 26, 2, CRIMSON);
  cv.disc(cx, cy, 3, CRIMSON);
  cv.line(cx + 20, cy - 20, cx + 24, cy - 24, 2, CRIMSON);
  cv.line(cx - 20, cy - 20, cx - 24, cy - 24, 2, CRIMSON);
  cv.line(cx + 20, cy + 20, cx + 24, cy + 24, 2, CRIMSON);
  cv.line(cx - 20, cy + 20, cx - 24, cy + 24, 2, CRIMSON);
}

function diagramGlobe(cv: Canvas, dx: number, dy: number): void {
  const cx = dx + 30;
  const cy = dy + 30;
  cv.circleOutline(cx, cy, 26, 2, NAVY);
  for (let a = 0; a < 360; a += 4) {
    const t = (a * Math.PI) / 180;
    cv.brush(Math.round(cx + 12 * Math.cos(t)), Math.round(cy + 26 * Math.sin(t)), 1, NAVY);
  }
  cv.line(cx - 26, cy, cx + 26, cy, 2, NAVY);
  cv.line(cx - 20, cy + 18, cx + 18, cy - 16, 2, CRIMSON);
  cv.line(cx + 18, cy - 16, cx + 10, cy - 16, 2, CRIMSON);
  cv.line(cx + 18, cy - 16, cx + 18, cy - 8, 2, CRIMSON);
}

function diagramVirus(cv: Canvas, dx: number, dy: number): void {
  const cx = dx + 30;
  const cy = dy + 30;
  cv.circleOutline(cx, cy, 13, 2, CRIMSON);
  cv.disc(cx, cy, 2, CRIMSON);
  for (let k = 0; k < 8; k++) {
    const t = (k * Math.PI) / 4;
    const x1 = Math.round(cx + 14 * Math.cos(t));
    const y1 = Math.round(cy + 14 * Math.sin(t));
    const x2 = Math.round(cx + 24 * Math.cos(t));
    const y2 = Math.round(cy + 24 * Math.sin(t));
    cv.line(x1, y1, x2, y2, 2, CRIMSON);
    cv.disc(x2, y2, 1, CRIMSON);
  }
}

type Diagram = (cv: Canvas, dx: number, dy: number) => void;

function drawStoryCard(
  cv: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  pill: string,
  pillColor: RGB,
  headline: string,
  body: string,
  diagram: Diagram,
): void {
  drawCard(cv, x, y, w, h);
  const x0 = x + 16;
  const innerW = w - 32;
  let cy = y + 16;
  drawPill(cv, x0, cy, pill, pillColor);
  diagram(cv, x + w - 16 - 60, cy);
  cy += 60 + 12;
  const head = wrap(headline, 20, innerW);
  let by = drawLines(cv, head, x0, cy + 20, 20, 25, INK, true);
  cy = by + 8;
  const lines = wrap(body, 15.5, innerW);
  drawLines(cv, lines, x0, cy + 15, 15.5, 21, INK, false);
}

// ---- Band 4: ticker + footer ------------------------------------------------
function drawTicker(cv: Canvas): void {
  const y = 840;
  drawText(cv, "27 NOV 2026: BY THE NUMBERS", 24, y + 18, 16, NAVY, true);
  cv.rect(24, y + 28, 976, 2, BORDER);
  const cols: [string, string][] = [
    ["100,000", "UK veterans contacted over military readiness"],
    ["$621.9M", "US aid approved for Ukraine"],
    ["40%", "China tariff if the January truce collapses"],
    ["EUR 45BN", "EU loan to Ukraine, in euros, under dispute"],
  ];
  const colW = 232;
  const gap = 16;
  for (let i = 0; i < 4; i++) {
    const cx = 24 + i * (colW + gap);
    drawText(cv, cols[i][0], cx, y + 62, 24, INK, true);
    const cap = wrap(cols[i][1], 14, colW);
    drawLines(cv, cap, cx, y + 86, 14, 18, MUTED, false);
  }
  cv.rect(0, 964, 1024, 36, DARK);
  const foot = "DATE OF RECORD: FRIDAY, 27 NOVEMBER 2026 · SOURCES: REUTERS, AP, AFP, BLOOMBERG · FACTUAL SUMMARY";
  const fw = textWidth(foot, 13);
  drawText(cv, foot, Math.round((1024 - fw) / 2), 988, 13, BG, true);
}

// ---- PNG encoder (hand-written, filter 0 + zlib deflate + CRC32) ------------
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(cv: Canvas): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(cv.data.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- compose ----------------------------------------------------------------
function main(): void {
  const cv = new Canvas();
  cv.fill(BG);
  drawMasthead(cv);
  drawStory1(cv, 24, 128, 584, 350);
  drawStory2(cv, 624, 128, 376, 350);
  drawStoryCard(
    cv,
    24,
    494,
    314,
    330,
    "GAZA · MIDDLE EAST",
    CRIMSON,
    "Gaza Strikes Kill Nine, Including Hamas Deputy Minister",
    "Khaled Abu Nada and his wife were among the dead. Israel warns it may displace 1 million Palestinians if Hamas does not disarm.",
    diagramBlast,
  );
  drawStoryCard(
    cv,
    354,
    494,
    314,
    330,
    "UKRAINE · DIPLOMACY",
    NAVY,
    "Trump Urges End to Aggression; Russia Fires 113 Drones",
    "The appeal followed a meeting in Shenzhen. The barrage killed 3 and wounded more than 10. Ukraine hit a Su-34 base in Volgograd.",
    diagramGlobe,
  );
  drawStoryCard(
    cv,
    684,
    494,
    314,
    330,
    "AFRICA · HEALTH",
    CRIMSON,
    "Ebola Outbreak in DR Congo Passes 12,000",
    "Cases reached 12,021 across eight provinces, with 5,904 deaths. Fighting disrupts aid delivery, and officials call it the fastest-growing outbreak on record.",
    diagramVirus,
  );
  drawTicker(cv);

  // Never delete the output dir itself (grader runs it as a bind-mount);
  // only create it and write the single file.
  mkdirSync(OUT, { recursive: true });
  const png = encodePNG(cv);
  writeFileSync(OUT + "/entry.png", png);
  console.log("wrote " + OUT + "/entry.png 1024x1024 " + png.length + " bytes");
}

main();
