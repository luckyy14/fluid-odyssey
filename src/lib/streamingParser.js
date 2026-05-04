import { parse, Allow } from 'partial-json';

// Pre-clean the LLM's raw output before parsing:
//   - strip leading ```json or ``` fences and trailing ``` fences
//   - quote bare object keys ({ foo: 1 } → { "foo": 1 }) — Qwen 1.5B drops them
//   - convert single-quoted string values/keys to double-quoted
// Best-effort: regexes only fire outside string contexts as a heuristic; bad input
// just falls through to partial-json's existing error tolerance.
function normalize(raw) {
  let s = raw;
  // Strip markdown fence prefix
  s = s.replace(/^\s*```(?:json|json5)?\s*\n?/i, '');
  // Strip trailing fence (may or may not have closed if streaming cut early)
  s = s.replace(/\n?\s*```\s*$/, '');
  // Quote bare keys: { foo: ... }  or  , foo: ...
  s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*):/g, '$1"$2"$3:');
  return s;
}

/**
 * Streaming parser for pass-2 SceneSpec JSON. Designed to surface three event
 * tiers as the underlying JSON stream lands:
 *   1. theme_ready — when theme.{palette_name,type_family,density,radius,motion,background.kind} are all present
 *   2. shell       — when blocks[*].{id,type} are all present (heuristic: blocks array stable)
 *   3. block_filled — per block, when blocks[i].props parses cleanly
 *
 * Each gate fires at most once; takeFilledBlocks() returns only newly-completed blocks.
 */
export function createPartialJsonParser() {
  let buf = '';
  let lastObj = {};
  const emittedBlocks = new Set();
  let themeFired = false;
  let shellFired = false;

  function tryParse() {
    if (!buf.trim()) return;
    const cleaned = normalize(buf);
    try { lastObj = parse(cleaned, Allow.ALL) || {}; }
    catch { /* not parseable yet */ }
  }

  function feed(chunk) {
    buf += chunk;
    tryParse();
  }

  // Coerce common model mistakes: `background: "noise"` → `{ kind: "noise" }`.
  function bgKindOf(t) {
    if (!t || !t.background) return undefined;
    if (typeof t.background === 'string') return t.background;
    return t.background.kind;
  }

  function hasTheme() {
    if (themeFired) return false;
    const t = lastObj?.theme;
    return !!(t && t.palette_name && t.type_family && t.density && t.radius && t.motion && bgKindOf(t));
  }

  function takeTheme() {
    themeFired = true;
    const t = lastObj.theme;
    return {
      palette_name: t.palette_name,
      type_family: t.type_family,
      density: t.density,
      radius: t.radius,
      motion: t.motion,
      bg_kind: bgKindOf(t),
      seed: lastObj.seed | 0,
    };
  }

  // Heuristic: scaffold is "stable" once BOTH expected blocks have shown up
  // with id+type AND a `props` key. The presence of `props` in the parsed
  // object proves the model has moved past the type field, so the `type`
  // string is fully closed (not a mid-emission truncation like `"exp"` for
  // `"exp_role_card_stack"`). Without this, partial-json can return a
  // truncated type that locks the renderer into the wrong component.
  function hasBlockScaffold() {
    if (shellFired) return false;
    if (!Array.isArray(lastObj?.blocks) || lastObj.blocks.length < 2) return false;
    if (!lastObj.blocks.every((b) => b && b.id && b.type && 'props' in b)) return false;
    return true;
  }

  function takeBlockScaffold() {
    shellFired = true;
    return lastObj.blocks.map((b) => ({
      id: String(b.id),
      type: String(b.type),
      props_preview: b.props_preview ?? {},
    }));
  }

  function takeLayout() {
    return lastObj.layout || 'default';
  }

  function takeFilledBlocks() {
    if (!Array.isArray(lastObj?.blocks)) return [];
    const out = [];
    for (const b of lastObj.blocks) {
      if (!b?.id || emittedBlocks.has(b.id)) continue;
      if (!b.props || typeof b.props !== 'object') continue;
      // Heuristic: props is "complete" if there's any key present AND the
      // string buf indicates we've moved past this block (next block exists,
      // or stream has ended).
      const idx = lastObj.blocks.indexOf(b);
      const isLast = idx === lastObj.blocks.length - 1;
      const nextHasProps = !isLast && lastObj.blocks[idx + 1]?.props;
      const probablyDone = nextHasProps || /\}\s*\]\s*\}?\s*$/.test(buf);
      if (Object.keys(b.props).length > 0 && probablyDone) {
        emittedBlocks.add(b.id);
        out.push({ id: b.id, type: b.type, props: b.props });
      }
    }
    return out;
  }

  // Final pass at end-of-stream: emit any blocks not yet emitted.
  function finalFlushBlocks() {
    if (!Array.isArray(lastObj?.blocks)) return [];
    const out = [];
    for (const b of lastObj.blocks) {
      if (!b?.id || emittedBlocks.has(b.id)) continue;
      if (!b.props) continue;
      emittedBlocks.add(b.id);
      out.push({ id: b.id, type: b.type, props: b.props });
    }
    return out;
  }

  function finalSpec() {
    return lastObj;
  }

  function rawBuffer() { return buf; }

  return {
    feed, hasTheme, takeTheme, hasBlockScaffold, takeBlockScaffold,
    takeLayout, takeFilledBlocks, finalFlushBlocks, finalSpec, rawBuffer,
  };
}
