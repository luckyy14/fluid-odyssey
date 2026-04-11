import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Code, Coffee, Compass, Pen } from 'lucide-react';
import { profile } from '../../data/profile';
import AnimatedText from '../ui/AnimatedText';

const visitorTypes = [
  {
    id: 'recruiter',
    label: 'Hiring',
    fullLabel: 'Recruiter / Hiring Manager',
    emoji: '🔍',
    icon: Briefcase,
    description: 'Scouting talent',
    color: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'developer',
    label: 'Dev',
    fullLabel: 'Fellow Developer',
    emoji: '💻',
    icon: Code,
    description: 'Checking your code',
    color: 'from-purple-500 to-pink-400',
    shadow: 'shadow-purple-500/20',
  },
  {
    id: 'collaborator',
    label: 'Collab',
    fullLabel: 'Potential Collaborator',
    emoji: '🤝',
    icon: Coffee,
    description: 'Let\'s build together',
    color: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'curious',
    label: 'Explore',
    fullLabel: 'Just Exploring',
    emoji: '🧭',
    icon: Compass,
    description: 'Show me around',
    color: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/20',
  },
];

const WelcomeScreen = ({ onVisitorIdentified }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleSelect = (type, e) => {
    onVisitorIdentified(
      { type: type.id, label: type.fullLabel, intro: type.description },
      e.nativeEvent,
    );
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onVisitorIdentified(
      { type: 'custom', label: 'Custom', intro: customInput.trim() },
      e.nativeEvent,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10"
    >
      {/* Avatar / Identity */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-lg shadow-purple-500/30"
      >
        {profile.firstName[0]}
      </motion.div>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl sm:text-6xl font-bold mb-2"
      >
        <span className="gradient-text">{profile.name}</span>
      </motion.h1>

      {/* Animated tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="h-7 mb-8"
      >
        <AnimatedText
          texts={[
            profile.role + ' @ ' + profile.company,
            profile.tagline,
            '3.5+ years building for the web',
          ]}
          className="text-base sm:text-lg text-gray-500"
        />
      </motion.div>

      {/* Question prompt */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-gray-300 text-sm sm:text-base mb-8 font-light"
      >
        What brings you here today?
      </motion.p>

      {/* Visitor type cards */}
      {!showCustom && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-3 mb-6 max-w-lg"
        >
          {visitorTypes.map((type, i) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.08, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredCard(type.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={(e) => handleSelect(type, e)}
              className={`
                relative px-5 py-3 rounded-2xl cursor-pointer
                bg-white/[0.03] border border-white/[0.08]
                hover:border-white/20 hover:bg-white/[0.06]
                transition-colors duration-300
                group overflow-hidden
                ${hoveredCard === type.id ? `shadow-xl ${type.shadow}` : ''}
              `}
            >
              {/* Gradient glow on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${type.color} rounded-2xl blur-xl`}
                style={{ transform: 'scale(0.8)', filter: 'blur(20px)', opacity: hoveredCard === type.id ? 0.12 : 0 }}
              />

              <div className="relative flex items-center gap-2.5">
                <span className="text-xl">{type.emoji}</span>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{type.label}</p>
                  <p className="text-gray-600 text-[11px] leading-tight">{type.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Custom input */}
      {!showCustom && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={() => setShowCustom(true)}
          className="text-xs text-gray-600 hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1.5 group"
        >
          <Pen size={12} className="group-hover:rotate-12 transition-transform" />
          something else entirely
        </motion.button>
      )}

      {showCustom && (
        <motion.form
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          transition={{ duration: 0.3 }}
          onSubmit={handleCustomSubmit}
          className="w-full max-w-sm"
        >
          <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden focus-within:border-purple-500/40 transition-colors">
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="I'm a startup founder looking for..."
              rows={2}
              className="w-full bg-transparent text-white placeholder-gray-700 px-4 py-3 text-sm focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center px-3 pb-2">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
              >
                ← pick a role
              </button>
              <motion.button
                type="submit"
                disabled={!customInput.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 text-xs font-medium rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
              >
                dive in →
              </motion.button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Subtle hint at bottom */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 text-[11px] text-gray-700 font-mono"
      >
        this site adapts to you — powered by in-browser AI
      </motion.p>
    </motion.div>
  );
};

export default WelcomeScreen;
