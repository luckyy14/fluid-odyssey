import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/flow/WelcomeScreen';
import PersonalizedView from './components/flow/PersonalizedView';
import FloatingOrbs from './components/ui/FloatingOrbs';
import RippleTransition from './components/ui/RippleTransition';

function App() {
  const [visitor, setVisitor] = useState(null);
  const [ripple, setRipple] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleVisitorIdentified = useCallback((visitorData, clickEvent) => {
    const origin = clickEvent
      ? { x: clickEvent.clientX, y: clickEvent.clientY }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    setRipple(origin);
    setTransitioning(true);

    setTimeout(() => {
      setVisitor(visitorData);
      setTransitioning(false);
      setTimeout(() => setRipple(null), 500);
    }, 600);
  }, []);

  const handleReset = useCallback(() => {
    setRipple({ x: 60, y: 30 });
    setTransitioning(true);

    setTimeout(() => {
      setVisitor(null);
      setTransitioning(false);
      setTimeout(() => setRipple(null), 500);
    }, 600);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />

      <AnimatePresence mode="wait">
        {ripple && <RippleTransition key="ripple" origin={ripple} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!visitor && !transitioning && (
          <WelcomeScreen key="welcome" onVisitorIdentified={handleVisitorIdentified} />
        )}
        {visitor && !transitioning && (
          <PersonalizedView key="personalized" visitor={visitor} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
