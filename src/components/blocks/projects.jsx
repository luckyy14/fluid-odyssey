import { z } from 'zod';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { BlockShell, Shimmer } from './_shared';

const projectItem = z.object({
  name: z.string().max(60),
  description: z.string().max(200),
  tech: z.array(z.string().max(24)).max(10).optional(),
  github: z.string().url().optional(),
  live: z.string().url().optional(),
});

// proj_grid
export function ProjGrid({ projects }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {projects.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            padding: '1rem 1.25rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-family)',
          }}
        >
          <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.95rem' }}>{p.name}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', lineHeight: 'var(--leading)', flex: 1 }}>{p.description}</p>
          {p.tech?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {p.tech.map((t) => (
                <span key={t} style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>{t}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={linkStyle()}><FaGithub size={11} /> Code</a>}
            {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" style={linkStyle()}><ExternalLink size={11} /> Live</a>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
export const projGridPropsSchema = z.object({ projects: z.array(projectItem).min(1).max(8) });
export function ProjGridSkeleton({ tile_count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {Array.from({ length: tile_count }).map((_, i) => <Shimmer key={i} style={{ height: 140 }} />)}
    </div>
  );
}

// proj_spotlight
export function ProjSpotlight({ projects }) {
  const p = projects[0];
  if (!p) return null;
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--fg-muted)' }}>Featured project</p>
        <h3 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--fg)' }}>{p.name}</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--fg-muted)', lineHeight: 'var(--leading)' }}>{p.description}</p>
        {p.tech?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {p.tech.map((t) => (
              <span key={t} style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>{t}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={linkStyle()}><FaGithub size={12} /> Code</a>}
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" style={linkStyle()}><ExternalLink size={12} /> Live</a>}
        </div>
      </div>
    </BlockShell>
  );
}
export const projSpotlightPropsSchema = z.object({ projects: z.array(projectItem).min(1).max(1) });
export function ProjSpotlightSkeleton() {
  return (
    <BlockShell>
      <Shimmer style={{ height: 12, width: 100 }} className="mb-3" />
      <Shimmer style={{ height: 28, width: '60%' }} className="mb-3" />
      <Shimmer style={{ height: 64 }} className="mb-3" />
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => <Shimmer key={i} style={{ height: 24, width: 70, borderRadius: 'var(--radius-pill)' }} />)}
      </div>
    </BlockShell>
  );
}

function linkStyle() {
  return { fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 };
}
