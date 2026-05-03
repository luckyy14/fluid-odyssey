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
