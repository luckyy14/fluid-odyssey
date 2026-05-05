# Calibration WAL

Append-only log of every change made to align the local-LLM scene engine
(prompts, parser, runtime, instrumentation) with what Qwen2.5-1.5B-q4f16 on
WebGPU actually produces. Each entry: timestamp, problem observed, change
made, file(s) touched, expected effect.

Newest entry at the bottom. Never edit past entries — append a follow-up.

---

## 2026-05-04 03:22 — Dev-mode realtime logging
**Problem.** No visibility into where time was spent or what the model emitted between "submit question" and "scene rendered." Long quiet pauses with no signal whether the engine was working or hung.

**Change.** Added `src/lib/devLog.js` — dev-only (`import.meta.env.DEV`) logger with tag-styled console output. Tags: `llm`, `scene`, `phase`, `ui`. Helpers: `info`, `debug`, `warn`, `group`/`groupEnd`, `time`/`timeEnd`. Wired through `llmEngine.js` (init lifecycle), `sceneOrchestrator.js` (pass 1 + pass 2 events), `SceneRenderer.jsx` (event consumption), `PersonalizedView.jsx` (submit handler).

**Files.** `src/lib/devLog.js` (new), `src/lib/llmEngine.js`, `src/lib/sceneOrchestrator.js`, `src/components/SceneRenderer.jsx`, `src/components/flow/PersonalizedView.jsx`.

**Expected.** Every LLM call, every yielded scene phase, every UI event tagged with timestamp + elapsed seconds. No-ops in production builds.

---

## 2026-05-04 03:30 — Wall-clock + elapsed timestamps
**Problem.** Logs showed events but not when. Hard to reason about gaps.

**Change.** Each log line now prefixed with `HH:MM:SS.mmm +Ns` (wall-clock + seconds since page load).

**Files.** `src/lib/devLog.js`.

**Expected.** Visual gap detection at a glance.

---

## 2026-05-04 03:32 — ANSI color codes
**Problem.** User requested ANSI colors over CSS console styling.

**Change.** Switched `STYLES` from `%c`-prefixed CSS strings to `\x1b[...]m` ANSI escape sequences.

**Files.** `src/lib/devLog.js`.

**Caveat.** Chrome/Edge DevTools do **not** render ANSI — raw escape sequences appear there. Firefox 136+, Safari, and terminals render correctly. If we view logs in Chrome we may need to revert.

---

## 2026-05-04 03:35 — Heartbeats + streaming throughput + expanded group
**Problem.** Pass-1 silent for 30+ seconds during cold-start shader compile. User couldn't tell if hung. `console.groupCollapsed` also hid all sub-events behind a closed disclosure.

**Change.**
- `devLog.heartbeat(tag, label, intervalMs)` — periodic "still working" tick + final `✓ done in Ns` when stopped.
- `devLog.preview(s, max)` — truncated previews to keep one-line logs readable.
- Switched `devLog.group` from `groupCollapsed` → `group` (auto-expanded).
- Pass 1: heartbeat every 3s; logs `prompt_chars`, `usage.completion_tokens`, `finish_reason`.
- Pass 2: heartbeat until first chunk; logs **TTFT** when first chunk arrives; periodic throughput (chunks, chars, ch/s) every ~1.5s; final summary with TTFT + stream_s + avg ch/s.
- Engine init: heartbeat every 5s during download + shader compile.
- Demoted prebaked-spec mount log from `info` → `debug` (StrictMode mounts twice).

**Files.** `src/lib/devLog.js`, `src/lib/llmEngine.js`, `src/lib/sceneOrchestrator.js`, `src/components/SceneRenderer.jsx`.

**Expected.** Long awaits show ticking progress; speed problems become legible.

---

## 2026-05-04 03:38 — Move WebLLM into a Web Worker
**Problem.** Heartbeat ticks DID stop firing during pass-1 cold start, confirming the main thread was blocked by WebLLM's WGSL→HLSL shader compile. UI froze.

**Change.** Switched `CreateMLCEngine(modelId, opts)` → `CreateWebWorkerMLCEngine(worker, modelId, opts)`. Added `src/lib/llm.worker.js` wrapping `WebWorkerMLCEngineHandler`; instantiated via `new Worker(new URL('./llm.worker.js', import.meta.url), { type: 'module' })` so Vite bundles it as a separate module worker chunk.

**Files.** `src/lib/llm.worker.js` (new), `src/lib/llmEngine.js`.

**Expected.** Heartbeats keep firing throughout shader compile; UI stays responsive. Inference speed itself unchanged (work is real GPU/CPU work, just off-main-thread).

---

## 2026-05-04 03:40 — Drop `response_format: { type: 'json_object' }`
**Problem.** Pass 1 hung silently. DevTools surfaced an uncaught error inside the worker:
```
BindingError: Cannot pass non-string to std::string
  at GrammarCompiler.CompileJSONSchema
```
This version of `@mlc-ai/web-llm` calls `CompileJSONSchema` on the `response_format` and the binding requires the schema to be a JSON-string, not an object. Without a schema string, it crashes mid-prefill and the chat-completion promise never settles.

**Change.** Removed `response_format` from both pass-1 and pass-2 chat-completion calls. Both prompts already contain explicit "JSON ONLY" instructions; pass 2 has a partial-JSON parser; pass 1 has a hard-coded fallback route on `JSON.parse` failure.

**Files.** `src/lib/sceneOrchestrator.js`.

**Note.** If we want strict JSON enforcement back, the correct shape is `response_format: { type: 'json_object', schema: JSON.stringify(zodSchema) }` — `schema` MUST be a string.

**Expected.** Pass 1 returns; full pipeline can run end-to-end.

---

## 2026-05-04 03:41 — Streaming parser: strip markdown fences + tolerate bare keys
**Problem.** Pipeline ran end-to-end but parser found neither `theme` nor `blocks`: `top_keys: Array(0)`. Raw buffer revealed two model misbehaviors:
1. Output wrapped in ` ```json … ``` ` markdown fences. `partial-json` choked on the leading ` ``` `.
2. Inside `props.events`, keys were unquoted (`{ title: "x" }`). Strict JSON; `partial-json` doesn't accept JSON5.

**Change.**
- `streamingParser.js`: added `normalize(raw)` pre-processor that (a) strips a leading ` ```json ` / ` ``` ` fence, (b) strips trailing ` ``` `, (c) regex-quotes bare object keys (`/([{,]\s*)([A-Za-z_$][\w$]*)(\s*):/g → '$1"$2"$3:'`).
- `streamingParser.js`: exposed `rawBuffer()` for end-of-stream debugging.
- `sceneOrchestrator.js`: at end of pass 2, log raw buffer (full) + parsed-keys summary so future calibration is data-driven.
- `sceneOrchestrator.js`: hardened composer prompt with explicit "no markdown fences, start with {" rules.

**Files.** `src/lib/streamingParser.js`, `src/lib/sceneOrchestrator.js`.

**Expected.** Theme + shell + at least one filled block emit successfully even when the model wraps in fences or drops quotes.

---

## 2026-05-04 03:44 — Composer prompt rewrite: drop `props_preview`, inline per-block examples
**Problem.** Run completed end-to-end but with two qualitative failures visible in the raw buffer:
1. **Hero block had `props: {}`** (empty). Schema validation rejected it; renderer fell back to `markdown_prose`. The hero never actually rendered as a hero.
2. **Real data went into `props_preview` instead of `props`** for the contact block — the model emitted `props_preview: { email: "…", linkedin: "…" }` and gave `props` only `{title, kicker}`. Qwen 1.5B was conflating the two keys because the prompt's distinction ("preview counts" vs "real props") was abstract.

**Change.** Rewrote `composerPrompt` in `sceneOrchestrator.js`:
- **Dropped `props_preview` from the spec entirely.** It was only consumed by skeletons, which already default cleanly when missing (`{...(b.props_preview ?? {})}`). Removing it eliminates the source of confusion and shortens output.
- **Added `PROPS_EXAMPLES` map** with one concrete `props` literal per block type (real values from the fact sheet — `lakshayb.work@gmail.com`, `Bajaj Finserv Health`, etc.) and `HERO_PROPS_EXAMPLE` with a real `{title, kicker}` literal. Prompt renders only the examples for blocks allowed for this intent (post-exclusions).
- **Added explicit assertion** in CRITICAL OUTPUT RULES: `BOTH blocks MUST have non-empty "props". The hero "props" MUST contain at least "title".`
- **Added** `Do NOT include a "props_preview" key.`
- Simplified enum syntax from `one of [...]` → `<one of: a, b, c>` (less likely to confuse small models into emitting the literal word "one").

**Files.** `src/lib/sceneOrchestrator.js`.

**Expected.**
- Hero renders with real title/kicker, not the markdown_prose fallback.
- Scenario block's `props` object actually contains the right keys.
- Pass 2 output is shorter (no `props_preview` payload), so total stream time drops.
- Subsequent runs should validate cleanly through the Zod schemas without falling back.

**Verification next time.** Watch for: `phase block_filled h:hero_*` with non-empty props, no "schema failed → markdown_prose" warn, and pass-2 `chars` count noticeably lower.

---

## 2026-05-04 03:50 — Premature shell + background-string + verbatim-example fixes
**Problem.** End-to-end pipeline ran successfully but only the hero title rendered on the page. Inspection of the log:

```
phase shell {layout: 'hero', blocks: Array(1)}     ← only 1 block in the shell
phase block_filled h:hero { ... }
phase block_filled b:exp_timeline_vertical { ... }  ← arrived but had no slot
```

Root cause: `streamingParser.hasBlockScaffold()` fired the `shell` event as soon as ANY `"props":` substring appeared in the buffer. At that moment the parsed `blocks` array contained only the hero. The shell locked in a 1-block layout. Subsequent `block_filled` events for `id: 'b'` updated `filled[b]` but the renderer's iteration over `shell.blocks` never saw `b`.

Three secondary issues observed in the same raw buffer:
- **`"background": "noise"`** instead of `{ "kind": "noise" }` — model coerced the object to a string.
- **JS comment inside JSON** (`// This field should be filled with actual facts.`) — `partial-json`'s `Allow.ALL` tolerated it, but it's a model-quality smell.
- **Verbatim example copy** — model emitted `"title": "Eight years of frontend.", "kicker": "Ask me anything."`, which were the literal example values from the prompt.

**Change.**
1. `streamingParser.hasBlockScaffold()` now requires `lastObj.blocks.length >= 2` AND every block to have `id+type`. Composer prompt always asks for hero + scenario, so waiting for both is correct. Removed the regex-based "looks closed" tail check (which was the real source of the early fire).
2. `streamingParser` added `bgKindOf(t)` coercion: if `theme.background` is a string, treat it as `{ kind: <string> }`. `hasTheme()` and `takeTheme()` both go through it.
3. `SceneRenderer` defensive merge: when a `block_filled` event arrives for an `id` not present in the current `shell.blocks`, append a synthetic scaffold entry `{ id, type: blockType, props_preview: {} }` so the renderer mounts a slot for it. Belt + suspenders against future parser misfires.
4. `sceneOrchestrator.emitBlock()` now propagates `blockType: filled.type` on `block_filled` events so the renderer can pick the right component when defensively appending.
5. `composerPrompt`:
   - Hero example changed from real-sounding text to clearly-placeholder shape: `{ "title": "<headline answering the question>", "kicker": "<one-line subtitle>" }`.
   - New CRITICAL rule: `"background" MUST be an object: { "kind": "<value>" }. NEVER a bare string.`
   - New CRITICAL rule: examples show SHAPE only — fill from FACT SHEET, do not copy placeholder text.
   - Tightened comment ban to spell out: `no //, no /* */`.

**Files.** `src/lib/streamingParser.js`, `src/lib/sceneOrchestrator.js`, `src/components/SceneRenderer.jsx`.

**Expected.**
- Both blocks render. `phase shell` event now fires with `blocks: Array(2)`.
- Background works even if model emits string form (parser coerces).
- Hero title reflects the actual question, not the example placeholder.
- Even if shell still misfires for some reason, late `block_filled` events will self-heal via the renderer's defensive append.

**Verification next time.** Watch for: `phase shell {... blocks: Array(2)}`, no "block_filled for id not in shell" pattern, hero title that's actually about the question asked.

---

## 2026-05-04 03:55 — Leaf component extraction + ellipsis-leak fix
**Problem.** Two issues from previous run:
1. **Architectural seam request.** User asked: "can we do that thing where all our templates can have a nested part where child renders until leaf is reached?" — i.e., recursive composition. Full version (LLM emits a tree) is high-risk on Qwen 1.5B; safer middle is to keep the LLM emitting flat specs while restructuring block components to compose internal React leaf children.
2. **`"…"` literal in rendered timeline description.** The model copied the `"description": "…"` placeholder from `PROPS_EXAMPLES.exp_timeline_vertical` verbatim — same root cause as the previous hero-text leak.

**Change.**
1. **New file `src/components/blocks/leaves.jsx`** containing 10 leaf components: `TechChip`, `ProjectLinks`, `SkillTag`, `SkillBar`, `TimelineEvent`, `RoleCard`, `ProjectCard`, `StatCell`, `StackLayer`, `ManifestoBelief`. Each accepts a single item shape + optional `index` prop for stagger animation. Cut-and-paste of the inline JSX previously embedded in the container blocks; behavior identical.
2. **Refactored 6 block files** to import and consume leaves instead of inline `events.map(...)` JSX:
   - `experience.jsx` → `TimelineEvent`, `RoleCard`
   - `skills.jsx` → `SkillTag`, `SkillBar`
   - `projects.jsx` → `ProjectCard`, `TechChip`, `ProjectLinks` (also reuses chip+links in `ProjSpotlight`)
   - `outcomes.jsx` → `StatCell`
   - `technical.jsx` → `StackLayer` (code block kept inline — atomic)
   - `philosophy.jsx` → `ManifestoBelief` (pullquote kept inline — atomic)
   Container blocks now read as: outer layout shell + `items.map((it, i) => <Leaf {...it} index={i} />)`. ~40% line reduction across the 6 files.
3. **Replaced `"…"` placeholders in `PROPS_EXAMPLES`** (`sceneOrchestrator.js`) with real-fact descriptions so the model has nothing tempting to copy verbatim. Affected: `exp_timeline_vertical`, `exp_role_card_stack`, `tech_code_block`.
4. **New file `future_plan.md`** documenting the full recursive-spec migration: promote leaves to first-class registry types, extend `SceneSpec` with `children`, recursive renderer, recursive streaming parser changes, prompt updates, and risk analysis (small-model reliability cliff). Six-step plan with scope estimates.

**Files.** `src/components/blocks/leaves.jsx` (new), `src/components/blocks/{experience,skills,projects,outcomes,technical,philosophy}.jsx`, `src/lib/sceneOrchestrator.js`, `future_plan.md` (new).

**Expected.**
- No render change today — same blocks produce same output.
- Future change to leaf styling (e.g., themed timeline dot variants) only edits one file instead of two.
- When we move to the recursive-spec architecture, leaves are already ready; only the registry, schema, renderer, and parser need extending.
- Timeline description should no longer render literal "…".

**Verification next time.** Watch for: timeline event with a real description (not "…"); page renders identically to before this refactor (visual regression check).

---

## 2026-05-04 04:00 — Angle-bracket placeholders to break copy-verbatim
**Problem.** Even after replacing `"…"` with realistic-sounding example text ("Led FE migration of clinic ops portal, cut latency 90%."), the model still copied the example verbatim into the rendered output. Realistic strings are exactly the kind of thing a 1.5B model treats as canonical "fill this in" content.

**Change.**
- `PROPS_EXAMPLES` in `sceneOrchestrator.js`: every model-generated string field now uses `<ANGLE_BRACKET_TAGS>` (e.g. `"description": "<ONE_SENTENCE_IMPACT>"`, `"title": "<JOB_TITLE>"`). Stable real values (URLs, fixed identifiers like `"Lakshay Baheti"`) stay literal — those are facts the model should always emit verbatim.
- New CRITICAL rule: `Any string in <ANGLE_BRACKETS> is a placeholder you MUST replace with a real fact from the FACT SHEET or a string derived from the user's question. NEVER emit literal angle-bracket text in your output.`

**Files.** `src/lib/sceneOrchestrator.js`.

**Expected.** Angle brackets are visually obviously meta — model should infer the shape but not paste them. If a field comes through with `<...>` in the rendered output, the prompt rule needs more weight (e.g., another worked example showing transformation).

**Verification next time.** Run a question and look at rendered text. Watch for: no `<ANGLE_BRACKET>` strings on the page; no copy of the literal example sentences. Also note: latest log showed model swapping hero and scenario roles (placed `exp_role_card_stack` at `id: 'h'` and `hero_quote` at `id: 'b'`). May need a follow-up entry to make the id→role binding more explicit (e.g., literal `"id": "hero"` and `"id": "scenario"` instead of `"h"`/`"b"`).

---

## 2026-05-04 04:30 — Multi-persona test cycle: shell-type truncation + theme flash + hero-length fixes
**Problem.** User reported (a) layout flashes 2× before content arrives, (b) only the hero block renders despite logs showing both `block_filled` events fire. Connected chrome-devtools MCP, drove 5 question cycles from different personas (recruiter, CTO, journalist, junior dev, tech enthusiast), inspected DOM + console for each.

**Root causes found.**

1. **Shell scaffold locks in a TRUNCATED block type.** `streamingParser.hasBlockScaffold()` fired as soon as both blocks had `id` and `type` fields. But `partial-json` returns mid-emission strings as truncated values: while the model is writing `"type": "exp_role_card_stack"`, the parser sees `type: "exp"`. The shell event committed `type: "exp"` to React state, `getBlock("exp")` returned the `markdown_prose` fallback (registry default), and when `block_filled` later arrived with the real props (`{events: [...]}`), they were passed to `MarkdownProse` which only knows `text` — so it rendered an empty `<p>`. Looked like "second block missing" but was actually "second block rendered as the wrong component." Caught by adding a temporary `render block ${id}:${type}` log inside the renderer's blocks.map loop — caught `b:exp` instead of `b:exp_role_card_stack`.

2. **Theme flash.** `index.css` had a `.theme-transition` rule trapped INSIDE a `@keyframes water-wave` block (CSS syntax error — the rule was never applied). When `theme_hint` and `theme_ready` set different CSS vars on `:root`, every var-driven element snapped to the new value with no transition.

3. **Hero schema too tight.** `heroBaseSchema` required `title` ≤ 160 chars; Qwen 1.5B regularly emits 200–280 char titles for prose-heavy questions ("Tell me about Lakshay as a person…"). Schema rejected, fallback to `markdown_prose`, rendered text included the leaking `title:` JSON key prefix from `stringifyShallow`.

**Change.**

1. **`src/lib/streamingParser.js`** — `hasBlockScaffold()` now requires `'props' in b` for every block in addition to `id`/`type`. Once `"props":` appears in the buffer, the type field BEFORE it is fully closed, so `type` cannot be a mid-emission truncation. Removed the old regex-based "looks closed" tail check that was firing too early.

2. **`src/components/SceneRenderer.jsx`** — added shell reconciliation: when a `block_filled` event arrives with `evt.blockType` that differs from the existing `shell.blocks[idx].type`, update the shell. Belt-and-suspenders against future parser misfires. Logs `shell: reconciled block X type Y → Z` when it kicks in.

3. **`src/index.css`** — pulled `.theme-transition` out of the `@keyframes` block (where it was dead code). Replaced with a global selector `*, *::before, *::after { transition: background-color 0.45s, color 0.45s, border-color 0.45s, box-shadow 0.45s, fill 0.45s, stroke 0.45s; }` plus an opt-out for `[class*="animate-"]` and `[style*="animation"]` so framer-motion transforms and shimmer keyframes aren't stomped.

4. **`src/components/blocks/heros.jsx`** — `heroBaseSchema`: `title` max 160 → 320, `kicker` max 80 → 200. Comment explains: Qwen 1.5B emits long copy regularly; `clamp()` font sizing in each variant handles overflow gracefully.

5. **`src/lib/sceneOrchestrator.js`** — `HERO_PROPS_EXAMPLE` placeholder updated to `<6-12 word headline>` / `<5-10 word subtitle>` to nudge the model toward shorter copy.

**Verification.** Ran 5 multi-persona cycles after the fix (recruiter, CTO, journalist, junior, tech enthusiast). Result:
- Cycle 1–2 (pre-fix): both showed empty markdown_prose for block `b`. Caught the bug.
- Cycle 3 (post truncation fix, pre hero-length fix): both blocks rendered, hero fell back to markdown_prose for long title.
- Cycle 4–5 (post all fixes): both blocks render with content, no console warns, schemas validate cleanly. Confirmed reliable.

**Files.** `src/lib/streamingParser.js`, `src/components/SceneRenderer.jsx`, `src/index.css`, `src/components/blocks/heros.jsx`, `src/lib/sceneOrchestrator.js`.

**Open issues observed during testing (not yet fixed).**
- **Pass 2 throughput is 17–23 ch/s on Qwen 1.5B-q4f16 + WebGPU/D3D11.** Total cycle time 80–95s. Worth profiling but normal for this model size; biggest user-facing latency lever now.
- **Pass 1 monoculture.** Model nearly always picks `palette_name: ember`/`ink` and `bg_kind: particles`/`pattern`. Theme variety is low. Could surface as an explicit "use a palette you have NOT used recently" prompt rule, but recencyRing already does this at the algorithmic level — the model just isn't honoring the exclusion set well.
- **Polarity flip on stats.** Model sometimes emits `-59.9%` for "faster deployments" (should be positive `60%`). A prompt rule about sign might help.
- **`stringifyShallow` leaks JSON keys.** When schema validation fails, fallback rendering shows `"title: <text>"` because the function prefixes each key. Could render values-only when there's a single key, or strip well-known keys.

---

## 2026-05-04 04:45 — Optimistic-UI streaming status with phase-mapped vocabulary
**Problem.** End-to-end cycle is 80–95s on Qwen 1.5B. Only feedback during that wait was a tiny `<Loader2 spin/>` + the static text "Composing your page…" Users don't know if anything's actually happening, especially during the silent 10–20s pass-1 router call.

**Change.**
1. **`src/lib/statusVocabulary.js`** (new) — exports `STATUS_VOCAB`, a map of phase → string array. ~70 phrases across 9 phases:
   - `warming` (engine init/download): "Warming up the model", "Loading the local AI", "Spinning up WebGPU", "Heating the GPU", "Stretching the neurons", …
   - `routing` (pass 1 awaiting): "Pondering", "Mulling it over", "Cogitating", "Picking an angle", "Routing the request", "Triangulating", …
   - `theming`: "Sketching a palette", "Mixing colors", "Painting the canvas", …
   - `composing` (pass 2 pre-first-chunk): "Composing", "Drafting", "Sketching", "Outlining", …
   - `streaming` (pass 2 chunks arriving): "Streaming words", "Weaving sentences", "Threading the answer", "Stitching together", "Pouring the content", "Brewing", "Forging", …
   - `shaping` (shell + first block_filled): "Laying out blocks", "Placing the hero", "Arranging sections", …
   - `finishing` (both blocks filled, waiting for done): "Final touches", "Tying the bow", "Polishing", "Almost there", …
   - `ready`: "Ready", "Hot off the press", "Fresh from the kiln", …
   - `starting`: "Reading your question", "Listening", "Tuning in", …
   - `pickStatus(phase, exclude)` helper picks a non-repeating word from the pool.

2. **`src/components/StreamingStatus.jsx`** (new) — small pill component. Subscribes to a `phase` prop; rotates the displayed word every 1.8s within the phase pool using framer-motion fade. Includes a pulsing dot and animated three-dot ellipsis. `aria-live="polite"` for screen readers. Auto-rerolls when phase changes (so the user sees an immediate word change at each phase transition, not just at the next 1.8s tick).

3. **`src/components/SceneRenderer.jsx`** — added `phase` state. Live-iterator effect now drives phase transitions:
   - `iterator attached` → `routing`
   - `theme_hint` → `composing`
   - `theme_ready` → upgrade `composing` → `streaming` (only if still composing — preserves later phases)
   - `shell` → `shaping`
   - `block_filled` → `shaping` (first) / `finishing` (second+)
   - `done` → `ready` for 1.2s flash, then `null` (pill disappears)
   - Pill renders above the AnimatePresence block when `phase` is set.

4. **`src/components/flow/PersonalizedView.jsx`** — replaced the static "Composing your page…" busy line with a `<StreamingStatus phase="warming" />` shown only during `LLM_STATUS.LOADING` (engine warmup). During in-flight question generation, SceneRenderer owns the status.

**Files.** `src/lib/statusVocabulary.js` (new), `src/components/StreamingStatus.jsx` (new), `src/components/SceneRenderer.jsx`, `src/components/flow/PersonalizedView.jsx`.

**Expected.** The 80–95s wait now has continuous, varied feedback: a fresh word every 1.8s, phase transitions visibly tied to what the orchestrator is actually doing. No more 10s of empty silence during pass 1. Engine warmup also gets a status pill on first load instead of a generic spinner. Pill quietly disappears 1.2s after `done`.

**Verification next time.** Submit a question and watch: the pill should cycle through routing → composing → streaming → shaping → finishing → ready as the events fire, with words changing every ~2s within each phase.

---

## 2026-05-04 05:00 — Sidebar declutter + scene layout strategies + block frame variants
**Problem.** Two visual issues: (1) the desktop left rail was overstuffed in a 96px column — `restart` caption + `L`/`Lakshay` caption + `AI` label + vertical `© 2025` text + 8 nav labels with truncation (`Architectu…`); content was overflowing the column and labels wrapped awkwardly. (2) Every scene rendered as the same flat vertical stack of `BlockShell` cards with identical padding/radius/bg — content was dynamic but the *look* was uniform and boxy across all 8 intents.

**Change.**

A) **`src/components/flow/SideRail.jsx` rewrite.** Width 96px → 128px (`w-24` → `w-32`). Dropped: `restart` caption under reset icon, `L`/`Lakshay` caption under avatar, separate "AI" sparkle block, vertical `© 2025` text. AI status moved to a small dot riding the avatar's bottom-right corner (green when ready, pulsing primary when loading). Section nav now uses a horizontal pill row (dot + label) instead of stacked dot-above-label, scrolls internally if viewport is short (`overflow-y-auto scrollbar-hide`), no truncation needed — all 8 labels including "Architecture" fit. Footer condensed to one row of social icons + theme toggle. Dividers added between header / nav / footer for breathing room. Main content offset bumped `lg:pl-24` → `lg:pl-32` in `PersonalizedView.jsx` to match.

B) **`src/lib/sceneLayouts.js` (new)** — strategy and frame selection logic. 5 layout strategies (`editorial`, `split`, `bleed`, `mosaic`, `stack`) and 6 frame variants (`clean`, `numbered`, `ruled`, `markered`, `tinted`, `cutout`). `pickLayoutStrategy(seed, intent)` chooses a strategy with intent-bias maps (philosophy → editorial, outcomes → mosaic, technical → split, etc). `pickFrameVariant(seed, index, isHero)` chooses per-block frame, with hero-specific pool kept simpler. Deterministic from seed — same permalink always renders the same look.

C) **`src/components/SceneLayout.jsx` (new)** — `<SceneLayout strategy>` outer container with one of 5 visual treatments:
   - `editorial`: 38rem max-width centered column, generous 36px vertical gap (magazine).
   - `split`: 2-column CSS Grid (1.4fr / 1fr), collapses to single column under 768px.
   - `bleed`: vertical stack with alternating odd children breaking out of the column via negative margins (-1.25rem mobile, -2.5rem desktop).
   - `mosaic`: vertical stack with varied widths per child (92%/86%/78%) and alternating left/right alignment.
   - `stack`: original flat vertical, kept as fallback.
   And `<BlockFrame variant>` per-block decorator: numbered (oversized `01`/`02` counter floating left), ruled (small accent-color rule on top), markered (left accent border), tinted (gradient pad), cutout (asymmetric corner radii), clean (no chrome).

D) **`src/index.css`** — added bleed/mosaic/split CSS classes with the asymmetric child rules plus mobile-collapse for split.

E) **`src/components/SceneRenderer.jsx`** — replaced the flat `flex column gap:20` map with `<SceneLayout strategy>{ blocks.map(b => <BlockFrame variant={..}>{content}</BlockFrame>) }`. `chooseSceneLook({seed, intent, blocks})` picks both at once; results are memoizable via the deterministic seed.

**Files.** `src/components/flow/SideRail.jsx` (rewrite), `src/components/flow/PersonalizedView.jsx` (one-line padding bump), `src/lib/sceneLayouts.js` (new), `src/components/SceneLayout.jsx` (new), `src/index.css` (added strategy classes), `src/components/SceneRenderer.jsx` (wire new layout system).

**Verification.** Drove chrome MCP through all 8 intent chips back-to-back. Each picked a distinct strategy that matched its INTENT_BIAS map and stayed stable across re-clicks (same intent = same strategy). 5 of 5 strategies (`editorial`, `bleed`, `stack`, `mosaic`, `split`) appeared in active use across the 8 prebaked intents. Sidebar audit: 0 overflowing children at w-32, all 8 labels render full text, no `…` truncation.

**Expected runtime feel.** A philosophy answer reads like a magazine column. A projects answer feels mosaic, hand-arranged. An outcomes answer splits into a 2-column comparison. Same JSON spec; pure visual variety. Combined with the per-block frames (oversized numerals, accent rules, asymmetric corners), no two answers look alike even though they share a small set of components.

**Open follow-ups.**
- The per-block `BlockShell` (still applied INSIDE each block component) is a uniform card — it now sits inside the `BlockFrame`, which is fine but creates a "card-in-frame" effect for `tinted` and `cutout` variants. A future pass could let blocks opt out of `BlockShell` when wrapped in a frame that already provides the surface treatment.
- `mosaic` widths are hardcoded to 2-block scenes (works today since spec is always hero+scenario). Recursive specs (`future_plan.md`) would need a generalized rule.

---

## 2026-05-04 05:15 — Layout & frame catalog expansion (+research doc)
**Problem.** Initial layout system (entry 14) shipped 5 strategies + 6 frames. Variety was a step up but variants stayed within the same "rounded box" idiom — the Apple Bento, Brutalist, Polaroid, Sticky-Note, Newspaper, and Terminal-Window patterns from common design systems weren't represented. User asked for a research-grounded expansion.

**Change.**

A) **`src/lib/sceneLayouts.js`** — extended the catalogs:
- `LAYOUT_STRATEGIES` 5 → **9** (added `bento`, `polaroid_scatter`, `brutalist`, `newspaper`)
- `FRAME_VARIANTS` 6 → **10** (added `polaroid`, `sticky_note`, `terminal_window`, `brutalist_box`)
- `INTENT_BIAS` rebalanced to weight new strategies into appropriate intents (e.g., `outcomes → bento × 2`, `personal → polaroid_scatter`, `philosophy → newspaper`, `technical → brutalist`)
- Hero pool got `terminal_window` (works well for hero_terminal blocks); scenario pool absorbed all four new frames

B) **`src/components/SceneLayout.jsx`** — added the 4 new strategy containers (each picks a recognizable layout idiom: bento = 6-col CSS Grid with hero spanning all 6; polaroid_scatter = 36px gap with rotation; brutalist = 28px gap pairing with hard borders; newspaper = 46rem max-width column for serif drop-cap treatment) and 4 new frame variants:
   - `polaroid`: white photo-frame (#fafaf7) + 14/14/36 padding + alternating ±1–3° rotation + drop shadow + hover-to-flat. Fixed colors so the album feel doesn't break in dark themes.
   - `sticky_note`: pastel `--accent-soft` bg + 1.5° rotation + folded-corner triangle via `clip-path`.
   - `terminal_window`: macOS-style title bar with red/yellow/green traffic-light dots above the block, bordered with `--outline`.
   - `brutalist_box`: 2px `--fg` border + 6px solid offset shadow + zero border-radius. Anti-Material.

C) **`src/index.css`** — strategy CSS for the 4 new containers:
   - `.scene-bento > :nth-child(N)` rules to assign grid spans (`span 6` / `span 4` / `span 2`) with mobile fallback to full-width.
   - `.scene-polaroid-scatter > :nth-child(odd|even)` — alternating left/right offsets so rotated children scatter visually.
   - `.scene-brutalist` — small block padding to let offset shadows breathe.
   - `.scene-newspaper` — serif heading override + `column-count: 2` on the second block + drop-cap `:first-letter` selector with 3em accent-color glyph.

D) **`layout_catalog.md` (new, ~250 lines)** — research-grounded reference doc:
- Table of all 9 strategies and 10 frames with their design-system inspiration (Medium, Linear, Stripe, Apple Bento, Awwwards, NYT print, Pinterest, Brutalist Web Design, macOS Terminal, Post-it).
- Backlog of 10 strategies and 15 frames worth adding next, each with inspiration source (XCKD comic strips, Spotify album covers, NYC subway maps, Genius highlights, ticket stubs, footnote markers, glassmorphism, vinyl crops, etc).
- Intent → strategy bias map documented.
- Implementation notes (determinism via Knuth multiplicative hash, hero vs scenario pools, theme-awareness rules, `nth-child` CSS hooks).
- "How to add a new variant" 8-step recipe.
- Research sources tapped (CodePen tags, Awwwards, Apple HIG, GOV.UK, Tufte CSS, Brutalist Web Design, Tailwind UI Catalyst).

**Files.** `src/lib/sceneLayouts.js`, `src/components/SceneLayout.jsx`, `src/index.css`, `layout_catalog.md` (new).

**Verification.** Drove chrome MCP through all 8 intent chips, captured strategy per chip. Result: 6 distinct strategies in active use (`editorial`, `mosaic`, `split`, `brutalist`, `bleed`, `polaroid-scatter`) — both new ones (`brutalist` for Architecture, `polaroid-scatter` for About me) appear. Same intent → same strategy on re-click (deterministic, permalink-stable). `bento` and `newspaper` will surface for other seeds; the prebaked 8 happen not to land on them at the chosen seeds, but they're reachable via question generation.

**Open follow-ups.**
- Backlog in `layout_catalog.md` has 10 strategies + 15 frames not yet implemented. Highest-impact picks for v2: `comic_strip`, `index_card_stack`, `manifesto`, `ticket`, `glass`, `stamp`.
- Some frames don't compose cleanly with the inner `BlockShell` of every block (e.g. `polaroid` inside a block that already paints a card surface produces a card-in-frame). Fix once we add a `noShell` prop to blocks.
- `polaroid` uses fixed colors (`#fafaf7` bg + black text) so it doesn't blend into dark themes — design choice to preserve the album feel, but worth a `--polaroid-bg` token if user feedback wants it themeable.

---

## 2026-05-05 00:24 — Layout LoRA live in fluid-odyssey (Qwen 0.5B + custom WSL build)
**Problem.** Two trained LoRAs (portfolio + layout) sat in `models/loras/` as raw safetensors, unusable by web-llm which needs MLC-compiled bundles. Goal: get the layout LoRA actually serving inference in the browser, no Docker, no per-request network calls.

**Pipeline built (Windows + WSL2 hybrid).**

1. `scripts/merge_loras.py` (Python on Windows) — peft `merge_and_unload` fuses each LoRA into Qwen2.5-0.5B-Instruct base → `models/merged/{portfolio,layout}/` (~954 MB each, full standalone safetensors).
2. WSL2 Ubuntu 24.04: `pip install mlc-llm-nightly-cu124 mlc-ai-nightly-cu124` (~2 GB wheels) plus all `nvidia-*-cu12` runtime packages (the nightly bundles cu13 NVIDIA libs but TVM is built against cu12, so explicit `nvidia-cuda-runtime-cu12 nvidia-cublas-cu12 …` install needed; export LD_LIBRARY_PATH to point at the cu12 libs in the venv).
3. `scripts/compile_mlc.sh` — runs `python -m mlc_llm convert_weight --device cpu --quantization q4f16_1` + `gen_config --conv-template qwen2` for each merged model. Note `--device cpu` (CUDA path needs `nvcc` which isn't in venv). Output: `models/compiled/{portfolio,layout}-q4f16_1/` (~281 MB each — 70% reduction via 4-bit quant).
4. WASM lib step (`mlc_llm compile`) needs emscripten + the mlc-llm git repo's `web/dist/wasm/mlc_wasm_runtime.bc` — NOT shipped in pip wheel. Bypassed by reusing MLC's published `Qwen2-0.5B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm` from `binary-mlc-llm-libs` since the wasm lib is architecture-only (depends on Qwen 0.5B + q4f16, NOT on weights). Same lib works for both LoRAs.
5. `public/models/{portfolio,layout}-q4f16_1/` — bundles staged for Vite to serve as static assets.

**Bugs hit + patched along the way.**

- **`config.json` missing.** `convert_weight` in newer mlc-llm doesn't write the HF model config. Manually patched `rope_theta` from nested `rope_parameters` (newer transformers format) to top-level (mlc expects old format).
- **`vocab.json` and `merges.txt` missing.** Bundle assembly only included `tokenizer.json`. web-llm fetches the BPE pair too. Downloaded both from MLC's reference HF repo.
- **`tensor-cache.json` vs `ndarray-cache.json`.** New mlc-llm names the manifest `tensor-cache.json`; web-llm looks for `ndarray-cache.json`. Symlinked (cp) one to the other; reference repo confirms they're byte-identical.
- **HF URL convention.** web-llm's `cleanModelUrl()` appends `resolve/main/` to any model URL that doesn't already match `.+/resolve/.+/`. Our `http://localhost:5173/models/layout-q4f16_1/` became `…/resolve/main/mlc-chat-config.json` → 404 → SPA fallback HTML → JSON.parse "Unexpected token '<'". Fixed by mirroring the bundle into `public/models/<name>/resolve/main/<file>` so the appended path resolves.
- **Vite SPA fallback hiding 404s.** Default Vite dev server returns `index.html` for every unknown path. Wrote a `noSpaFor(['/models/'])` plugin (in `vite.config.js`) that intercepts `res.writeHead`: if the response is going out as `text/html` for a `/models/*` URL, rewrite to `404 text/plain`. Kept SPA behavior for non-`/models/` paths so the React app still routes.
- **IndexedDB cache poisoning.** Earlier failed inits cached the SPA fallback HTML as the model config. Cleared `indexedDB.databases()` + `caches.keys()` to wipe; subsequent reload pulled fresh files.
- **Worker dtype mismatch (training side).** RTX 2070 Super (Turing, compute 7.5) has no native bf16. Training configs forced `torch_dtype: float16`, `bf16: false`, `fp16: false` (left mixed-precision off entirely; bnb 4-bit handles compute precision).

**Files added/touched.**
- `scripts/merge_loras.py` (new) — peft merge.
- `scripts/compile_mlc.sh` (new) — WSL2 invocation of mlc-llm convert/gen_config.
- `vite.config.js` — `noSpaFor` plugin so Vite returns real 404s for missing `/models/` files.
- `public/models/{portfolio,layout}-q4f16_1/` and `…/resolve/main/` (gitignored).
- `.env.local` — `VITE_PERSONAL_MODEL_URL=http://localhost:5173/models/layout-q4f16_1/` + matching `..._LIB`.

**Verified end-to-end.**

- Engine init: **5.96s** (vs 6.5s on Qwen 1.5B). 8 shards (266 MB) downloaded once into IndexedDB; subsequent loads come from cache, zero network.
- Pass 1 (router): **2.5s** (vs 10–25s on base Qwen 1.5B). **4–10× faster.**
- Pass 2 throughput: **52 ch/s sustained** (vs 17–23 ch/s on base). **2.5–3× faster.**
- Total cycle: **~17s** end-to-end (vs 80–95s previously). **~5× faster.**
- LoRA-fused output recognizably follows our SceneSpec contract: emits the correct top-level keys (`request_id`, `seed`, `intent`, `mood`, `theme`, `layout`, `blocks`), fills both blocks with `id: "h"` and `id: "b"`, picks valid hero variants and scenario block types.

**Quality caveats (model trained on 104 rows; expected).**
- Occasional invalid enum values (e.g. `palette_name: "citrine"` instead of `citrus`).
- Stray field leakage (e.g. `background.kind: "hero_typewriter"` — block type bled into bg).
- Minor JSON malformation (unclosed `}` between blocks). Streaming parser's permissive mode catches some; schema validation falls back to `markdown_prose` for the rest.

**Ship vs improve trade.** The pipeline is correct and proves the approach. Output quality is a function of training data scale (we trained on 8 seeds × 12 paraphrases = 96 effective rows). Per `layout_adapter_plan.md` §3.2, the target is 2,000–3,000 examples. To improve, run `generate_layout_data.py` with `ANTHROPIC_API_KEY` set and `--target-rows 2000`, then retrain.

**Open follow-ups.**
- Output quality: train on 2k synthetic rows for a real validation. Current LoRA is proof-of-pipeline only.
- The portfolio LoRA is staged but unused at runtime (only one bundle URL active per `.env.local`). Decide whether to stack adapters (orthogonal target_modules; see `layout_adapter_plan.md` §9) or runtime-swap via `engine.reload()`.
- Compile WASM lib locally (instead of borrowing MLC's prebuilt) when we change the model arch or quantization. Needs emscripten + mlc-llm git repo in WSL.
