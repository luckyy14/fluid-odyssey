import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import GlassCard from '../ui/GlassCard';

const ContentSection = ({ section }) => {
  return (
    <div>
      {section.title && (
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          {section.title}
        </h2>
      )}

      {section.type === 'text' && <TextBlock content={section.content} />}
      {section.type === 'skills' && <SkillsGrid skills={section.content} />}
      {section.type === 'projects' && <ProjectCards projects={section.content} />}
      {section.type === 'timeline' && <Timeline experience={section.content} />}
      {section.type === 'stats' && <StatsGrid stats={section.content} />}
    </div>
  );
};

const TextBlock = ({ content }) => (
  <GlassCard className="p-5" hover={false}>
    <p className="text-gray-300 text-sm leading-relaxed">{content}</p>
  </GlassCard>
);

const SkillsGrid = ({ skills }) => {
  const categories = [...new Set(skills.map((s) => s.category))];
  const colorMap = {
    frontend: 'from-blue-500 to-cyan-400',
    backend: 'from-green-500 to-emerald-400',
    language: 'from-purple-500 to-pink-400',
    mobile: 'from-orange-500 to-amber-400',
    tools: 'from-cyan-500 to-blue-400',
    devops: 'from-indigo-500 to-violet-400',
    web: 'from-teal-500 to-green-400',
    security: 'from-red-500 to-orange-400',
  };

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-mono mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills
              .filter((s) => s.category === cat)
              .map((skill) => (
                <div key={skill.name} className="group relative">
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-default">
                    {skill.name}
                    <span className="ml-1.5 text-xs text-gray-600">{skill.level}%</span>
                  </div>
                  {/* Skill bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${colorMap[cat] || 'from-purple-500 to-pink-400'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProjectCards = ({ projects }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {projects.map((project, i) => {
      const accentColors = [
        'rgba(59, 130, 246, 0.15)',
        'rgba(139, 92, 246, 0.15)',
        'rgba(236, 72, 153, 0.15)',
        'rgba(16, 185, 129, 0.15)',
      ];
      return (
        <GlassCard key={project.name} className="p-4" glowColor={accentColors[i % 4]}>
          <h3 className="text-white font-semibold text-sm mb-1">{project.name}</h3>
          <p className="text-gray-400 text-xs mb-3 line-clamp-2">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tech.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 border border-white/10 text-gray-500"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <FaGithub size={12} /> Code
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <ExternalLink size={12} /> Live
              </a>
            )}
          </div>
        </GlassCard>
      );
    })}
  </div>
);

const Timeline = ({ experience }) => (
  <div className="space-y-4 relative">
    {/* Vertical line */}
    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent" />

    {experience.map((exp) => (
      <div key={exp.company} className="relative pl-8">
        {/* Dot */}
        <div
          className={`absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center ${
            exp.roles[0]?.current
              ? 'border-green-400 bg-green-400/20'
              : 'border-purple-500/50 bg-purple-500/10'
          }`}
        >
          {exp.roles[0]?.current && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>

        <GlassCard className="p-4" hover={false}>
          <h3 className="text-white font-semibold text-sm">{exp.company}</h3>
          <div className="mt-2 space-y-1">
            {exp.roles.map((role) => (
              <div key={role.title} className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">{role.title}</span>
                <span className="text-gray-600 text-[11px] font-mono">{role.period}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-2">{exp.description}</p>
        </GlassCard>
      </div>
    ))}
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3">
    {stats.map((stat) => (
      <GlassCard key={stat.label} className="p-4 text-center" hover>
        <p className="text-2xl font-bold gradient-text">{stat.value}</p>
        <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
      </GlassCard>
    ))}
  </div>
);

export default ContentSection;
