import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { profile, skills } from '../../data/profile';
import AnimatedText from '../ui/AnimatedText';

const roles = [
  { id: 'recruiter', emoji: '🔍', label: 'Hiring', sub: 'Scouting talent' },
  { id: 'developer', emoji: '💻', label: 'Developer', sub: 'Fellow dev here' },
  { id: 'collaborator', emoji: '🤝', label: 'Collaborate', sub: "Let's build" },
  { id: 'curious', emoji: '🧭', label: 'Explore', sub: 'Just looking around' },
];

const topSkills = skills.filter((s) => s.level >= 85).map((s) => s.name);

const WelcomeScreen = ({ onVisitorIdentified }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [text, setText] = useState('');

  const pick = (role, e) => {
    onVisitorIdentified({ type: role.id, label: role.label, intro: role.sub }, e.nativeEvent);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onVisitorIdentified({ type: 'custom', label: 'Custom', intro: text.trim() }, e.nativeEvent);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative z-10 lg:flex-row lg:items-center lg:justify-between lg:px-20 lg:gap-20 lg:max-w-7xl lg:mx-auto"
    >
      {/* Left column — identity */}
      <div className="text-center lg:text-left lg:flex-1">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="w-16 h-16 rounded-full bg-[#0077b6] flex items-center justify-center text-[1.5rem] font-extrabold text-white mb-6 shadow-[0_20px_40px_rgba(0,93,144,0.15)] mx-auto lg:mx-0"
        >
          {profile.firstName[0]}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[3.571rem] sm:text-[5rem] lg:text-[5.714rem] font-extrabold tracking-tight text-[#94ccff] leading-none mb-3"
        >
          {profile.firstName}
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="h-7 mb-6 lg:mb-8">
          <AnimatedText
            texts={[`${profile.role} @ ${profile.company}`, profile.tagline, '3.5+ years on the web']}
            className="text-[1rem] sm:text-[1.125rem] lg:text-[1.286rem] text-[#8899aa] font-light"
          />
        </motion.div>

        {/* Desktop-only: intro paragraph + skill tags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="hidden lg:block">
          <p className="text-[#8899aa] text-[1.125rem] leading-relaxed max-w-lg mb-6">{profile.intro}</p>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-[#112240]/70 text-[#94ccff] text-[0.75rem] font-medium backdrop-blur-md">{s}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right column — role selection */}
      <div className="lg:flex-1 lg:max-w-md w-full">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-[#e0e8f0] text-[0.875rem] sm:text-[1rem] font-medium mb-6 text-center lg:text-left"
        >
          What brings you here?
        </motion.p>

        {/* Role pills */}
        {!showCustom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-wrap justify-center gap-2.5 max-w-md mb-5 lg:flex-col lg:gap-3 lg:max-w-none"
          >
            {roles.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.07, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.03, x: 4 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => pick(r, e)}
                className="px-5 py-3 rounded-full bg-[#112240]/70 backdrop-blur-md shadow-[0_20px_40px_rgba(0,93,144,0.15)] hover:shadow-[0_20px_40px_rgba(0,93,144,0.25)] transition-shadow cursor-pointer lg:rounded-[3rem] lg:px-6 lg:py-4 lg:flex lg:items-center lg:justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[1.125rem]">{r.emoji}</span>
                  <span className="text-[0.875rem] font-semibold text-[#94ccff]">{r.label}</span>
                  <span className="hidden lg:inline text-[0.75rem] text-[#8899aa]">— {r.sub}</span>
                </span>
                <ChevronRight size={16} className="hidden lg:block text-[#3d5060]" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Custom toggle */}
        {!showCustom && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            onClick={() => setShowCustom(true)}
            className="text-[0.75rem] text-[#3d5060] hover:text-[#94ccff] transition-colors cursor-pointer mx-auto lg:mx-0 block"
          >
            or tell me in your own words →
          </motion.button>
        )}

        {/* Custom input */}
        {showCustom && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-sm lg:max-w-none">
            <div className="rounded-[3rem] bg-[#112240]/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,93,144,0.15)] overflow-hidden">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="I'm a startup founder looking for..."
                rows={3} className="w-full bg-transparent text-[#e0e8f0] placeholder-[#3d5060] px-5 py-4 text-[0.875rem] focus:outline-none resize-none" autoFocus />
              <div className="flex justify-between items-center px-4 pb-3">
                <button type="button" onClick={() => setShowCustom(false)} className="text-[0.786rem] text-[#3d5060] hover:text-[#94ccff] cursor-pointer">← roles</button>
                <button type="submit" disabled={!text.trim()} className="px-5 py-1.5 text-[0.75rem] font-bold rounded-full bg-[#0077b6] text-white disabled:opacity-25 cursor-pointer hover:bg-[#005c70] transition-colors">dive in →</button>
              </div>
            </div>
          </motion.form>
        )}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[0.714rem] text-[#3d5060] tracking-widest uppercase">
        adaptive portfolio · powered by in-browser AI
      </motion.p>
    </motion.main>
  );
};

export default WelcomeScreen;
