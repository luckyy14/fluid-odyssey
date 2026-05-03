import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

const skillItem = z.object({ name: z.string().max(40), level: z.number().min(0).max(100).optional(), category: z.string().max(40).optional() });

// skill_tag_cloud
export function SkillTagCloud({ skills }) {
  const cats = [...new Set(skills.map((s) => s.category).filter(Boolean))];
  const groups = cats.length ? cats : [null];
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groups.map((cat) => (
          <div key={cat ?? 'all'}>
            {cat && (
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--fg-muted)', marginBottom: 8, fontWeight: 700 }}>{cat}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.filter((s) => !cat || s.category === cat).map((s, i) => (
                <motion.span
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: 12 + ((s.level || 50) / 100) * 4,
                  }}
                >
                  {s.name}
                </motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}
export const skillTagCloudPropsSchema = z.object({ skills: z.array(skillItem).min(1).max(40) });
export function SkillTagCloudSkeleton({ tile_count = 12 }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: tile_count }).map((_, i) => (
          <Shimmer key={i} style={{ height: 28, width: 60 + (i % 4) * 18, borderRadius: 'var(--radius-pill)' }} />
        ))}
      </div>
    </BlockShell>
  );
}

// skill_meter_bars
export function SkillMeterBars({ skills }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {skills.map((s) => (
          <div key={s.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--fg)', fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{s.level ?? 80}</span>
            </div>
            <div style={{ height: 6, backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.level ?? 80}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-pill)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}
export const skillMeterBarsPropsSchema = z.object({ skills: z.array(skillItem).min(1).max(15) });
export function SkillMeterBarsSkeleton({ bullet_count = 6 }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: bullet_count }).map((_, i) => (
          <div key={i}>
            <Shimmer style={{ height: 12, width: '40%' }} className="mb-2" />
            <Shimmer style={{ height: 6, borderRadius: 'var(--radius-pill)' }} className="w-full" />
          </div>
        ))}
      </div>
    </BlockShell>
  );
}
