import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Code, Coffee, MessageCircle } from 'lucide-react';
import { profile } from '../../data/profile';
import AnimatedText from '../ui/AnimatedText';
import GlassCard from '../ui/GlassCard';

const visitorTypes = [
  {
    id: 'recruiter',
    label: 'Recruiter / Hiring Manager',
    icon: Briefcase,
    description: "I'm looking at potential candidates",
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'developer',
    label: 'Fellow Developer',
    icon: Code,
    description: "I'm a dev checking out your work",
    color: 'from-purple-500 to-pink-400',
  },
  {
    id: 'collaborator',
    label: 'Potential Collaborator',
    icon: Coffee,
    description: 'Interested in working together',
    color: 'from-amber-500 to-orange-400',
  },
  {
    id: 'curious',
    label: 'Just Exploring',
    icon: User,
    description: 'Just curious about what you do',
    color: 'from-green-500 to-emerald-400',
  },
];

const WelcomeScreen = ({ onVisitorIdentified }) => {
  const [step, setStep] = useState('intro'); // intro → choose → custom
  const [customInput, setCustomInput] = useState('');

  const handleSelect = (type) => {
    onVisitorIdentified({
      type: type.id,
      label: type.label,
      intro: type.description,
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onVisitorIdentified({
      type: 'custom',
      label: 'Custom',
      intro: customInput.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10"
    >
      <div className="max-w-2xl w-full text-center">
        {/* Name + Intro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm font-mono text-purple-400 tracking-widest uppercase mb-4">
            Welcome to my world
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold mb-4">
            <span className="text-white">Hey, I&apos;m </span>
            <span className="gradient-text">{profile.firstName}</span>
          </h1>
          <div className="h-8 mb-6">
            <AnimatedText
              texts={[profile.role, `@ ${profile.company}`, profile.tagline]}
              className="text-lg sm:text-xl text-gray-400"
            />
          </div>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-10">
            {profile.intro}
          </p>
        </motion.div>

        {/* Step: Choose who you are */}
        {step === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-white font-medium text-lg mb-6">
              Tell me a bit about yourself so I can tailor this for you
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {visitorTypes.map((type, i) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <GlassCard className="p-4 cursor-pointer text-left" hover>
                    <button
                      onClick={() => handleSelect(type)}
                      className="w-full flex items-start gap-3 cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}
                      >
                        <type.icon size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{type.label}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{type.description}</p>
                      </div>
                    </button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              onClick={() => setStep('custom')}
              className="text-sm text-gray-500 hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <MessageCircle size={14} />
              Or tell me in your own words
            </motion.button>
          </motion.div>
        )}

        {/* Step: Custom text input */}
        {step === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-white font-medium text-lg mb-4">
              Tell me who you are and what you&apos;re looking for
            </p>
            <form onSubmit={handleCustomSubmit} className="max-w-md mx-auto">
              <GlassCard className="p-1" hover={false}>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. I'm a startup founder looking for a React expert to join our team..."
                  rows={3}
                  className="w-full bg-transparent text-white placeholder-gray-600 px-4 py-3 text-sm focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-between items-center px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => setStep('intro')}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    ← Back to options
                  </button>
                  <button
                    type="submit"
                    disabled={!customInput.trim()}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:scale-105 transition-transform"
                  >
                    Let&apos;s go →
                  </button>
                </div>
              </GlassCard>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
