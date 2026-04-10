import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { experience } from '../../data/profile';

const ExperienceSection = () => {
  return (
    <section id="experience" className="relative py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase">
            Experience
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2">
            My <span className="gradient-text">journey</span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-[0.5px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />

          {experience.map((exp, expIndex) => (
            <div key={exp.company} className="mb-12 last:mb-0">
              {exp.roles.map((role, roleIndex) => {
                const isEven = (expIndex + roleIndex) % 2 === 0;
                const globalIndex = experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + e.roles.length, 0) + roleIndex;

                return (
                  <motion.div
                    key={`${exp.company}-${role.title}`}
                    initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: globalIndex * 0.1,
                    }}
                    viewport={{ once: true }}
                    className={`
                      relative flex items-start mb-8 last:mb-0
                      md:justify-${isEven ? 'start' : 'end'}
                      pl-12 md:pl-0
                    `}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`
                        absolute left-4 md:left-1/2 -translate-x-1/2 top-6
                        w-3 h-3 rounded-full z-10
                        ${role.current
                          ? 'bg-green-400 shadow-lg shadow-green-400/50'
                          : 'bg-purple-500 border-2 border-[#0a0a0a]'}
                      `}
                    >
                      {role.current && (
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`w-full md:w-[calc(50%-2rem)] ${isEven ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}
                    >
                      <GlassCard
                        className="p-5"
                        glowColor={
                          role.current
                            ? 'rgba(74, 222, 128, 0.15)'
                            : 'rgba(139, 92, 246, 0.1)'
                        }
                      >
                        {/* Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-white font-semibold text-base">
                              {role.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-purple-400 text-sm font-medium">
                                {exp.company}
                              </span>
                              {exp.link && (
                                <a
                                  href={exp.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 hover:text-purple-400 transition-colors"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                          {role.current && (
                            <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-green-500/10 text-green-400 rounded-full border border-green-500/20 whitespace-nowrap">
                              Current
                            </span>
                          )}
                        </div>

                        {/* Period */}
                        <p className="text-xs font-mono text-gray-500 mt-2">
                          {role.period}
                        </p>

                        {/* Description (only for first role in a company) */}
                        {roleIndex === 0 && (
                          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </GlassCard>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
