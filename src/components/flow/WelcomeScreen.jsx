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
      {/* Left column — identity (mobile: stacked center, desktop: left-aligned) */}
      <div className="text-center lg:text-left lg:flex-1">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="w-16 h-16 rounded-full bg-[#0077b6] flex items-center justify-center text-2xl font-extrabold text-white mb-6 shadow-[0_20px_40px_rgba(0,93,144,0.2)] mx-auto lg:mx-0"
        >
          {profile.firstName[0]}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-[#005d90] leading-none mb-3"
        >
          {profile.firstName}
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="h-7 mb-6 lg:mb-8">
          <AnimatedText
            texts={[`${profile.role} @ ${profile.company}`, profile.tagline, '3.5+ years on the web']}
            className="text-base sm:text-lg lg:text-xl text-[#404850] font-light"
          />
        </motion.div>

        {/* Desktop-only: intro paragraph + skill tags */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="hidden lg:block">
          <p className="text-[#404850] text-lg leading-relaxed max-w-lg mb-6">{profile.intro}</p>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-[#ecf5fb] text-[#005d90] text-xs font-medium">{s}</span>
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
          className="text-[#141d21] text-sm sm:text-base font-medium mb-6 text-center lg:text-left"
        >
          What brings you here?
        </motion.p>

        {/* Role pills — mobile: row wrap, desktop: stacked cards */}
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
                className="px-5 py-3 rounded-full bg-white/70 backdrop-blur-md shadow-[0_8px_24px_rgba(0,93,144,0.06)] hover:shadow-[0_12px_32px_rgba(0,93,144,0.12)] transition-shadow cursor-pointer lg:rounded-2xl lg:px-6 lg:py-4 lg:flex lg:items-center lg:justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-lg">{r.emoji}</span>
                  <span className="text-sm font-semibold text-[#005d90]">{r.label}</span>
                  <span className="hidden lg:inline text-xs text-[#707881]">— {r.sub}</span>
                </span>
                <ChevronRight size={16} className="hidden lg:block text-[#bfc7d1]" />
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
            className="text-xs text-[#707881] hover:text-[#005d90] transition-colors cursor-pointer mx-auto lg:mx-0 block"
          >
            or tell me in your own words →
          </motion.button>
        )}

        {/* Custom input */}
        {showCustom && (
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="w-full max-w-sm lg:max-w-none">
            <div className="rounded-3xl bg-white/70 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,93,144,0.08)] overflow-hidden">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="I'm a startup founder looking for..."
                rows={3} className="w-full bg-transparent text-[#141d21] placeholder-[#bfc7d1] px-5 py-4 text-sm focus:outline-none resize-none" autoFocus />
              <div className="flex justify-between items-center px-4 pb-3">
                <button type="button" onClick={() => setShowCustom(false)} className="text-[11px] text-[#707881] hover:text-[#005d90] cursor-pointer">← roles</button>
                <button type="submit" disabled={!text.trim()} className="px-5 py-1.5 text-xs font-bold rounded-full bg-[#0077b6] text-white disabled:opacity-25 cursor-pointer hover:bg-[#005d90] transition-colors">dive in →</button>
              </div>
            </div>
          </motion.form>
        )}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-[#bfc7d1] tracking-widest uppercase">
        adaptive portfolio · powered by in-browser AI
      </motion.p>
    </motion.main>
  );
};

export default WelcomeScreen;
