import { useState, useCallback, useEffect, useRef } from 'react';
import { getResponse } from '../lib/chatResponses';
import {
  initEngine,
  chat as llmChat,
  isWebGPUAvailable,
  setProgressCallback,
  LLM_STATUS,
} from '../lib/llmEngine';

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [llmStatus, setLlmStatus] = useState(LLM_STATUS.IDLE);
  const [loadProgress, setLoadProgress] = useState('');
  const chatHistory = useRef([]);

  // Boot up the LLM on mount
  useEffect(() => {
    if (!isWebGPUAvailable()) {
      setLlmStatus(LLM_STATUS.ERROR);
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "Hey! I'm Lakshay's AI assistant. Your browser doesn't support WebGPU, so I'm running on a simpler engine — but I can still answer questions about my work, skills, and projects!",
        },
      ]);
      return;
    }

    setLlmStatus(LLM_STATUS.LOADING);
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: '🧠 Loading my brain into your browser... This takes a moment on first visit (model gets cached after that). Ask me anything while I warm up!',
      },
    ]);

    setProgressCallback((progress) => {
      setLoadProgress(progress.text || '');
    });

    initEngine()
      .then(() => {
        setLlmStatus(LLM_STATUS.READY);
        setMessages((prev) => [
          ...prev,
          {
            id: 'ready',
            sender: 'bot',
            text: "✨ Brain loaded! I'm running a real AI model right in your browser — no server needed. Ask me anything about my work, skills, or projects!",
          },
        ]);
      })
      .catch(() => {
        setLlmStatus(LLM_STATUS.ERROR);
        setMessages((prev) => [
          ...prev,
          {
            id: 'fallback',
            sender: 'bot',
            text: "Couldn't load the AI model, but no worries — I can still answer your questions with my backup brain!",
          },
        ]);
      });
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (isTyping) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      let response;

      if (llmStatus === LLM_STATUS.READY) {
        // Use the real LLM
        try {
          response = await llmChat(text, chatHistory.current);
          chatHistory.current.push(
            { role: 'user', content: text },
            { role: 'assistant', content: response },
          );
        } catch {
          response = getResponse(text);
        }
      } else {
        // Fallback to pattern matching
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
        response = getResponse(text);
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    },
    [isTyping, llmStatus],
  );

  return { messages, isTyping, sendMessage, llmStatus, loadProgress };
};

export default useChat;
