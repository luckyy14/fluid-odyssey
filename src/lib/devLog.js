// Dev-only console logger. No-ops in production builds.
// Tagged + colored so the LLM/scene flow is easy to follow in DevTools.

const ENABLED = !!import.meta.env?.DEV;

// ANSI escape codes. Most modern browser DevTools (Chrome 69+, Firefox) render
// these in the console; terminals render them natively.
const ANSI = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  // bright fg + black text on colored bg → looks like a tag chip
  llm:     '\x1b[1;97;45m', // bold white on magenta
  scene:   '\x1b[1;97;46m', // bold white on cyan
  phase:   '\x1b[1;97;42m', // bold white on green
  ui:      '\x1b[1;30;43m', // bold black on yellow
  ts:      '\x1b[90m',      // bright-black (gray) for timestamp
};

const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

function ts() {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  const elapsed = ((now - t0) / 1000).toFixed(2);
  return `${hh}:${mm}:${ss}.${ms} +${elapsed}s`;
}

function paint(tag) {
  const color = ANSI[tag] || ANSI.scene;
  return `${ANSI.ts}${ts()}${ANSI.reset} ${color} ${tag} ${ANSI.reset}`;
}

function emit(level, tag, msg, data) {
  if (!ENABLED) return;
  const fn = console[level] || console.log;
  if (data !== undefined) fn(paint(tag), msg, data);
  else fn(paint(tag), msg);
}

/**
 * Periodically log a "still working" message until the returned stop() is called.
 * Useful around long awaits (LLM calls, model download) so the console doesn't
 * go silent. Returns elapsed seconds when stopped.
 *
 *   const stop = devLog.heartbeat('llm', 'pass 1 awaiting…', 3000);
 *   await something();
 *   stop();  // → logs "pass 1 done in 12.4s"
 */
function heartbeat(tag, label, intervalMs = 3000) {
  if (!ENABLED) return () => 0;
  const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let ticks = 0;
  emit('info', tag, `${label} — heartbeat every ${intervalMs}ms`);
  const id = setInterval(() => {
    ticks++;
    const elapsed = (((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start) / 1000).toFixed(1);
    emit('debug', tag, `… still ${label} (${elapsed}s, tick ${ticks})`);
  }, intervalMs);
  return () => {
    clearInterval(id);
    const elapsed = (((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start) / 1000).toFixed(2);
    emit('info', tag, `✓ ${label} done in ${elapsed}s`);
    return parseFloat(elapsed);
  };
}

/** Truncate long values for one-line previews. */
function preview(s, max = 120) {
  if (s == null) return '';
  const str = typeof s === 'string' ? s : JSON.stringify(s);
  return str.length > max ? str.slice(0, max) + `… (+${str.length - max} chars)` : str;
}

export const devLog = {
  info:  (tag, msg, data) => emit('info',  tag, msg, data),
  debug: (tag, msg, data) => emit('debug', tag, msg, data),
  warn:  (tag, msg, data) => emit('warn',  tag, msg, data),
  group: (tag, label) => { if (ENABLED) console.group(paint(tag), label); },
  groupEnd: () => { if (ENABLED) console.groupEnd(); },
  time: (label) => { if (ENABLED) console.time(label); },
  timeEnd: (label) => { if (ENABLED) console.timeEnd(label); },
  heartbeat,
  preview,
};

export const DEV = ENABLED;
