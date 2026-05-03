import { z } from 'zod';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Shimmer } from './_shared';

const heroBaseSchema = z.object({
  title: z.string().min(1).max(160),
  kicker: z.string().max(80).optional(),
});

// hero
export function Hero({ title, kicker }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '2rem 0', fontFamily: 'var(--font-family)' }}
    >
      {kicker && (
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--fg-muted)', marginBottom: '0.5rem' }}>
          {kicker}
        </p>
      )}
      <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--fg)', lineHeight: 1.1 }}>
        {title}
      </h1>
    </motion.div>
  );
}
export const heroPropsSchema = heroBaseSchema;
export function HeroSkeleton() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <Shimmer className="h-3 w-32 mb-3" style={{ height: 12 }} />
      <Shimmer style={{ height: 48 }} className="w-3/4" />
    </div>
  );
}

// hero_quote
export function HeroQuote({ title, kicker }) {
  return (
    <motion.blockquote
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '2rem 0', borderLeft: '3px solid var(--accent)', paddingLeft: '1.25rem', fontStyle: 'italic' }}
    >
      <p style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.25 }}>
        “{title}”
      </p>
      {kicker && <cite style={{ display: 'block', fontStyle: 'normal', fontSize: '0.875rem', color: 'var(--fg-muted)', marginTop: '0.75rem' }}>— {kicker}</cite>}
    </motion.blockquote>
  );
}
export const heroQuotePropsSchema = heroBaseSchema;
export function HeroQuoteSkeleton() {
  return (
    <div style={{ padding: '2rem 0', borderLeft: '3px solid var(--accent)', paddingLeft: '1.25rem' }}>
      <Shimmer style={{ height: 40 }} className="w-full mb-2" />
      <Shimmer style={{ height: 24 }} className="w-2/3" />
    </div>
  );
}

// hero_terminal
export function HeroTerminal({ title, kicker }) {
  return (
    <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
      </div>
      <p style={{ color: 'var(--fg-muted)', fontSize: '0.875rem' }}>$ {kicker || 'whoami'}</p>
      <p style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 600, marginTop: 4 }}>{title}</p>
    </div>
  );
}
export const heroTerminalPropsSchema = heroBaseSchema;
export function HeroTerminalSkeleton() {
  return <Shimmer style={{ height: 110 }} className="w-full" />;
}

// hero_typewriter
export function HeroTypewriter({ title, kicker }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i++;
      setShown(title.slice(0, i));
      if (i >= title.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [title]);
  return (
    <div style={{ padding: '2rem 0' }}>
      {kicker && <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--fg-muted)', marginBottom: '0.5rem' }}>{kicker}</p>}
      <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)', fontWeight: 700, color: 'var(--fg)', lineHeight: 1.15 }}>
        {shown}
        <span style={{ opacity: 0.6, animation: 'pulse 1s infinite' }}>▍</span>
      </h1>
    </div>
  );
}
export const heroTypewriterPropsSchema = heroBaseSchema;
export function HeroTypewriterSkeleton() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <Shimmer style={{ height: 12, width: 120 }} className="mb-3" />
      <Shimmer style={{ height: 44 }} className="w-2/3" />
    </div>
  );
}
