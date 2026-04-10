import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';
import { profile } from '../../data/profile';

const socialLinks = [
  {
    icon: <FaGithub size={20} />,
    href: profile.github,
    label: 'GitHub',
  },
  {
    icon: <FaLinkedin size={20} />,
    href: profile.linkedin,
    label: 'LinkedIn',
  },
  {
    icon: <HiOutlineMail size={20} />,
    href: `mailto:${profile.email}`,
    label: 'Email',
  },
];

const Footer = () => {
  return (
    <footer className="relative">
      {/* Gradient border top */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <motion.span
            className="font-mono text-2xl font-bold gradient-text"
            whileHover={{ scale: 1.1 }}
          >
            {'{L}'}
          </motion.span>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('mailto') ? undefined : '_blank'}
                rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={link.label}
              >
                {link.icon}
              </motion.a>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-sm text-gray-500 font-mono">
            Built with chaos and code
          </p>

          {/* Copyright */}
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
