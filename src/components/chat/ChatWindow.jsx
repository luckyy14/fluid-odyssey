import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChat from '../../hooks/useChat';

const ChatWindow = ({ suggestedQuestions = [] }) => {
  const { messages, isTyping, sendMessage } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <GlassCard className="overflow-hidden" hover={false}>
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
            LB
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0a]" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">AI Lakshay</h4>
          <p className="text-green-400 text-xs">Online</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-80 sm:h-96 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 inline-flex gap-1">
              <motion.span
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
              />
              <motion.span
                className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </GlassCard>
  );
};

export default ChatWindow;
