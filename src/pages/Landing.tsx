import { Flame, ArrowRight, CheckCircle2, Zap, Users, Trophy } from 'lucide-react';
import { useState } from 'react';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { signInMock } = useAuth();

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-bounce">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Pridruži se 10,000+ Polaznika</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
            POMAKNI SVOJE <br />
            <span className="text-gradient">GRANICE</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Elitna zajednica za fitness visokih performansi. Tečajevi, svakodnevni treninzi i pleme koje te gura prema vrhu.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-black rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(190,242,100,0.4)]"
            >
              Postani Član <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 glass rounded-full font-bold text-lg hover:bg-white/10 transition-colors">
              Pogledaj Trailer
            </button>
          </div>

          <button 
            onClick={signInMock}
            className="mt-8 text-xs text-muted hover:text-primary transition-colors underline"
          >
            [Dev] Preskoči na Dashboard
          </button>
        </div>
        
        {/* Floating Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl">
          {[
            { label: 'Tečajeva', val: '50+', icon: Trophy },
            { label: 'Aktivnih Članova', val: '10k+', icon: Users },
            { label: 'Energija', val: '100%', icon: Flame },
            { label: 'Rezultati', val: 'Zajamčeni', icon: CheckCircle2 },
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-2xl flex flex-col items-center gap-2">
              <stat.icon className="w-6 h-6 text-primary" />
              <span className="text-2xl font-black">{stat.val}</span>
              <span className="text-muted-foreground text-xs uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing/Call to Action */}
      <section className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-xl mx-auto glass p-10 rounded-[2.5rem] border-primary/20 shadow-[0_0_50px_rgba(190,242,100,0.1)]">
          <h2 className="text-3xl font-black mb-4">Projekt90 Članstvo</h2>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-black">49€</span>
            <span className="text-muted-foreground">/ mjesečno</span>
          </div>
          
          <ul className="space-y-4 mb-10">
            {[
              'Neograničen pristup tečajevima',
              'Tjedni Live Coaching',
              'Privatni Community Feed',
              'Dinamični Macro Kalkulator',
              'Personalizirani planovi obroka',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="w-full py-4 bg-primary text-black rounded-2xl font-black text-lg hover:opacity-90 transition-opacity"
          >
            KRENI SADA
          </button>
          <p className="text-center text-muted-foreground text-sm mt-4">
            Bez ugovorne obveze. Otkaži bilo kada.
          </p>
        </div>
      </section>
    </div>
  );
}
