import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

// out_stat_grid
const statItem = z.object({ label: z.string().max(50), value: z.string().max(20), context: z.string().max(80).optional() });
export function OutStatGrid({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          style={{
            padding: '1.25rem 1rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-md)',
            textAlign: 'center', fontFamily: 'var(--font-family)',
          }}
        >
          <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</p>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted)', marginTop: 4, fontWeight: 600 }}>{s.label}</p>
          {s.context && <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 8, lineHeight: 'var(--leading)' }}>{s.context}</p>}
        </motion.div>
      ))}
    </div>
  );
}
export const outStatGridPropsSchema = z.object({ stats: z.array(statItem).min(2).max(6) });
export function OutStatGridSkeleton({ tile_count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {Array.from({ length: tile_count }).map((_, i) => <Shimmer key={i} style={{ height: 110 }} />)}
    </div>
  );
}

// out_kpi_hero
export function OutKpiHero({ value, label, context }) {
  return (
    <BlockShell>
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <p style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--fg)', marginTop: 12, fontWeight: 700 }}>{label}</p>
        {context && <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', marginTop: 16, maxWidth: 480, marginInline: 'auto', lineHeight: 'var(--leading)' }}>{context}</p>}
      </div>
    </BlockShell>
  );
}
export const outKpiHeroPropsSchema = z.object({
  value: z.string().max(20),
  label: z.string().max(60),
  context: z.string().max(280).optional(),
});
export function OutKpiHeroSkeleton() {
  return (
    <BlockShell>
      <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Shimmer style={{ height: 80, width: 200 }} />
        <Shimmer style={{ height: 14, width: 140 }} />
        <Shimmer style={{ height: 12, width: '60%' }} />
      </div>
    </BlockShell>
  );
}
