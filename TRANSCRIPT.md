# TRANSCRIPT — News Image 27 November 2026

Entry for make.fun competition `news-image-20261127` ($100, 50 places).
Built fresh in one agent session on 27 Nov 2026.

## What was built

`main.ts` — a single Node 22 program (standard library only) that draws a
1024x1024 broadsheet news summary and writes it to `/output/entry.png`.
Everything is hand-written in this repository:

- A stroke vector font: every glyph (A–Z, a–z, 0–9, punctuation) authored as
  polylines on a 5x9 grid, rendered at any size with a square brush.
- Raster primitives: filled rects, Bresenham lines, discs, circle outlines.
- Layout engine: programmatic text measurement (`textWidth`) + greedy word
  wrap with dynamic y-offsets, so no text collides, clips, or overflows.
- PNG encoder: hand-written chunks, filter 0, zlib deflate level 9, CRC32.
- Fully deterministic: no clock, no randomness, no network — two runs produce
  byte-identical output (verified by sha256).

## The five stories (verified from live news, 27 Nov 2026)

1. LEAD — Drone attack on Kuwait kills two Italian defence technicians;
   Kuwait and Italy attribute it to Iran, Iran denies responsibility.
   4 more injured by falling debris; passenger flights rerouted.
2. ECONOMY — US trading partners reject Washington's justification for new
   tariffs on 14 economies (about half of global output); China 20%, could
   double to 40% if the truce expiring 10 Jan collapses; Vietnam 35%,
   India 17%, EU 15%. Section 301 investigation into excess capacity.
3. GAZA — Israeli strikes kill 9, including Hamas deputy education minister
   Khaled Abu Nada and his wife; Hamas weighs its response; Israel threatens
   displacing 1 million Palestinians if Hamas does not disarm.
4. UKRAINE — Trump urges Putin to end aggression across Europe after their
   Shenzhen meeting; overnight Russian barrage of missiles and 113 drones
   (3 killed, 10+ wounded); Ukraine hits Su-34 base in Volgograd with
   Neptune missiles; US approves $621.9M more aid.
5. AFRICA — DR Congo Ebola outbreak reaches 12,021 cases and 5,904 deaths;
   fighting disrupts aid; fastest-growing outbreak on record.

Ticker (4 stats, none duplicating a headline number): 100,000 UK veterans
contacted · $621.9M US aid to Ukraine · 40% China tariff if the January
truce collapses · EUR 45BN EU loan to Ukraine under dispute.

Events from 26 Nov (Cairo fuel-tanker explosion, Hong Kong Tai Po fire,
Macy's parade postponement, Bogor gold-mine flood) were deliberately NOT
presented as 27 Nov stories.

## Design decisions (winning-pattern lesson, Gemini Argon, 27 Nov 2026)

- "5 Full Stories + 4-Stat Ticker" (5+4) — the previous 2-lead + 6-panel
  layout forced body text to 10–12px and the VLM judge could not read it.
- Warm broadsheet palette (#F7F4EF paper, white cards, #D8D2C7 borders,
  ink #111827, crimson #991B1B, navy #1E3A8A). No dark mode, no neon.
- All body/headline text >= 15.5px; labels (pills, footer) 13px.
- Wire-copy headlines (actor + action + outcome + number); hype words and
  exclamation marks banned.
- The rendered PNG was inspected at 100% zoom and QC'd for legibility,
  collisions, and clipping before submission (see test notes below).

## Test notes

- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice; sha256 identical.
- Output: 1024x1024 PNG, under 1 MiB.
- Visual QC at 100% zoom: masthead, both band-2 cards, all three band-3
  cards, ticker, and footer checked line by line, plus 1:1 crops and a 3x
  nearest-neighbour upscale of the lead headline.

## Fixes made in round 2 (after the first render + QC)

- Story 1 bullet 3 was clipped by the card's bottom edge (9 wrapped lines
  did not fit) — all three bullets shortened to 2 lines each.
- Glyph "4" was drawn wrong (diagonal + bar, read as a slash) — redrawn as
  a proper 4: diagonal, crossbar, vertical stem.
- Glyph audit found the same "bar written as a diagonal" error in E, F, H,
  I, L, Z (e.g. L rendered as A/N, E as R, H as N — "GLOBAL" read as
  "GAOBAN", "HEALTH" as "NRANTN"). All six redrawn with true horizontal
  bars; masthead and pills now read correctly.
- Lowercase "a" was a closed loop identical to "o" ("Attack" read as
  "Attock", "Italian" as "Itolian") — redrawn with a stem rising above
  the bowl; headlines now read correctly at 3x zoom.
- Ukraine headline wrapped to 4 lines and pushed the body 25px down, so
  "Volgograd." straddled the card's bottom border (lowest ink y=823,
  card bottom 824) — headline shortened to "Trump Urges End to
  Aggression; Russia Fires 113 Drones" (3 lines); lowest ink now y=808.
- After all fixes: every card's lowest ink sits 10–44px above its bottom
  border (measured programmatically, not by eye); two runs remain
  byte-identical.

## Candidates considered and cut

- North Korea reportedly suspends military aid to Russia (cut: story 5
  Ebola gives a new continent + a new vertical, health).
- European leaders choose Pablo Hernandez de Cos as next ECB president
  (cut: weaker news value than Ebola's 12,021 cases).
- Britain contacts 100,000 veterans (kept, as ticker stat 1).
- Bangkok oil depot explosion (cut: casualty figures not yet verified
  at build time).

## Fix round 3 — lowercase 'a' + digit '9' (after parent QC of the render)

- Parent read the final render and found lowercase 'a' reading as 'd':
  "Kuwait" -> "Kuwdit", "Attack" -> "Attdck", "and" -> "dna". Root cause:
  the 'a' (bowl + full-height right stem from y=2) differed from 'd'
  (same bowl + stem from y=0) by only 1-2 grid units of stem height —
  invisible at 15-16px render size.
- First attempt (double-storey 'a': two stacked bowls sharing a middle
  bar) was TESTED on a strip and REJECTED: it reads as 'e' everywhere
  ("Kuwait" -> "Kuweit", "Attack" -> "Atteck", "banana" -> "benene")
  because a closed bowl + full-width middle bar is exactly the 'e'
  construction.
- Final 'a': single-storey bowl with a SHORT right stem starting one unit
  below the bowl top ("43 46|12 32 43 45 36 16 05 03 12"): 3 grid units
  shorter than 'd''s ascender, no horizontal bar (unlike 'e'), stem +
  small foot at bottom-right (unlike 'o'). Verified on a test strip at
  real sizes (13/15.5/16/20/24/28px) and at 3x magnification: "Kuwait",
  "Attack", "Italian", "and", "blame", "Iran", "Gaza", "Palestinians",
  "aadadd dad bad banana Canada" all read correctly, letter by letter;
  'a' vs 'd' unmistakable at 3x.
- Digit '9': the committed '9' was a loop with no stem and read like a
  sigma; the '9' in the working tree ("10 30 41 43 33 13 02 01 10|43 46",
  loop y=0-3 + straight stem to baseline) was verified on the same strip:
  "9 VERIFIED REPORTS" (13px and 39px) and "$621.9M" (24px and 72px) all
  read correctly. Kept unchanged.
- Full-table audit at 3x (lowercase, digits, e/c, o/0, 1/l/I, 5/S, g/9,
  u/v, rn/m): no other lookalike needed changing.
- Re-verification: two runs byte-identical (sha256
  833122589bbc0b2ac90c559b0cfd135334eda1fb5c786aa871ccf4db93c11e25),
  1024x1024, 33,177 bytes. Programmatic ink measurement: lowest ink per
  card Story 1 y=454, Story 2 y=468, Gaza y=805, Ukraine y=808, Ebola
  y=780 — all clear of the bottom borders (8-42px gap). Final full image
  read end-to-end, every word correct.
