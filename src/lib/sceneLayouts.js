// Scene-level layout strategies + per-block frame variants. The renderer
// picks one layout strategy per scene (deterministic from the seed so the
// same permalink always looks the same) and one frame variant per block.
// Purely visual — no LLM/spec change required. Goal: every scene reads
// differently even though the underlying blocks are the same components.

// Strategy catalog — each is a distinct way to arrange the scene.
// Inspirations in comments link to the design pattern they evoke.
const LAYOUT_STRATEGIES = [
  'editorial',         // magazine narrow column (NYT, Medium long-form)
  'split',             // 2-col grid (Linear, Vercel docs)
  'bleed',             // alternating full-bleed (Stripe homepage)
  'mosaic',            // asymmetric widths (Awwwards portfolio sites)
  'stack',             // simple vertical (default)
  'bento',             // varied grid tiles (Apple iOS bento, raycast.com)
  'polaroid_scatter',  // photo-album rotation (Pinterest/Tumblr)
  'brutalist',         // bold borders + offset shadows (Brutalist Web Design)
  'newspaper',         // serif columns w/ drop cap (NYT print)
];

const FRAME_VARIANTS = [
  'clean',             // no chrome
  'numbered',          // oversized leading numeral
  'ruled',             // accent rule on top
  'markered',          // left accent border bar
  'tinted',            // gradient pad backdrop
  'cutout',            // asymmetric corner radii
  'polaroid',          // white photo-frame + rotation + drop shadow
  'sticky_note',       // pastel rotation + folded corner (Post-it)
  'terminal_window',   // macOS title bar w/ traffic lights
  'brutalist_box',     // hard border + solid offset shadow (no radius)
];

// Some intents prefer specific strategies. Bento for multi-stat outcomes;
// newspaper for philosophy / personal long-prose; brutalist for technical;
// polaroid for personal warmth. Lists are biased pools (duplicates allowed
// to weight common picks).
const INTENT_BIAS = {
  philosophy: ['newspaper', 'editorial', 'editorial', 'bleed'],
  outcomes:   ['bento', 'mosaic', 'split', 'bento'],
  contact:    ['polaroid_scatter', 'editorial', 'brutalist'],
  technical:  ['brutalist', 'split', 'mosaic'],
  experience: ['bleed', 'split', 'mosaic', 'bento'],
  projects:   ['bento', 'mosaic', 'split'],
  skills:     ['mosaic', 'bento', 'editorial'],
  personal:   ['polaroid_scatter', 'newspaper', 'editorial', 'bleed'],
};

// Hero blocks look best with restrained chrome (the headline carries the
// page). Scenario blocks can take the louder treatments.
const HERO_FRAMES     = ['clean', 'ruled', 'cutout', 'terminal_window'];
const SCENARIO_FRAMES = ['numbered', 'markered', 'tinted', 'cutout', 'clean', 'ruled', 'polaroid', 'sticky_note', 'brutalist_box'];

function pickFrom(arr, n) {
  return arr[Math.abs(n) % arr.length];
}

export function pickLayoutStrategy(seed, intent) {
  const pool = INTENT_BIAS[intent] || LAYOUT_STRATEGIES;
  return pickFrom(pool, (seed | 0));
}

export function pickFrameVariant(seed, index, isHero) {
  const pool = isHero ? HERO_FRAMES : SCENARIO_FRAMES;
  // Mix seed + index so siblings get different variants.
  return pickFrom(pool, ((seed | 0) ^ (index * 2654435761)) | 0);
}

export { LAYOUT_STRATEGIES, FRAME_VARIANTS };

// Helper: choose layout + frame variants for a whole scene at once.
export function chooseSceneLook({ seed, intent, blocks }) {
  const layoutStrategy = pickLayoutStrategy(seed, intent);
  const frames = (blocks || []).map((b, i) => {
    const isHero = b.id === 'h' || /^hero/.test(b.type || '');
    return { id: b.id, variant: pickFrameVariant(seed, i, isHero), isHero };
  });
  return { layoutStrategy, frames };
}
