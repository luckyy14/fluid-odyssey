import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
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
  const [dynamicBlocks, setDynamicBlocks] = useState([]);
  const [llmStatus, setLlmStatus] = useState(LLM_STATUS.IDLE);
  const [loadProgress, setLoadProgress] = useState('');
  const [generating, setGenerating] = useState(false);
  const chatHistory = useRef([]);
  const bottomRef = useRef(null);

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

  // Generate initial personalized greeting via LLM when ready
  useEffect(() => {
    if (llmStatus !== LLM_STATUS.READY) return;
    if (dynamicBlocks.length > 0) return;

    const visitorContext =
      visitor.type === 'custom'
        ? visitor.intro
        : `I'm a ${visitor.label.toLowerCase()}. ${visitor.intro}`;

    const prompt = `The visitor said: "${visitorContext}". Write a warm, personalized 2-3 sentence welcome for them. Address what they might be looking for based on who they are. Be yourself — Lakshay.`;

    setGenerating(true);
    llmChat(prompt, [])
      .then((response) => {
        chatHistory.current.push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: response },
        );
        setDynamicBlocks([{ id: 'ai-welcome', type: 'ai-text', title: '', content: response }]);
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, [llmStatus, visitor, dynamicBlocks.length]);

  const handleTopicClick = useCallback(
    async (topic) => {
      if (generating) return;
      setGenerating(true);

      const scrollTarget = bottomRef.current;

      if (llmStatus === LLM_STATUS.READY) {
        try {
          const response = await llmChat(topic.prompt, chatHistory.current);
          chatHistory.current.push(
            { role: 'user', content: topic.prompt },
            { role: 'assistant', content: response },
          );
          setDynamicBlocks((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              type: 'ai-text',
              title: topic.label,
              content: response,
            },
          ]);
        } catch {
          setDynamicBlocks((prev) => [
            ...prev,
            {
              id: `fallback-${Date.now()}`,
              type: 'ai-text',
              title: topic.label,
              content: "I'd love to tell you more about this! Reach me at " + profile.email,
            },
          ]);
        }
      } else {
        setDynamicBlocks((prev) => [
          ...prev,
          {
            id: `fallback-${Date.now()}`,
            type: 'ai-text',
            title: topic.label,
            content:
              "The AI model is still loading. In the meantime — feel free to explore the sections above, or reach out directly at " +
              profile.email,
          },
        ]);
      }

      setGenerating(false);
      setTimeout(() => scrollTarget?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    [generating, llmStatus],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen relative z-10"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Start over
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              {visitor.type === 'custom' ? 'Custom' : visitor.label}
            </span>
            {llmStatus === LLM_STATUS.READY && (
              <span className="px-2 py-0.5 text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> AI Active
              </span>
            )}
            {llmStatus === LLM_STATUS.LOADING && (
              <span className="px-2 py-0.5 text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Loading AI
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading progress banner */}
      {llmStatus === LLM_STATUS.LOADING && loadProgress && (
        <div className="max-w-4xl mx-auto px-4 pt-2">
          <div className="text-[11px] text-yellow-400/60 font-mono truncate text-center">
            {loadProgress}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            <span className="gradient-text">{profile.firstName}</span>
            <span className="text-gray-500 text-lg sm:text-xl font-normal ml-2">
              {profile.role}
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">{content.greeting}</p>
        </motion.div>

        {/* AI personalized welcome */}
        <AnimatePresence>
          {dynamicBlocks
            .filter((b) => b.id === 'ai-welcome')
            .map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard className="p-5" hover={false} glowColor="rgba(59, 130, 246, 0.15)">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{block.content}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Static content sections */}
        {content.sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
          >
            <ContentSection section={section} />
          </motion.div>
        ))}

        {/* AI-generated dynamic blocks */}
        <AnimatePresence>
          {dynamicBlocks
            .filter((b) => b.id !== 'ai-welcome')
            .map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard className="p-5" hover={false} glowColor="rgba(139, 92, 246, 0.15)">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-purple-400" />
                    <h3 className="text-white font-semibold text-sm">{block.title}</h3>
                    <span className="text-[10px] text-purple-400/60 font-mono">AI generated</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {block.content}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Generating indicator */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-4"
          >
            <Loader2 size={16} className="animate-spin text-purple-400" />
            <span className="text-sm text-gray-500">Thinking...</span>
          </motion.div>
        )}

        {/* Topic buttons — explore more */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-500 text-xs uppercase tracking-wider font-mono mb-3 text-center">
            Want to know more? Click a topic
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {content.topics.map((topic) => (
              <button
                key={topic.label}
                onClick={() => handleTopicClick(topic)}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Contact footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8 border-t border-white/5 mt-8"
        >
          <p className="text-gray-500 text-sm mb-3">Want to talk for real?</p>
          <div className="flex justify-center gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 transition-transform"
            >
              Email me
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
            >
              LinkedIn
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
            >
              GitHub
            </a>
          </div>
        </motion.div>

        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
};

export default PersonalizedView;
