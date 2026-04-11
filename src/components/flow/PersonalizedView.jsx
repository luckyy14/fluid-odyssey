import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, ChevronRight, Send } from 'lucide-react';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';
import { getContentForVisitor } from '../../lib/contentGenerator';
import { initEngine, chat as llmChat, isWebGPUAvailable, setProgressCallback, LLM_STATUS } from '../../lib/llmEngine';
import ContentSection from './ContentSection';
import SideRail from './SideRail';
import ThemeToggle from '../ui/ThemeToggle';
import { profile } from '../../data/profile';

const PersonalizedView = ({ visitor, onReset }) => {
  const content = getContentForVisitor(visitor.type);
  const [open, setOpen] = useState(new Set());
  const [blocks, setBlocks] = useState([]);
  const [llm, setLlm] = useState(LLM_STATUS.IDLE);
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [activeSection, setActiveSection] = useState(content.sections[0]?.id);
  const history = useRef([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (!isWebGPUAvailable()) { setLlm(LLM_STATUS.ERROR); return; }
    setLlm(LLM_STATUS.LOADING);
    setProgressCallback((p) => setProgress(p.text || ''));
    initEngine().then(() => setLlm(LLM_STATUS.READY)).catch(() => setLlm(LLM_STATUS.ERROR));
  }, []);

  useEffect(() => {
    if (llm !== LLM_STATUS.READY || blocks.length > 0) return;
    const ctx = visitor.type === 'custom' ? visitor.intro : `I'm a ${visitor.label.toLowerCase()}. ${visitor.intro}`;
    setBusy(true);
    llmChat(`The visitor said: "${ctx}". Write a warm 2-sentence welcome. Be yourself — Lakshay.`, [])
      .then((r) => { history.current.push({ role: 'assistant', content: r }); setBlocks([{ id: 'welcome', content: r }]); })
      .catch(() => {}).finally(() => setBusy(false));
  }, [llm, visitor, blocks.length]);

  const ask = useCallback(async (prompt, label) => {
    if (busy) return;
    setBusy(true);
    try {
      if (llm === LLM_STATUS.READY) {
        const r = await llmChat(prompt, history.current);
        history.current.push({ role: 'user', content: prompt }, { role: 'assistant', content: r });
        setBlocks((prev) => [...prev, { id: `ai-${Date.now()}`, title: label, content: r }]);
      } else {
        setBlocks((prev) => [...prev, { id: `f-${Date.now()}`, title: label, content: `AI is loading — reach me at ${profile.email}!` }]);
      }
    } catch { setBlocks((prev) => [...prev, { id: `e-${Date.now()}`, title: label, content: `Something went wrong. Email me at ${profile.email}` }]); }
    setBusy(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 150);
  }, [busy, llm]);

  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="min-h-dvh relative z-10">
      {/* Desktop side rail */}
      <SideRail sections={content.sections} activeSection={activeSection} onSectionClick={(id) => { setActiveSection(id); document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' }); }} llmStatus={llm} onReset={onReset} />

      {/* Mobile nav pill (hidden on lg) */}
      <MobileNav onReset={onReset} llmStatus={llm} progress={progress} />

      {/* Main — shifted right on desktop for side rail */}
      <div className="lg:pl-24">
        <div className="max-w-2xl mx-auto px-5 pt-24 lg:pt-10 pb-10 lg:max-w-5xl lg:px-12 flex flex-col gap-8">
          {/* Header */}
          <motion.header initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
            <div className="flex items-center gap-4 lg:block">
              <div className="w-12 h-12 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-lg font-extrabold text-white shrink-0 shadow-[0_20px_40px_var(--shadow-tint)] lg:hidden">
                {profile.firstName[0]}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-5xl font-extrabold text-[var(--primary)] tracking-tight lg:leading-none lg:mb-4">{profile.name}</h1>
                <p className="text-xs lg:text-lg text-[var(--on-surface-variant)] lg:max-w-md lg:leading-relaxed">{content.greeting}</p>
              </div>
            </div>
            {/* Desktop badges */}
            <div className="hidden lg:flex gap-3">
              <span className="px-5 py-2 rounded-full bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)] text-xs font-bold tracking-widest uppercase">{visitor.label}</span>
              {llm === LLM_STATUS.READY && (
                <span className="px-5 py-2 rounded-full bg-[var(--surface-container-low)] text-[var(--tertiary)] text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--tertiary)] animate-pulse" /> AI Active
                </span>
              )}
            </div>
          </motion.header>

          {/* AI welcome */}
          <AnimatePresence>
            {blocks.filter((b) => b.id === 'welcome').map((b) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="rounded-2xl rounded-tl-md bg-[var(--surface-container-low)] px-5 py-4 lg:px-8 lg:py-6 lg:max-w-2xl">
                <p className="text-sm lg:text-base text-[var(--on-surface)] leading-relaxed">{b.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && blocks.length === 0 && <TypingDots />}

          {/* Topics + input — PRIMARY interaction */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--on-surface-variant)] font-bold text-center lg:text-left">Ask me about</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {content.topics.map((t) => (
                <motion.button key={t.label} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                  onClick={() => ask(t.prompt, t.label)} disabled={busy}
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-[var(--surface-container-low)]/70 shadow-[0_20px_40px_var(--shadow-tint)] text-[var(--primary)] hover:bg-[var(--surface-container)] transition-colors cursor-pointer disabled:opacity-30 whitespace-nowrap">
                  {t.label}
                </motion.button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!question.trim()) return; ask(question, question); setQuestion(''); }} className="flex items-center gap-2 max-w-lg lg:max-w-xl">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} disabled={busy}
                placeholder="or type anything..."
                className="flex-1 rounded-full bg-[var(--surface-container-low)] px-5 py-3 text-sm text-[var(--on-surface)] placeholder-[var(--outline)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-40" />
              <motion.button type="submit" disabled={busy || !question.trim()} whileTap={{ scale: 0.9 }}
                className="p-3 rounded-full bg-[var(--primary-container)] text-white disabled:opacity-20 cursor-pointer hover:bg-[var(--secondary-container)] transition-colors">
                <Send size={15} />
              </motion.button>
            </form>
          </div>

          {/* AI blocks */}
          <div ref={endRef}>
            <AnimatePresence>
              {blocks.filter((b) => b.id !== 'welcome').map((b) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="mb-3">
                  <div className="rounded-2xl bg-[var(--surface-container-low)]/80 backdrop-blur-md shadow-[0_20px_40px_var(--shadow-tint)] p-5 lg:p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-[var(--primary)]" />
                      <span className="text-xs font-semibold text-[var(--primary)]">{b.title}</span>
                    </div>
                    <p className="text-sm lg:text-base text-[var(--on-surface-variant)] leading-relaxed whitespace-pre-line">{b.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {busy && blocks.length > 0 && <TypingDots />}

          {/* MOBILE: Accordion sections */}
          <div className="space-y-2 lg:hidden">
            {content.sections.map((sec, i) => (
              <motion.div key={sec.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                <button onClick={() => toggle(sec.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors cursor-pointer">
                  <span className="text-sm font-semibold text-[var(--primary)]">{sec.title}</span>
                  <motion.span animate={{ rotate: open.has(sec.id) ? 90 : 0 }} className="text-[var(--outline)]"><ChevronRight size={16} /></motion.span>
                </button>
                <AnimatePresence>
                  {open.has(sec.id) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="pt-3 pb-1 px-2"><ContentSection section={sec} /></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* DESKTOP: Two-column flow — no overlap */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
            {content.sections.map((sec, i) => (
              <motion.div key={sec.id} id={`sec-${sec.id}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="rounded-2xl bg-[var(--surface-container-low)]/60 backdrop-blur-md p-6 lg:p-8 shadow-[0_20px_40px_var(--shadow-tint)]">
                <h2 className="text-xs tracking-[0.3em] text-[var(--primary)]/50 uppercase font-bold mb-5">{sec.title}</h2>
                <ContentSection section={sec} />
              </motion.div>
            ))}
          </div>

          {/* Contact */}
          <div className="text-center">
            <p className="text-xs text-[var(--on-surface-variant)] mb-3">Want to talk for real?</p>
            <div className="flex justify-center gap-3">
              <a href={`mailto:${profile.email}`} className="px-5 py-2.5 text-xs font-bold rounded-full bg-[var(--primary-container)] text-white hover:bg-[var(--secondary-container)] transition-colors">Email me</a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-xs font-bold rounded-full bg-[var(--surface-container-low)] text-[var(--primary)] hover:bg-[var(--surface-container)] transition-colors">LinkedIn</a>
            </div>
          </div>
          <div className="h-8" />
        </div>
      </div>
    </motion.div>
  );
};

/* Mobile top nav — hidden on lg */
const MobileNav = ({ onReset, llmStatus, progress }) => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl rounded-2xl bg-[var(--surface)]/80 backdrop-blur-xl shadow-[0_20px_40px_var(--shadow-tint)] flex items-center justify-between px-4 sm:px-6 py-3 z-50 lg:hidden">
    <button onClick={onReset} className="flex items-center gap-1 text-xs text-[var(--on-surface-variant)] hover:text-[var(--primary)] cursor-pointer group transition-colors">
      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> back
    </button>
    <div className="flex items-center gap-3">
      {llmStatus === LLM_STATUS.LOADING && <Loader2 size={12} className="animate-spin text-[var(--primary)]" />}
      {llmStatus === LLM_STATUS.LOADING && progress && <span className="text-xs text-[var(--primary)]/50 font-mono truncate max-w-[100px]">{progress}</span>}
      {llmStatus === LLM_STATUS.READY && <span className="flex items-center gap-1 text-xs text-[var(--tertiary)] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-[var(--tertiary)] animate-pulse" />AI</span>}
      <ThemeToggle size="sm" />
      <div className="flex items-center gap-2.5 pl-2.5 border-l border-[var(--outline-variant)]/15">
        <a href={`mailto:${profile.email}`} className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaEnvelope size={13} /></a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaLinkedin size={13} /></a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[var(--outline)] hover:text-[var(--primary)] transition-colors"><FaGithub size={13} /></a>
      </div>
    </div>
  </nav>
);

const TypingDots = () => (
  <div className="flex items-center gap-2 px-1 py-2">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
      ))}
    </div>
    <span className="text-xs text-[var(--on-surface-variant)]">thinking...</span>
  </div>
);

export default PersonalizedView;
