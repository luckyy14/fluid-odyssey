import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, ChevronRight, Send } from 'lucide-react';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';
import { getContentForVisitor } from '../../lib/contentGenerator';
import {
  initEngine,
  chat as llmChat,
  isWebGPUAvailable,
  setProgressCallback,
  LLM_STATUS,
} from '../../lib/llmEngine';
import ContentSection from './ContentSection';
import GlassCard from '../ui/GlassCard';
import { profile } from '../../data/profile';

const PersonalizedView = ({ visitor, onReset }) => {
  const content = getContentForVisitor(visitor.type);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [dynamicBlocks, setDynamicBlocks] = useState([]);
  const [llmStatus, setLlmStatus] = useState(LLM_STATUS.IDLE);
  const [loadProgress, setLoadProgress] = useState('');
  const [generating, setGenerating] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const chatHistory = useRef([]);
  const bottomRef = useRef(null);
  const dynamicRef = useRef(null);

  // Boot LLM
  useEffect(() => {
    if (!isWebGPUAvailable()) {
      setLlmStatus(LLM_STATUS.ERROR);
      return;
    }
    setLlmStatus(LLM_STATUS.LOADING);
    setProgressCallback((p) => setLoadProgress(p.text || ''));

    initEngine()
      .then(() => setLlmStatus(LLM_STATUS.READY))
      .catch(() => setLlmStatus(LLM_STATUS.ERROR));
  }, []);

  // Generate AI welcome when ready
  useEffect(() => {
    if (llmStatus !== LLM_STATUS.READY || dynamicBlocks.length > 0) return;

    const ctx =
      visitor.type === 'custom'
        ? visitor.intro
        : `I'm a ${visitor.label.toLowerCase()}. ${visitor.intro}`;

    setGenerating(true);
    llmChat(
      `The visitor said: "${ctx}". Write a warm 2-sentence welcome. Be yourself — Lakshay.`,
      [],
    )
      .then((r) => {
        chatHistory.current.push({ role: 'assistant', content: r });
        setDynamicBlocks([{ id: 'ai-welcome', title: '', content: r }]);
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, [llmStatus, visitor, dynamicBlocks.length]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const askAI = useCallback(
    async (prompt, label) => {
      if (generating) return;
      setGenerating(true);

      const scrollTarget = dynamicRef.current;

      if (llmStatus === LLM_STATUS.READY) {
        try {
          const response = await llmChat(prompt, chatHistory.current);
          chatHistory.current.push(
            { role: 'user', content: prompt },
            { role: 'assistant', content: response },
          );
          setDynamicBlocks((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, title: label, content: response },
          ]);
        } catch {
          setDynamicBlocks((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              title: label,
              content: `Hmm, hit a snag. Reach the real me at ${profile.email}!`,
            },
          ]);
        }
      } else {
        setDynamicBlocks((prev) => [
          ...prev,
          {
            id: `wait-${Date.now()}`,
            title: label,
            content: `AI is still loading — drop me a line at ${profile.email} in the meantime!`,
          },
        ]);
      }

      setGenerating(false);
      setTimeout(() => scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 150);
    },
    [generating, llmStatus],
  );

  const handleCustomQuestion = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    const q = customQuestion.trim();
    setCustomQuestion('');
    askAI(q, q);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen relative z-10"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            restart
          </button>

          <div className="flex items-center gap-3">
            {llmStatus === LLM_STATUS.LOADING && (
              <div className="flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin text-yellow-500" />
                <span className="text-[10px] text-yellow-500/60 font-mono max-w-[150px] truncate hidden sm:block">
                  {loadProgress || 'loading brain...'}
                </span>
              </div>
            )}
            {llmStatus === LLM_STATUS.READY && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI ready
              </span>
            )}

            {/* Contact links inline */}
            <div className="flex items-center gap-2 border-l border-white/[0.06] pl-3">
              <a href={`mailto:${profile.email}`} className="text-gray-600 hover:text-white transition-colors" title="Email">
                <FaEnvelope size={13} />
              </a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors" title="LinkedIn">
                <FaLinkedin size={13} />
              </a>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white transition-colors" title="GitHub">
                <FaGithub size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header — compact */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-2"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-purple-500/20">
            {profile.firstName[0]}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-xs text-gray-500">{content.greeting}</p>
          </div>
        </motion.div>

        {/* AI welcome bubble */}
        <AnimatePresence>
          {dynamicBlocks
            .filter((b) => b.id === 'ai-welcome')
            .map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative"
              >
                <div className="bg-purple-500/[0.06] border border-purple-500/10 rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{block.content}</p>
                </div>
                {/* Chat-bubble tail */}
                <div className="absolute -left-1 top-3 w-3 h-3 bg-purple-500/[0.06] border-l border-t border-purple-500/10 rotate-[-45deg]" />
              </motion.div>
            ))}
        </AnimatePresence>

        {generating && dynamicBlocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-1"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">thinking of something personal...</span>
          </motion.div>
        )}

        {/* Expandable content sections */}
        <div className="space-y-2">
          {content.sections.map((section, i) => {
            const isOpen = expandedSections.has(section.id);
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                {/* Clickable header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                >
                  <span className="text-sm text-white font-medium flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blue-500 to-purple-500 group-hover:h-5 transition-all" />
                    {section.title}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-600"
                  >
                    <ChevronRight size={16} />
                  </motion.span>
                </button>

                {/* Expanding content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 pl-3">
                        <ContentSection section={section} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* AI conversation blocks */}
        <div ref={dynamicRef}>
          <AnimatePresence>
            {dynamicBlocks
              .filter((b) => b.id !== 'ai-welcome')
              .map((block) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="mb-4"
                >
                  <GlassCard className="p-4" hover={false} glowColor="rgba(139, 92, 246, 0.1)">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-purple-400" />
                      <span className="text-xs text-gray-400 font-medium">{block.title}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {block.content}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* Generating indicator */}
        {generating && dynamicBlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-1 py-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-purple-400"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">generating...</span>
          </motion.div>
        )}

        {/* Topic pills — scrollable row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-mono text-center">
            ask me about
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            {content.topics.map((topic) => (
              <motion.button
                key={topic.label}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => askAI(topic.prompt, topic.label)}
                disabled={generating}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white/[0.03] border border-white/[0.08] text-gray-500 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/[0.06] transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                {topic.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Free-form question input */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onSubmit={handleCustomQuestion}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="or ask anything..."
            disabled={generating}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-purple-500/30 transition-colors disabled:opacity-40"
          />
          <motion.button
            type="submit"
            disabled={generating || !customQuestion.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </motion.button>
        </motion.form>

        {/* Bottom breathing room */}
        <div className="h-12" ref={bottomRef} />
      </div>
    </motion.div>
  );
};

export default PersonalizedView;
