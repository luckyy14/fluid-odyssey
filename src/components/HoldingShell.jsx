import { motion } from 'framer-motion';
import { Shimmer } from './blocks/_shared';

/**
 * Pre-anything view: shown for the brief window before pass 1 returns.
 * Echoes the question back and shows neutral skeletons. No theme applied yet.
 */
export default function HoldingShell({ question }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {question && (
        <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', fontStyle: 'italic' }}>
          “{question}”
        </p>
      )}
      <Shimmer style={{ height: 56, width: '70%' }} />
      <Shimmer style={{ height: 220 }} />
    </motion.div>
  );
}

/**
 * Theme applied, scaffold not yet known. Skeletons use the page's accent colour.
 */
export function ThemedHoldingShell({ question }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      {question && (
        <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', fontStyle: 'italic' }}>
          “{question}”
        </p>
      )}
      <Shimmer style={{ height: 56, width: '70%' }} />
      <Shimmer style={{ height: 180 }} />
      <Shimmer style={{ height: 100, width: '85%' }} />
    </motion.div>
  );
}
