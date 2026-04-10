import { motion } from 'framer-motion';
import ChatWindow from '../chat/ChatWindow';

const suggestedQuestions = [
  'What tech do you use?',
  'Tell me about your experience',
  'What projects have you built?',
  'How can I contact you?',
  'What are you working on now?',
];

const ChatSection = () => {
  return (
    <section id="chat" className="relative py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-mono text-cyan-400 tracking-wider uppercase">
            Chat
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2">
            Ask me{' '}
            <span className="gradient-text">anything</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Curious about my work? Have a question? Chat with the AI version of me!
          </p>
        </motion.div>

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <ChatWindow suggestedQuestions={suggestedQuestions} />
        </motion.div>
      </div>
    </section>
  );
};

export default ChatSection;
