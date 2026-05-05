// Animated status pill shown while a scene is generating. Subscribes to a
// phase string from the parent (driven by the orchestrator's events) and
// rotates a phase-appropriate word every ~1.8s so the wait feels alive.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { pickStatus } from '../lib/statusVocabulary';

const ROTATE_MS = 1800;

export default function StreamingStatus({ phase, hidden }) {
  const [word, setWord] = useState(() => pickStatus(phase));

  // Re-roll a starting word whenever phase changes.
  useEffect(() => {
    setWord(pickStatus(phase));
  }, [phase]);

  // Periodically rotate within the same phase pool.
  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => {
      setWord((prev) => pickStatus(phase, prev));
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [phase, hidden]);

  if (hidden) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderRadius: 'var(--radius-pill, 9999px)',
        backgroundColor: 'var(--surface-1)',
        color: 'var(--fg-muted)',
        fontSize: '0.8125rem',
        fontFamily: 'var(--font-family)',
        fontWeight: 500,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 0 var(--outline)',
      }}
      aria-live="polite"
    >
      <PulseDot />
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
        >
          <span>{word}</span>
          <Ellipsis />
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function PulseDot() {
  return (
    <motion.span
      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: 'var(--accent)',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

function Ellipsis() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        marginLeft: 2,
        lineHeight: 1,
      }}
    >
      <Dot delay={0} /><Dot delay={0.2} /><Dot delay={0.4} />
    </span>
  );
}

function Dot({ delay }) {
  return (
    <motion.span
      animate={{ opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{
        width: 3,
        height: 3,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block',
      }}
    />
  );
}
