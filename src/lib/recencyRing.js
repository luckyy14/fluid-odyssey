import { PALETTES, BG_KINDS, HERO_VARIANTS, INTENT_BLOCKS } from './recipes';

const KEY = 'fluid:recency';
const SIZE = 10;

function read() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, SIZE) : [];
  } catch {
    return [];
  }
}

function write(buf) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(buf.slice(0, SIZE))); } catch { /* quota */ }
}

/**
 * Build per-dimension exclusion sets, with the fallback rule: if exclusion
 * would empty the available pool for a dimension, drop the oldest entry for
 * THAT dimension only so the pool always has at least one option.
 *
 * @param {string} [intent] — used to size scenario_block pool; if absent, all blocks across all intents are eligible.
 * @returns {{palette:Set<string>, bg:Set<string>, hero:Set<string>, scenarioBlock:Set<string>}}
 */
export function buildExclusions(intent) {
  const buf = read();
  const dims = {
    palette: { pool: new Set(PALETTES) },
    bg: { pool: new Set(BG_KINDS) },
    hero: { pool: new Set(HERO_VARIANTS) },
    scenarioBlock: { pool: new Set(intent ? INTENT_BLOCKS[intent] || [] : Object.values(INTENT_BLOCKS).flat()) },
  };
  // Walk newest → oldest accumulating excludes, but never empty a pool.
  const ex = { palette: new Set(), bg: new Set(), hero: new Set(), scenarioBlock: new Set() };
  for (const entry of buf) {
    for (const dim of ['palette', 'bg', 'hero', 'scenarioBlock']) {
      const val = entry[dim];
      if (!val) continue;
      const candidate = new Set(ex[dim]);
      candidate.add(val);
      const remaining = [...dims[dim].pool].filter((v) => !candidate.has(v));
      if (remaining.length >= 1) ex[dim] = candidate;
      // else: leave ex[dim] alone — exclusion would empty the pool.
    }
  }
  return ex;
}

export function pushSelection({ palette, bg, hero, scenarioBlock }) {
  const buf = read();
  buf.unshift({ palette, bg, hero, scenarioBlock });
  write(buf);
}

export function clearRecency() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
}

export function readRecency() {
  return read();
}
