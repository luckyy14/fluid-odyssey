import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/flow/WelcomeScreen';
import PersonalizedView from './components/flow/PersonalizedView';
import FluidBackground from './components/ui/FluidBackground';
import RippleTransition from './components/ui/RippleTransition';

function App() {
  const [visitor, setVisitor] = useState(null);
  const [ripple, setRipple] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

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
    <div className="min-h-dvh relative overflow-hidden bg-[#f4faff]">
      <FluidBackground variant={visitor ? 'light' : 'light'} />
      <AnimatePresence mode="wait">
        {ripple && <RippleTransition key="ripple" origin={ripple} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!visitor && !transitioning && (
          <WelcomeScreen key="welcome" onVisitorIdentified={handleVisitorIdentified} />
        )}
        {visitor && !transitioning && (
          <PersonalizedView key="personal" visitor={visitor} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
