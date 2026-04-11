import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      className={`
        relative rounded-3xl
        bg-white/60 backdrop-blur-xl
        shadow-[0_20px_40px_rgba(0,93,144,0.06)]
        overflow-hidden
        ${hover ? 'transition-all duration-300' : ''}
        ${className}
      `}
      whileHover={hover ? { scale: 1.015, y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
