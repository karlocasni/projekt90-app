import React from 'react';
import TopBar from './TopBar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Leaderboard from '../feed/Leaderboard';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <Navbar />

      <div className="flex-1 pt-14 md:pt-16 pb-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex gap-6 items-start">
          <main className="flex-1 min-w-0">{children}</main>

          <aside className="hidden lg:flex flex-col gap-4 w-80 flex-shrink-0 sticky top-20">
            <Leaderboard />
            <div className="ursa-card p-5">
              <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Nadolazeći Izazovi
              </h3>
              <p className="text-sm text-muted-foreground">Uskoro...</p>
            </div>
          </aside>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
