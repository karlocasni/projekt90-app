import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Clock, Check } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { XP_THRESHOLDS, calculateLevel } from '../lib/xp';
import Leaderboard from '../components/feed/Leaderboard';

// Monday–Sunday labels in Croatian
const DAY_LABELS = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRecentWeekdays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const jsDay = d.getDay(); // 0=Sun … 6=Sat
    const idx = jsDay === 0 ? 6 : jsDay - 1; // remap to Mon=0 … Sun=6
    return {
      label: DAY_LABELS[idx],
      key: d.toISOString().slice(0, 10),
      isToday: i === 6,
      idx
    };
  }).filter(day => day.idx < 5); // Only keep Mon-Fri (indices 0-4)
}

export default function Progress() {
  const { user, profile } = useAuth();
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set());

  const xp = profile?.xp ?? 0;
  const level = calculateLevel(xp);
  const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = level < 10 ? XP_THRESHOLDS[level] : currentThreshold + 500;
  const levelRange = nextThreshold - currentThreshold;
  const levelProgress = levelRange > 0 ? (xp - currentThreshold) / levelRange : 1;
  const xpToNext = Math.max(0, nextThreshold - xp);
  const strokeOffset = CIRCUMFERENCE * (1 - Math.min(levelProgress, 1));

  // Stats derived from cumulative XP
  const totalPosts = Math.max(0, Math.floor(xp / 50));
  const calories = totalPosts * 250;
  const trainingHours = Math.floor(totalPosts * 1.2);
  const achievements = Math.max(0, level - 1);

  // Fetch user's posts from last 7 days (no composite index needed — equality + limit)
  useEffect(() => {
    if (!user) return;
    getDocs(
      query(collection(db, 'posts'), where('authorId', '==', user.uid), limit(50)),
    )
      .then((snap) => {
        const sevenAgo = new Date();
        sevenAgo.setDate(sevenAgo.getDate() - 6);
        sevenAgo.setHours(0, 0, 0, 0);
        const days = new Set<string>();
        snap.docs.forEach((d) => {
          const ts = d.data().createdAt as Timestamp | undefined;
          if (!ts) return;
          const date = ts.toDate();
          if (date >= sevenAgo) days.add(date.toISOString().slice(0, 10));
        });
        setActiveDays(days);
      })
      .catch(() => {});
  }, [user]);

  const weekDays = getRecentWeekdays();

  const stats = [
    {
      label: 'Treninzi',
      value: totalPosts.toString(),
      icon: Flame,
      color: 'text-orange-400',
    },
    {
      label: 'Kalorije',
      value: calories >= 1000 ? `${(calories / 1000).toFixed(1)}k` : calories.toString(),
      icon: Target,
      color: 'text-primary',
    },
    {
      label: 'Sati',
      value: `${trainingHours}h`,
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      label: 'Postignuća',
      value: achievements.toString(),
      icon: Trophy,
      color: 'text-yellow-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 max-w-2xl mx-auto pb-24 space-y-6"
    >
      {/* Page header */}
      <header>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white">
          NAPREDAK
        </h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest mt-1">
          Tvoj put do vrha
        </p>
      </header>

      {/* XP Ring card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="ursa-card p-8 flex flex-col items-center"
      >
        {/* Circular progress ring */}
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="#D4FF00"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Razina
            </span>
            <span className="text-5xl font-black text-white leading-none">{level}</span>
          </div>
        </div>

        {/* XP info below ring */}
        <div className="mt-5 text-center w-full max-w-xs">
          <p className="text-primary font-black text-2xl">
            {xp.toLocaleString()}{' '}
            <span className="text-sm font-bold text-primary/70">XP</span>
          </p>
          {level < 10 ? (
            <p className="text-muted-foreground text-sm mt-1">
              Još{' '}
              <span className="text-white font-bold">{xpToNext.toLocaleString()} XP</span>{' '}
              do razine {level + 1}
            </p>
          ) : (
            <p className="text-primary font-black text-sm mt-1 uppercase tracking-widest">
              Maksimalna razina!
            </p>
          )}

          {/* Linear progress bar */}
          <div className="mt-4 bg-white/10 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(levelProgress * 100, 100)}%` }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-bold">
            <span>Razina {level}</span>
            <span>{level < 10 ? `Razina ${level + 1}` : 'MAX'}</span>
          </div>
        </div>
      </motion.div>

      {/* Weekly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ursa-card p-6"
      >
        <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-5">
          Tjedna Aktivnost
        </h2>
        <div className="flex justify-between">
          {weekDays.map((day) => {
            const active = activeDays.has(day.key);
            return (
              <div key={day.key} className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active
                      ? 'bg-primary shadow-[0_0_14px_rgba(212,255,0,0.45)]'
                      : day.isToday
                      ? 'bg-white/10 ring-1 ring-primary/40'
                      : 'bg-white/5'
                  }`}
                >
                  {active && <Check className="w-4 h-4 text-black stroke-[2.5px]" />}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + i * 0.07 }}
            className="ursa-card p-5 flex flex-col items-center justify-center text-center group"
          >
            <stat.icon
              className={`w-7 h-7 mb-2 ${stat.color} group-hover:scale-110 transition-transform`}
            />
            <div className="text-3xl font-black text-white">{stat.value}</div>
            <div className="text-[11px] text-white/50 uppercase font-semibold mt-0.5 tracking-wide">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Trophy className="text-primary w-5 h-5" /> Rang Lista
          </h2>
          <span className="text-[11px] font-black text-primary uppercase tracking-widest">
            Sezona 1
          </span>
        </div>
        <Leaderboard />
      </motion.div>
    </motion.div>
  );
}
