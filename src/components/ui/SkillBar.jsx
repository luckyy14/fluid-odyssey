import { motion } from 'framer-motion';

const SkillBar = ({ name, level, index = 0 }) => {
  const getBarGradient = () => {
    if (level >= 90) return 'from-blue-500 via-purple-500 to-pink-500';
    if (level >= 80) return 'from-blue-500 to-purple-500';
    if (level >= 70) return 'from-purple-500 to-pink-500';
    return 'from-blue-400 to-blue-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-200">{name}</span>
        <span className="text-xs font-mono text-gray-400">{level}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          transition={{ duration: 1, delay: 0.2 + index * 0.05, ease: 'easeOut' }}
          viewport={{ once: true }}
          className={`h-full rounded-full bg-gradient-to-r ${getBarGradient()}`}
        />
      </div>
    </motion.div>
  );
};

export default SkillBar;
