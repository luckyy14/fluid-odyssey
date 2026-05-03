import { z } from 'zod';
import { motion } from 'framer-motion';
import { BlockShell, Shimmer } from './_shared';

// me_about_card
export function MeAboutCard({ name, role, bio, location }) {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%', backgroundColor: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--bg)', fontWeight: 800, fontSize: '1.5rem',
          }}>
            {name?.[0] || '·'}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '1rem' }}>{name}</p>
            {role && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)' }}>{role}</p>}
            {location && <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 2 }}>{location}</p>}
          </div>
        </div>
        {bio && <p style={{ fontSize: '0.9375rem', color: 'var(--fg)', lineHeight: 'var(--leading)' }}>{bio}</p>}
      </div>
    </BlockShell>
  );
}
export const meAboutCardPropsSchema = z.object({
  name: z.string().max(80),
  role: z.string().max(80).optional(),
  bio: z.string().max(400).optional(),
  location: z.string().max(60).optional(),
});
export function MeAboutCardSkeleton() {
  return (
    <BlockShell>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <Shimmer style={{ height: 54, width: 54, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Shimmer style={{ height: 14, width: 140, marginBottom: 6 }} />
          <Shimmer style={{ height: 12, width: 100 }} />
        </div>
      </div>
      <Shimmer style={{ height: 56 }} />
    </BlockShell>
  );
}

// me_polaroid_intro
export function MePolaroidIntro({ name, caption, role }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -3 }}
      animate={{ opacity: 1, rotate: -2 }}
      style={{
        margin: '1rem auto', maxWidth: 320, padding: 16, paddingBottom: 28,
        backgroundColor: 'var(--surface-1)', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        fontFamily: '"Caveat", "Comic Sans MS", cursive', textAlign: 'center',
      }}
    >
      <div style={{
        height: 220, backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', fontWeight: 800, fontSize: '4rem',
        fontFamily: 'var(--font-family)',
      }}>
        {name?.[0] || '·'}
      </div>
      <p style={{ marginTop: 14, fontSize: '1.125rem', color: 'var(--fg)', fontWeight: 600 }}>{name}</p>
      {role && <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', fontFamily: 'var(--font-family)' }}>{role}</p>}
      {caption && <p style={{ marginTop: 6, fontSize: '0.95rem', color: 'var(--fg-muted)' }}>{caption}</p>}
    </motion.div>
  );
}
export const mePolaroidIntroPropsSchema = z.object({
  name: z.string().max(80),
  role: z.string().max(80).optional(),
  caption: z.string().max(200).optional(),
});
export function MePolaroidIntroSkeleton() {
  return (
    <div style={{ margin: '1rem auto', maxWidth: 320, padding: 16, paddingBottom: 28, backgroundColor: 'var(--surface-1)' }}>
      <Shimmer style={{ height: 220 }} />
      <Shimmer style={{ height: 18, width: 160, margin: '12px auto 6px' }} />
      <Shimmer style={{ height: 12, width: 120, margin: '0 auto' }} />
    </div>
  );
}
