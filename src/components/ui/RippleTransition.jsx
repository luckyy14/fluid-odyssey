import { motion } from 'framer-motion';

/**
 * Full-screen water ripple transition overlay.
 * Renders expanding concentric rings from a click origin point.
 */
const RippleTransition = ({ origin, onComplete }) => {
  const cx = origin?.x ?? '50%';
  const cy = origin?.y ?? '50%';

  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 1 }}
      onAnimationComplete={onComplete}
    >
      {/* SVG ripple rings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            cx={typeof cx === 'number' ? (cx / window.innerWidth) * 100 : 50}
            cy={typeof cy === 'number' ? (cy / window.innerHeight) * 100 : 50}
            r={0}
            fill="none"
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth={0.3}
            initial={{ r: 0, opacity: 0.8 }}
            animate={{ r: 80, opacity: 0 }}
            transition={{
              duration: 1.2,
              delay: i * 0.12,
              ease: 'easeOut',
            }}
          />
        ))}
      </svg>

      {/* Expanding fill */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: typeof cx === 'number' ? cx : '50%',
          top: typeof cy === 'number' ? cy : '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)',
        }}
        initial={{ width: 0, height: 0, opacity: 0.8 }}
        animate={{ width: '300vmax', height: '300vmax', opacity: 0 }}
        transition={{ duration: 1.3, ease: 'easeOut' }}
      />
    </motion.div>
  );
};

export default RippleTransition;
