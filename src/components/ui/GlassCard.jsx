import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div
      className={`
        relative rounded-3xl
        bg-[#112240]/60 backdrop-blur-xl
        shadow-[0_20px_40px_rgba(0,93,144,0.15)]
        overflow-hidden
        ${hover ? 'transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,93,144,0.25)] hover:border hover:border-[#2a3a4a]/15' : ''}
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
