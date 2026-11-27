# News Image — Friday, 27 November 2026

[![make.fun](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127)
[![Rank](https://make.fun/badge/news-image-20261127/idinlabs-dev/makefun-news-image-27/rank.svg)](https://make.fun/bounty/news-image-20261127/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![Reward](https://make.fun/badge/news-image-20261127/idinlabs-dev/makefun-news-image-27/reward.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)

One image that sums up the world's news of **Friday, 27 November 2026** — drawn
entirely in code by `main.ts` (Node 22, standard library only). No images, no
fonts, no network, no external assets: a hand-built stroke vector font, raster
primitives, a programmatic layout engine, and a hand-written PNG encoder.

## The day, in five stories

1. **Kuwait drone attack kills two Italian technicians** — Kuwait and Italy blame
   Iran; Tehran denies responsibility. Four more hurt by debris; flights rerouted.
2. **US tariff plan on 14 economies rejected** — partners covering about half of
   world output reject the Section 301 case. China 20% (could rise to 40%),
   Vietnam 35%, India 17%, EU 15%.
3. **Gaza strikes kill nine**, including Hamas deputy education minister Khaled
   Abu Nada and his wife. Israel warns it may displace 1 million Palestinians.
4. **Trump urges Putin to end aggression** after their Shenzhen meeting; Russia
   fires 113 drones at Ukraine overnight; Ukraine hits a Su-34 base in Volgograd.
5. **DR Congo Ebola outbreak passes 12,000 cases** — 12,021 cases, 5,904 deaths;
   fighting disrupts aid; fastest-growing outbreak on record.

Plus a "By The Numbers" ticker: 100,000 UK veterans contacted · $621.9M US aid
to Ukraine · 40% China tariff if the January truce collapses · EUR 45BN EU loan
to Ukraine under dispute.

## Design

"5 Full Stories + 4-Stat Ticker" on a warm broadsheet palette. Every
body/headline text is at least 15.5px so the image reads at a glance; headlines
are wire copy (actor + action + outcome + number), no hype words, no
exclamation marks. All facts verified from live news feeds on 27 November 2026.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png — 1024x1024, deterministic, byte-identical every run
```

## Bounty

[news-image-20261127 on make.fun](https://make.fun/bounty/news-image-20261127)
