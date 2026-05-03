import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

// tech_code_block
export function TechCodeBlock({ language, code, caption }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {caption && <p style={{ fontSize: '0.875rem', color: 'var(--fg)', lineHeight: 'var(--leading)' }}>{caption}</p>}
        <div style={{
          padding: '1rem 1.25rem', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
          fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', overflowX: 'auto',
        }}>
          {language && <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--fg-muted)', marginBottom: 8 }}>{language}</p>}
          <pre style={{ color: 'var(--fg)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
        </div>
      </div>
    </BlockShell>
  );
}
export const techCodeBlockPropsSchema = z.object({
  language: z.string().max(20).optional(),
  code: z.string().min(1).max(2000),
  caption: z.string().max(280).optional(),
});
export function TechCodeBlockSkeleton() {
  return (
    <BlockShell>
      <Shimmer style={{ height: 14, width: '60%' }} className="mb-3" />
      <Shimmer style={{ height: 140, borderRadius: 'var(--radius-md)' }} />
    </BlockShell>
  );
}

// tech_stack_layered
const layerItem = z.object({ name: z.string().max(40), description: z.string().max(160).optional() });
export function TechStackLayered({ layers }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {layers.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--surface-2)',
              borderLeft: '3px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              transform: `translateX(${i * 8}px)`,
            }}
          >
            <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.875rem' }}>{l.name}</p>
            {l.description && <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 2 }}>{l.description}</p>}
          </motion.div>
        ))}
      </div>
    </BlockShell>
  );
}
export const techStackLayeredPropsSchema = z.object({ layers: z.array(layerItem).min(1).max(8) });
export function TechStackLayeredSkeleton({ bullet_count = 5 }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from({ length: bullet_count }).map((_, i) => (
          <Shimmer key={i} style={{ height: 50, transform: `translateX(${i * 8}px)` }} />
        ))}
      </div>
    </BlockShell>
  );
}
