import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';
import SceneRenderer from '../SceneRenderer';
import SideRail from './SideRail';
import ThemeToggle from '../ui/ThemeToggle';
import { profile } from '../../data/profile';
import { getPrebaked } from '../../data/prebaked';
import { LLM_STATUS, getEngine } from '../../lib/llmEngine';
import { INTENTS } from '../../lib/recipes';
import { generateScene } from '../../lib/sceneOrchestrator';

const VISITOR_TO_INTENT = {
  recruiter: 'experience',
  developer: 'technical',
  collaborator: 'projects',
  curious: 'personal',
  custom: 'personal',
};

const INTENT_LABELS = {
  skills: 'Stack',
  experience: 'Career',
  contact: 'Reach out',
  projects: 'Projects',
  technical: 'Architecture',
  outcomes: 'Impact',
  philosophy: 'How I work',
  personal: 'About me',
};

const PersonalizedView = ({ visitor, onReset, llmStatus = LLM_STATUS.IDLE, initialSpec = null }) => {
  const startIntent = initialSpec?.intent || VISITOR_TO_INTENT[visitor.type] || 'personal';
  const [activeIntent, setActiveIntent] = useState(startIntent);
  const [question, setQuestion] = useState('');
  const [liveIterator, setLiveIterator] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');
  const [permalinkSpec, setPermalinkSpec] = useState(initialSpec);

  const spec = useMemo(
    () => permalinkSpec || getPrebaked(activeIntent),
    [activeIntent, permalinkSpec],
  );

  // Sections for the side rail = the 8 intents.
  const sections = useMemo(
    () => INTENTS.map((id) => ({ id, title: INTENT_LABELS[id] })),
    [],
  );

  const handleIntentClick = useCallback((id) => {
    setActiveIntent(id);
    setLiveIterator(null);
    setLastQuestion('');
    setPermalinkSpec(null);
    if (typeof history !== 'undefined') history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy || llmStatus !== LLM_STATUS.READY) return;
    const engine = getEngine();
    if (!engine) return;
    setBusy(true);
    setLastQuestion(q);
    setQuestion('');
    setPermalinkSpec(null);
    const iter = generateScene({ question: q, engine });
    const wrapped = (async function* () {
      try {
        for await (const evt of iter) {
          if (evt.type === 'done') {
            setBusy(false);
            if (evt.request_id) {
              history.replaceState(null, '', `#p=${encodeURIComponent(evt.request_id)}`);
            }
          }
          yield evt;
        }
      } finally {
        setBusy(false);
      }
    })();
    setLiveIterator(wrapped);
  }, [question, busy, llmStatus]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh relative z-10"
    >
      <SideRail
        sections={sections}
        activeSection={activeIntent}
        onSectionClick={handleIntentClick}
        llmStatus={llmStatus}
        onReset={onReset}
      />
      <MobileNav onReset={onReset} llmStatus={llmStatus} />

      <div className="lg:pl-24">
        <div className="max-w-2xl mx-auto px-5 pt-24 lg:pt-10 pb-10 lg:max-w-4xl lg:px-12 flex flex-col gap-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between"
          >
            <div className="flex items-center gap-4 lg:block">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-lg font-extrabold text-[var(--bg)] shrink-0 lg:hidden">
                {profile.firstName[0]}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-[var(--accent)] tracking-tight lg:leading-none lg:mb-2">
                  {profile.name}
                </h1>
                <p className="text-xs lg:text-sm text-[var(--fg-muted)] lg:max-w-md">
                  {visitor.label && visitor.label !== 'Custom' ? `Hey, ${visitor.label.toLowerCase()}.` : 'Hey there.'} {' '}
                  Each page below is regenerated for the question you ask.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)] text-[10px] font-bold tracking-widest uppercase">
                {visitor.label}
              </span>
            </div>
          </motion.header>

          {/* Intent selector chips */}
          <div className="flex flex-wrap gap-2">
            {INTENTS.map((id) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleIntentClick(id)}
                className="px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer"
                style={{
                  backgroundColor: activeIntent === id ? 'var(--accent)' : 'var(--surface-1)',
                  color: activeIntent === id ? 'var(--bg)' : 'var(--fg-muted)',
                }}
              >
                {INTENT_LABELS[id]}
              </motion.button>
            ))}
          </div>

          {/* Scene */}
          <SceneRenderer
            spec={liveIterator ? null : spec}
            iterator={liveIterator}
            question={lastQuestion}
          />

          {busy && (
            <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
              <Loader2 size={12} className="animate-spin" /> Composing your page…
            </div>
          )}

          {/* Free-text input — live generation when LLM is READY. */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={llmStatus !== LLM_STATUS.READY || busy}
              placeholder={
                llmStatus === LLM_STATUS.LOADING ? 'AI is warming up — pre-baked pages are live above'
                : llmStatus === LLM_STATUS.READY ? 'Ask anything…'
                : 'AI unavailable on this device — using pre-baked pages'
              }
              className="flex-1 rounded-full bg-[var(--surface-1)] px-5 py-3 text-sm text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none disabled:opacity-60"
              style={{ fontFamily: 'var(--font-family)' }}
            />
            <motion.button
              type="submit"
              disabled={llmStatus !== LLM_STATUS.READY || busy || !question.trim()}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-30 cursor-pointer"
            >
              <Send size={15} />
            </motion.button>
          </form>

          {/* Contact footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-[var(--fg-muted)] mb-3">Want to talk for real?</p>
            <div className="flex justify-center gap-3">
              <a href={`mailto:${profile.email}`} className="px-5 py-2.5 text-xs font-bold rounded-full bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 transition-opacity">
                Email me
              </a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-xs font-bold rounded-full bg-[var(--surface-1)] text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
          <div className="h-8" />
        </div>
      </div>
    </motion.div>
  );
};

const MobileNav = ({ onReset, llmStatus }) => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl rounded-2xl bg-[var(--surface-1)]/85 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 py-3 z-50 lg:hidden">
    <button
      onClick={onReset}
      className="flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--accent)] cursor-pointer group transition-colors"
    >
      <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> back
    </button>
    <div className="flex items-center gap-3">
      {llmStatus === LLM_STATUS.LOADING && <Loader2 size={12} className="animate-spin text-[var(--accent)]" />}
      {llmStatus === LLM_STATUS.READY && (
        <span className="flex items-center gap-1 text-xs text-[var(--accent)] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" /> AI
        </span>
      )}
      <ThemeToggle size="sm" />
      <div className="flex items-center gap-2.5 pl-2.5 border-l border-[var(--outline)]/30">
        <a href={`mailto:${profile.email}`} className="text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors"><FaEnvelope size={13} /></a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors"><FaLinkedin size={13} /></a>
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors"><FaGithub size={13} /></a>
      </div>
    </div>
  </nav>
);

export default PersonalizedView;
