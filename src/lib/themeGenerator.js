import { CODE_RAIN_PALETTES } from './recipes';

// Seeded PRNG (mulberry32). Deterministic given the same seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Palette anchors. Each palette has 5 anchor colors plus a tone hint.
const PALETTE_CATALOG = {
  ink: {
    tone: 'dark',
    bg: [220, 14, 8],
    surface1: [220, 14, 12],
    surface2: [220, 12, 16],
    fg: [220, 8, 92],
    fgMuted: [220, 6, 64],
    accent: [38, 90, 65],
    outline: [220, 10, 30],
  },
  sage: {
    tone: 'light',
    bg: [105, 18, 96],
    surface1: [105, 16, 92],
    surface2: [105, 14, 88],
    fg: [150, 20, 18],
    fgMuted: [150, 12, 38],
    accent: [155, 35, 42],
    outline: [120, 12, 70],
  },
  ember: {
    tone: 'dark',
    bg: [18, 30, 10],
    surface1: [18, 28, 14],
    surface2: [18, 26, 18],
    fg: [28, 25, 92],
    fgMuted: [28, 18, 68],
    accent: [14, 85, 60],
    outline: [18, 22, 30],
  },
  dusk: {
    tone: 'dark',
    bg: [255, 25, 12],
    surface1: [255, 22, 16],
    surface2: [255, 20, 22],
    fg: [250, 15, 90],
    fgMuted: [250, 10, 65],
    accent: [285, 70, 70],
    outline: [255, 18, 32],
  },
  citrus: {
    tone: 'light',
    bg: [48, 95, 96],
    surface1: [48, 80, 92],
    surface2: [48, 70, 88],
    fg: [20, 35, 18],
    fgMuted: [20, 22, 38],
    accent: [28, 95, 55],
    outline: [40, 40, 70],
  },
  noir: {
    tone: 'dark',
    bg: [0, 0, 6],
    surface1: [0, 0, 10],
    surface2: [0, 0, 14],
    fg: [0, 0, 96],
    fgMuted: [0, 0, 60],
    accent: [0, 0, 70],
    outline: [0, 0, 26],
  },
  paper: {
    tone: 'light',
    bg: [40, 25, 96],
    surface1: [40, 22, 92],
    surface2: [40, 20, 88],
    fg: [220, 15, 12],
    fgMuted: [220, 10, 38],
    accent: [220, 50, 35],
    outline: [40, 14, 70],
  },
  tide: {
    tone: 'dark',
    bg: [200, 35, 10],
    surface1: [200, 32, 14],
    surface2: [200, 30, 18],
    fg: [195, 12, 92],
    fgMuted: [195, 10, 64],
    accent: [180, 65, 55],
    outline: [200, 26, 28],
  },
};

// Type family → CSS font stack. Self-hosted fonts go in public/fonts; for now
// we use system + Plus Jakarta (already imported in index.css).
const FONT_STACKS = {
  serif: '"Plus Jakarta Sans", "Source Serif 4", Georgia, serif',
  sans: '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  display: '"Plus Jakarta Sans", "Fraunces", Georgia, serif',
};

function hsl([h, s, l]) {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

function hsla([h, s, l], a) {
  return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a})`;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Jitter an HSL anchor by seeded amounts within bounds that preserve contrast.
function jitter(rng, [h, s, l], hueRange = 6, satRange = 8, lightRange = 5) {
  return [
    (h + (rng() - 0.5) * 2 * hueRange + 360) % 360,
    clamp(s + (rng() - 0.5) * 2 * satRange, 0, 100),
    clamp(l + (rng() - 0.5) * 2 * lightRange, 4, 96),
  ];
}

// Relative luminance for WCAG contrast.
function luminance([h, s, l]) {
  // Convert HSL to RGB linear approx via sRGB.
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const lin = (v) => {
    const sv = v + m;
    return sv <= 0.03928 ? sv / 12.92 : Math.pow((sv + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Background props generators per kind. All deterministic from seed.
function buildBgProps(kind, palette, rng) {
  if (kind === 'gradient') {
    const angle = Math.floor(rng() * 360);
    return {
      kind,
      angle,
      stops: [
        { at: 0, color: hsl(palette.bg) },
        { at: 0.6, color: hsla(palette.accent, 0.12) },
        { at: 1, color: hsl(palette.surface1) },
      ],
    };
  }
  if (kind === 'particles') {
    return {
      kind,
      count: 18 + Math.floor(rng() * 14),
      speed: 0.4 + rng() * 0.4,
      size: 1.2 + rng() * 1.6,
      color: hsla(palette.accent, 0.5),
    };
  }
  if (kind === 'code_rain') {
    return {
      kind,
      density: 0.3 + rng() * 0.4,
      speed: 0.3 + rng() * 0.5,
      glyphs: 'アァイィウヴエカキクケコサシスセソタチツテトナニヌネノ01',
      color: hsla(palette.accent, 0.45),
    };
  }
  if (kind === 'pattern') {
    const kinds = ['dots', 'grid', 'herringbone'];
    return {
      kind,
      pattern: kinds[Math.floor(rng() * kinds.length)],
      opacity: 0.06 + rng() * 0.06,
      scale: 14 + Math.floor(rng() * 10),
      color: hsl(palette.outline),
    };
  }
  // noise (default)
  return {
    kind: 'noise',
    octaves: 2 + Math.floor(rng() * 2),
    opacity: 0.04 + rng() * 0.05,
    seed: Math.floor(rng() * 1e6),
  };
}

const DENSITY_VARS = {
  airy:   { leading: 1.7,  tracking: '0.01em',  spacing: 1.25 },
  normal: { leading: 1.55, tracking: '0em',     spacing: 1 },
  dense:  { leading: 1.35, tracking: '-0.005em', spacing: 0.85 },
};

const RADIUS_VARS = {
  sharp: { sm: '4px',  md: '6px',  lg: '8px',   pill: '9999px' },
  soft:  { sm: '8px',  md: '16px', lg: '24px',  pill: '9999px' },
  pill:  { sm: '14px', md: '24px', lg: '32px',  pill: '9999px' },
};

const MOTION_VARS = {
  still:  { fast: '0ms',   med: '0ms',   slow: '0ms',   ease: 'ease' },
  subtle: { fast: '120ms', med: '300ms', slow: '500ms', ease: 'ease-out' },
  lively: { fast: '180ms', med: '450ms', slow: '700ms', ease: 'cubic-bezier(.2,.8,.2,1)' },
};

/**
 * Build a deterministic theme from the named selections.
 * @param {object} sel
 * @param {string} sel.palette_name
 * @param {string} sel.type_family
 * @param {string} sel.density
 * @param {string} sel.radius
 * @param {string} sel.motion
 * @param {string} sel.bg_kind
 * @param {number} sel.seed
 * @returns {{ input: object, cssVars: object, bgProps: object, fontStack: string, paletteTone: 'light'|'dark' }}
 */
export function themeGenerator(sel) {
  const anchor = PALETTE_CATALOG[sel.palette_name] || PALETTE_CATALOG.ink;
  const rng = mulberry32(sel.seed | 0);

  // Jitter colors with WCAG fallback to anchor if contrast fails.
  let bg = jitter(rng, anchor.bg, 4, 4, 3);
  let fg = anchor.fg; // never jitter fg — we want it stable for contrast
  if (contrastRatio(bg, fg) < 7) bg = anchor.bg;
  const accent = jitter(rng, anchor.accent, 8, 6, 4);
  const surface1 = jitter(rng, anchor.surface1, 4, 4, 2);
  const surface2 = jitter(rng, anchor.surface2, 4, 4, 2);

  // Disable code_rain on palettes that don't suit it.
  let bgKind = sel.bg_kind;
  if (bgKind === 'code_rain' && !CODE_RAIN_PALETTES.has(sel.palette_name)) {
    bgKind = 'pattern';
  }

  const bgProps = buildBgProps(bgKind, anchor, rng);

  const density = DENSITY_VARS[sel.density] || DENSITY_VARS.normal;
  const radius = RADIUS_VARS[sel.radius] || RADIUS_VARS.soft;
  const motion = MOTION_VARS[sel.motion] || MOTION_VARS.subtle;

  const fontStack = FONT_STACKS[sel.type_family] || FONT_STACKS.sans;

  // CSS vars — both new theme tokens and aliases for existing components.
  const cssVars = {
    // New scene tokens
    '--bg': hsl(bg),
    '--fg': hsl(fg),
    '--fg-muted': hsl(anchor.fgMuted),
    '--accent': hsl(accent),
    '--accent-soft': hsla(accent, 0.18),
    '--surface-1': hsl(surface1),
    '--surface-2': hsl(surface2),
    '--outline': hsl(anchor.outline),

    // Aliases keeping existing components rendering
    '--surface': hsl(bg),
    '--surface-container-lowest': hsl(bg),
    '--surface-container-low': hsl(surface1),
    '--surface-container': hsl(surface2),
    '--surface-container-high': hsl(surface2),
    '--on-surface': hsl(fg),
    '--on-surface-variant': hsl(anchor.fgMuted),
    '--primary': hsl(accent),
    '--primary-container': hsl(accent),
    '--secondary': hsl(accent),
    '--secondary-container': hsla(accent, 0.5),
    '--tertiary': hsl(accent),
    '--tertiary-container': hsla(accent, 0.18),
    '--on-tertiary-container': hsl(fg),
    '--outline-variant': hsla(anchor.outline, 0.4),
    '--shadow-tint': hsla(accent, 0.12),
    '--ripple-tint': hsla(accent, 0.08),
    '--glass-bg': hsla(surface1, 0.6),
    '--glass-bg-dark': hsla(bg, 0.7),

    // Typography
    '--font-family': fontStack,
    '--leading': String(density.leading),
    '--tracking': density.tracking,
    '--spacing-scale': String(density.spacing),

    // Radius
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-pill': radius.pill,

    // Motion
    '--dur-fast': motion.fast,
    '--dur-med': motion.med,
    '--dur-slow': motion.slow,
    '--ease': motion.ease,
  };

  return {
    seed: sel.seed,   // top-level so SceneRenderer drives deterministic frame/layout picks
    input: {
      palette_name: sel.palette_name,
      type_family: sel.type_family,
      density: sel.density,
      radius: sel.radius,
      motion: sel.motion,
      bg_kind: bgKind,
    },
    cssVars,
    bgProps,
    fontStack,
    paletteTone: anchor.tone,
  };
}

/**
 * Apply CSS vars to <html>. Idempotent — overwrites previous theme.
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined' || !theme) return;
  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.dataset.paletteTone = theme.paletteTone;
}

/**
 * Hash a string + a few changing inputs into a stable 32-bit seed.
 */
export function hashSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h | 0;
}

export function motionForA11y(requested) {
  if (typeof window === 'undefined') return requested || 'subtle';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'still';
  return requested || 'subtle';
}

export function defaultTypeFor(intent) {
  // Used pre-pass-2 when only the hint is known.
  const map = {
    skills: 'mono',
    experience: 'serif',
    contact: 'sans',
    projects: 'sans',
    technical: 'mono',
    outcomes: 'sans',
    philosophy: 'serif',
    personal: 'serif',
  };
  return map[intent] || 'sans';
}
