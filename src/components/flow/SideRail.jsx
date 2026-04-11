import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub } from 'react-icons/fa';
import { Sparkles, Loader2 } from 'lucide-react';
import { profile } from '../../data/profile';
import { LLM_STATUS } from '../../lib/llmEngine';

const SideRail = ({ sections, activeSection, onSectionClick, llmStatus, onReset }) => {
  return (
    <aside className="fixed left-0 top-0 h-dvh w-20 hidden lg:flex flex-col items-center py-8 z-40 bg-[#112240]/80 backdrop-blur-2xl shadow-[10px_0_30px_rgba(0,93,144,0.1)]">
      {/* Avatar */}
      <motion.button
        onClick={onReset}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-11 h-11 rounded-full bg-[#0077b6] flex items-center justify-center text-base font-extrabold text-white mb-2 cursor-pointer shadow-[0_20px_40px_rgba(0,93,144,0.15)]"
      >
        {profile.firstName[0]}
      </motion.button>
      <span className="text-xs tracking-[0.2em] uppercase text-[#3d5060] mb-8">v1.0</span>

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
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-[#94ccff] scale-150' : 'bg-[#3d5060] group-hover:bg-[#94ccff] group-hover:scale-125'}`} />
              <span className={`text-xs uppercase tracking-widest transition-colors ${isActive ? 'text-[#94ccff] font-bold' : 'text-[#8899aa] group-hover:text-[#94ccff]'}`}>
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
            <Sparkles size={12} className="text-[#83d3e1]" />
            <span className="text-xs text-[#83d3e1] font-bold uppercase tracking-wider">AI</span>
          </div>
        )}
        {llmStatus === LLM_STATUS.LOADING && (
          <Loader2 size={14} className="animate-spin text-[#94ccff]" />
        )}

        {/* Social links */}
        <div className="flex flex-col gap-3">
          <a href={`mailto:${profile.email}`} className="text-[#3d5060] hover:text-[#94ccff] transition-colors"><FaEnvelope size={13} /></a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#3d5060] hover:text-[#94ccff] transition-colors"><FaLinkedin size={13} /></a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[#3d5060] hover:text-[#94ccff] transition-colors"><FaGithub size={13} /></a>
        </div>

        {/* Vertical text */}
        <span className="text-xs tracking-[0.4em] text-[#3d5060] uppercase" style={{ writingMode: 'vertical-rl' }}>
          © 2025
        </span>
      </div>
    </aside>
  );
};

export default SideRail;
