import { motion } from 'framer-motion';

const FluidBackground = ({ variant = 'light' }) => {
  const isDeep = variant === 'deep';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Blurred fluid shapes */}
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] ${isDeep ? 'bg-[#0077b6]/30' : 'bg-[#50d9fe]/10'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] ${isDeep ? 'bg-[#00626f]/20' : 'bg-[#0077b6]/8'}`} />
      <div className={`absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full blur-[80px] ${isDeep ? 'bg-[#94ccff]/15' : 'bg-[#94ccff]/6'}`} />

      {/* Concentric ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        {[800, 600, 400, 250].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-[#0077b6]/15"
            style={{ width: size, height: size }}
            animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          />
        ))}
      </div>
    </div>
  );
};

export default FluidBackground;
