# Transcript — News Image 27 November 2026 (user-poster entry)

## What this entry is

The image in this entry is **the user's own poster**. Idin Iskandar built the
poster himself as an HTML page
(`~/workspace/user/files/global_wire_briefing_poster__1__1_7k9o.html`) and
screenshotted it. This entry renders that HTML to a 1024×1024 PNG and submits
it, replacing the earlier code-drawn entry (submission 01a21cc5, which the
user called ugly).

The competition rules explicitly allow this shape: "the simplest entry is a
repository holding the image and a one-line program that copies it there".
`main.ts` is that one-line program (copy `entry.png` to `/output/entry.png`).

## The one fix

The user's screenshot had two small flaws the parent (Reni) flagged in QC:

1. The ticker caption repeated the big stat: "EU loan to Ukraine: EUR 45BN,
   under dispute" — the number EUR 45BN already appears as the big stat
   above it.
2. (Dark version only, not used here) the word "Volgograd." was partly
   covered by a photo, and "vowing" should have been "covering".

In the working copy `poster.html` ONLY, one line was changed to fix flaw 1:

- Before: `<span>EU loan to Ukraine:<br>EUR 45BN, under dispute</span>`
- After: `<span>EU loan to Ukraine,<br>under dispute</span>`

Nothing else was changed. The user's original file was never modified.

## Render log

- Renderer: sandbox Chrome (headless) driven via CDP on port 9223 with a
  small stdlib-only Python WebSocket driver; `file://` URL, viewport
  1060×1060, poster element clipped at (18, 18) 1024×1024.
- First attempt hit a stale Chrome on port 9222 (an old screenshot session's
  instance serving an unrelated tab) and a missing WebGL policy flag
  (Chrome 157 refuses to start without it). Fixed by using port 9223 and the
  `webgl-policy-all.txt` flags.
- `document.fonts.status` reported `loaded`, but the FontFace list came back
  empty, so the Google Fonts (@import) may have fallen back to system fonts
  (Impact/sans-serif for the condensed headings, monospace for the body).
  The render was compared against the user's own screenshot: the look is the
  same, and every word reads correctly, so no re-render was needed.
- Final render: `entry.png`, exactly 1024×1024, 211,055 bytes,
  sha256 `f69c4853be337d0bafacd15e09c117cefda08fdb02664047d20044df55b3e3c4`.

## QC log (render read at 100% by the builder)

- Masthead: "FRIDAY, 27 NOVEMBER 2026" ✓; kicker "GLOBAL WIRE BRIEFING ·
  FACTUAL DAILY SUMMARY · NO EDITORIALIZING" ✓; badge "5 REGIONS ·
  9 VERIFIED REPORTS" ✓.
- Story 1 (Kuwait): headline, all 3 bullets, "CASUALTIES 2 KILLED / 4
  INJURED / DRONE STRIKE, 27 NOV" ✓.
- Story 2 (tariffs): headline, bars CHINA 20% / VIETNAM 35% / INDIA 17% /
  EU 15%, "Washington cites excess capacity in a Section 301 case.
  Partners covering about half of world output reject it." ✓.
- Story 3 (Gaza): headline + body ✓.
- Story 4 (Ukraine): headline + body, "Ukraine hit a Su-34 base in
  Volgograd." fully visible ✓.
- Story 5 (Ebola): headline + body, "12,021 across eight provinces, with
  5,904 deaths" ✓.
- Ticker: "27 NOV 2026: BY THE NUMBERS" + 100,000 / $621.9M / 40% /
  EUR 45BN with the fixed caption "EU loan to Ukraine, under dispute" ✓.
- Footer: "DATE OF RECORD: FRIDAY, 27 NOVEMBER 2026 · SOURCES: REUTERS,
  AP, AFP, BLOOMBERG · FACTUAL SUMMARY" — fully visible, not cut off ✓.
- No clipping, no overlap, no text running off any card.

## Program test log (measured 27 Nov 2026, round 2)

- `MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts` → exit 0; wrote
  `/tmp/out1/entry.png`, 211,055 bytes,
  sha256 `f69c4853be337d0bafacd15e09c117cefda08fdb02664047d20044df55b3e3c4`.
- `MAKEFUN_OUTPUT_DIR=/tmp/out2 node main.ts` → exit 0; identical sha256.
- Both outputs byte-identical to `entry.png`. Deterministic ✓.
- Local Node v24.22.1; `main.ts` contains no TypeScript-only syntax
  (plain JS in a `.ts` file), so it also runs under the grader's Node 22
  type stripping.
