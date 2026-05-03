export const INTENTS = [
  'skills',
  'experience',
  'contact',
  'projects',
  'technical',
  'outcomes',
  'philosophy',
  'personal',
];

export const MOODS = ['reflective', 'playful', 'direct', 'warm', 'technical'];

export const HERO_VARIANTS = ['hero', 'hero_quote', 'hero_terminal', 'hero_typewriter'];

export const PALETTES = ['ink', 'sage', 'ember', 'dusk', 'citrus', 'noir', 'paper', 'tide'];

export const BG_KINDS = ['gradient', 'particles', 'code_rain', 'pattern', 'noise'];

export const TYPE_FAMILIES = ['serif', 'sans', 'mono', 'display'];
export const DENSITIES = ['airy', 'normal', 'dense'];
export const RADII = ['sharp', 'soft', 'pill'];
export const MOTIONS = ['still', 'subtle', 'lively'];

// Phase-1 scenario block roster — names match registry.js keys.
// Add more block files and re-list them here to expand the roster.
export const INTENT_BLOCKS = {
  skills: ['skill_tag_cloud', 'skill_meter_bars'],
  experience: ['exp_timeline_vertical', 'exp_role_card_stack'],
  contact: ['contact_card_centered', 'contact_terminal_prompt'],
  projects: ['proj_grid', 'proj_spotlight'],
  technical: ['tech_code_block', 'tech_stack_layered'],
  outcomes: ['out_stat_grid', 'out_kpi_hero'],
  philosophy: ['phil_pullquote', 'phil_manifesto'],
  personal: ['me_about_card', 'me_polaroid_intro'],
};

// Allowed type families per intent (intent-roster).
export const TYPE_ROSTER = {
  skills: ['mono', 'sans'],
  experience: ['serif', 'sans'],
  contact: ['sans', 'mono', 'display'],
  projects: ['sans', 'display'],
  technical: ['mono', 'sans'],
  outcomes: ['sans', 'serif'],
  philosophy: ['serif', 'display'],
  personal: ['serif', 'sans', 'display'],
};

// Allowed background kinds per intent.
export const BG_ROSTER = {
  skills: ['pattern', 'noise', 'gradient'],
  experience: ['gradient', 'noise', 'particles'],
  contact: ['gradient', 'noise', 'pattern'],
  projects: ['gradient', 'particles', 'noise'],
  technical: ['code_rain', 'pattern', 'noise'],
  outcomes: ['gradient', 'particles', 'noise'],
  philosophy: ['gradient', 'noise', 'pattern'],
  personal: ['gradient', 'noise', 'particles'],
};

// Layout name per intent (single anchor for phase 1; expand later).
export const LAYOUTS = {
  skills: ['skills_grid', 'skills_centered'],
  experience: ['exp_vertical_flow', 'exp_card_stack'],
  contact: ['contact_centered', 'contact_split'],
  projects: ['proj_grid_flow', 'proj_spotlight_full'],
  technical: ['tech_centered', 'tech_split'],
  outcomes: ['out_centered', 'out_split'],
  philosophy: ['phil_centered_long_form', 'phil_split'],
  personal: ['me_centered', 'me_card_flow'],
};

// Mood biases (used in system prompt as natural-language guidance, not enforced).
export const MOOD_BIAS = {
  reflective: { palette: ['ink', 'paper', 'dusk'], type: ['serif', 'display'], motion: ['still', 'subtle'] },
  playful: { palette: ['citrus', 'ember'], type: ['display', 'sans'], motion: ['lively'] },
  direct: { palette: ['noir', 'ink'], type: ['sans', 'mono'], density: ['dense'] },
  warm: { palette: ['ember', 'paper', 'sage'], type: ['serif', 'sans'], radius: ['soft', 'pill'] },
  technical: { palette: ['noir', 'ink', 'tide'], type: ['mono', 'sans'], bg: ['code_rain', 'pattern'] },
};

// Light-anchored vs dark-anchored palettes (used to filter by prefers-color-scheme).
export const LIGHT_PALETTES = ['sage', 'citrus', 'paper'];
export const DARK_PALETTES = ['ink', 'ember', 'dusk', 'noir', 'tide'];

// code_rain only looks right on dark, cool palettes.
export const CODE_RAIN_PALETTES = new Set(['tide', 'ink', 'noir']);
