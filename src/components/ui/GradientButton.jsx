import { motion } from 'framer-motion';

const GradientButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
}) => {
  const baseClasses =
    'relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer';

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
      text-white shadow-lg shadow-purple-500/25
      hover:shadow-purple-500/40 hover:scale-105
    `,
    outline: `
      bg-transparent text-white
      border border-transparent
      hover:scale-105
    `,
  };

  const content = (
    <motion.span
      className="relative z-10 flex items-center gap-2"
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`${baseClasses} ${variants[variant]} ${className}`}
      >
        {variant === 'outline' && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]">
            <span className="flex h-full w-full rounded-[11px] bg-[#0a0a0a]" />
          </span>
        )}
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {variant === 'outline' && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]">
          <span className="flex h-full w-full rounded-[11px] bg-[#0a0a0a]" />
        </span>
      )}
      {content}
    </button>
  );
};

export default GradientButton;
