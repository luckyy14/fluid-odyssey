import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';
import { RotateCcw } from 'lucide-react';
import { profile } from '../../data/profile';
import { LLM_STATUS } from '../../lib/llmEngine';
import ThemeToggle from '../ui/ThemeToggle';

// Compact left rail. Layout:
//   ┌─────────────────────────────┐
//   │  ↺ (restart)                │
//   │  L (avatar) ● (AI dot)      │
//   │ ─────────                   │
//   │  • Stack                    │
//   │  • Career                   │
//   │  • Reach out                │
//   │  …                          │
//   │ ─────────                   │
//   │  ✉  in  gh                  │
//   │  ☼/☾                        │
//   └─────────────────────────────┘
// Width is set so the longest label ("Architecture", 12 chars) fits at the
// chosen text-[10px] tracking-widest size with breathing room. Scrolls
// internally if the viewport is short rather than overflowing.

const SideRail = ({ sections, activeSection, onSectionClick, llmStatus, onReset }) => {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-32 hidden lg:flex flex-col z-40
                 bg-[var(--surface-container-low)]/85 backdrop-blur-2xl
                 border-r border-[var(--outline-variant)]/40
                 shadow-[6px_0_24px_var(--shadow-tint)]"
    >
      {/* Header: restart + avatar + AI dot */}
      <div className="flex flex-col items-center gap-3 px-3 pt-6 pb-4">
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.08, rotate: -12 }}
          whileTap={{ scale: 0.92 }}
          className="w-9 h-9 rounded-full bg-[var(--surface-container)]
                     hover:bg-[var(--surface-container-high)]
                     flex items-center justify-center cursor-pointer
                     transition-colors"
          title="Start over"
          aria-label="Start over"
        >
          <RotateCcw size={13} className="text-[var(--on-surface-variant)]" />
        </motion.button>

        <div className="relative">
          <div
            className="w-11 h-11 rounded-full bg-[var(--primary-container)]
                       flex items-center justify-center text-base font-extrabold text-white
                       shadow-[0_8px_24px_var(--shadow-tint)]"
            title={profile.name}
          >
            {profile.firstName[0]}
          </div>
          {/* AI status indicator: tiny dot riding the avatar's edge. */}
          {llmStatus === LLM_STATUS.READY && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
                         bg-[var(--tertiary)] ring-2 ring-[var(--surface-container-low)]"
              title="Local AI ready"
            />
          )}
          {llmStatus === LLM_STATUS.LOADING && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full
                         bg-[var(--primary)] ring-2 ring-[var(--surface-container-low)]"
              title="Local AI warming up"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--outline-variant)]/50" />

      {/* Section nav — scrolls internally if too tall for viewport. */}
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hide
                      flex flex-col gap-1 px-2 py-4">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSectionClick(sec.id)}
              title={sec.title}
              className={`group flex items-center gap-2 cursor-pointer
                          rounded-md px-2 py-1.5 transition-all
                          ${isActive
                            ? 'bg-[var(--surface-container)]'
                            : 'hover:bg-[var(--surface-container)]/60'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all
                            ${isActive
                              ? 'bg-[var(--primary)] scale-125'
                              : 'bg-[var(--outline)] group-hover:bg-[var(--primary)]'}`}
              />
              <span
                className={`text-[10px] uppercase tracking-widest truncate
                            transition-colors flex-1 text-left
                            ${isActive
                              ? 'text-[var(--primary)] font-bold'
                              : 'text-[var(--on-surface-variant)] group-hover:text-[var(--primary)]'}`}
              >
                {sec.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--outline-variant)]/50" />

      {/* Footer: socials + theme */}
      <div className="flex flex-col items-center gap-3 px-3 py-4">
        <div className="flex items-center gap-3">
          <a
            href={`mailto:${profile.email}`}
            title="Email"
            className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
          >
            <FaEnvelope size={13} />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
          >
            <FaLinkedin size={13} />
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"
          >
            <FaGithub size={13} />
          </a>
        </div>
        <ThemeToggle size="sm" />
      </div>
    </aside>
  );
};

export default SideRail;
