import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

const eventItem = z.object({
  title: z.string().max(80),
  company: z.string().max(80).optional(),
  period: z.string().max(40).optional(),
  description: z.string().max(280).optional(),
  current: z.boolean().optional(),
});

// exp_timeline_vertical
export function ExpTimelineVertical({ events }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, backgroundColor: 'var(--accent-soft)' }} />
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ position: 'relative', paddingLeft: '1.5rem' }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 6, width: 14, height: 14, borderRadius: '50%',
              backgroundColor: e.current ? 'var(--accent)' : 'var(--surface-2)',
              boxShadow: e.current ? '0 0 0 4px var(--accent-soft)' : 'none',
            }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--fg)' }}>{e.title}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              {e.company && <span style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)' }}>{e.company}</span>}
              {e.period && <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{e.period}</span>}
            </div>
            {e.description && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 6, lineHeight: 'var(--leading)' }}>{e.description}</p>}
          </motion.div>
        ))}
      </div>
    </BlockShell>
  );
}
export const expTimelineVerticalPropsSchema = z.object({ events: z.array(eventItem).min(1).max(10) });
export function ExpTimelineVerticalSkeleton({ event_count = 4 }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {Array.from({ length: event_count }).map((_, i) => (
          <div key={i} style={{ paddingLeft: '1.5rem' }}>
            <Shimmer style={{ height: 14, width: '50%' }} className="mb-2" />
            <Shimmer style={{ height: 12, width: '30%' }} className="mb-2" />
            <Shimmer style={{ height: 36, width: '100%' }} />
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

// exp_role_card_stack
export function ExpRoleCardStack({ events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {events.map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--surface-1)',
            borderRadius: 'var(--radius-md)',
            borderLeft: e.current ? '3px solid var(--accent)' : '3px solid var(--surface-2)',
            fontFamily: 'var(--font-family)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.95rem' }}>{e.title}</p>
            {e.period && <span style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>{e.period}</span>}
          </div>
          {e.company && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 2 }}>{e.company}</p>}
          {e.description && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 8, lineHeight: 'var(--leading)' }}>{e.description}</p>}
        </motion.div>
      ))}
    </div>
  );
}
export const expRoleCardStackPropsSchema = z.object({ events: z.array(eventItem).min(1).max(8) });
export function ExpRoleCardStackSkeleton({ event_count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: event_count }).map((_, i) => <Shimmer key={i} style={{ height: 84 }} />)}
    </div>
  );
}
