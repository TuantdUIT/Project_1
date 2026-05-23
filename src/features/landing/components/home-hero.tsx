import { Sigma, Triangle, Grid3X3, Pi, Variable, FunctionSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomeHero() {
  return (
    <section className="relative py-32 overflow-hidden bg-white">
      {/* Floating Icon Containers - Math Signatures with Styled Layout */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sigma - Top Left */}
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-blue-200 shadow-[0_0_30px_rgba(186,230,253,0.8)] flex items-center justify-center text-blue-500 border border-white/50"
        >
          <Sigma size={40} strokeWidth={1.5} />
        </motion.div>
        
        {/* Triangle - Top Right */}
        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[5%] right-[25%] w-28 h-28 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 shadow-[0_0_35px_rgba(167,243,208,0.8)] flex items-center justify-center text-emerald-600 border border-white/50"
        >
          <Triangle size={44} strokeWidth={1.5} />
        </motion.div>

        {/* Grid3X3 - Middle Left */}
        <motion.div 
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[45%] left-[10%] w-26 h-26 rounded-full bg-gradient-to-br from-emerald-100 to-green-300 shadow-[0_0_30px_rgba(110,231,183,0.6)] flex items-center justify-center text-green-700 border border-white/50"
        >
          <Grid3X3 size={42} strokeWidth={1.5} />
        </motion.div>

        {/* Pi - Middle Right */}
        <motion.div 
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-[40%] right-[12%] w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 shadow-[0_0_30px_rgba(191,219,254,0.8)] flex items-center justify-center text-blue-600 border border-white/50"
        >
          <Pi size={40} strokeWidth={1.5} />
        </motion.div>

        {/* FunctionSquare - Bottom Left */}
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[15%] left-[25%] w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 shadow-[0_0_30px_rgba(165,180,252,0.7)] flex items-center justify-center text-indigo-700 border border-white/50"
        >
          <FunctionSquare size={40} strokeWidth={1.5} />
        </motion.div>

        {/* Variable - Bottom Right */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute bottom-[10%] right-[30%] w-26 h-26 rounded-full bg-gradient-to-br from-emerald-200 to-green-400 shadow-[0_0_35px_rgba(52,211,153,0.6)] flex items-center justify-center text-green-800 border border-white/50"
        >
          <Variable size={42} strokeWidth={1.5} />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-7xl md:text-6xl font-black text-indigo-deep tracking-tighter leading-none">
            Love Math - Do Math
          </h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-lg text-on-surface-variant font-medium max-w-2xl mx-auto"
        >
          BHP Math is where learning math becomes easier
        </motion.p>
      </div>
    </section>
  );
}
