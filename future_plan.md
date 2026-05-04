# Future plan: recursive scene specs

A design note for the next major step on the scene engine. Not implemented
yet — the current architecture (calibration entry 10) is the "safer middle":
LLM emits flat 2-block scenes; block components compose React leaves
internally. This file captures what the full recursive version looks like and
the migration path.

---

## Why the safer middle exists today

Qwen2.5-1.5B-q4f16 (the local fallback model) is barely reliable on the
flat 2-block scene shape. The calibration WAL shows eight separate
prompt/parser/runtime fixes just to get hero + scenario rendering. Asking
the same model to emit a deeper tree multiplies the surface for failure:

- More tokens → longer streams, higher chance of `max_tokens` truncation.
- Deeper nesting → more bracket-balancing, more chance of malformed JSON.
- More sibling shapes → harder to keep the model consistent across siblings.

So today the LLM produces *flat* specs (`hero` + `scenario_block`), and we
get composition from React: each scenario block iterates its own
`events/skills/projects/etc.` array and renders a leaf component per item.

## What "recursive specs" means

A spec where any block can contain a `children: [...]` array of child block
specs, and the renderer walks the tree until it hits leaves with no
children. Example:

```jsonc
{
  "id": "exp",
  "type": "exp_timeline_vertical",
  "props": { "title": "Career so far" },
  "children": [
    {
      "id": "ev1",
      "type": "timeline_event",
      "props": { "title": "SDE II", "company": "…", "period": "…", "current": true },
      "children": [
        { "id": "ev1-tech", "type": "tech_chip_row", "props": { "items": ["React","TypeScript"] } }
      ]
    },
    { "id": "ev2", "type": "timeline_event", "props": { … } }
  ]
}
```

The benefits:

1. **The LLM picks layout per-item, not per-page.** It can decide one role
   gets a tech-chip row and another gets a code snippet.
2. **Mixed-content blocks become natural.** A single experience scene could
   have heroes, callouts, code, and pullquotes interleaved.
3. **The leaf catalogue is reusable everywhere.** A `tech_chip_row` works
   inside experience, projects, and stack — no duplication in container blocks.

## Migration path

The leaves file (`src/components/blocks/leaves.jsx`) created in calibration
entry 10 is the foundation. Each leaf is already a self-contained React
component that takes a single item shape — exactly what a recursive renderer
needs.

### Step 1 — promote leaves to first-class block types

Add registry entries for every leaf so the renderer can resolve them by
type-string just like container blocks:

```js
// registry.js
import { TimelineEvent, RoleCard, SkillTag, /* … */ } from './leaves';
registry.timeline_event   = { Component: TimelineEvent,   Skeleton: …, propsSchema: timelineEventPropsSchema, scenarios: ['*'] };
registry.skill_tag        = { Component: SkillTag,        Skeleton: …, propsSchema: skillTagPropsSchema,        scenarios: ['*'] };
// …
```

Each leaf needs its own zod `propsSchema` (extract from the existing
container-block schemas — they already define the per-item shape) plus a
`Skeleton` (a single shimmer matching the leaf's footprint).

### Step 2 — extend `SceneSpec` with `children`

In `src/lib/sceneSpec.js`, the block schema becomes:

```js
const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.object({}).passthrough(),
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
```

`z.lazy` is required for the recursive type. Cap depth (e.g. depth ≤ 3) at
schema-validation time to prevent runaway model output.

### Step 3 — recursive renderer

`SceneRenderer` walks the tree:

```jsx
function RenderBlock({ block, filled, level = 0 }) {
  const entry = getBlock(block.type);
  const Component = entry.Component;
  const Skeleton = entry.Skeleton;
  const props = filled[block.id];
  if (!props) return <Skeleton {...(block.props_preview ?? {})} />;
  if (props.fallback === 'markdown_prose') return <Fallback text={props.text} />;
  // Children render *inside* the parent component's slot via a `children` prop.
  const children = block.children?.map((c) => (
    <RenderBlock key={c.id} block={c} filled={filled} level={level + 1} />
  ));
  return <Component {...props}>{children}</Component>;
}
```

Each container block accepts `children` and decides where to slot them
(usually inside the iteration position currently held by the leaf map).
For backwards compatibility, blocks that receive a flat `events`/`skills`
prop continue to render as today; blocks that receive children render
those instead.

### Step 4 — streaming parser changes

The current parser (`src/lib/streamingParser.js`) detects:
- `theme` ready
- `blocks[]` scaffold (currently waits for length ≥ 2)
- per-block `props` complete

Recursive parser needs to additionally detect:
- per-block `children[]` scaffold (with same `length ≥ N` heuristic per parent)
- per-child `props` complete

The cleanest approach is to walk `lastObj` recursively in `takeFilledBlocks`
yielding any `(id, type, props, parent_id)` tuple seen for the first time
where props is non-empty. Renderer keeps a flat `filled[id] → props` map and
walks the tree from the top-level shell each render — no structural changes
to the event protocol.

### Step 5 — LLM prompt updates

The composer prompt in `src/lib/sceneOrchestrator.js` needs to:
- Replace per-container-block `PROPS_EXAMPLES` with per-leaf examples.
- Show one full nested example with `children` populated.
- Explicit rule: max depth N (probably 3 — hero / container / leaf).
- Bump `max_tokens` to ~1500–2000 since output is structurally bigger.

Practical risk: the small model will need either a much better fine-tune or
a step up to a 7B-class model to do this reliably. Reasonable to gate the
recursive path behind `useCustomBundle` (the fluid-trainer LoRA) — flat
specs stay as the fallback for the canonical Qwen.

### Step 6 — new prebaked specs

`src/data/prebaked.js` needs nested examples per intent so the page renders
something rich before the model loads. Hand-author 1–2 deep nestings per
intent.

## Design questions to resolve before implementing

- **Skeleton ergonomics for nested.** Does the parent skeleton render its
  own placeholders for children, or do children render their own skeletons
  once their scaffold is detected? (Probably the latter — matches the
  current per-block streaming behavior.)
- **Children animation choreography.** Stagger across the whole tree, or
  per-parent? Per-parent is cheaper to implement and visually fine.
- **Style inheritance.** Do nested children inherit parent surface styles
  (e.g., a `role_card` inside a `timeline_event` already has a card
  background) or always render on the page background? Probably the latter
  with explicit "wrap me" container blocks.
- **Schema enforcement vs prompt instruction.** Add web-llm
  `response_format.schema` once the JSON-string format works (calibration
  entry 6) — recursive schemas are exactly where small-model reliability
  drops off, so machine enforcement matters more here.

## Estimated scope

- Leaves promotion + registry + skeletons: ~1 day.
- Recursive `SceneSpec` + renderer + parser: ~1–2 days (most of the risk
  lives in the streaming parser).
- Prompt redesign + new prebaked specs + calibration loop until reliability
  matches today's flat scenes: ~1 week of iteration with the actual model.

Until then the flat-with-leaves architecture covers ~80% of the
expressiveness benefit at ~20% of the LLM-reliability cost, which is the
right trade for a model in the 1.5B class.
