import { z } from 'zod';
import {
  INTENTS,
  MOODS,
  PALETTES,
  TYPE_FAMILIES,
  DENSITIES,
  RADII,
  MOTIONS,
  BG_KINDS,
} from './recipes';

export const ThemeSchema = z.object({
  palette_name: z.enum(PALETTES),
  type_family: z.enum(TYPE_FAMILIES),
  density: z.enum(DENSITIES),
  radius: z.enum(RADII),
  motion: z.enum(MOTIONS),
  background: z.object({
    kind: z.enum(BG_KINDS),
    hint: z.string().max(48).optional(),
  }),
});

export const PropsPreviewSchema = z
  .object({
    event_count: z.number().int().min(0).max(12).optional(),
    tile_count: z.number().int().min(0).max(12).optional(),
    bullet_count: z.number().int().min(0).max(12).optional(),
    chart_kind: z.string().optional(),
  })
  .optional();

export const BlockSchema = z.object({
  id: z.string().min(1).max(8),
  type: z.string().min(1).max(48),
  props_preview: PropsPreviewSchema,
  props: z.record(z.string(), z.any()).optional(),
});

export const SceneSpecSchema = z.object({
  request_id: z.string().min(1),
  seed: z.number().int(),
  intent: z.enum(INTENTS),
  mood: z.enum(MOODS),
  theme: ThemeSchema,
  layout: z.string(),
  blocks: z.array(BlockSchema).min(1).max(5),
});

export const ThemeHintSchema = z.object({
  palette_name: z.enum(PALETTES),
  bg_kind: z.enum(BG_KINDS),
});

export const Pass1Schema = z.object({
  intent: z.enum(INTENTS),
  mood: z.enum(MOODS),
  keywords: z.array(z.string().max(32)).min(1).max(7),
  layout_seed: z.number().int(),
  theme_hint: ThemeHintSchema.optional(),
});
