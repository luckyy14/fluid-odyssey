import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import SkillBar from '../ui/SkillBar';
import { skills } from '../../data/profile';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'language', label: 'Languages' },
  { key: 'tools', label: 'Tools & DevOps' },
];

const getCategoryColor = (category) => {
  const colors = {
    frontend: 'from-blue-500 to-cyan-500',
    backend: 'from-green-500 to-emerald-500',
    language: 'from-purple-500 to-violet-500',
    mobile: 'from-orange-500 to-amber-500',
    tools: 'from-pink-500 to-rose-500',
    devops: 'from-pink-500 to-rose-500',
    web: 'from-teal-500 to-cyan-500',
    security: 'from-red-500 to-orange-500',
  };
  return colors[category] || 'from-gray-500 to-gray-600';
};

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSkills =
    activeCategory === 'all'
      ? skills
      : skills.filter((skill) => {
          if (activeCategory === 'tools') {
            return skill.category === 'tools' || skill.category === 'devops' || skill.category === 'web';
          }
          return skill.category === activeCategory;
        });

  return (
    <section id="skills" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-blue-400 tracking-wider uppercase">
            Skills
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2">
            My <span className="gradient-text">tech stack</span>
          </h2>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer
                ${
                  activeCategory === cat.key
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill, index) => (
              <motion.div
                key={skill.name}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <GlassCard className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(skill.category)}`}
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      {skill.category}
                    </span>
                  </div>
                  <SkillBar
                    name={skill.name}
                    level={skill.level}
                    index={index}
                  />
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
