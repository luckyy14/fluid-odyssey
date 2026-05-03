import { parse, Allow } from 'partial-json';

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
    try { lastObj = parse(buf, Allow.ALL) || {}; }
    catch { /* not parseable yet */ }
  }

  function feed(chunk) {
    buf += chunk;
    tryParse();
  }

  function hasTheme() {
    if (themeFired) return false;
    const t = lastObj?.theme;
    return !!(t && t.palette_name && t.type_family && t.density && t.radius && t.motion && t.background?.kind);
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
      bg_kind: t.background.kind,
      seed: lastObj.seed | 0,
    };
  }

  // Heuristic: scaffold is "stable" once the model has emitted blocks AND moved on
  // (we see a closing bracket OR every block has at least one prop key).
  function hasBlockScaffold() {
    if (shellFired) return false;
    if (!Array.isArray(lastObj?.blocks) || lastObj.blocks.length === 0) return false;
    // Every block has id+type
    if (!lastObj.blocks.every((b) => b && b.id && b.type)) return false;
    // We've moved past blocks-array scaffold either because the last char is past `]`
    // or because at least one block has begun props.
    const tail = buf.trimEnd();
    const closed = /\]\s*[,}]?\s*$/.test(tail) || /"props"\s*:/.test(buf);
    return closed;
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

  return {
    feed, hasTheme, takeTheme, hasBlockScaffold, takeBlockScaffold,
    takeLayout, takeFilledBlocks, finalFlushBlocks, finalSpec,
  };
}
