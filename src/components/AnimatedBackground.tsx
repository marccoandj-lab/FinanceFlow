import { motion } from 'framer-motion';

interface Props {
  isDark: boolean;
}

export default function AnimatedBackground({ isDark }: Props) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-violet-600' : 'bg-violet-300'}`}
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-3xl opacity-15 ${isDark ? 'bg-blue-600' : 'bg-blue-300'}`}
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        className={`absolute -bottom-32 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-10 ${isDark ? 'bg-emerald-600' : 'bg-emerald-300'}`}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-1.5 h-1.5 rounded-full ${isDark ? 'bg-violet-400' : 'bg-violet-400'} opacity-30`}
          style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 4) * 20}%` }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
