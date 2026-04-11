import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { profile } from '../../data/profile';
import { LLM_STATUS } from '../../lib/llmEngine';
import ThemeToggle from '../ui/ThemeToggle';

const SideRail = ({ sections, activeSection, onSectionClick, llmStatus, onReset }) => {
  return (
    <aside className="fixed left-0 top-0 h-dvh w-20 hidden lg:flex flex-col items-center py-8 z-40 bg-[var(--surface-container-low)]/80 backdrop-blur-2xl shadow-[10px_0_30px_var(--shadow-tint)]">
      {/* Back to start */}
      <motion.button
        onClick={onReset}
        whileHover={{ scale: 1.1, rotate: -15 }}
        whileTap={{ scale: 0.9 }}
        className="w-10 h-10 rounded-full bg-[var(--surface-container)] flex items-center justify-center cursor-pointer mb-1 hover:bg-[var(--surface-container-high)] transition-colors"
        title="Start over"
      >
        <RotateCcw size={14} className="text-[var(--on-surface-variant)]" />
      </motion.button>
      <span className="text-xs tracking-wider uppercase text-[var(--outline)] mb-6">restart</span>

      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-base font-extrabold text-white mb-1 shadow-[0_20px_40px_var(--shadow-tint)]">
        {profile.firstName[0]}
      </div>
      <span className="text-xs tracking-[0.2em] uppercase text-[var(--outline)] mb-6">{profile.firstName}</span>

      {/* Section nav */}
      <div className="flex flex-col gap-6 mt-2">
        {sections.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSectionClick(sec.id)}
              className="flex flex-col items-center gap-1 cursor-pointer group transition-all"
            >
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-[var(--primary)] scale-150' : 'bg-[var(--outline)] group-hover:bg-[var(--primary)] group-hover:scale-125'}`} />
              <span className={`text-xs uppercase tracking-widest transition-colors ${isActive ? 'text-[var(--primary)] font-bold' : 'text-[var(--on-surface-variant)] group-hover:text-[var(--primary)]'}`}>
                {sec.title.length > 8 ? sec.title.slice(0, 7) + '…' : sec.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col items-center gap-4">
        {/* AI status */}
        {llmStatus === LLM_STATUS.READY && (
          <div className="flex flex-col items-center gap-1">
            <Sparkles size={12} className="text-[var(--tertiary)]" />
            <span className="text-xs text-[var(--tertiary)] font-bold uppercase tracking-wider">AI</span>
          </div>
        )}
        {llmStatus === LLM_STATUS.LOADING && (
          <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
        )}

        {/* Theme toggle */}
        <ThemeToggle size="sm" />

        {/* Social links */}
        <div className="flex flex-col gap-3">
          <a href={`mailto:${profile.email}`} className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaEnvelope size={13} /></a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaLinkedin size={13} /></a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaGithub size={13} /></a>
        </div>

        {/* Vertical text */}
        <span className="text-xs tracking-[0.4em] text-[var(--outline)] uppercase" style={{ writingMode: 'vertical-rl' }}>
          © 2025
        </span>
      </div>
    </aside>
  );
};

export default SideRail;
