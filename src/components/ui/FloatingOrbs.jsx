import { motion } from 'framer-motion';

const orbs = [
  {
    size: 300,
    color: 'rgba(59, 130, 246, 0.15)',
    x: '10%',
    y: '20%',
    duration: 20,
  },
  {
    size: 250,
    color: 'rgba(139, 92, 246, 0.12)',
    x: '70%',
    y: '60%',
    duration: 25,
  },
  {
    size: 200,
    color: 'rgba(236, 72, 153, 0.1)',
    x: '80%',
    y: '10%',
    duration: 18,
  },
  {
    size: 350,
    color: 'rgba(59, 130, 246, 0.08)',
    x: '30%',
    y: '70%',
    duration: 22,
  },
  {
    size: 180,
    color: 'rgba(139, 92, 246, 0.1)',
    x: '50%',
    y: '40%',
    duration: 30,
  },
];

const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            left: orb.x,
            top: orb.y,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 20, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingOrbs;
