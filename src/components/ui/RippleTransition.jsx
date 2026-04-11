import { motion } from 'framer-motion';

const RippleTransition = ({ origin }) => {
  const px = origin?.x ?? window.innerWidth / 2;
  const py = origin?.y ?? window.innerHeight / 2;

  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.9 }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.circle
            key={i}
            cx={px}
            cy={py}
            r={0}
            fill="none"
            stroke="rgba(0, 119, 182, 0.2)"
            strokeWidth={1.5}
            initial={{ r: 0, opacity: 0.6 }}
            animate={{ r: Math.max(window.innerWidth, window.innerHeight), opacity: 0 }}
            transition={{ duration: 1.4, delay: i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <motion.div
        className="absolute rounded-full"
        style={{
          left: px, top: py, transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(0,119,182,0.1) 0%, rgba(80,217,254,0.05) 40%, transparent 70%)',
        }}
        initial={{ width: 0, height: 0, opacity: 0.6 }}
        animate={{ width: '300vmax', height: '300vmax', opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </motion.div>
  );
};

export default RippleTransition;
