import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import GlassCard from '../ui/GlassCard';
import { projects } from '../../data/profile';

const accentColors = [
  { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', glow: 'rgba(59, 130, 246, 0.2)', text: 'text-blue-400' },
  { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', glow: 'rgba(139, 92, 246, 0.2)', text: 'text-purple-400' },
  { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', glow: 'rgba(236, 72, 153, 0.2)', text: 'text-pink-400' },
  { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', glow: 'rgba(16, 185, 129, 0.2)', text: 'text-emerald-400' },
];

const ProjectsSection = () => {
  return (
    <section id="projects" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-pink-400 tracking-wider uppercase">
            Projects
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2">
            Things I&apos;ve{' '}
            <span className="gradient-text">built</span>
          </h2>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => {
            const accent = accentColors[index % accentColors.length];

            return (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="h-full group" glowColor={accent.glow}>
                  <div className="p-6 flex flex-col h-full">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 font-mono text-lg font-bold"
                          style={{ backgroundColor: accent.bg }}
                        >
                          <span className={accent.text}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                          {project.name}
                        </h3>
                      </div>

                      {/* Links */}
                      <div className="flex items-center gap-2">
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                            aria-label={`GitHub repo for ${project.name}`}
                          >
                            <FaGithub size={18} />
                          </a>
                        )}
                        {project.live && (
                          <a
                            href={project.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                            aria-label={`Live demo for ${project.name}`}
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">
                      {project.description}
                    </p>

                    {/* Tech badges */}
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-xs font-mono rounded-full border transition-colors duration-200"
                          style={{
                            backgroundColor: accent.bg,
                            borderColor: accent.border,
                          }}
                        >
                          <span className={accent.text}>{tech}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
