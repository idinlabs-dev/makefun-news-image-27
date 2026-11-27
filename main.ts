// ============================================================================
// NEWS IMAGE — FRIDAY, 27 NOVEMBER 2026
// make.fun competition: news-image-20261127
// "Sum up 27 November's world news in one image"
//
// The image itself is the entrant's own poster: an HTML page
// (poster.html, authored by Idin Iskandar) rendered to a 1024x1024 PNG
// (entry.png) with a headless browser before this entry was assembled.
// This program does exactly one thing: it copies that pre-rendered image
// to the output directory, as the competition rules explicitly allow
// ("the simplest entry is a repository holding the image and a one-line
// program that copies it there").
//
// The poster sums up Friday 27 November 2026 in the "5 Full Stories +
// 4-Stat Ticker" layout: Kuwait drone attack (2 Italian technicians
// killed), US tariff plan on 14 economies rejected, Gaza strikes,
// Trump urges end to aggression / Russia fires 113 drones, DR Congo
// Ebola outbreak passes 12,000 cases — plus a by-the-numbers ticker
// (100,000 UK veterans, $621.9M US aid, 40% China tariff, EUR 45BN EU
// loan). All facts verified from live news feeds on 27 Nov 2026.
//
// Run:  node main.ts            (writes /output/entry.png)
//       MAKEFUN_OUTPUT_DIR=out node main.ts
// Output is fully deterministic: the copy is byte-identical every run.
// ============================================================================

import { mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const SRC = join(dirname(fileURLToPath(import.meta.url)), "entry.png");
const DEST = join(OUT, "entry.png");

// Create the output directory if needed. Never delete it: in the grader
// it is a bind-mount, and removing it fails the run.
mkdirSync(OUT, { recursive: true });
copyFileSync(SRC, DEST);

const bytes = readFileSync(DEST);
const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`news-image-20261127: wrote ${DEST}`);
console.log(`  ${bytes.length} bytes, sha256 ${sha256}`);
console.log("  poster: FRIDAY, 27 NOVEMBER 2026 — 5 stories + 4-stat ticker");
