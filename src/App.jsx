import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/flow/WelcomeScreen';
import PersonalizedView from './components/flow/PersonalizedView';
import FluidBackground from './components/ui/FluidBackground';
import RippleTransition from './components/ui/RippleTransition';
import WaterLoader from './components/ui/WaterLoader';
import { ThemeContext, useThemeProvider } from './hooks/useTheme';
import {
  initEngine,
  isWebGPUAvailable,
  setProgressCallback,
  parseProgress,
  LLM_STATUS,
} from './lib/llmEngine';
import { hashToSpec, loadSpec } from './lib/specCache';

function App() {
  const themeCtx = useThemeProvider();
  const [visitor, setVisitor] = useState(null);
  const [ripple, setRipple] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [llmStatus, setLlmStatus] = useState(LLM_STATUS.IDLE);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState('');
  const [permalinkSpec, setPermalinkSpec] = useState(null);

  // Permalink hash bootstrap — #p=<id> reads from IndexedDB; #s=<b64> decodes inline.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const sid = params.get('p');
    const blob = params.get('s');
    if (sid) {
      loadSpec(sid).then((spec) => {
        if (spec) {
          setPermalinkSpec(spec);
          setVisitor({ type: 'permalink', label: 'Shared', intro: '' });
        }
      });
    } else if (blob) {
      const spec = hashToSpec(blob);
      if (spec) {
        setPermalinkSpec(spec);
        setVisitor({ type: 'permalink', label: 'Shared', intro: '' });
      }
    }
  }, []);

  // Start loading model immediately on mount
  useEffect(() => {
    if (!isWebGPUAvailable()) {
      setLlmStatus(LLM_STATUS.ERROR);
      return;
    }
    setLlmStatus(LLM_STATUS.LOADING);
    setProgressCallback((p) => {
      setLoadProgress(parseProgress(p));
      setLoadText(p.text || '');
    });
    initEngine()
      .then(() => setLlmStatus(LLM_STATUS.READY))
      .catch(() => setLlmStatus(LLM_STATUS.ERROR));
  }, []);

  const handleVisitorIdentified = useCallback((data, e) => {
    const origin = e ? { x: e.clientX, y: e.clientY } : null;
    setRipple(origin);
    setTransitioning(true);
    setTimeout(() => {
      setVisitor(data);
      setTransitioning(false);
      setTimeout(() => setRipple(null), 600);
    }, 500);
  }, []);

  const handleReset = useCallback(() => {
    setRipple({ x: 40, y: 30 });
    setTransitioning(true);
    setTimeout(() => {
      setVisitor(null);
      setTransitioning(false);
      setTimeout(() => setRipple(null), 600);
    }, 500);
  }, []);

  return (
    <ThemeContext.Provider value={themeCtx}>
      <div className="min-h-dvh relative overflow-hidden bg-[var(--surface)] theme-transition">
        <FluidBackground />

        {/* Water fill loader — shows during model download on ALL pages */}
        <AnimatePresence>
          {llmStatus === LLM_STATUS.LOADING && (
            <WaterLoader key="water" progress={loadProgress} statusText={loadText} />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {ripple && <RippleTransition key="ripple" origin={ripple} />}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {!visitor && !transitioning && (
            <WelcomeScreen key="welcome" onVisitorIdentified={handleVisitorIdentified} />
          )}
          {visitor && !transitioning && (
            <PersonalizedView
              key="personal"
              visitor={visitor}
              onReset={handleReset}
              llmStatus={llmStatus}
              initialSpec={permalinkSpec}
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
