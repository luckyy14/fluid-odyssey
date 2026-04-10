import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hover = true,
  glowColor = 'rgba(139, 92, 246, 0.15)',
  ...props
}) => {
  return (
    <motion.div
      className={`
        relative rounded-2xl
        bg-white/5 backdrop-blur-xl
        border border-white/10
        overflow-hidden
        ${hover ? 'transition-all duration-300' : ''}
        ${className}
      `}
      whileHover={
        hover
          ? {
              scale: 1.02,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }
          : undefined
      }
      style={
        hover
          ? {
              boxShadow: `0 0 0px ${glowColor}`,
              transition: 'box-shadow 0.3s ease',
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = `0 0 30px ${glowColor}`;
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = `0 0 0px ${glowColor}`;
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
