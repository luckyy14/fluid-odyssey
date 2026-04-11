import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      className={`
        relative rounded-3xl
        bg-[var(--surface-container-low)]/60 backdrop-blur-xl
        shadow-[0_20px_40px_var(--shadow-tint)]
        overflow-hidden
        ${hover ? 'transition-all duration-300 hover:shadow-[0_20px_40px_var(--shadow-tint)] hover:border hover:border-[var(--outline-variant)]/15' : ''}
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
