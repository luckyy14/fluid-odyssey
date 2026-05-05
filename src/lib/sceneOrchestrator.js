// Scene orchestrator — slot-fill architecture (v2).
//
// Old (v1): single LLM call had to emit the full SceneSpec JSON + content.
// Failure mode: small LLM kept producing schema-invalid JSON, invented
// fields, or fell into token loops.
//
// New (v2): orchestrator owns ALL structure decisions deterministically.
//   1. Router LLM call → intent + mood (cheap, ~3s).
//   2. Random pick (with recencyRing exclusions) of:
//        hero variant, scenario block type, palette, background kind,
//        type family, density, radius, motion.
//   3. Build the SceneSpec skeleton with empty slot values.
//   4. Per-block LLM slot-fill: model emits ONLY the values for that
//      block's allowed fields (a tiny, schema-tight ask). Hero is
//      ~50 tokens, scenario block is ~150-300 tokens.
//   5. Stamp slot values into the skeleton, validate, yield events.
//
// Personality LoRA contributes Lakshay's voice in the slot values.
// Layout structure is guaranteed valid by construction (no LayoutLoRA).

import { profile, skills, experience, projects, awards, education, patent } from '../data/profile';
import { themeGenerator, hashSeed, motionForA11y } from './themeGenerator';
import { Pass1Schema } from './sceneSpec';
import { buildExclusions, pushSelection } from './recencyRing';
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
  TYPE_FAMILIES,
  DENSITIES,
  RADII,
  MOTIONS,
} from './recipes';

// ───────── Fact sheet (passed to LoRA at slot-fill time) ─────────

// Fact sheet sourced ENTIRELY from src/data/profile.js. No hardcoded strings
// here — anything that should land in the model's prompt context lives in
// profile.js (single source of truth). Update profile.js → fact sheet
// auto-updates → no orchestrator changes needed for content.
const FACT_SHEET = (() => {
  const job = experience[0];
  const skillsByCategory = skills.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(`${s.name} (${s.level})`);
    return acc;
  }, {});
  const skillsBlock = Object.entries(skillsByCategory)
    .map(([cat, list]) => `  - ${cat}: ${list.join(', ')}`)
    .join('\n');
  const awardsBlock = awards
    .map((a) => `  - ${a.name} (${a.period}) — ${a.reason}`)
    .join('\n');
  const projectsBlock = projects
    .map((p) => `  - ${p.name}: ${p.description} [tech: ${p.tech.join(', ')}]${p.github ? ` (github: ${p.github})` : ''}${p.live ? ` (live: ${p.live})` : ''}`)
    .join('\n');
  const careerBlock = job.roles
    .map((r) => `  - ${r.title} (${r.period})${r.current ? ' — CURRENT ROLE' : ''}`)
    .join('\n');
  const highlightsBlock = job.highlights
    .map((h) => `  - ${h}`)
    .join('\n');

  return `
IDENTITY:
  - Name: ${profile.name}
  - Current role: ${profile.role} at ${profile.company}
  - Location: ${profile.location}
  - Tagline: ${profile.tagline}

CONTACT (use these exact values; phone IS available):
  - Email: ${profile.email}
  - Phone: ${profile.phone}
  - LinkedIn: ${profile.linkedin}
  - GitHub: ${profile.github}

RESUME BIO (use this exact framing for "years of experience" / "what do you do" questions):
  ${profile.intro}

CAREER (all at ${job.company}):
${careerBlock}

CAREER HIGHLIGHTS (use these exact phrasings for impact/outcomes questions):
${highlightsBlock}

SKILLS (level out of 100):
${skillsBlock}

EDUCATION:
  - ${education.degree}, ${education.institution} (${education.duration}), CGPA ${education.cgpa}

PATENT:
  - ${patent.name} (Application No. ${patent.applicationNo})

AWARDS:
${awardsBlock}

PROJECTS:
${projectsBlock}

Description of current job: ${job.description}
`.trim();
})();

// ───────── Per-block slot definitions ─────────
// Mirrors src/components/blocks/*.jsx zod propsSchema.
// Each entry is the slot-fill template the LLM is asked to produce, with
// inline placeholder hints. The orchestrator stamps the parsed values into
// the SceneSpec skeleton without rewriting structure.

const BLOCK_SLOTS = {
  // Heroes: title MUST be a direct, terse answer to the visitor's question.
  // Kicker adds context, doesn't restate the title.
  hero:            '{ "title": "<direct 4-10 word answer to the question>", "kicker": "<context, NOT a restatement>" }',
  hero_quote:      '{ "title": "<the answer phrased as a short quotable line>", "kicker": "<5-10 word context>" }',
  hero_terminal:   '{ "title": "<direct answer, terse>", "kicker": "<one-line shell-style context>" }',
  hero_typewriter: '{ "title": "<direct 4-10 word answer to the question>", "kicker": "<context, NOT a restatement>" }',

  skill_tag_cloud:   '{ "skills": [ { "name": "<skill>", "category": "<group>", "level": <1-5> }, ... 6-10 entries ] }',
  skill_meter_bars:  '{ "skills": [ { "name": "<skill>", "level": <1-5> }, ... 4-7 entries ] }',

  exp_timeline_vertical: '{ "events": [ { "title": "<role>", "company": "<company>", "period": "<dates>", "description": "<one sentence>", "current": <true|false> }, ... 1-3 entries from the FACT SHEET ] }',
  exp_role_card_stack:   '{ "events": [ { "title": "<role>", "company": "<company>", "period": "<dates>", "description": "<one sentence>" }, ... 1-3 entries ] }',

  contact_card_centered:   '{ "email": "<email>", "linkedin": "<url>", "github": "<url>", "message": "<one-line note>" }',
  contact_terminal_prompt: '{ "email": "<email>", "linkedin": "<url>", "github": "<url>" }',

  proj_grid:      '{ "projects": [ { "name": "<project>", "description": "<one sentence>", "tech": ["<t1>","<t2>"], "github": "<url or omit>" }, ... 2-4 entries ] }',
  proj_spotlight: '{ "projects": [ { "name": "<project>", "description": "<two sentences>", "tech": ["<t1>","<t2>","<t3>"] } ] }',

  tech_code_block:    '{ "language": "<lang>", "code": "<short code snippet>", "caption": "<one sentence explanation>" }',
  tech_stack_layered: '{ "layers": [ { "name": "<layer>", "description": "<one line>" }, ... 3-5 entries ] }',

  out_stat_grid: '{ "stats": [ { "label": "<metric>", "value": "<number/%>", "context": "<short context>" }, ... 3-4 entries ] }',
  out_kpi_hero:  '{ "value": "<headline number>", "label": "<metric name>", "context": "<one sentence>" }',

  phil_pullquote: '{ "quote": "<one-sentence belief>", "attribution": "Lakshay" }',
  phil_manifesto: '{ "title": "<short title>", "beliefs": ["<belief 1>", "<belief 2>", "<belief 3>"] }',

  me_about_card:     '{ "name": "Lakshay Baheti", "role": "<role>", "bio": "<one or two sentences>", "location": "Pune, India" }',
  me_polaroid_intro: '{ "name": "Lakshay Baheti", "role": "<role>", "caption": "<one-line caption>" }',
};

// ───────── Keyword-first router ─────────
// Classifying intent in the LoRA was unreliable ("frontend" → personal).
// Keyword scan runs in <1ms with high precision; LLM router is only called
// when keywords are ambiguous (no match or tie at score 0).

const INTENT_KEYWORDS = {
  skills:     ['skill', 'stack', 'tech ', 'language', 'tool', 'framework', 'frontend', 'backend', 'fullstack', 'react', 'typescript', 'javascript', 'node', 'python', 'java', 'css', 'html', 'webgpu', 'know', 'comfortable with'],
  experience: ['career', 'role', 'job', 'past', 'timeline', 'journey', 'intern', 'sde', 'history', 'tenure', 'where have you', 'where do you', 'how long', 'work history', 'walk me through your', 'started', 'company'],
  contact:    ['contact', 'email', 'reach', 'linkedin', 'github', 'hire you', 'recruit', 'dm', 'how do i reach', 'how can i reach', 'message you', 'get in touch'],
  projects:   ['project', 'built', 'made', 'side', 'demo', 'repo', 'open source', 'shipped', 'fluid-odyssey', 'human keyboard', 'portfolio trainer'],
  technical:  ['architecture', 'system design', 'infra', 'migration', 'strangler', 'code', 'snippet', 'how is it built', 'how does it work', 'stack at work', 'design pattern'],
  outcomes:   ['impact', 'numbers', 'metric', 'result', 'win', 'outcome', 'performance', 'perf', 'cwv', 'core web vitals', 'seo', 'cost', 'traffic', 'faster', 'lower'],
  philosophy: ['believe', 'think about', 'approach', 'principle', 'opinion', 'philosophy', 'how do you work', 'how you work', 'productive', 'reviews', 'tests', 'remote'],
  personal:   ['about you', 'yourself', 'beyond', 'outside of code', 'hobby', 'who are you', 'tell me about yo', 'one-line bio', 'intro', 'background'],
};

const MOOD_KEYWORDS = {
  technical:  ['stack', 'architecture', 'code', 'system', 'how is', 'how does'],
  reflective: ['why', 'tell me', 'walk me', 'story', 'journey'],
  warm:       ['hi', 'hey', 'about you', 'yourself', 'beyond'],
  playful:    ['fun', 'cool', 'show me', '!'],
  direct:     ['?', 'list', 'what', 'when', 'where'],
};

function scoreIntent(q) {
  const lower = ' ' + q.toLowerCase() + ' ';
  const scores = {};
  let best = null, bestScore = 0;
  for (const [intent, kws] of Object.entries(INTENT_KEYWORDS)) {
    let s = 0;
    for (const kw of kws) if (lower.includes(kw)) s += kw.includes(' ') ? 2 : 1;
    scores[intent] = s;
    if (s > bestScore) { best = intent; bestScore = s; }
  }
  return { best, bestScore, scores };
}

function scoreMood(q) {
  const lower = ' ' + q.toLowerCase() + ' ';
  let best = 'direct', bestScore = 0;
  for (const [mood, kws] of Object.entries(MOOD_KEYWORDS)) {
    const s = kws.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (s > bestScore) { best = mood; bestScore = s; }
  }
  return best;
}

function extractKeywords(q) {
  const stop = new Set(['the','a','an','to','of','in','on','for','at','is','are','do','does','what','how','tell','me','about','you','your','can','i']);
  return q.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 5);
}

const ROUTER_PROMPT = `You are a router for ${profile.firstName}'s portfolio. Emit ONE compact JSON object:

{ "intent": one of [${INTENTS.map((i) => `"${i}"`).join(', ')}], "mood": one of [${MOODS.map((m) => `"${m}"`).join(', ')}], "keywords": [3-5 short keywords] }

JSON only.`;

// ───────── Random helpers ─────────

function pickFrom(arr, n) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.abs(n | 0) % arr.length];
}

function pickWithExclusions(pool, excluded, n) {
  const allowed = pool.filter((x) => !excluded.has(x));
  return pickFrom(allowed.length ? allowed : pool, n);
}

// Slot-fill prompt for one block.
function slotPrompt(blockType, intent, mood, question) {
  const slots = BLOCK_SLOTS[blockType] || '{ }';
  return `${FACT_SHEET}

A visitor asked: "${question}"
Intent: ${intent} | Mood: ${mood}
You are filling content for a "${blockType}" page section.

Output ONLY a JSON object with these EXACT keys, no others:
${slots}

CRITICAL RULES:
- The "title" field on a hero block MUST directly answer the visitor's question in your own words. Do NOT use generic intros when the question is specific. Examples (note the pattern, do NOT copy these phrasings):
    Q about location → title is the city + country
    Q about frameworks → title lists the actual frameworks
    Q about tenure → title gives the actual duration
- Use ONLY values from the FACT SHEET above. Do NOT invent names, locations, phone numbers, dates, companies, projects, awards, or skills.
- If the question asks for something genuinely not in the FACT SHEET, omit the field or write a short honest note. Do NOT make up a value.
- DO NOT contradict the FACT SHEET. Lakshay's location is exactly "${profile.location}".
- DO NOT emit angle-bracket placeholders like <number> or <role>. Replace them with real values from the fact sheet.
- DO NOT copy these instruction phrases verbatim into your output. Paraphrase using the actual facts.
- Start with { and end with }. No prose, no markdown, no comments.`;
}

// ───────── Slot-fill execution ─────────

async function fillSlots(engine, blockType, intent, mood, question) {
  const prompt = slotPrompt(blockType, intent, mood, question);
  const stop = devLog.heartbeat('llm', `slot-fill ${blockType}`, 3000);
  let raw;
  try {
    raw = await engine.chat.completions.create({
      messages: [{ role: 'system', content: prompt }, { role: 'user', content: question }],
      max_tokens: 400,
      temperature: 0.2,   // lowered from 0.6 — fact-bound output should be near-deterministic
    });
  } finally {
    stop();
  }
  const text = raw.choices?.[0]?.message?.content || '';
  devLog.debug('llm', `slot-fill ${blockType} raw`, devLog.preview(text, 300));
  return text;
}

// Lenient JSON extraction — strips markdown fences, quotes bare keys, finds
// the {...} substring if there's prose around it, and patches a few common
// LLM-output bugs.
function extractJson(text) {
  let s = String(text || '').trim();
  // Strip markdown fences
  s = s.replace(/^\s*```(?:json|json5)?\s*\n?/i, '');
  s = s.replace(/\n?\s*```\s*$/i, '');
  // Find the outermost {...} if model added prose
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  // Quote bare keys ({ foo: 1 } → { "foo": 1 })
  s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*):/g, '$1"$2"$3:');
  // Strip stray punctuation between a closed string and the next , or }
  //   "text". }   →   "text" }
  //   "text".,   →   "text",
  s = s.replace(/("[^"\n]*")\s*[.;]+\s*([,}\]])/g, '$1$2');
  // Strip trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s;
}

function tryParseSlots(text, fallback = {}) {
  try {
    const cleaned = extractJson(text);
    return JSON.parse(cleaned);
  } catch (err) {
    devLog.warn('llm', 'slot JSON parse failed', err?.message);
    return fallback;
  }
}

// Default values to plug in when the LoRA forgets a required field.
// Keyed by block_type, then field name. Source: profile.js fact sheet.
const SLOT_DEFAULTS = {
  hero:            { title: 'Lakshay Baheti' },
  hero_quote:      { title: 'Lakshay Baheti' },
  hero_terminal:   { title: 'Lakshay Baheti' },
  hero_typewriter: { title: 'Lakshay Baheti' },
  contact_card_centered:   { email: profile.email, phone: profile.phone, linkedin: profile.linkedin, github: profile.github },
  contact_terminal_prompt: { email: profile.email, phone: profile.phone, linkedin: profile.linkedin, github: profile.github },
  me_about_card:     { name: profile.name, role: `${profile.role} at ${profile.company}`, location: profile.location },
  me_polaroid_intro: { name: profile.name, role: `${profile.role} at ${profile.company}` },
  phil_pullquote:    { attribution: profile.firstName },
  out_kpi_hero:      { value: '90% faster', label: 'procedure execution' },
  tech_code_block:   { code: '// snippet' },
  // List-typed blocks: provide a tiny seed list so schema validation passes
  // even when the LoRA returns an empty array.
  exp_timeline_vertical: { events: [{ title: profile.role, company: profile.company, period: 'Aug 2023–present', current: true }] },
  exp_role_card_stack:   { events: [{ title: profile.role, company: profile.company, period: 'Aug 2023–present' }] },
  skill_tag_cloud:       { skills: [{ name: 'React', category: 'frontend', level: 5 }, { name: 'TypeScript', category: 'language', level: 5 }] },
  skill_meter_bars:      { skills: [{ name: 'React', level: 5 }, { name: 'TypeScript', level: 5 }] },
  proj_grid:             { projects: [{ name: 'fluid-odyssey', description: 'Adaptive in-browser-LLM portfolio.' }] },
  proj_spotlight:        { projects: [{ name: 'fluid-odyssey', description: 'Adaptive in-browser-LLM portfolio.' }] },
  tech_stack_layered:    { layers: [{ name: 'Frontend', description: 'React + Next.js + TypeScript' }] },
  out_stat_grid:         { stats: [{ label: 'Procedure execution', value: '90% faster' }] },
  phil_manifesto:        { beliefs: ['Boring tools, weird products.', 'Performance is a feature.'] },
};

// True if value is "empty" for our purposes — null/empty string/empty array,
// OR an obvious LoRA placeholder like "<number>" / "<role>" / "..." that
// shouldn't render as page content.
function isEmptyOrPlaceholder(v) {
  if (v == null || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '' || trimmed === '...' || trimmed === '…') return true;
    if (/^<[^>]{1,40}>$/.test(trimmed)) return true;   // <number>, <ROLE>, etc.
  }
  return false;
}

function fillDefaults(blockType, parsed) {
  const defaults = SLOT_DEFAULTS[blockType] || {};
  const merged = { ...parsed };
  // Strip placeholder values from anywhere in the merged object so defaults can fill them.
  for (const k of Object.keys(merged)) {
    if (isEmptyOrPlaceholder(merged[k])) delete merged[k];
  }
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in merged)) merged[k] = v;
  }
  return merged;
}

// ───────── Main generator ─────────

export async function* generateScene({ question, engine }) {
  // Random per question; permalink-stable because seed is persisted with spec.
  const seed = hashSeed(question + ':' + Date.now() + ':' + Math.random());
  devLog.group('scene', `generateScene "${question.slice(0, 60)}"`);
  devLog.info('scene', 'seed', seed);

  // ───────── Pass 1: router ─────────
  // Keyword router runs first (instant + accurate). LLM router is only
  // called when keywords are ambiguous (zero matches across all intents).
  const kw = scoreIntent(question);
  let route;
  if (kw.bestScore > 0) {
    route = {
      intent: kw.best,
      mood: scoreMood(question),
      keywords: extractKeywords(question),
      layout_seed: seed,
    };
    devLog.info('scene', 'router (keyword)', { ...route, scores: kw.scores });
  } else {
    devLog.info('llm', 'pass 1 (router LLM) → request — keyword classifier ambiguous', { max_tokens: 100 });
    const stopP1 = devLog.heartbeat('llm', 'pass 1 awaiting response', 3000);
    let pass1Raw;
    try {
      pass1Raw = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: ROUTER_PROMPT },
          { role: 'user', content: question },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });
    } finally {
      stopP1();
    }
    const pass1Text = pass1Raw.choices[0].message.content;
    devLog.debug('llm', 'pass 1 raw', devLog.preview(pass1Text, 200));
    try { route = Pass1Schema.parse(JSON.parse(extractJson(pass1Text))); }
    catch (err) {
      devLog.warn('llm', 'pass 1 parse failed — falling back to personal/warm', err?.message);
      route = { intent: 'personal', mood: 'warm', keywords: [question.slice(0, 24)], layout_seed: seed };
    }
    devLog.info('llm', 'pass 1 route', route);
  }

  // ───────── Random structural decisions ─────────
  const exclusions = buildExclusions(route.intent);
  const isLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const palettePool = (isLight ? LIGHT_PALETTES : DARK_PALETTES).filter((p) => PALETTES.includes(p));
  const bgPool = BG_ROSTER[route.intent] || BG_KINDS;
  const typePool = TYPE_ROSTER[route.intent] || TYPE_FAMILIES;

  const heroType     = pickWithExclusions(HERO_VARIANTS, exclusions.hero, seed);
  const scenarioType = pickWithExclusions(INTENT_BLOCKS[route.intent] || ['me_about_card'], exclusions.scenarioBlock, seed >> 4);
  const paletteName  = pickWithExclusions(palettePool, exclusions.palette, seed >> 8);
  const bgKind       = pickWithExclusions(bgPool, exclusions.bg, seed >> 12);
  const typeFamily   = pickFrom(typePool, seed >> 16);
  const density      = pickFrom(DENSITIES, seed >> 20);
  const radius       = pickFrom(RADII, seed >> 24);
  const motion       = motionForA11y(pickFrom(MOTIONS, seed >> 28));

  devLog.info('scene', 'random picks', {
    hero: heroType, scenario: scenarioType, palette: paletteName, bg: bgKind,
    type: typeFamily, density, radius, motion,
  });

  // ───────── Theme + skeleton (all yielded immediately) ─────────
  const theme = themeGenerator({
    palette_name: paletteName, type_family: typeFamily, density, radius, motion,
    bg_kind: bgKind, seed,
  });
  devLog.info('phase', 'theme_hint', { palette: paletteName, bg: bgKind });
  yield { type: 'theme_hint', theme };
  yield { type: 'theme_ready', theme };

  const shellBlocks = [
    { id: 'h', type: heroType, props_preview: {} },
    { id: 'b', type: scenarioType, props_preview: {} },
  ];
  devLog.info('phase', 'shell', { layout: 'random', blocks: shellBlocks.map((b) => `${b.id}:${b.type}`) });
  yield { type: 'shell', layout: 'random', blocks: shellBlocks };

  // ───────── Slot-fill each block ─────────
  const filledBlocks = [];

  // Hero first (smaller, faster).
  const heroRaw = await fillSlots(engine, heroType, route.intent, route.mood, question);
  const heroSlots = fillDefaults(heroType, tryParseSlots(heroRaw, { title: route.keywords?.[0] || question.slice(0, 60), kicker: route.intent }));
  devLog.info('phase', `block_filled h:${heroType}`, heroSlots);
  const heroEvent = emitBlock({ id: 'h', type: heroType, props: heroSlots });
  filledBlocks.push({ id: 'h', type: heroType, props: heroEvent.props });
  yield heroEvent;

  // Then the scenario block.
  const scenarioRaw = await fillSlots(engine, scenarioType, route.intent, route.mood, question);
  const scenarioSlots = fillDefaults(scenarioType, tryParseSlots(scenarioRaw, {}));
  devLog.info('phase', `block_filled b:${scenarioType}`, scenarioSlots);
  const scenarioEvent = emitBlock({ id: 'b', type: scenarioType, props: scenarioSlots });
  filledBlocks.push({ id: 'b', type: scenarioType, props: scenarioEvent.props });
  yield scenarioEvent;

  // ───────── Persist + done ─────────
  const requestId = `r${(seed >>> 0).toString(16).slice(0, 7)}`;
  const finalSpec = {
    request_id: requestId,
    seed,
    intent: route.intent,
    mood: route.mood,
    theme: {
      palette_name: paletteName,
      type_family: typeFamily,
      density,
      radius,
      motion,
      background: { kind: bgKind },
    },
    layout: 'random',
    blocks: filledBlocks,
  };
  pushSelection({ palette: paletteName, bg: bgKind, hero: heroType, scenarioBlock: scenarioType });
  persistSpec(finalSpec).catch((err) => devLog.warn('scene', 'persistSpec failed', err));
  devLog.info('phase', 'done', { request_id: requestId, blocks: 2 });
  devLog.groupEnd();
  yield { type: 'done', request_id: requestId };
}

// ───────── Block emit helper (validates props against zod schema) ─────────

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
