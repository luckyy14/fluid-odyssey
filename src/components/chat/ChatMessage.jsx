import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`
          max-w-[80%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed
          ${
            isBot
              ? 'bg-white/5 text-gray-200 rounded-2xl rounded-bl-md'
              : 'bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 text-white rounded-2xl rounded-br-md'
          }
        `}
      >
        {message.text}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
