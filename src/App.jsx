import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/flow/WelcomeScreen';
import PersonalizedView from './components/flow/PersonalizedView';
import FloatingOrbs from './components/ui/FloatingOrbs';

function App() {
  const [visitor, setVisitor] = useState(null);

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      <AnimatePresence mode="wait">
        {!visitor ? (
          <WelcomeScreen key="welcome" onVisitorIdentified={setVisitor} />
        ) : (
          <PersonalizedView key="personalized" visitor={visitor} onReset={() => setVisitor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
