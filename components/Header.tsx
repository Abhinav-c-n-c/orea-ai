import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  extra?: React.ReactNode;
}

export default function Header({ title, subtitle, icon, children, extra }: HeaderProps) {
  return (
    <div className="flex flex-col mb-0 flex-shrink-0 bg-white dark:bg-slate-800 rounded-[4px] shadow-sm border border-primary-100 dark:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          {/* LOGO / ICON BOX */}
          <div className="w-10 h-10 rounded-[4px] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
            {icon ? (
              <div className="text-white w-5 h-5 flex items-center justify-center">{icon}</div>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              {title}
            </div>
            {subtitle && (
              <p className="text-surface-500 dark:text-slate-400 text-sm mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {children}
        </div>
      </div>

      <AnimatePresence>
        {extra && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col"
            style={{ overflow: 'visible' }}
          >
            {/* Animated Divider with Spacing */}
            <div className="px-4">
              <motion.div 
                className="h-px w-full bg-slate-100 dark:bg-slate-700 relative overflow-hidden"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-400/30 to-transparent w-1/2"
                  animate={{ 
                    x: ['-100%', '200%'] 
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </motion.div>
            </div>
            
            <div className="p-4 pt-3">
              {extra}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
