import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { profile, education } from '../../data/profile';
import { FaGraduationCap } from 'react-icons/fa';

const stats = [
  { value: '3.5+', label: 'Years Experience', color: 'from-blue-400 to-blue-600' },
  { value: '2+', label: 'Organizations', color: 'from-purple-400 to-purple-600' },
  { value: 'React', label: 'Specialist', color: 'from-pink-400 to-pink-600' },
];

const highlightWords = [
  'React.js',
  'Next.js',
  'TypeScript',
  'Nx monorepos',
  'Micro Frontend',
  'Spring Boot',
  'NestJS',
  'healthcare SaaS',
  '3.5+ years',
];

const highlightText = (text) => {
  let result = text;
  highlightWords.forEach((word) => {
    result = result.replace(
      new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
      `<span class="gradient-text font-semibold">$1</span>`,
    );
  });
  return result;
};

const AboutSection = () => {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-purple-400 tracking-wider uppercase">
            About Me
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2">
            Get to know{' '}
            <span className="gradient-text">me better</span>
          </h2>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Intro text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p
              className="text-lg leading-relaxed text-gray-300"
              dangerouslySetInnerHTML={{ __html: highlightText(profile.intro) }}
            />

            {/* Education Card */}
            <GlassCard className="mt-8 p-5" glowColor="rgba(59, 130, 246, 0.15)">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <FaGraduationCap size={24} />
                </div>
                <div>
                  <h4 className="text-white font-semibold">
                    {education.institution}
                  </h4>
                  <p className="text-gray-400 text-sm mt-1">
                    {education.degree}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-mono">
                    {education.duration}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Right: Stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4"
          >
            {stats.map((stat, index) => (
              <GlassCard
                key={stat.label}
                className="p-6 text-center lg:text-left"
                glowColor={
                  index === 0
                    ? 'rgba(59, 130, 246, 0.15)'
                    : index === 1
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'rgba(236, 72, 153, 0.15)'
                }
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col lg:flex-row items-center lg:items-end gap-2 lg:gap-4"
                >
                  <span
                    className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </span>
                  <span className="text-gray-400 text-sm font-medium pb-1">
                    {stat.label}
                  </span>
                </motion.div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
