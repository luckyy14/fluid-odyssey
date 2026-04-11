import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AnimatedText = ({
  texts = [],
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const stateRef = useRef({
    currentTextIndex: 0,
    isDeleting: false,
    currentDisplay: '',
  });

  useEffect(() => {
    let timerId;

    const tick = () => {
      const state = stateRef.current;
      const currentFullText = texts[state.currentTextIndex] || '';

      if (!state.isDeleting) {
        if (state.currentDisplay.length < currentFullText.length) {
          state.currentDisplay = currentFullText.slice(
            0,
            state.currentDisplay.length + 1,
          );
          setDisplayText(state.currentDisplay);
          timerId = setTimeout(tick, typingSpeed);
        } else {
          timerId = setTimeout(() => {
            state.isDeleting = true;
            tick();
          }, pauseDuration);
        }
      } else {
        if (state.currentDisplay.length > 0) {
          state.currentDisplay = state.currentDisplay.slice(0, -1);
          setDisplayText(state.currentDisplay);
          timerId = setTimeout(tick, deletingSpeed);
        } else {
          state.isDeleting = false;
          state.currentTextIndex =
            (state.currentTextIndex + 1) % texts.length;
          timerId = setTimeout(tick, typingSpeed);
        }
      }
    };

    tick();

    return () => clearTimeout(timerId);
  }, [texts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-[1em] bg-[var(--primary-container)] ml-1 align-middle"
      />
    </span>
  );
};

export default AnimatedText;
