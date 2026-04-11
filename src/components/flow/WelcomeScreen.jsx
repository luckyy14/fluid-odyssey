import { useState } from 'react';
import { motion } from 'framer-motion';
import { profile } from '../../data/profile';
import AnimatedText from '../ui/AnimatedText';

const roles = [
  { id: 'recruiter', emoji: '🔍', label: 'Hiring', sub: 'Scouting talent' },
  { id: 'developer', emoji: '💻', label: 'Developer', sub: 'Fellow dev here' },
  { id: 'collaborator', emoji: '🤝', label: 'Collaborate', sub: "Let's build" },
  { id: 'curious', emoji: '🧭', label: 'Explore', sub: 'Just looking around' },
];

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
      className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 relative z-10"
    >
      {/* Identity */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="w-16 h-16 rounded-full bg-[#0077b6] flex items-center justify-center text-2xl font-extrabold text-white mb-6 shadow-[0_20px_40px_rgba(0,93,144,0.2)]"
      >
        {profile.firstName[0]}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#005d90] leading-none mb-3"
      >
        {profile.firstName}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="h-7 mb-10"
      >
        <AnimatedText
          texts={[`${profile.role} @ ${profile.company}`, profile.tagline, '3.5+ years on the web']}
          className="text-base sm:text-lg text-[#404850] font-light"
        />
      </motion.div>

      {/* Question */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="text-[#141d21] text-sm sm:text-base font-medium mb-6"
      >
        What brings you here?
      </motion.p>

      {/* Role pills */}
      {!showCustom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-wrap justify-center gap-2.5 max-w-md mb-5"
        >
          {roles.map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.07, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => pick(r, e)}
              className="px-5 py-3 rounded-full bg-white/70 backdrop-blur-md shadow-[0_8px_24px_rgba(0,93,144,0.06)] hover:shadow-[0_12px_32px_rgba(0,93,144,0.12)] transition-shadow cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{r.emoji}</span>
                <span className="text-sm font-semibold text-[#005d90]">{r.label}</span>
              </span>
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
          className="text-xs text-[#707881] hover:text-[#005d90] transition-colors cursor-pointer"
        >
          or tell me in your own words →
        </motion.button>
      )}

      {/* Custom input */}
      {showCustom && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="w-full max-w-sm"
        >
          <div className="rounded-3xl bg-white/70 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,93,144,0.08)] overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I'm a startup founder looking for..."
              rows={2}
              className="w-full bg-transparent text-[#141d21] placeholder-[#bfc7d1] px-5 py-4 text-sm focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center px-4 pb-3">
              <button type="button" onClick={() => setShowCustom(false)} className="text-[11px] text-[#707881] hover:text-[#005d90] cursor-pointer">
                ← roles
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-5 py-1.5 text-xs font-bold rounded-full bg-[#0077b6] text-white disabled:opacity-25 cursor-pointer hover:bg-[#005d90] transition-colors"
              >
                dive in →
              </button>
            </div>
          </div>
        </motion.form>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-5 text-[10px] text-[#bfc7d1] tracking-widest uppercase"
      >
        adaptive portfolio · powered by in-browser AI
      </motion.p>
    </motion.main>
  );
};

export default WelcomeScreen;
