import { z } from 'zod';
import { BlockShell, Shimmer } from './_shared';
import { ProjectCard, TechChip, ProjectLinks } from './leaves';

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
      {projects.map((p, i) => <ProjectCard key={p.name} {...p} index={i} />)}
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

// proj_spotlight — single project, larger treatment. Reuses TechChip + ProjectLinks
// leaves but keeps its own outer layout (the visual is meaningfully different
// from the grid card).
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
            {p.tech.map((t) => <TechChip key={t} label={t} />)}
          </div>
        )}
        <ProjectLinks github={p.github} live={p.live} size={12} />
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
