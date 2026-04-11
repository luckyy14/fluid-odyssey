import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

const ContentSection = ({ section }) => (
  <div className="space-y-3">
    {section.type === 'text' && <TextBlock content={section.content} />}
    {section.type === 'skills' && <SkillsGrid skills={section.content} />}
    {section.type === 'projects' && <ProjectCards projects={section.content} />}
    {section.type === 'timeline' && <Timeline experience={section.content} />}
    {section.type === 'stats' && <StatsGrid stats={section.content} />}
  </div>
);

const TextBlock = ({ content }) => (
  <p className="text-[var(--on-surface-variant)] text-sm leading-relaxed">{content}</p>
);

const SkillsGrid = ({ skills }) => {
  const cats = [...new Set(skills.map((s) => s.category))];
  return (
    <div className="space-y-4">
      {cats.map((cat) => (
        <div key={cat}>
          <p className="text-xs uppercase tracking-widest text-[var(--on-surface-variant)] font-bold mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills.filter((s) => s.category === cat).map((s) => (
              <span key={s.name} className="px-3 py-1.5 rounded-full bg-[var(--surface-container)] text-[var(--primary)] text-xs font-medium">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ProjectCards = ({ projects }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {projects.map((p) => (
      <div key={p.name} className="p-4 rounded-[3rem] bg-[var(--surface-container-low)]/80 shadow-[0_20px_40px_var(--shadow-tint)]">
        <h4 className="text-sm font-bold text-[var(--primary)] mb-1">{p.name}</h4>
        <p className="text-xs text-[var(--on-surface-variant)] mb-3 line-clamp-2">{p.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {p.tech.map((t) => (
            <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-[var(--tertiary-container)]/40 text-[var(--tertiary)] font-medium">{t}</span>
          ))}
        </div>
        <div className="flex gap-3">
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--outline)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"><FaGithub size={11} /> Code</a>}
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--outline)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"><ExternalLink size={11} /> Live</a>}
        </div>
      </div>
    ))}
  </div>
);

const Timeline = ({ experience }) => (
  <div className="space-y-3">
    {experience.map((exp) => (
      <div key={exp.company} className="relative pl-5">
        <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full ${exp.roles[0]?.current ? 'bg-[var(--tertiary)] ring-4 ring-[var(--tertiary)]/15' : 'bg-[var(--primary-container)] ring-4 ring-[var(--primary-container)]/10'}`} />
        <h4 className="text-sm font-bold text-[var(--primary)]">{exp.company}</h4>
        {exp.roles.map((r) => (
          <div key={r.title} className="flex items-baseline justify-between mt-0.5">
            <span className="text-xs text-[var(--on-surface-variant)]">{r.title}</span>
            <span className="text-xs text-[var(--outline)] ml-2 shrink-0">{r.period}</span>
          </div>
        ))}
        <p className="text-xs text-[var(--on-surface-variant)] mt-1">{exp.description}</p>
      </div>
    ))}
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3">
    {stats.map((s) => (
      <div key={s.label} className="p-4 rounded-[3rem] bg-[var(--surface-container-low)]/80 text-center shadow-[0_20px_40px_var(--shadow-tint)]">
        <p className="text-2xl font-extrabold text-[var(--primary)]">{s.value}</p>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1 uppercase tracking-wider">{s.label}</p>
      </div>
    ))}
  </div>
);

export default ContentSection;
