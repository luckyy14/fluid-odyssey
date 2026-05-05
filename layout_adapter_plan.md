# Layout Adapter — Detailed Plan

A separate LoRA fine-tuned exclusively for emitting valid SceneSpec JSON
(pass 2 of the orchestrator). Lives next to the personality adapter that
fluid-trainer already produces; both adapt the same base model but specialize
on different things.

This document covers: purpose, scope, data, training, integration, evaluation,
and a phased rollout.

---

## 1. Why a separate layout adapter

### What we observe today (Qwen2.5-1.5B-Instruct-q4f16, no fine-tune)

From the calibration WAL (`calibration.md`):

- 17–23 ch/s sustained, 80–95s end-to-end per question.
- Repeated structural failures the prompt couldn't fully fix:
  - markdown ` ```json ` fence wrapping (entry 7)
  - unquoted JSON keys / JSON5-style output (entry 7)
  - JS-style comments inside JSON (entry 9)
  - `background` emitted as a string instead of `{kind: ...}` (entry 9)
  - `hero` props left empty (entry 8)
  - placeholder copy verbatim (`"…"`, `"Eight years of frontend"`, …) — entries 8, 10, 11
  - hero/scenario role swap (`id: "h"` got the scenario block) — entry 11
  - block type truncated mid-stream (`"exp"` instead of `"exp_role_card_stack"`) — entry 12
  - title overflows (260 chars vs 160 schema cap) — entry 12
  - palette monoculture (model nearly always picks `ember`/`ink` + `particles`/`pattern`) — entry 12
  - polarity flips on stats (`-59.9% faster`) — entry 12

Every one of these is the same thing: the **base model doesn't know our
contract**, so we use prompt acrobatics + a forgiving parser to clean up
after it. That's expensive in both tokens and dev time.

### What a layout adapter changes

It moves the contract knowledge from the prompt into the weights. The model
emits valid SceneSpec JSON because it has *seen thousands of valid scene
specs* during training. Specifically:

- **Quality:** Schema-failure rate drops from ~30% (today) to a target
  ≤5%. Fewer fallback-to-markdown_prose renders. Fewer copies of placeholder
  text. Fewer truncations.
- **Length:** Output gets shorter because the model stops emitting unneeded
  filler ("Sure, here's…", JSON-fence markers, JS comments). Estimated
  20–40% fewer tokens per scene.
- **Diversity:** Palette/block choices spread across the catalog instead of
  concentrating on 2 favorites.
- **End-to-end speed:** *Indirect.* Tokens/sec stays the same, but fewer
  tokens × fewer regenerations × shorter prompts (we can drop the giant
  "CRITICAL OUTPUT RULES" preamble) means user-perceived latency drops by
  roughly the same 20–40%. Pass 2 from ~50s → ~30s is realistic.

### What it does NOT change

- WebGPU shader compile (one-time, ~10s on first call).
- Pass 1 router latency unless we also train a routing adapter (out of scope
  here — separately worth doing).
- Token-per-second throughput on the GPU.
- Total model bundle size (LoRA adds ~20–80 MB on top of the 829 MB base).

---

## 2. Scope

### In scope

- **Pass 2 (composer)** output. Full SceneSpec JSON given a question + a
  pass-1 routing summary.
- All 9 scenario block types in the existing registry.
- All 4 hero variants.
- The full theme catalog (palettes, type families, densities, radii,
  motions, backgrounds).

### Out of scope (for v1)

- Pass 1 (router). Stays prompted on the same base model. Could become a
  v2 adapter or a heuristic embedding lookup.
- Recursive scene specs (`children[]`). Covered separately in
  `future_plan.md`. Adapter v1 emits flat 2-block scenes only.
- Personality / voice. The personality LoRA stays the way it is. The two
  adapters are stackable at runtime if web-llm supports adapter merging
  (see §9), or we ship them as separate model bundles for different routes.

---

## 3. Training data — structure and content

### 3.1 Example shape

Each training example is a `(prompt, completion)` pair. The prompt is
deterministic and resembles what the orchestrator actually sends at runtime;
the completion is exactly the SceneSpec JSON we want, no preamble, no
trailing text.

```jsonl
{
  "prompt": "<|im_start|>system\nYou compose JSON pages for Lakshay's portfolio.<|im_end|>\n<|im_start|>user\nQuestion: What frontend work has Lakshay done?\nIntent: experience\nMood: technical\nKeywords: frontend, work, react\nSeed: 42\n\nReturn the JSON object now.<|im_end|>\n<|im_start|>assistant\n",
  "completion": "{\"request_id\":\"a1b2c3d4\",\"seed\":42,\"intent\":\"experience\",\"mood\":\"technical\",\"theme\":{\"palette_name\":\"tide\",\"type_family\":\"sans\",\"density\":\"normal\",\"radius\":\"soft\",\"motion\":\"subtle\",\"background\":{\"kind\":\"gradient\"}},\"layout\":\"hero-block\",\"blocks\":[{\"id\":\"h\",\"type\":\"hero\",\"props\":{\"title\":\"Eight years building frontends.\",\"kicker\":\"From legacy migrations to greenfield React.\"}},{\"id\":\"b\",\"type\":\"exp_timeline_vertical\",\"props\":{\"events\":[{\"title\":\"Software Development Engineer II\",\"company\":\"Bajaj Finserv Health\",\"period\":\"Aug 2023–present\",\"description\":\"Led FE migration of clinic ops portal, cut latency 90%.\",\"current\":true},{\"title\":\"Associate SDE\",\"company\":\"Bajaj Finserv Health\",\"period\":\"Jul 2022–Jul 2023\",\"description\":\"Built micro-frontend shell, coordinated 4 product squads.\"}]}}]}<|im_end|>"
}
```

Notes on the completion:

- **Compact JSON.** No extra whitespace. Fewer tokens. Same parser handles it.
- **Keys in canonical order:** `request_id`, `seed`, `intent`, `mood`,
  `theme`, `layout`, `blocks`. Same order every example.
- **Inside `theme`:** `palette_name`, `type_family`, `density`, `radius`,
  `motion`, `background.kind` — same order.
- **Block ordering:** hero first (id `h`), scenario second (id `b`). Always.
  This kills the role-swap class of bugs (entry 11) by making it learned.
- **`current` boolean:** included only when true. Optional fields omitted
  when absent — teaches the model the optional discipline.
- **Real fact-sheet data only.** Names, companies, dates, URLs all match
  `src/data/profile.js`.

### 3.2 Coverage matrix — what to include

A useful training set hits every cell in this matrix at least 5–10 times so
the model learns the joint distribution.

| dimension | values | examples needed |
|---|---|---|
| intent | skills, experience, contact, projects, technical, outcomes, philosophy, personal | 8 × ~80 = ~640 base examples |
| hero variant | hero, hero_quote, hero_terminal, hero_typewriter | each hero seen across multiple intents |
| scenario block per intent | (per `INTENT_BLOCKS` in `recipes.js`) | each scenario block seen ≥30 times |
| palette | all in `PALETTES` (ember, ink, sage, tide, paper, …) | each palette seen ≥40 times |
| background kind | gradient, particles, pattern, noise, clouds, … | each kind seen ≥40 times |
| type family | sans, serif, mono, … | balanced |
| density / radius / motion | airy/normal/dense, sharp/soft/round, still/subtle/lively | balanced |
| question style | short ("FE work?"), long, casual, formal, ambiguous, multi-topic | each style ≥100 examples |

Target dataset size: **~2,000–3,000 examples**. That's small by LLM
standards but plenty for a structured-output LoRA on a 1.5B base. Going
higher hits diminishing returns and risks overfitting on phrasings.

### 3.3 How to generate the data

Three sources, used in combination:

#### (a) Hand-authored seeds (~80 examples)

Start from `src/data/prebaked.js` — already has 8 curated specs. Expand to
~80 by writing one canonical spec per (intent × hero variant × scenario
block) combination. These are the "gold standard" for the rest to be derived
from. Owned by you, in version control, used in eval.

#### (b) Synthetic expansion via a larger model (~2,000 examples)

Use Claude (Sonnet/Opus) or GPT-4 with a script that:

1. Picks a random (intent, hero, scenario_block, palette, …) combo from
   the coverage matrix.
2. Picks a question template from a list of ~50 templates (recruiter,
   developer, casual, multi-topic, edge cases like single-word questions).
3. Asks the larger model:
   > Given Lakshay's fact sheet `<inserts profile.js>`, the chosen
   > combo, and this user question, produce the canonical SceneSpec JSON
   > exactly matching this schema and key order. Use real facts only.

4. Validates the result through `Pass2Schema.parse()` plus all per-block
   `propsSchema.safeParse()`. Rejects + retries on failure. Caps at 5
   tries per row.
5. Writes to `data/layout_train.jsonl`.

The generation prompt is itself a calibration loop. Iterate the few-shot
examples until the larger model produces ≥95% schema-passing rows. Estimate:
~$30–50 in API costs for 2k rows on Sonnet, ~$200 on Opus.

#### (c) Replay-from-failure (~200 examples)

Mine the production console logs (the `pass 2 raw buffer` we already log in
dev) for cases where the base model emitted broken JSON. For each, hand-fix
or LLM-fix to the canonical form. These are the highest-value examples
because they target the exact failure modes the base model exhibits.

### 3.4 Data validation pipeline

Before training, every row passes through `scripts/validate_layout_data.py`
(to write):

1. JSON parses cleanly with `json.loads` (no `Allow.ALL` permissiveness).
2. Top-level keys present in canonical order.
3. Theme keys present, all values from allowed enums.
4. Both blocks present, hero first.
5. Hero `type` ∈ `HERO_VARIANTS`; scenario `type` ∈ `INTENT_BLOCKS[intent]`.
6. Per-block props validate against the corresponding zod schema (we'll
   port the zod schemas to JSON Schema for the validator).
7. Total completion length ≤ 1500 tokens (Qwen tokenizer).
8. Question length ≤ 200 chars (realistic input range).

Reject rows that fail any check. Log the rejection reason. Re-generate.

### 3.5 Train / eval split

- 90% train, 10% eval, random split with seeded RNG so the split is
  reproducible.
- Eval set MUST contain ≥1 example per (intent × scenario_block) combo so
  per-cell metrics are computable.

---

## 4. Base model & adapter shape

### 4.1 Base model choice

Stick with **Qwen2.5-1.5B-Instruct** (current fallback) for v1. Reasons:

- It's already in the user's browser cache after one visit.
- web-llm publishes the q4f16 MLC bundle.
- Small enough to compile shaders quickly.
- Instruction-tuned, so it follows the prompt format the LoRA expects.

For v2 consider Qwen2.5-0.5B-Instruct with a heavier LoRA (rank 64). On
modern hardware that hits 30–50 tok/s on WebGPU — 4× faster. Quality drops
without the LoRA but a structured-output task is exactly where a small
fine-tuned model can match a much larger zero-shot one.

### 4.2 LoRA hyperparameters (starting point)

```python
LoraConfig(
    r=16,                       # rank — 16 is plenty for format-following
    lora_alpha=32,              # alpha = 2 × rank, standard
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",   # attention — always
        "gate_proj", "up_proj", "down_proj",       # MLP — helps for structured output
    ],
)
```

Why these target modules: attention-only LoRAs (`q,k,v,o`) are enough for
style/voice. Structured output benefits from MLP adaptation too because the
"emit a `{` next, then `\"theme\":` next" decisions live in the FFN.

Adapter size on disk: ~30–60 MB depending on rank/modules.

### 4.3 Training hyperparameters

```python
TrainingArguments(
    output_dir="checkpoints/layout-lora-v1",
    num_train_epochs=3,                # structured output overfits fast — 3 is enough
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,     # effective batch = 16
    learning_rate=2e-4,                # standard for LoRA
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    weight_decay=0.01,
    bf16=True,                         # if hardware supports; else fp16
    optim="adamw_torch",
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=100,
    save_strategy="steps",
    save_steps=200,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    seed=42,
)
```

On a single A100 / 4090, expected training time: 30–90 minutes for 2k
examples × 3 epochs.

### 4.4 Loss masking

Critical: **mask the prompt tokens out of the loss**. Only score the
assistant's completion. Without masking, the model wastes capacity learning
to reproduce the system prompt and user message — which it already sees
verbatim at inference. Most LoRA training scripts (TRL's `SFTTrainer` with
`DataCollatorForCompletionOnlyLM`) handle this with one config flag; double-
check it's on.

---

## 5. Schema-constrained decoding (orthogonal but stackable)

The LoRA teaches the model the format. Constrained decoding *forces* it.
Combining both is the gold path.

### 5.1 At inference time

web-llm supports `response_format: { type: "json_object", schema: <JSON
Schema as STRING> }`. Calibration entry 6 found this currently crashes when
schema is omitted — but giving it a real string-encoded schema works. Ship
the SceneSpec JSON Schema (compiled from our zod schemas via
`zod-to-json-schema`) and pass it on every pass-2 call:

```js
const SCENE_SCHEMA_STRING = JSON.stringify(zodToJsonSchema(SceneSpecSchema));
// at call site:
response_format: { type: "json_object", schema: SCENE_SCHEMA_STRING }
```

This guarantees:

- No markdown fences.
- No JS comments.
- No unquoted keys.
- No type truncation issues (the grammar enforces full enum strings).
- No length overruns (max constraints are encoded).

### 5.2 During training data generation

Use the same JSON Schema as the validator in §3.4 so the data and the
runtime grammar agree. If the LoRA emits something the grammar would
reject, that's a training data bug.

### 5.3 During eval

Run two eval passes: with and without grammar enforcement. The gap measures
how much the LoRA learned vs how much the grammar rescues. If the gap is
small, the LoRA is doing its job.

---

## 6. Repo / file structure

In **fluid-trainer** (the existing personality-LoRA repo):

```
fluid-trainer/
├── adapters/
│   ├── personality/                       # existing
│   │   └── …
│   └── layout/                            # NEW
│       ├── README.md                      # adapter purpose, version, eval scores
│       ├── config/
│       │   ├── base_model.yaml            # model id, tokenizer config
│       │   ├── lora.yaml                  # LoraConfig values
│       │   └── train.yaml                 # TrainingArguments
│       ├── data/
│       │   ├── seeds/                     # hand-authored gold examples
│       │   │   └── seed_*.json            # one per (intent, hero, scenario)
│       │   ├── synthetic/                 # generated by §3.3(b)
│       │   │   └── batch_<timestamp>.jsonl
│       │   ├── replay/                    # mined from production logs §3.3(c)
│       │   │   └── replay_*.jsonl
│       │   ├── train.jsonl                # final, after dedupe + validate
│       │   └── eval.jsonl
│       ├── scripts/
│       │   ├── 01_generate_synthetic.py   # calls Claude/GPT-4
│       │   ├── 02_validate.py             # JSON Schema + zod-port checks
│       │   ├── 03_dedupe.py               # canonicalize + hash + drop dupes
│       │   ├── 04_split.py                # train/eval split
│       │   ├── 10_train.py                # PEFT training
│       │   ├── 20_eval.py                 # batch eval, schema pass rate
│       │   ├── 30_compile_mlc.py          # MLC-LLM compile to .wasm + params
│       │   └── 99_smoke.py                # end-to-end: load adapter, ask 5 Qs
│       ├── checkpoints/                   # gitignored
│       ├── compiled/                      # MLC artifact, gitignored
│       └── eval_reports/
│           └── v1.md                      # metrics from §8
├── shared/
│   ├── scene_schema.json                  # JSON Schema, source of truth
│   ├── scene_schema.py                    # Python zod-equivalent (port)
│   ├── profile.json                       # canonical fact sheet
│   └── prompt_templates/
│       ├── pass2_system.txt               # what fluid-odyssey sends at runtime
│       └── pass2_user_template.txt
└── README.md
```

In **fluid-odyssey** (this repo):

```
src/lib/
├── llmEngine.js                # add an env var VITE_LAYOUT_MODEL_URL for the layout bundle
├── sceneOrchestrator.js        # if useLayoutBundle, drop the giant CRITICAL_OUTPUT_RULES section, pass schema
└── sceneSpec.js                # source of zod schemas — must stay in lockstep with shared/scene_schema.json
scripts/
└── export_schema.mjs           # NEW: dump SceneSpecSchema → fluid-trainer/shared/scene_schema.json
```

The export script keeps the two repos in sync. CI (or a pre-commit hook in
fluid-odyssey) runs it and fails if `scene_schema.json` diverges from the
zod source.

---

## 7. Compilation & runtime integration

### 7.1 Bake the LoRA into the base weights

For web-llm we cannot ship a separate adapter file at runtime — the runtime
loads one MLC bundle per `model_id`. Two options:

**Option A — Merge LoRA into base, compile fresh bundle.**
```bash
python scripts/30_compile_mlc.py \
    --base Qwen/Qwen2.5-1.5B-Instruct \
    --adapter checkpoints/layout-lora-v1/best \
    --output compiled/layout-v1 \
    --quantization q4f16_1 \
    --target webgpu
```
Output: `compiled/layout-v1/{params,*.wasm,mlc-chat-config.json}`. Total size
~830 MB (same as base). Push to a CDN; set `VITE_LAYOUT_MODEL_URL` to point
at it.

**Option B — Ship two bundles (personality + layout), let the orchestrator
pick.**
- `engine.reload(modelId)` lets you switch bundles at runtime.
- Pass 1 uses the personality bundle (sounds like Lakshay).
- Pass 2 uses the layout bundle (emits perfect JSON).
- Cost: 2× model download + 2× shader compile on first run. Brutal first
  load. Probably not worth it unless personality matters more than first-
  load time.

Recommendation: **Option A** for v1. Personality matters most in conversation
(future feature, not pass 1's strict-JSON router). Layout matters most for
output. Merge layout into the base first; revisit when there's a real
conversational use case.

### 7.2 fluid-odyssey runtime change

In `src/lib/llmEngine.js`, the existing `useCustomBundle` path already
handles a custom URL. Just add a `VITE_LAYOUT_MODEL_URL` and prefer it when
set:

```js
const LAYOUT_MODEL_URL = import.meta.env?.VITE_LAYOUT_MODEL_URL || '';
const PERSONAL_MODEL_URL = import.meta.env?.VITE_PERSONAL_MODEL_URL || '';
const ACTIVE_URL = LAYOUT_MODEL_URL || PERSONAL_MODEL_URL || '';
```

In `sceneOrchestrator.js`, when `LAYOUT_MODEL_URL` is set:

- Drop the long "CRITICAL OUTPUT RULES" preamble (the LoRA knows them).
- Drop the `<ANGLE_BRACKET>` placeholder examples (the LoRA knows them).
- Keep only: fact sheet + question + intent + mood + keywords + seed.
- Add `response_format: { type: 'json_object', schema: SCENE_SCHEMA_STRING }`.

Result: pass-2 prompt drops from ~3000 tokens to ~600 tokens. That alone
shaves 5–10s off TTFT.

---

## 8. Evaluation

### 8.1 Automated metrics

Run `scripts/20_eval.py` after every training run. Eval set has ~200 held-out
prompts. For each:

| metric | how | target v1 | target v2 |
|---|---|---|---|
| **schema_pass_rate** | run `Pass2Schema.parse()` on output | ≥95% | ≥99% |
| **block_pass_rate** | per-block `propsSchema.safeParse()` | ≥95% | ≥99% |
| **intent_match** | does block.type ∈ INTENT_BLOCKS[intent] | ≥98% | ≥99.5% |
| **hero_in_first_slot** | blocks[0].id == 'h' AND type ∈ HERO_VARIANTS | 100% | 100% |
| **completion_tokens_p50** | tokenizer count of output | ≤300 | ≤250 |
| **completion_tokens_p95** | | ≤500 | ≤400 |
| **palette_diversity** | unique palettes across 100 random questions | ≥6 | ≥8 |
| **block_diversity** | unique scenario blocks across 100 random Qs | ≥6 | ≥8 |
| **placeholder_leak_rate** | fraction with `<ANGLE_BRACKET>` or `…` in any string field | 0% | 0% |
| **fact_accuracy** | spot check 50, count fields contradicting fact sheet | ≤2% | ≤1% |

Compare against base model + current prompt as baseline. v1 success = beat
baseline on every metric AND hit the v1 target on schema/block pass rates.

### 8.2 Render eval

Schema-passing JSON ≠ a good page. After the metrics run, take 20 random
eval outputs and feed them through fluid-odyssey's renderer (use the
prebaked-spec path). Screenshot with playwright. Eyeball:

- No empty blocks (hero/scenario both have visible content).
- Title fits the hero treatment without clipping.
- Palette feels appropriate for the mood/intent.
- No literal placeholder text on page.

20 is enough to catch obvious regressions. Over time, snapshot-test the
eyeball judgments by hand-ranking each output 1–5 and tracking the average
across model versions.

### 8.3 Latency eval

Compile + load the merged bundle; run 30 questions through the actual
fluid-odyssey orchestrator with the layout adapter. Record:

- TTFT (pass 1 + pass 2 first chunk)
- Pass 2 stream duration
- Tokens/sec
- Total wall-clock per question

Compare against the same 30 questions on the base model. Target: 30–40%
reduction in pass-2 stream duration purely from shorter output.

### 8.4 Failure log

Every eval row that fails any check goes into `eval_reports/v1_failures.md`
with the input, output, and which check failed. This is the next iteration's
training data (after fixing or hand-correcting the output).

---

## 9. Stacking with the personality adapter

If both adapters target the same modules at the same rank, you can:

- Train both, save both, then **merge sequentially into the base** during
  compilation: `base + personality_lora + layout_lora` → single fused
  bundle. PEFT supports `model.add_adapter(...)` then
  `model.merge_and_unload()`.
- Or (richer, harder) train them with **orthogonal subspaces** (different
  `target_modules`) so they don't interfere. Personality on attention
  only, layout on MLP only. Merge cleanly.

Easiest: train layout in isolation for v1, ship it, then experiment with
stacking in a v1.1 spike.

---

## 10. Phased rollout

| phase | scope | duration | exit criteria |
|---|---|---|---|
| **0. Schema export** | add `scripts/export_schema.mjs` to fluid-odyssey, dump JSON Schema. Add to fluid-trainer/shared. CI check that they stay in sync. | 0.5 day | schema commits land in both repos, CI green |
| **1. Hand seeds** | author 80 gold (intent × hero × scenario) seeds in `data/seeds/`. Run validator on all. | 1 day | 100% validate, every cell ≥1 |
| **2. Synthetic generation** | write `01_generate_synthetic.py`, iterate few-shot prompt to Claude/GPT-4 until ≥95% gen-then-validate pass rate, generate 2k rows | 2 days | 2k rows in `data/synthetic/`, ≥95% validated |
| **3. Replay mining** | grep production logs for 200 broken pass-2 outputs, hand-fix or LLM-fix | 1 day | 200 rows in `data/replay/` |
| **4. Train v1** | dedupe → split → train, log to wandb/local | 0.5 day | adapter checkpoint in `checkpoints/layout-lora-v1` |
| **5. Eval v1** | run §8.1 metrics; if any miss target, iterate data + retrain | 1–3 days | schema_pass_rate ≥95%, all targets met |
| **6. Compile MLC** | run `30_compile_mlc.py`, push bundle to CDN | 0.5 day | bundle accessible at known URL |
| **7. Wire fluid-odyssey** | env var, sceneOrchestrator prompt slim-down, grammar mode on | 0.5 day | local dev runs end-to-end on layout bundle, pass-2 prompt ≤700 tokens |
| **8. A/B production** | flip `VITE_LAYOUT_MODEL_URL` for half of visitors via build flag, watch metrics for a week | 1 week | layout-bundle visitors show lower fallback rate AND faster total cycle |
| **9. Default-on** | make layout bundle the default; keep base as fallback for WebGPU-disabled clients | — | shipped |

Total elapsed: ~3 weeks calendar, ~1 week of focused work.

---

## 11. Risks and mitigations

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| Synthetic data generator inherits its own biases (Claude prefers certain palettes) | high | medium | balance the coverage matrix at generation time, not after; reject biased batches |
| LoRA overfits on Lakshay's specific facts; can't be reused | high | low | this is a feature, not a bug — fluid-odyssey is a personal site; if a generic version is wanted later, train with templated facts |
| Merged bundle bigger than base, slower download | low | medium | LoRA fuse adds ≤1 MB to compiled weights; bundle stays ~830 MB |
| Grammar mode (`response_format.schema`) still crashes web-llm runtime | medium | high | test in isolation early (phase 0); fallback to no-grammar + LoRA-only if needed |
| Adapter regresses on novel question phrasings not in train set | medium | medium | broad question-template diversity at generation time; replay-from-production loop catches stragglers post-launch |
| Compiling MLC bundle for new base + LoRA hits dependency hell on Windows | high | medium | document a Linux/WSL-only build path; provide a Dockerfile |
| Web-llm version skew breaks the bundle on user browsers | low | high | pin web-llm version in fluid-odyssey package.json; rebuild bundle with same major version |
| Personality and layout adapters interfere when stacked | medium (only if v1.1 stacking attempted) | medium | use orthogonal `target_modules` per §9 |

---

## 12. Open questions for you to decide

1. **Synthetic generator model.** Sonnet 4.6 is cheaper, Opus 4.7 produces
   cleaner JSON. For 2k rows, is the ~5× cost worth it? Recommend starting
   with Sonnet and only escalating cells where the validator rejection rate
   exceeds 30%.
2. **Hosting the bundle.** Vercel static? Cloudflare R2? HuggingFace Hub
   (free, but cold latency)? For 830 MB, R2 with a 10-minute browser cache
   header is the sweet spot.
3. **Personality vs layout when forced to choose.** If web-llm grammar mode
   never works reliably and we can only ship one adapter, which one?
   Recommend layout — fewer broken pages outweighs voice fidelity for a
   portfolio that's mostly read silently.
4. **Eval cadence.** Once-per-checkpoint is fine for training. Should the
   replay-from-production loop run weekly? Monthly? Never until something
   breaks?
5. **0.5B vs 1.5B base for v2.** A 0.5B with a heavier LoRA and grammar
   enforcement might match 1.5B quality at 4× the speed. Worth a spike
   after v1 ships.

---

## 13. Appendix — data row template

Reference for hand-authoring the 80 seeds:

```jsonl
{
  "meta": {
    "intent": "experience",
    "hero": "hero",
    "scenario_block": "exp_timeline_vertical",
    "palette": "tide",
    "background": "gradient",
    "type_family": "sans",
    "question_style": "short",
    "source": "seed",
    "seed_id": "exp-timeline-001"
  },
  "prompt": {
    "question": "What frontend work has Lakshay done?",
    "intent": "experience",
    "mood": "technical",
    "keywords": ["frontend", "work", "react"],
    "seed": 42
  },
  "completion_json": {
    "request_id": "a1b2c3d4",
    "seed": 42,
    "intent": "experience",
    "mood": "technical",
    "theme": {
      "palette_name": "tide",
      "type_family": "sans",
      "density": "normal",
      "radius": "soft",
      "motion": "subtle",
      "background": { "kind": "gradient" }
    },
    "layout": "hero-timeline",
    "blocks": [
      {
        "id": "h",
        "type": "hero",
        "props": {
          "title": "Eight years building frontends.",
          "kicker": "From legacy migrations to greenfield React."
        }
      },
      {
        "id": "b",
        "type": "exp_timeline_vertical",
        "props": {
          "events": [
            {
              "title": "Software Development Engineer II",
              "company": "Bajaj Finserv Health",
              "period": "Aug 2023–present",
              "description": "Led FE migration of clinic ops portal, cut latency 90%.",
              "current": true
            },
            {
              "title": "Associate SDE",
              "company": "Bajaj Finserv Health",
              "period": "Jul 2022–Jul 2023",
              "description": "Built micro-frontend shell, coordinated 4 product squads."
            }
          ]
        }
      }
    ]
  }
}
```

The training script (`10_train.py`) flattens `prompt` + `completion_json`
into the chat-format string in §3.1 at load time. Source-of-truth lives in
the structured form so the validator and the trainer agree.
