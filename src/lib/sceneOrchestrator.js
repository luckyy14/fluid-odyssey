import { profile, skills, experience, projects, awards } from '../data/profile';
import { themeGenerator, hashSeed, motionForA11y, defaultTypeFor } from './themeGenerator';
import { Pass1Schema } from './sceneSpec';
import { buildExclusions, pushSelection } from './recencyRing';
import { createPartialJsonParser } from './streamingParser';
import { persistSpec } from './specCache';
import { devLog } from './devLog';
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

// Per-block concrete `props` examples. Small models follow inline examples
// far more reliably than abstract "{name, level?}" hints.
// SHAPE-ONLY examples. Use <ANGLE_BRACKET_TAGS> for every field the model must
// generate — the brackets signal "placeholder, fill from FACT SHEET", and the
// model is far less likely to copy them verbatim than to copy a realistic
// sentence. Stable real values (urls, fixed identifiers) stay literal.
const PROPS_EXAMPLES = {
  skill_tag_cloud:         '{ "skills": [{ "name": "<SKILL_NAME>", "category": "<CATEGORY>", "level": <0-5> }] }',
  skill_meter_bars:        '{ "skills": [{ "name": "<SKILL_NAME>", "level": <0-5> }] }',
  exp_timeline_vertical:   '{ "events": [{ "title": "<JOB_TITLE>", "company": "<COMPANY>", "period": "<DATE_RANGE>", "description": "<ONE_SENTENCE_IMPACT>", "current": <true|false> }] }',
  exp_role_card_stack:     '{ "events": [{ "title": "<JOB_TITLE>", "company": "<COMPANY>", "period": "<DATE_RANGE>", "description": "<ONE_SENTENCE_IMPACT>" }] }',
  contact_card_centered:   '{ "email": "lakshayb.work@gmail.com", "linkedin": "https://www.linkedin.com/in/lakshay-baheti", "github": "https://github.com/luckyy14", "message": "<ONE_LINE_NOTE_TO_VISITOR>" }',
  contact_terminal_prompt: '{ "email": "lakshayb.work@gmail.com", "linkedin": "https://www.linkedin.com/in/lakshay-baheti", "github": "https://github.com/luckyy14" }',
  proj_grid:               '{ "projects": [{ "name": "<PROJECT_NAME>", "description": "<ONE_SENTENCE>", "tech": ["<TECH_1>","<TECH_2>"], "github": "<URL_OR_OMIT>" }] }',
  proj_spotlight:          '{ "projects": [{ "name": "<PROJECT_NAME>", "description": "<TWO_SENTENCES>", "tech": ["<TECH_1>","<TECH_2>"] }] }',
  tech_code_block:         '{ "language": "<LANG>", "code": "<CODE_SNIPPET>", "caption": "<ONE_SENTENCE_EXPLANATION>" }',
  tech_stack_layered:      '{ "layers": [{ "name": "<LAYER_NAME>", "description": "<ONE_LINE>" }] }',
  out_stat_grid:           '{ "stats": [{ "label": "<METRIC_LABEL>", "value": "<NUMBER_OR_PCT>", "context": "<SHORT_CONTEXT>" }] }',
  out_kpi_hero:            '{ "value": "<NUMBER_OR_PCT>", "label": "<METRIC_LABEL>", "context": "<ONE_SENTENCE>" }',
  phil_pullquote:          '{ "quote": "<ONE_SENTENCE_BELIEF>", "attribution": "Lakshay" }',
  phil_manifesto:          '{ "title": "<SHORT_TITLE>", "beliefs": ["<BELIEF_1>", "<BELIEF_2>"] }',
  me_about_card:           '{ "name": "Lakshay Baheti", "role": "<ROLE>", "bio": "<ONE_OR_TWO_SENTENCES>", "location": "<CITY>" }',
  me_polaroid_intro:       '{ "name": "Lakshay Baheti", "role": "<ROLE>", "caption": "<ONE_LINE>" }',
};

const HERO_PROPS_EXAMPLE = '{ "title": "<headline answering the question>", "kicker": "<one-line subtitle>" }';

function composerPrompt(intent, exclusions) {
  const heros = HERO_VARIANTS.filter((h) => !exclusions.hero.has(h));
  const blocks = (INTENT_BLOCKS[intent] || []).filter((b) => !exclusions.scenarioBlock.has(b));
  const palettes = PALETTES.filter((p) => !exclusions.palette.has(p));
  const bgs = (BG_ROSTER[intent] || BG_KINDS).filter((b) => !exclusions.bg.has(b));
  const types = TYPE_ROSTER[intent] || TYPE_FAMILIES;

  const blockExamples = blocks
    .map((b) => `  • ${b}: ${PROPS_EXAMPLES[b] || '{ }'}`)
    .join('\n');

  return `You compose a JSON page for ${profile.firstName}'s portfolio. Read the user's question, pick a theme, pick ONE hero + ONE scenario block, and fill them with TRUE facts.

ABOUT ${profile.firstName.toUpperCase()} (use ONLY these facts):
${FACT_SHEET}

Output a SINGLE JSON object — no prose, no markdown — with this exact shape:

{
  "request_id": "<8-char hex>",
  "seed": <integer>,
  "intent": "${intent}",
  "mood": "<one of: ${MOODS.join(', ')}>",
  "theme": {
    "palette_name": "<one of: ${palettes.join(', ')}>",
    "type_family":  "<one of: ${types.join(', ')}>",
    "density":      "<one of: ${DENSITIES.join(', ')}>",
    "radius":       "<one of: ${RADII.join(', ')}>",
    "motion":       "<one of: ${MOTIONS.join(', ')}>",
    "background":   { "kind": "<one of: ${bgs.join(', ')}>" }
  },
  "layout": "<short identifier>",
  "blocks": [
    { "id": "h", "type": "<one of: ${heros.join(', ')}>", "props": ${HERO_PROPS_EXAMPLE} },
    { "id": "b", "type": "<one of: ${blocks.join(', ')}>", "props": <see examples below> }
  ]
}

Concrete \`props\` shape per block-type (copy the shape exactly, fill with real facts):
${blockExamples}

CRITICAL OUTPUT RULES:
- Output ONLY the raw JSON object. No prose, no explanation, no comments (no //, no /* */).
- Do NOT wrap the JSON in markdown fences. Start with { and end with }.
- Use double-quotes for ALL keys and string values.
- "background" MUST be an object: { "kind": "<value>" }. NEVER a bare string.
- BOTH blocks MUST be present and have non-empty "props". The hero "props" MUST contain at least "title".
- The hero/block examples above show the SHAPE only — fill values from the FACT SHEET and the user's question, do NOT copy the placeholder text.
- Do NOT include a "props_preview" key.`;
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
  devLog.group('scene', `generateScene "${question.slice(0, 60)}"`);
  devLog.info('scene', 'seed', seed);

  // ───────── Pass 1 ─────────
  devLog.info('llm', 'pass 1 (router) → request', {
    prompt_chars: ROUTER_PROMPT.length + question.length,
    max_tokens: 160,
    temperature: 0.3,
  });
  const stopP1 = devLog.heartbeat('llm', 'pass 1 awaiting response', 3000);
  let pass1Raw;
  try {
    pass1Raw = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: ROUTER_PROMPT },
        { role: 'user', content: question },
      ],
    max_tokens: 160,
      temperature: 0.3,
    });
  } finally {
    stopP1();
  }
  const pass1Text = pass1Raw.choices[0].message.content;
  const usage1 = pass1Raw.usage || {};
  devLog.info('llm', 'pass 1 ✓', {
    completion_tokens: usage1.completion_tokens,
    prompt_tokens: usage1.prompt_tokens,
    finish_reason: pass1Raw.choices[0].finish_reason,
  });
  devLog.debug('llm', 'pass 1 raw', devLog.preview(pass1Text, 200));

  let route;
  try { route = Pass1Schema.parse(JSON.parse(pass1Text)); }
  catch (err) {
    devLog.warn('llm', 'pass 1 parse failed — falling back to personal/warm', err?.message);
    route = { intent: 'personal', mood: 'warm', keywords: [question.slice(0, 24)], layout_seed: seed };
  }
  devLog.info('llm', 'pass 1 route', route);

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
    devLog.info('phase', 'theme_hint', { palette: route.theme_hint.palette_name, bg: route.theme_hint.bg_kind });
    yield { type: 'theme_hint', theme: precomputedTheme };
  } else {
    devLog.warn('phase', 'no theme_hint emitted — pass 1 omitted theme_hint');
  }

  // ───────── Pass 2 ─────────
  const exclusions = buildExclusions(route.intent);
  devLog.info('llm', 'pass 2 (composer) → stream request', {
    intent: route.intent,
    excluded: {
      hero: [...exclusions.hero],
      scenarioBlock: [...exclusions.scenarioBlock],
      palette: [...exclusions.palette],
      bg: [...exclusions.bg],
    },
  });
  const stopP2Open = devLog.heartbeat('llm', 'pass 2 awaiting first chunk', 3000);
  const pass2Start = performance.now();
  const stream = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: composerPrompt(route.intent, exclusions) },
      { role: 'user', content: `Question: ${question}\nIntent: ${route.intent}\nMood: ${route.mood}\nSeed: ${seed}\nKeywords: ${route.keywords.join(', ')}\n\nReturn the JSON object now.` },
    ],
max_tokens: 800,
    temperature: 0.7,
    stream: true,
  });

  const parser = createPartialJsonParser();
  let chunkCount = 0;
  let totalChars = 0;
  let firstChunkTime = 0;
  let lastProgressLog = performance.now();

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (!delta) continue;
    chunkCount++;
    totalChars += delta.length;

    if (chunkCount === 1) {
      stopP2Open();
      firstChunkTime = performance.now();
      devLog.info('llm', `pass 2 first chunk (TTFT ${((firstChunkTime - pass2Start) / 1000).toFixed(2)}s)`);
    }

    // Throughput log every ~1.5s of streaming.
    const now = performance.now();
    if (now - lastProgressLog > 1500) {
      const secs = (now - firstChunkTime) / 1000;
      const cps = secs > 0 ? Math.round(totalChars / secs) : 0;
      devLog.debug('llm', `pass 2 streaming… ${chunkCount} chunks, ${totalChars} chars (${cps} ch/s)`);
      lastProgressLog = now;
    }

    parser.feed(delta);

    if (parser.hasTheme()) {
      const themeNames = parser.takeTheme();
      const sameAsHint = precomputedTheme && precomputedTheme.input.palette_name === themeNames.palette_name && precomputedTheme.input.bg_kind === themeNames.bg_kind;
      devLog.info('phase', 'theme_ready', { ...themeNames, reused_hint: sameAsHint });
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
      const layout = parser.takeLayout();
      const blocks = parser.takeBlockScaffold();
      devLog.info('phase', 'shell', { layout, blocks: blocks.map((b) => `${b.id}:${b.type}`) });
      yield { type: 'shell', layout, blocks };
    }

    for (const filled of parser.takeFilledBlocks()) {
      devLog.info('phase', `block_filled ${filled.id}:${filled.type}`, filled.props);
      yield emitBlock(filled);
    }
  }
  const pass2End = performance.now();
  const ttft = firstChunkTime ? ((firstChunkTime - pass2Start) / 1000).toFixed(2) : 'n/a';
  const streamSecs = firstChunkTime ? ((pass2End - firstChunkTime) / 1000).toFixed(2) : '0';
  const avgCps = firstChunkTime ? Math.round(totalChars / ((pass2End - firstChunkTime) / 1000)) : 0;
  devLog.info('llm', `pass 2 ✓ stream closed`, {
    chunks: chunkCount,
    chars: totalChars,
    ttft_s: ttft,
    stream_s: streamSecs,
    avg_ch_per_s: avgCps,
  });
  const rawBuf = parser.rawBuffer();
  devLog.debug('llm', 'pass 2 raw buffer', rawBuf);
  const finalParsed = parser.finalSpec();
  devLog.debug('llm', 'pass 2 parsed keys', {
    top_keys: finalParsed ? Object.keys(finalParsed) : null,
    has_theme: !!finalParsed?.theme,
    theme_keys: finalParsed?.theme ? Object.keys(finalParsed.theme) : null,
    blocks_count: Array.isArray(finalParsed?.blocks) ? finalParsed.blocks.length : null,
    blocks_summary: Array.isArray(finalParsed?.blocks)
      ? finalParsed.blocks.map((b) => ({ id: b?.id, type: b?.type, has_props: !!b?.props }))
      : null,
  });

  // Final flush — anything not detected mid-stream.
  if (!parser.finalSpec()?.theme) {
    devLog.warn('phase', 'no theme in stream — emitting fallback theme_ready');
    const fallbackTheme = precomputedTheme || themeGenerator({
      palette_name: isLight ? 'paper' : 'ink',
      type_family: defaultTypeFor(route.intent),
      density: 'normal', radius: 'soft', motion: motionForA11y('subtle'),
      bg_kind: 'noise', seed,
    });
    yield { type: 'theme_ready', theme: fallbackTheme };
  }
  const flushed = parser.finalFlushBlocks();
  if (flushed.length) devLog.debug('phase', `final flush — ${flushed.length} block(s)`);
  for (const filled of flushed) {
    devLog.info('phase', `block_filled (flush) ${filled.id}:${filled.type}`, filled.props);
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
    persistSpec(final).catch((err) => devLog.warn('scene', 'persistSpec failed', err));
    devLog.info('phase', 'done', { request_id: final.request_id, blocks: final.blocks.length });
    devLog.groupEnd();
    yield { type: 'done', request_id: final.request_id };
    return;
  }

  devLog.warn('phase', 'done — incomplete spec (no theme or blocks)');
  devLog.groupEnd();
  yield { type: 'done' };
}

function emitBlock(filled) {
  const entry = getBlock(filled.type);
  const v = entry.propsSchema.safeParse(filled.props);
  if (v.success) {
    return { type: 'block_filled', id: filled.id, blockType: filled.type, props: v.data };
  }
  devLog.warn('scene', `block "${filled.type}" props failed schema — falling back to markdown_prose`, v.error?.issues);
  return {
    type: 'block_filled',
    id: filled.id,
    blockType: 'markdown_prose',
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
