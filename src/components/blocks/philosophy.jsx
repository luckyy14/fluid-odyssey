import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

// phil_pullquote
export function PhilPullquote({ quote, attribution }) {
  return (
    <motion.blockquote
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '2.5rem 1rem', textAlign: 'center', fontFamily: 'var(--font-family)' }}
    >
      <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3, fontStyle: 'italic' }}>
        “{quote}”
      </p>
      {attribution && <cite style={{ display: 'block', fontStyle: 'normal', fontSize: '0.875rem', color: 'var(--fg-muted)', marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.15em' }}>— {attribution}</cite>}
    </motion.blockquote>
  );
}
export const philPullquotePropsSchema = z.object({
  quote: z.string().min(1).max(280),
  attribution: z.string().max(80).optional(),
});
export function PhilPullquoteSkeleton() {
  return (
    <div style={{ padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Shimmer style={{ height: 36, width: '90%' }} />
      <Shimmer style={{ height: 36, width: '70%' }} />
      <Shimmer style={{ height: 12, width: 140, marginTop: 8 }} />
    </div>
  );
}

// phil_manifesto
const beliefItem = z.string().min(1).max(160);
export function PhilManifesto({ beliefs, title }) {
  return (
    <BlockShell>
      {title && <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 16, fontWeight: 700 }}>{title}</p>}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none' }}>
        {beliefs.map((b, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--fg)', lineHeight: 'var(--leading)', display: 'flex', gap: 12 }}
          >
            <span style={{ color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}.</span>
            <span>{b}</span>
          </motion.li>
        ))}
      </ul>
    </BlockShell>
  );
}
export const philManifestoPropsSchema = z.object({
  title: z.string().max(60).optional(),
  beliefs: z.array(beliefItem).min(2).max(7),
});
export function PhilManifestoSkeleton({ bullet_count = 4 }) {
  return (
    <BlockShell>
      <Shimmer style={{ height: 12, width: 100 }} className="mb-3" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: bullet_count }).map((_, i) => <Shimmer key={i} style={{ height: 22 }} />)}
      </div>
    </BlockShell>
  );
}
