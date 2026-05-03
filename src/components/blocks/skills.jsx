import { z } from 'zod';
import { BlockShell, Shimmer } from './_shared';
import { SkillTag, SkillBar } from './leaves';

const skillItem = z.object({ name: z.string().max(40), level: z.number().min(0).max(100).optional(), category: z.string().max(40).optional() });

// skill_tag_cloud
export function SkillTagCloud({ skills }) {
  const cats = [...new Set(skills.map((s) => s.category).filter(Boolean))];
  const groups = cats.length ? cats : [null];
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groups.map((cat) => {
          const inGroup = skills.filter((s) => !cat || s.category === cat);
          return (
            <div key={cat ?? 'all'}>
              {cat && (
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--fg-muted)', marginBottom: 8, fontWeight: 700 }}>{cat}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {inGroup.map((s, i) => <SkillTag key={s.name} {...s} index={i} />)}
              </div>
            </div>
          );
        })}
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
        {skills.map((s) => <SkillBar key={s.name} {...s} />)}
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
