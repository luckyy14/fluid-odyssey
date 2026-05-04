import { motion } from 'framer-motion';

// Shimmer used by every skeleton. Driven by --accent-soft / --surface-2.
export function Shimmer({ className = '', style = {} }) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--surface-2)',
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.95, 0.6] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, var(--accent-soft) 50%, transparent 100%)',
          transform: 'translateX(-100%)',
          animation: 'shimmer-slide 1.8s infinite',
        }}
      />
    </motion.div>
  );
}

// Standard outer wrapper for any block.
export function BlockShell({ children, className = '', tight = false }) {
  return (
    <div
      className={className}
      style={{
        padding: tight ? '1rem' : '1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface-1)',
        color: 'var(--fg)',
        lineHeight: 'var(--leading)',
        letterSpacing: 'var(--tracking)',
        fontFamily: 'var(--font-family)',
      }}
    >
      {children}
    </div>
  );
}

// Inject shimmer keyframe once.
if (typeof document !== 'undefined' && !document.getElementById('fluid-shimmer-css')) {
  const style = document.createElement('style');
  style.id = 'fluid-shimmer-css';
  style.textContent = `@keyframes shimmer-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`;
  document.head.appendChild(style);
}
