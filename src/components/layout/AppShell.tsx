import React from 'react';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <main className="flex-1 w-full h-full transition-all">
        <div className="max-w-7xl mx-auto w-full h-full">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
