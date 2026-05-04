import { z } from 'zod';
import { BlockShell, Shimmer } from './_shared';
import { TimelineEvent, RoleCard } from './leaves';

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
        {events.map((e, i) => <TimelineEvent key={i} {...e} index={i} />)}
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
      {events.map((e, i) => <RoleCard key={i} {...e} index={i} />)}
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
