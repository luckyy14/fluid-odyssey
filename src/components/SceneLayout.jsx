// Scene-level layout container + per-block frame wrapper. Picks a strategy
// from the seed (so it's stable per permalink) and wraps each block in a
// decorative frame variant. See `layout_catalog.md` for the design-system
// inspirations behind each variant.

import { motion } from 'framer-motion';

// ───────────────────── Strategy: outer container ─────────────────────

export function SceneLayout({ strategy, children }) {
  switch (strategy) {
    case 'editorial':
      // Magazine narrow column. NYT / Medium long-form vibe.
      return (
        <div style={{
          maxWidth: '38rem', marginInline: 'auto',
          display: 'flex', flexDirection: 'column', gap: 36,
        }}>{children}</div>
      );

    case 'split':
      // 2-col grid. Linear / Vercel docs vibe.
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }} className="scene-split">{children}</div>
      );

    case 'bleed':
      // Stripe-style alternating full-bleed.
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 28,
        }} className="scene-bleed">{children}</div>
      );

    case 'mosaic':
      // Hand-arranged Awwwards portfolio feel.
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 24,
        }} className="scene-mosaic">{children}</div>
      );

    case 'bento':
      // Apple iOS Bento / raycast.com tiled grid. Hero spans both columns,
      // scenario sits below at varied widths.
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }} className="scene-bento">{children}</div>
      );

    case 'polaroid_scatter':
      // Photo album. Each child rotates slightly, larger gap so rotation
      // doesn't clip neighbors.
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 36, paddingBlock: 12,
        }} className="scene-polaroid-scatter">{children}</div>
      );

    case 'brutalist':
      // Brutalist Web Design — heavy bordered surfaces, no rounding,
      // generous breathing room.
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 28,
        }} className="scene-brutalist">{children}</div>
      );

    case 'newspaper':
      // NYT print. Multi-column flow on wider screens, drop-cap on first
      // child via CSS.
      return (
        <div style={{
          maxWidth: '46rem', marginInline: 'auto',
          display: 'flex', flexDirection: 'column', gap: 28,
        }} className="scene-newspaper">{children}</div>
      );

    case 'stack':
    default:
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>{children}</div>
      );
  }
}

// ───────────────────── Per-block frame variants ─────────────────────

export function BlockFrame({ variant, index, isHero, children }) {
  switch (variant) {
    case 'numbered':
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'relative', paddingLeft: 56 }}
        >
          <span style={{
            position: 'absolute', left: 0, top: -8,
            fontSize: '3.5rem', fontWeight: 800, lineHeight: 1,
            color: 'var(--accent-soft)', fontFamily: 'var(--font-family)',
            userSelect: 'none', pointerEvents: 'none',
          }}>{String(index + 1).padStart(2, '0')}</span>
          {children}
        </motion.div>
      );

    case 'ruled':
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ paddingTop: 18, position: 'relative' }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, width: 48, height: 3,
            backgroundColor: 'var(--accent)', borderRadius: 2,
          }} />
          {children}
        </motion.div>
      );

    case 'markered':
      return (
        <motion.div
          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'relative',
            paddingLeft: 18,
            borderLeft: '3px solid var(--accent)',
          }}
        >{children}</motion.div>
      );

    case 'tinted':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: 4, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--accent-soft) 0%, transparent 70%)',
          }}
        >{children}</motion.div>
      );

    case 'cutout':
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'relative',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 4,
            overflow: 'hidden',
          }}
        >{children}</motion.div>
      );

    case 'polaroid': {
      // Photo album frame. Small rotation alternates by index for variety.
      const rot = (index % 2 === 0 ? -1 : 1) * (1.2 + (index % 3) * 0.6);
      return (
        <motion.div
          initial={{ opacity: 0, rotate: 0, y: 10 }}
          animate={{ opacity: 1, rotate: rot, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ rotate: 0, scale: 1.02 }}
          style={{
            padding: '14px 14px 36px',
            backgroundColor: '#fafaf7',
            color: '#1a1a1a',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
            transformOrigin: 'center top',
          }}
        >
          {children}
        </motion.div>
      );
    }

    case 'sticky_note': {
      // Post-it. Pastel bg + slight tilt + folded corner.
      const rot = (index % 2 === 0 ? -1 : 1) * 1.5;
      return (
        <motion.div
          initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: rot }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'relative',
            padding: '20px 22px',
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--fg)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            // Folded corner via clip-path (top-right corner).
            clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)',
          }}
        >
          {children}
          {/* Fold triangle */}
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 0, height: 0,
            borderTop: '22px solid var(--surface-2)',
            borderLeft: '22px solid transparent',
          }} />
        </motion.div>
      );
    }

    case 'terminal_window':
      // macOS-style title bar. Matches the hero_terminal block visually so
      // the rest of the page feels like part of the same dev tool.
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--outline)',
            backgroundColor: 'var(--surface-1)',
          }}
        >
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-2)',
            borderBottom: '1px solid var(--outline)',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
          </div>
          <div style={{ padding: '4px 4px 8px' }}>{children}</div>
        </motion.div>
      );

    case 'brutalist_box':
      // Hard border + solid offset shadow. No radius. Anti-Material.
      return (
        <motion.div
          initial={{ opacity: 0, x: -4, y: -4 }} animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            border: '2px solid var(--fg)',
            boxShadow: '6px 6px 0 0 var(--fg)',
            backgroundColor: 'var(--surface-1)',
            padding: 4,
            borderRadius: 0,
          }}
        >{children}</motion.div>
      );

    case 'clean':
    default:
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={isHero ? { paddingBlock: '0.5rem' } : undefined}
        >{children}</motion.div>
      );
  }
}
