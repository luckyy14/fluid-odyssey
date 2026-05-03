import { profile, skills, experience, projects, awards } from '../data/profile';
import { themeGenerator, hashSeed, motionForA11y, defaultTypeFor } from './themeGenerator';
import { Pass1Schema } from './sceneSpec';
import { buildExclusions, pushSelection } from './recencyRing';
import { createPartialJsonParser } from './streamingParser';
import { persistSpec } from './specCache';
import { getBlock } from '../components/blocks/registry';
import {
  INTENTS,
  MOODS,
  PALETTES,
  BG_KINDS,
  HERO_VARIANTS,
  INTENT_BLOCKS,
  TYPE_ROSTER,
  BG_ROSTER,
  LIGHT_PALETTES,
  DARK_PALETTES,
  MOOD_BIAS,
  TYPE_FAMILIES,
  DENSITIES,
  RADII,
  MOTIONS,
} from './recipes';

const FACT_SHEET = (() => {
  const a = awards.slice(0, 3).map((x) => `${x.name} (${x.period})`).join(', ');
  return `
Identity: ${profile.name}, ${profile.role} at ${profile.company} in ${profile.location}.
Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github}.
Career: ${experience[0].roles.map((r) => r.title + ' (' + r.period + ')').join(' → ')} at ${experience[0].company}.
Stack: ${skills.map((s) => s.name).join(', ')}.
Awards: ${a}.
Projects: ${projects.map((p) => p.name + ': ' + p.description).join(' | ')}.
Highlights: 90% faster procedure exec via Strangler migration of 500k LOC; 60% faster deploys; 80% lower CDN cost; 12× traffic; OCR shortfalls 26%→11%; Core Web Vitals +30%; SEO page 10→1.
`.trim();
})();

const ROUTER_PROMPT = `You are a routing layer for ${profile.firstName}'s adaptive portfolio. Read the visitor's question and emit ONE compact JSON object with this exact shape:

{
  "intent": one of [${INTENTS.map((i) => `"${i}"`).join(', ')}],
  "mood":   one of [${MOODS.map((m) => `"${m}"`).join(', ')}],
  "keywords": [3-5 short noun-phrase keywords],
  "layout_seed": <integer>,
  "theme_hint": { "palette_name": one of [${PALETTES.map((p) => `"${p}"`).join(', ')}], "bg_kind": one of [${BG_KINDS.map((b) => `"${b}"`).join(', ')}] }
}

No prose. JSON only. Pick intent that best matches the question (skills/experience/contact/projects/technical/outcomes/philosophy/personal).`;

function composerPrompt(intent, exclusions) {
  const heros = HERO_VARIANTS.filter((h) => !exclusions.hero.has(h));
  const blocks = (INTENT_BLOCKS[intent] || []).filter((b) => !exclusions.scenarioBlock.has(b));
  const palettes = PALETTES.filter((p) => !exclusions.palette.has(p));
  const bgs = (BG_ROSTER[intent] || BG_KINDS).filter((b) => !exclusions.bg.has(b));
  const types = TYPE_ROSTER[intent] || TYPE_FAMILIES;

  const heroSchema = `{ "id":"h", "type": one of [${heros.map((h) => `"${h}"`).join(', ')}], "props_preview": {}, "props": { "title": <string ≤120>, "kicker": <string ≤60 optional> } }`;
  const blockSchemaHints = blocks.map((b) => `"${b}"`).join(', ');

  return `You compose a JSON page for ${profile.firstName}'s portfolio. Read the user's question, pick a theme, pick blocks from the allowed set, and fill them with TRUE facts.

ABOUT ${profile.firstName.toUpperCase()} (use ONLY these facts):
${FACT_SHEET}

Output a SINGLE JSON object — no prose, no markdown — with this exact shape (in this key order):

{
  "request_id": <8-char hex string>,
  "seed": <integer>,
  "intent": "${intent}",
  "mood": one of [${MOODS.map((m) => `"${m}"`).join(', ')}],
  "theme": {
    "palette_name": one of [${palettes.map((p) => `"${p}"`).join(', ')}],
    "type_family":  one of [${types.map((t) => `"${t}"`).join(', ')}],
    "density":      one of [${DENSITIES.map((d) => `"${d}"`).join(', ')}],
    "radius":       one of [${RADII.map((r) => `"${r}"`).join(', ')}],
    "motion":       one of [${MOTIONS.map((m) => `"${m}"`).join(', ')}],
    "background":   { "kind": one of [${bgs.map((b) => `"${b}"`).join(', ')}] }
  },
  "layout": <one short identifier string>,
  "blocks": [
    ${heroSchema},
    { "id":"b", "type": one of [${blockSchemaHints}], "props_preview": <object with relevant counts>, "props": <object matching the chosen block's required props> }
  ]
}

Block prop hints:
- skill_tag_cloud: { skills: [{name, category, level?}] }     ; props_preview: { tile_count: <int> }
- skill_meter_bars: { skills: [{name, level}] }               ; props_preview: { bullet_count: <int> }
- exp_timeline_vertical / exp_role_card_stack: { events: [{title, company, period, description?, current?}] } ; props_preview: { event_count: <int> }
- contact_card_centered / contact_terminal_prompt: { email, phone?, linkedin?, github?, message? }
- proj_grid: { projects: [{name, description, tech?, github?, live?}] } ; props_preview: { tile_count: <int> }
- proj_spotlight: { projects: [<single project>] }
- tech_code_block: { language, code, caption? }
- tech_stack_layered: { layers: [{name, description?}] }      ; props_preview: { bullet_count: <int> }
- out_stat_grid: { stats: [{label, value, context?}] }        ; props_preview: { tile_count: <int> }
- out_kpi_hero: { value, label, context? }
- phil_pullquote: { quote, attribution? }
- phil_manifesto: { title?, beliefs: [<string>] }             ; props_preview: { bullet_count: <int> }
- me_about_card: { name, role?, bio?, location? }
- me_polaroid_intro: { name, role?, caption? }

JSON ONLY.`;
}

/**
 * Two-pass generator. Yields events:
 *   { type: 'theme_hint',  theme }
 *   { type: 'theme_ready', theme }
 *   { type: 'shell',       layout, blocks }
 *   { type: 'block_filled', id, props }
 *   { type: 'done' }
 */
export async function* generateScene({ question, engine }) {
  const seed = hashSeed(question + ':' + Date.now() + ':' + Math.random());

  // ───────── Pass 1 ─────────
  const pass1Raw = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: ROUTER_PROMPT },
      { role: 'user', content: question },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 160,
    temperature: 0.3,
  });

  let route;
  try { route = Pass1Schema.parse(JSON.parse(pass1Raw.choices[0].message.content)); }
  catch {
    // Soft fallback: best-effort intent guess so we still emit something useful.
    route = { intent: 'personal', mood: 'warm', keywords: [question.slice(0, 24)], layout_seed: seed };
  }

  // Filter palette by user's prefers-color-scheme.
  const isLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const allowedPaletteSet = new Set(isLight ? LIGHT_PALETTES : DARK_PALETTES);
  if (route.theme_hint && !allowedPaletteSet.has(route.theme_hint.palette_name)) {
    const fallback = (isLight ? LIGHT_PALETTES : DARK_PALETTES)[0];
    route.theme_hint = { palette_name: fallback, bg_kind: route.theme_hint.bg_kind };
  }

  // Precompute theme from hint immediately (parallel with pass 2 below).
  let precomputedTheme = null;
  if (route.theme_hint) {
    precomputedTheme = themeGenerator({
      palette_name: route.theme_hint.palette_name,
      type_family: defaultTypeFor(route.intent),
      density: 'normal',
      radius: 'soft',
      motion: motionForA11y('subtle'),
      bg_kind: route.theme_hint.bg_kind,
      seed,
    });
    yield { type: 'theme_hint', theme: precomputedTheme };
  }

  // ───────── Pass 2 ─────────
  const exclusions = buildExclusions(route.intent);
  const stream = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: composerPrompt(route.intent, exclusions) },
      { role: 'user', content: `Question: ${question}\nIntent: ${route.intent}\nMood: ${route.mood}\nSeed: ${seed}\nKeywords: ${route.keywords.join(', ')}\n\nReturn the JSON object now.` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.7,
    stream: true,
  });

  const parser = createPartialJsonParser();

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (!delta) continue;
    parser.feed(delta);

    if (parser.hasTheme()) {
      const themeNames = parser.takeTheme();
      const sameAsHint = precomputedTheme && precomputedTheme.input.palette_name === themeNames.palette_name && precomputedTheme.input.bg_kind === themeNames.bg_kind;
      const finalTheme = sameAsHint
        ? precomputedTheme
        : themeGenerator({
            palette_name: themeNames.palette_name,
            type_family: themeNames.type_family,
            density: themeNames.density,
            radius: themeNames.radius,
            motion: motionForA11y(themeNames.motion),
            bg_kind: themeNames.bg_kind,
            seed,
          });
      yield { type: 'theme_ready', theme: finalTheme };
    }

    if (parser.hasBlockScaffold()) {
      yield { type: 'shell', layout: parser.takeLayout(), blocks: parser.takeBlockScaffold() };
    }

    for (const filled of parser.takeFilledBlocks()) {
      yield emitBlock(filled);
    }
  }

  // Final flush — anything not detected mid-stream.
  if (!parser.finalSpec()?.theme) {
    // No theme arrived at all — yield the precomputed one (or a default) so the page is at least themed.
    const fallbackTheme = precomputedTheme || themeGenerator({
      palette_name: isLight ? 'paper' : 'ink',
      type_family: defaultTypeFor(route.intent),
      density: 'normal', radius: 'soft', motion: motionForA11y('subtle'),
      bg_kind: 'noise', seed,
    });
    yield { type: 'theme_ready', theme: fallbackTheme };
  }
  for (const filled of parser.finalFlushBlocks()) {
    yield emitBlock(filled);
  }

  // Persist & update ring buffer.
  const final = parser.finalSpec();
  if (final?.theme && Array.isArray(final?.blocks)) {
    const heroBlock = final.blocks.find((b) => HERO_VARIANTS.includes(b.type));
    const scenarioBlock = final.blocks.find((b) => INTENT_BLOCKS[route.intent]?.includes(b.type));
    pushSelection({
      palette: final.theme.palette_name,
      bg: final.theme.background?.kind,
      hero: heroBlock?.type,
      scenarioBlock: scenarioBlock?.type,
    });
    final.request_id = final.request_id || `r${seed.toString(16).slice(0, 7)}`;
    final.seed = final.seed || seed;
    final.intent = final.intent || route.intent;
    final.mood = final.mood || route.mood;
    persistSpec(final).catch(() => {});
    yield { type: 'done', request_id: final.request_id };
    return;
  }

  yield { type: 'done' };
}

function emitBlock(filled) {
  const entry = getBlock(filled.type);
  const v = entry.propsSchema.safeParse(filled.props);
  if (v.success) {
    return { type: 'block_filled', id: filled.id, props: v.data };
  }
  return {
    type: 'block_filled',
    id: filled.id,
    props: { fallback: 'markdown_prose', text: stringifyShallow(filled.props) },
  };
}

function stringifyShallow(o) {
  try {
    if (typeof o === 'string') return o;
    const parts = [];
    for (const [k, v] of Object.entries(o || {})) {
      if (typeof v === 'string') parts.push(`${k}: ${v}`);
      else if (Array.isArray(v)) parts.push(`${k}: ${v.map((x) => (typeof x === 'string' ? x : x?.name || JSON.stringify(x))).join(', ')}`);
      else parts.push(`${k}: ${JSON.stringify(v)}`);
    }
    return parts.join('\n\n');
  } catch { return 'Could not render this section.'; }
}
