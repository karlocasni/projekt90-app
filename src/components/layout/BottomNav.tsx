import { Link, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Dumbbell, Trophy, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Zajednica', icon: Home, path: '/feed' },
  { label: 'Tečajevi', icon: PlaySquare, path: '/lectures' },
  { label: 'P90', icon: Dumbbell, path: '/training', isCenter: true },
  { label: 'Napredak', icon: Trophy, path: '/progress' },
  { label: 'Profil', icon: User, path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#161616]/90 backdrop-blur-xl z-50 px-4 md:px-8 border-t border-white/5 pb-safe flex items-center justify-center">
      <div className="max-w-md w-full flex justify-between items-center relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -top-6 flex flex-col items-center justify-center z-50 group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isActive 
                      ? "bg-primary shadow-[0_0_30px_rgba(212,255,0,0.4)]" 
                      : "bg-primary/90 hover:bg-primary shadow-[0_0_20px_rgba(212,255,0,0.2)]"
                  )}
                >
                  <item.icon className="w-8 h-8 text-black stroke-[2.5px]" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all flex-1",
                isActive ? "text-primary" : "text-white/50 hover:text-white/80"
              )}
            >
              <div className="relative p-1.5 rounded-xl transition-all flex flex-col items-center">
                <item.icon className={cn("w-6 h-6 transition-all duration-300", isActive ? "stroke-[2.5px] drop-shadow-[0_0_8px_rgba(212,255,0,0.5)]" : "stroke-2")} />
                {isActive && (
                  <motion.div 
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary" 
                  />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
