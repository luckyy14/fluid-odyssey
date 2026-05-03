// Leaf components — the smallest renderable units composed by container blocks.
// Each leaf accepts a single item shape and an optional `index` (used for
// stagger animation). Today these are called only by their parent block, but
// they're framework-ready for the future recursive-spec migration where the
// LLM emits leaves directly. See future_plan.md.

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

// ───────── shared atoms ─────────

export function TechChip({ label }) {
  return (
    <span style={{
      padding: '2px 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-pill)',
      backgroundColor: 'var(--surface-2)', color: 'var(--accent)',
    }}>{label}</span>
  );
}

export function ProjectLinks({ github, live, size = 11 }) {
  if (!github && !live) return null;
  const linkStyle = {
    fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
      {github && <a href={github} target="_blank" rel="noopener noreferrer" style={linkStyle}><FaGithub size={size} /> Code</a>}
      {live && <a href={live} target="_blank" rel="noopener noreferrer" style={linkStyle}><ExternalLink size={size} /> Live</a>}
    </div>
  );
}

// ───────── skills ─────────

export function SkillTag({ name, level, index = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      style={{
        padding: '6px 12px', borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--surface-2)', color: 'var(--accent)',
        fontWeight: 600, fontSize: 12 + ((level || 50) / 100) * 4,
      }}
    >
      {name}
    </motion.span>
  );
}

export function SkillBar({ name, level }) {
  const pct = level ?? 80;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--fg)', fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{pct}</span>
      </div>
      <div style={{ height: 6, backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', backgroundColor: 'var(--accent)', borderRadius: 'var(--radius-pill)' }}
        />
      </div>
    </div>
  );
}

// ───────── experience ─────────

export function TimelineEvent({ title, company, period, description, current, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ position: 'relative', paddingLeft: '1.5rem' }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 6, width: 14, height: 14, borderRadius: '50%',
        backgroundColor: current ? 'var(--accent)' : 'var(--surface-2)',
        boxShadow: current ? '0 0 0 4px var(--accent-soft)' : 'none',
      }} />
      <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--fg)' }}>{title}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        {company && <span style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)' }}>{company}</span>}
        {period && <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{period}</span>}
      </div>
      {description && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 6, lineHeight: 'var(--leading)' }}>{description}</p>}
    </motion.div>
  );
}

export function RoleCard({ title, company, period, description, current, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--surface-1)',
        borderRadius: 'var(--radius-md)',
        borderLeft: current ? '3px solid var(--accent)' : '3px solid var(--surface-2)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.95rem' }}>{title}</p>
        {period && <span style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>{period}</span>}
      </div>
      {company && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 2 }}>{company}</p>}
      {description && <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', marginTop: 8, lineHeight: 'var(--leading)' }}>{description}</p>}
    </motion.div>
  );
}

// ───────── projects ─────────

export function ProjectCard({ name, description, tech, github, live, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        padding: '1rem 1.25rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-md)',
        display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-family)',
      }}
    >
      <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.95rem' }}>{name}</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--fg-muted)', lineHeight: 'var(--leading)', flex: 1 }}>{description}</p>
      {tech?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {tech.map((t) => <TechChip key={t} label={t} />)}
        </div>
      )}
      <ProjectLinks github={github} live={live} size={11} />
    </motion.div>
  );
}

// ───────── outcomes ─────────

export function StatCell({ label, value, context, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      style={{
        padding: '1.25rem 1rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-md)',
        textAlign: 'center', fontFamily: 'var(--font-family)',
      }}
    >
      <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--accent)' }}>{value}</p>
      <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted)', marginTop: 4, fontWeight: 600 }}>{label}</p>
      {context && <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 8, lineHeight: 'var(--leading)' }}>{context}</p>}
    </motion.div>
  );
}

// ───────── technical ─────────

export function StackLayer({ name, description, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        padding: '0.875rem 1rem',
        backgroundColor: 'var(--surface-2)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius-sm)',
        transform: `translateX(${index * 8}px)`,
      }}
    >
      <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.875rem' }}>{name}</p>
      {description && <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 2 }}>{description}</p>}
    </motion.div>
  );
}

// ───────── philosophy ─────────

export function ManifestoBelief({ text, index = 0 }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--fg)', lineHeight: 'var(--leading)', display: 'flex', gap: 12 }}
    >
      <span style={{ color: 'var(--accent)' }}>{String(index + 1).padStart(2, '0')}.</span>
      <span>{text}</span>
    </motion.li>
  );
}
