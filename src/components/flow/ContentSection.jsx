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
  <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">{content}</p>
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
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {projects.map((p) => (
      <div key={p.name} className="p-5 rounded-2xl bg-[var(--surface-container-low)]/80 shadow-[0_20px_40px_var(--shadow-tint)]">
        <h4 className="text-sm font-bold text-[var(--primary)] mb-2">{p.name}</h4>
        <p className="text-xs text-[var(--on-surface-variant)] mb-3 leading-relaxed">{p.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.tech.map((t) => (
            <span key={t} className="px-2.5 py-1 text-xs rounded-full bg-[var(--tertiary-container)]/40 text-[var(--tertiary)] font-medium">{t}</span>
          ))}
        </div>
        <div className="flex gap-4">
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--outline)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"><FaGithub size={12} /> Code</a>}
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--outline)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"><ExternalLink size={12} /> Live</a>}
        </div>
      </div>
    ))}
  </div>
);

const Timeline = ({ experience }) => (
  <div className="space-y-5">
    {experience.map((exp) => (
      <div key={exp.company} className="relative pl-6">
        <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ${exp.roles[0]?.current ? 'bg-[var(--tertiary)] ring-4 ring-[var(--tertiary)]/15' : 'bg-[var(--primary-container)] ring-4 ring-[var(--primary-container)]/10'}`} />
        <h4 className="text-sm font-bold text-[var(--primary)] mb-1">{exp.company}</h4>
        {exp.roles.map((r) => (
          <div key={r.title} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mt-1">
            <span className="text-sm text-[var(--on-surface-variant)]">{r.title}</span>
            <span className="text-xs text-[var(--outline)] sm:ml-2 shrink-0">{r.period}</span>
          </div>
        ))}
        <p className="text-xs text-[var(--on-surface-variant)] mt-2 leading-relaxed">{exp.description}</p>
      </div>
    ))}
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-2 gap-4">
    {stats.map((s) => (
      <div key={s.label} className="p-5 rounded-2xl bg-[var(--surface-container-low)]/80 text-center shadow-[0_20px_40px_var(--shadow-tint)]">
        <p className="text-2xl font-extrabold text-[var(--primary)]">{s.value}</p>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1 uppercase tracking-wider">{s.label}</p>
      </div>
    ))}
  </div>
);

export default ContentSection;
