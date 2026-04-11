import { motion } from 'framer-motion';

const WaterLoader = ({ progress = 0 }) => {
  const pct = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
    >
      {/* Water fill rising from bottom */}
      <div
        className="absolute left-0 right-0 bottom-0 transition-[height] duration-[1500ms] ease-out"
        style={{
          height: `${pct}%`,
          background: 'linear-gradient(to top, var(--primary-container), var(--secondary-container), transparent)',
          opacity: 0.1,
        }}
      />

      {/* Wave surface */}
      <div
        className="absolute left-[-50%] w-[200%] h-20 transition-[bottom] duration-[1500ms] ease-out"
        style={{ bottom: `calc(${pct}% - 2.5rem)` }}
      >
        <div
          className="w-full h-full rounded-[45%]"
          style={{
            background: 'var(--primary-container)',
            opacity: 0.06,
            animation: 'water-wave 8s ease-in-out infinite',
          }}
        />
      </div>
    </motion.div>
  );
};

export default WaterLoader;
