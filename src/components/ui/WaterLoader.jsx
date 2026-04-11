import { motion } from 'framer-motion';

const WaterLoader = ({ progress = 0, statusText = '' }) => {
  const pct = Math.min(Math.max(progress * 100, 0), 100);
  const waterLevel = 100 - pct; // 0% downloaded = water at top (100), 100% = water at bottom (0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--surface)' }}
    >
      {/* Water fill — rises from bottom */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-0 right-0 bottom-0"
          initial={{ height: '0%' }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(to top, var(--primary-container), var(--secondary-container), transparent)',
            opacity: 0.15,
          }}
        />

        {/* Wave surface line */}
        <motion.div
          className="absolute left-0 right-0"
          animate={{ bottom: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 1200 40" className="w-full h-10 opacity-30" preserveAspectRatio="none">
            <motion.path
              d="M0,20 Q150,0 300,20 Q450,40 600,20 Q750,0 900,20 Q1050,40 1200,20 L1200,40 L0,40 Z"
              fill="var(--primary-container)"
              animate={{ d: [
                'M0,20 Q150,0 300,20 Q450,40 600,20 Q750,0 900,20 Q1050,40 1200,20 L1200,40 L0,40 Z',
                'M0,20 Q150,40 300,20 Q450,0 600,20 Q750,40 900,20 Q1050,0 1200,20 L1200,40 L0,40 Z',
                'M0,20 Q150,0 300,20 Q450,40 600,20 Q750,0 900,20 Q1050,40 1200,20 L1200,40 L0,40 Z',
              ]}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-xl font-extrabold text-white mx-auto shadow-[0_20px_40px_var(--shadow-tint)]">
            L
          </div>
        </motion.div>

        <p className="text-lg font-bold text-[var(--primary)] mb-2">Loading AI</p>
        <p className="text-3xl font-extrabold text-[var(--on-surface)] mb-4">{Math.round(pct)}%</p>

        {/* Progress bar */}
        <div className="w-48 h-1.5 rounded-full bg-[var(--surface-container)] mx-auto mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--primary-container)]"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <p className="text-xs text-[var(--on-surface-variant)] max-w-xs mx-auto leading-relaxed">
          {statusText || 'Preparing the model...'}
        </p>
        <p className="text-xs text-[var(--outline)] mt-3">
          First visit downloads ~200MB · cached after
        </p>
      </div>
    </motion.div>
  );
};

export default WaterLoader;
