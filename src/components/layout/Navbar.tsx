import { Link, useLocation } from 'react-router-dom';
import { Home, PlaySquare, Dumbbell, User, Flame, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import XPBadge from '../ui/XPBadge';

const navItems = [
  { label: 'Feed', icon: Home, path: '/feed' },
  { label: 'Tečajevi', icon: PlaySquare, path: '/lectures' },
  { label: 'Trening', icon: Dumbbell, path: '/training' },
  { label: 'Profil', icon: User, path: '/profile' },
];

export default function Navbar() {
  const location = useLocation();
  const { profile } = useAuth();

  const avatarSrc =
    profile?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`;

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 glass z-50 px-6 items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
        <Flame className="w-6 h-6 text-primary fill-primary" />
        <span>PROJEKT<span className="text-primary">90</span></span>
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isActive
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(190,242,100,0.3)]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-4 h-4", !isActive && "text-white")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/messages"
          className={cn(
            'p-2 rounded-full transition-colors',
            location.pathname.startsWith('/messages')
              ? 'text-primary'
              : 'text-white/60 hover:text-white hover:bg-white/5',
          )}
          aria-label="Poruke"
        >
          <MessageCircle className="w-5 h-5" />
        </Link>
        {profile && <XPBadge xp={profile.xp ?? 0} compact />}
        <div className="w-8 h-8 rounded-full bg-accent border border-white/10 overflow-hidden">
          <img src={avatarSrc} alt="Avatar" />
        </div>
      </div>
    </nav>
  );
}
