# Layout & Frame Catalog

Reference for all scene-level layout strategies and per-block frame
variants currently shipped in fluid-odyssey, plus a backlog of patterns
worth adding next. Each entry documents the design-system / web pattern
it evokes so a future contributor (or LoRA training set) can ground the
choice in recognizable references.

The picker is in `src/lib/sceneLayouts.js`. Implementations are in
`src/components/SceneLayout.jsx`. CSS hooks for asymmetric child rules
live in `src/index.css` under the "Scene layout strategies" section.

---

## Layout strategies (scene-level container)

A "strategy" is the outer container that arranges all blocks. It owns the
overall reading flow — column width, alignment, breakpoints. Picked once
per scene from a seed-deterministic hash, biased per intent.

### Shipped (9)

| key | inspiration | when it shines | what it does |
|---|---|---|---|
| `editorial` | Medium long-form, NYT Magazine | philosophy, personal — anything you'd read silently | 38rem centered column, 36px vertical rhythm, generous whitespace |
| `split` | Linear docs, Vercel docs, Stripe pricing | technical comparisons, before/after | CSS Grid `1.4fr / 1fr`, collapses to single column under 768px |
| `bleed` | Stripe homepage, Apple product pages | experience timelines with breathing room | alternating odd children break out of the column via negative margins |
| `mosaic` | Awwwards portfolios, Cargo Collective | projects, skills clouds | varied widths (92/86/78%) with alternating left/right alignment |
| `stack` | every CMS ever | safe default | flat vertical, 20px gap |
| `bento` | Apple iOS Bento, raycast.com, vercel.com/templates | outcomes (multi-stat), projects (grid of work), skills | 6-col CSS Grid with hero at span-6, scenario at varied spans |
| `polaroid_scatter` | Pinterest, Tumblr blog themes, Cosma Visual Editor | personal, contact ("warm" intents) | each block rotated 1–3°, alternating left/right offset, photo-album feel |
| `brutalist` | Brutalist Web Design, Figma's "Big" template, Read The Tea Leaves | technical (anti-corporate), philosophy when mood is "raw" | bold sibling spacing; pairs with `brutalist_box` frame for hard borders + offset shadows |
| `newspaper` | NYT print edition, Letterboxd reviews | philosophy, personal long prose | serif headings + `column-count: 2` on the second block + drop cap on first letter |

### Intent → strategy bias map

(in `INTENT_BIAS` of `sceneLayouts.js` — duplicates weight common picks)

```
philosophy → newspaper, editorial, editorial, bleed
outcomes   → bento, mosaic, split, bento
contact    → polaroid_scatter, editorial, brutalist
technical  → brutalist, split, mosaic
experience → bleed, split, mosaic, bento
projects   → bento, mosaic, split
skills     → mosaic, bento, editorial
personal   → polaroid_scatter, newspaper, editorial, bleed
```

### Backlog — strategies to add next

| key | inspiration | what it would do |
|---|---|---|
| `comic_strip` | XKCD, Dark Horse / Tapas web layouts | each block is a panel with a heavy black border + speech-bubble hero |
| `index_card_stack` | Lookbook, scrapbook | overlapping rectangular cards offset by `translateY` + `rotate`, hero on top of the stack |
| `album_cover` | Spotify "Now Playing", Apple Music | hero is a large square with overlay text, scenario is a tracklisting underneath |
| `receipt` | physical print receipts, store loyalty cards | narrow (32rem) monospace column with dotted dividers between blocks |
| `zine` | Photoshop cut-paste zines, Tumblr Geocities revival | every block at random small rotation + offset shadow + paper texture |
| `subway_map` | NYC MTA poster, Linear changelog timeline | vertical line connector with stations (blocks) hanging off it |
| `manifesto` | Grailed essays, Notable.com | massive type for the hero (8rem clamp), tiny supporting type for everything else |
| `scrolly` | NYT scrollytelling, The Pudding | sticky hero on top, scenario scrolls past — needs scroll listener |
| `cards_radial` | Apple Watch app grid, FigJam stickies | blocks arranged in arc/circle pattern around a focal point |
| `marquee` | y2k web, Tympanus.net experiments | horizontal-scroll snap row; scenario blocks scroll into view |

---

## Frame variants (per-block decorator)

A "frame" wraps a single block to add chrome — borders, numerals, rotation,
backgrounds. Picked per block from a seed+index hash with a hero-specific
pool (heroes get restrained chrome).

### Shipped (10)

| key | inspiration | what it adds |
|---|---|---|
| `clean` | Vercel Geist, Linear blog | no chrome — block renders bare |
| `numbered` | Wired magazine bullets, Coyote/Liquid editorial | oversized 01/02 numeral floating left at 3.5rem in `accent-soft` |
| `ruled` | New Yorker, FT.com section dividers | small 48px × 3px accent rule on top |
| `markered` | medical-record annotations, Notion callouts | left 3px accent border bar |
| `tinted` | Material-You, Apple iOS widgets | gradient pad backdrop using `accent-soft` |
| `cutout` | Figma Community templates, Vercel templates | asymmetric corner radii (top-left + bottom-right large, others tiny) |
| `polaroid` | Polaroid SX-70, Instagram pre-2010 | white photo-frame padding + drop shadow + 1–3° rotation that hovers to flat |
| `sticky_note` | 3M Post-it, FigJam stickies, Trello cards | pastel `accent-soft` bg + slight rotation + folded triangular corner via clip-path |
| `terminal_window` | macOS Terminal.app, iTerm2, Warp | title bar with red/yellow/green traffic-light dots above the block |
| `brutalist_box` | Brutalist Web Design, Vercel "Old School" templates, Tailwind UI / Catalyst Hard variant | hard 2px border + 6px solid offset shadow, no border-radius |

### Frame pool by block role

```
HERO_FRAMES     = clean, ruled, cutout, terminal_window
SCENARIO_FRAMES = numbered, markered, tinted, cutout, clean, ruled,
                  polaroid, sticky_note, brutalist_box
```

Heroes lean restrained because the headline carries the page; loud chrome
fights with the typography. Scenario blocks own the chrome.

### Backlog — frames to add next

| key | inspiration | what it would do |
|---|---|---|
| `ticket` | concert tickets, Eventbrite stubs | dotted-line perforated edge top+bottom (CSS radial-gradient mask) |
| `ribbon` | award badges, GitHub fork ribbons | diagonal banner across the top-right corner |
| `highlight` | Genius lyrics annotations, hypothes.is | yellow `mark` highlight strokes on key text spans |
| `index_card` | library catalog cards, recipe cards | lined-paper background (CSS repeating linear-gradient) + monospace |
| `comic_panel` | XKCD, Tintin frames | thick black border + halftone dot pattern (radial-gradient bg) |
| `vinyl` | Spotify Canvas, Discogs | circular crop with label center; only fits image-heavy blocks |
| `scotch_tape` | scrapbook, mood boards | 1–2 yellowish translucent rectangles "taping" the block to the page |
| `ascii_box` | terminal UIs, raw README art | unicode `┌─┐` border drawn via CSS borders + monospace family |
| `footnote` | academic papers, Tufte CSS | superscript marker on hero, with the scenario rendered in the margin |
| `badge_pill` | Vercel deploy badges, npm shields | rounded pill with a status dot + version string |
| `corner_chip` | Material chips, GitHub Topics | small accent-color tag pinned to one corner of the block |
| `embossed` | Material 3 elevated cards, neumorphism | inset+outset shadow on same color giving a debossed/embossed look |
| `glass` | macOS Big Sur, iOS control center | `backdrop-filter: blur(20px)` over a translucent fill |
| `stamp` | passport stamps, postal markings | rotated rough-edged border with `transform: rotate(-8deg)` and a worn texture |
| `magnifier_callout` | technical illustrations | subtle scale + ring shadow around an "important" block |

---

## Implementation notes

- **Determinism is non-negotiable.** Same seed → same picks. Permalinks
  (`#p=`) must reproduce exactly. The picker uses
  `pickFrom(arr, (seed | 0) ^ (index * 2654435761))` — Knuth multiplicative
  hash with the index so siblings get different variants from the same
  seed.

- **Heroes vs scenario blocks have separate pools.** Heroes get only
  restrained variants (no `polaroid` or `sticky_note` — those would clash
  with the headline typography). Maintained via the `isHero` flag passed
  to `pickFrameVariant`.

- **Most frames sit OUTSIDE the block's internal `BlockShell`.** This
  creates a "card-in-frame" effect for `tinted` / `cutout` (visible double
  surface). Future pass: let blocks opt out of `BlockShell` when wrapped
  in a frame that already provides surface treatment. See follow-up in
  calibration entry 14.

- **Some frames are theme-aware** (`tinted`, `markered`, `ruled` use
  `--accent`); some are aggressively NOT (`polaroid` uses fixed `#fafaf7`
  + black text — the album feel breaks if it inherits a dark palette;
  `sticky_note` uses `--accent-soft` so it adapts).

- **Strategy CSS lives in `index.css`** under selectors like
  `.scene-bento > :nth-child(N)`. This keeps the JSX clean and lets us
  use `nth-child` rules that React props can't express ergonomically.

- **Polyfills aren't needed.** Everything uses CSS Grid, `clip-path`,
  `nth-child`, and standard `box-shadow` — supported in every browser
  released since 2020.

---

## How to add a new variant

1. **Pick a name** matching existing convention: snake_case for keys.
2. **Add it to `LAYOUT_STRATEGIES` or `FRAME_VARIANTS` in
   `src/lib/sceneLayouts.js`.**
3. **Write the case** in the `switch` of `SceneLayout` or `BlockFrame` in
   `src/components/SceneLayout.jsx`.
4. **Add CSS** to `src/index.css` if the variant needs `nth-child` rules
   or pseudo-elements that don't compose ergonomically in JSX.
5. **Update `INTENT_BIAS`** if the new strategy fits a particular intent
   well — duplicate it 1–2 times in that intent's pool to weight it.
6. **Decide hero vs scenario.** Add to `HERO_FRAMES` only if it's
   restrained enough not to compete with the headline.
7. **Document here** with the inspiration source (helps future readers
   recognize the pattern, helps the layout-LoRA training set if we
   eventually train one).
8. **Test live.** Click through all 8 intent chips; the new variant
   should appear in roughly its biased frequency. Take a screenshot for
   the PR.

---

## Research sources tapped

- **CodePen tags:** brutalism, neomorphism, card-design, layout, masonry,
  bento, magazine, postcard, polaroid, ribbon, ticket, sticky-note.
- **Awwwards "Site of the Day" archive** — current asymmetric portfolio
  trends.
- **Pttrns.com** — mobile pattern catalog (bento, hero-cta).
- **Tailwind UI Catalyst, Vercel templates, Linear blog** — modern SaaS
  baseline.
- **Brutalist Web Design (brutalistwebsites.com)** — anti-Material
  reference.
- **Tufte CSS, Edward Tufte's books** — margin-note / footnote frame
  patterns.
- **Apple HIG iOS 17 Bento** — bento grid sizing rules.
- **GOV.UK Design System** — accessibility-first chrome, informed the
  decision to NEVER use animation-only state changes (every variant has
  static visual differences too).
- **Read The Tea Leaves blog (Nolan Lawson)** and **Aaron Gustafson's "Adaptive Web Design"** — strategy for graceful degradation when CSS
  features (clip-path, backdrop-filter) aren't supported.
