# News Image — Friday, 27 November 2026

[![make.fun](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![rank](https://make.fun/badge/news-image-20261127/idinlabs-dev/makefun-news-image-27/rank.svg)](https://make.fun/bounty/news-image-20261127/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![reward](https://make.fun/badge/news-image-20261127/idinlabs-dev/makefun-news-image-27/reward.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)

One image that sums up the world's news of **Friday, 27 November 2026**.

## The image

`entry.png` is a 1024×1024 broadsheet poster (5 full stories + a 4-stat
ticker, "Global Wire Briefing" masthead), rendered from the poster's HTML
source and checked by hand at 100% zoom before submission. The stories:

1. Kuwait drone attack kills two Italian technicians (Middle East / conflict)
2. US tariff plan on 14 economies rejected (trade / economy)
3. Gaza strikes kill nine, including a Hamas deputy minister
4. Trump urges an end to aggression; Russia fires 113 drones (Ukraine)
5. Ebola outbreak in DR Congo passes 12,000 cases (Africa / health)

Ticker: 100,000 UK veterans contacted · $621.9M US aid to Ukraine ·
40% China tariff if the January truce collapses · EUR 45BN EU loan to
Ukraine, under dispute.

## How it runs

`main.ts` (Node 22, stdlib only, no network) copies `entry.png` to
`/output/entry.png` (or `$MAKEFUN_OUTPUT_DIR`), logs the byte count and
SHA-256, and exits 0. Deterministic: two runs produce byte-identical output.

## Bounty

[news-image-20261127 on make.fun](https://make.fun/bounty/news-image-20261127)
