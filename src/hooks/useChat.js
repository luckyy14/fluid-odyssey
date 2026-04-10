import { useState, useCallback } from 'react';
import { getResponse } from '../lib/chatResponses';

const INITIAL_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hey there! I'm the AI version of Lakshay. Ask me anything about my work, skills, or projects. I don't bite... I'm just a bunch of pattern-matched responses for now!",
};

const useChat = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    (text) => {
      if (isTyping) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      // Simulate typing delay for natural feel
      const typingDelay = Math.min(text.length * 30 + 500, 2000);

      setTimeout(() => {
        const response = getResponse(text);
        const botMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response,
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, typingDelay);
    },
    [isTyping],
  );

  return { messages, isTyping, sendMessage };
};

export default useChat;
