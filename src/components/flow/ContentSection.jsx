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
  <p className="text-[#8899aa] text-[0.875rem] leading-relaxed">{content}</p>
);

const SkillsGrid = ({ skills }) => {
  const cats = [...new Set(skills.map((s) => s.category))];
  return (
    <div className="space-y-4">
      {cats.map((cat) => (
        <div key={cat}>
          <p className="text-[0.714rem] uppercase tracking-widest text-[#8899aa] font-bold mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills.filter((s) => s.category === cat).map((s) => (
              <span key={s.name} className="px-3 py-1.5 rounded-full bg-[#152a4a] text-[#94ccff] text-[0.75rem] font-medium">
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
      <div key={p.name} className="p-4 rounded-[3rem] bg-[#112240]/80 shadow-[0_20px_40px_rgba(0,93,144,0.15)]">
        <h4 className="text-[0.875rem] font-bold text-[#94ccff] mb-1">{p.name}</h4>
        <p className="text-[0.75rem] text-[#8899aa] mb-3 line-clamp-2">{p.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {p.tech.map((t) => (
            <span key={t} className="px-2 py-0.5 text-[0.714rem] rounded-full bg-[#004f59]/40 text-[#83d3e1] font-medium">{t}</span>
          ))}
        </div>
        <div className="flex gap-3">
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-[0.75rem] text-[#3d5060] hover:text-[#94ccff] flex items-center gap-1 transition-colors"><FaGithub size={11} /> Code</a>}
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" className="text-[0.75rem] text-[#3d5060] hover:text-[#94ccff] flex items-center gap-1 transition-colors"><ExternalLink size={11} /> Live</a>}
        </div>
      </div>
    ))}
  </div>
);

const Timeline = ({ experience }) => (
  <div className="space-y-3">
    {experience.map((exp) => (
      <div key={exp.company} className="relative pl-5">
        <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full ${exp.roles[0]?.current ? 'bg-[#83d3e1] ring-4 ring-[#83d3e1]/15' : 'bg-[#0077b6] ring-4 ring-[#0077b6]/10'}`} />
        <h4 className="text-[0.875rem] font-bold text-[#94ccff]">{exp.company}</h4>
        {exp.roles.map((r) => (
          <div key={r.title} className="flex items-baseline justify-between mt-0.5">
            <span className="text-[0.75rem] text-[#8899aa]">{r.title}</span>
            <span className="text-[0.714rem] text-[#3d5060] ml-2 shrink-0">{r.period}</span>
          </div>
        ))}
        <p className="text-[0.786rem] text-[#8899aa] mt-1">{exp.description}</p>
      </div>
    ))}
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3">
    {stats.map((s) => (
      <div key={s.label} className="p-4 rounded-[3rem] bg-[#112240]/80 text-center shadow-[0_20px_40px_rgba(0,93,144,0.15)]">
        <p className="text-[1.5rem] font-extrabold text-[#94ccff]">{s.value}</p>
        <p className="text-[0.714rem] text-[#8899aa] mt-1 uppercase tracking-wider">{s.label}</p>
      </div>
    ))}
  </div>
);

export default ContentSection;
