import { 
  Flame, ArrowRight, CheckCircle2, Zap, Users, Trophy, 
  Play, Target, Star, Gift, HelpCircle, XCircle, ChevronDown,
  ShieldCheck, Smartphone, Globe, MessageSquare, Instagram, Facebook
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const scrollToVideo = () => {
    const videoSection = document.getElementById('vsl-video');
    videoSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true }
  };

  return (
    <div className="relative bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary selection:text-black">
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 bg-noise z-[100] pointer-events-none" />
      
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode}
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-[60] py-6 px-6 md:px-12 flex justify-between items-center bg-background/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary fill-primary" />
          <span className="text-xl font-black tracking-tighter">PROJEKT90</span>
        </div>
        <button 
          onClick={() => openAuth('login')}
          className="px-6 py-2 glass rounded-full font-bold hover:bg-white/10 transition-colors"
        >
          PRIJAVA
        </button>
      </header>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-12 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[180px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-primary fill-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Postani dio elite - 10,000+ Polaznika</span>
          </div>
          
          <h1 className="text-5xl md:text-[10rem] font-black tracking-tighter mb-8 leading-[0.85] uppercase">
            POMAKNI SVOJE <br />
            <span className="text-gradient">GRANICE</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            Projekt90 nije samo trening. To je sistem koji transformira tvoje tijelo, um i navike. Pridruži se plemenu koje te gura prema vrhu.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => openAuth('register')}
              className="group w-full sm:w-auto px-10 py-5 bg-primary text-black rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_40px_rgba(190,242,100,0.3)] hover:shadow-[0_0_60px_rgba(190,242,100,0.5)]"
            >
              POSTANI ČLAN <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={scrollToVideo}
              className="w-full sm:w-auto px-10 py-5 glass rounded-2xl font-bold text-xl hover:bg-white/10 transition-all border border-white/10"
            >
              POGLEDAJ VIDEO
            </button>
          </div>
        </motion.div>
      </section>

      {/* VSL Section */}
      <section id="vsl-video" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            {...fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-12 leading-tight max-w-4xl mx-auto">
              Priključi se u Projekt90 i za 90 dana izgradi tijelo koje ćeš ponosno pokazati ovo ljeto.
            </h2>
            
            <div className="flex flex-col items-center gap-6 mb-16">
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-lg md:text-xl font-bold text-primary uppercase tracking-widest max-w-[300px] md:max-w-none">
                <span className="whitespace-nowrap">Trening</span>
                <span className="text-muted-foreground">•</span>
                <span className="whitespace-nowrap">Prehrana</span>
                <div className="w-full md:hidden" /> {/* Force break on mobile */}
                <span className="hidden md:inline text-muted-foreground">•</span>
                <span className="whitespace-nowrap">Zajednica</span>
                <span className="text-muted-foreground">•</span>
                <span className="whitespace-nowrap">Nagrade</span>
              </div>

              <p className="text-lg md:text-xl font-bold tracking-widest uppercase text-white/90">
                Pogledaj video i saznaj kako će ti ovaj projekt promijeniti život!
              </p>
            </div>
          </motion.div>

          <motion.div 
            {...fadeIn}
            className="relative aspect-video max-w-5xl mx-auto glass rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer shadow-2xl"
          >
            {/* Video Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-black/40 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale opacity-60 group-hover:scale-105 transition-transform duration-700"
              alt="Gym motivation"
              loading="lazy"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(190,242,100,0.5)] group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - Value Stack Style */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <motion.div {...fadeIn}>
            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-none uppercase">
              SVE ŠTO TREBAŠ <br />
              <span className="text-primary text-2xl md:text-5xl italic">NA JEDNOM MJESTU</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              Zaboravi na plaćanje trenera 200€ mjesečno, nutricionista 100€ i planova koji ne rade. Projekt90 je jedini sistem koji ti garantira rezultat.
            </p>
            
            <div className="space-y-6">
              {[
                { title: 'Projekt90 Akademija (Video Tečajevi)', val: '499€' },
                { title: 'Dinamični Planovi Treninga', val: '199€' },
                { title: 'Pametni Nutricionistički Sistem', val: '249€' },
                { title: 'Pristup Privatnoj Zajednici', val: '99€' },
                { title: 'Tjedni Live Pozivi sa Stručnjacima', val: '149€' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 glass rounded-xl border-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm md:text-base">{item.title}</span>
                  </div>
                  <span className="text-muted-foreground line-through decoration-red-500/50 text-sm md:text-base">{item.val}</span>
                </div>
              ))}
              <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl flex justify-between items-center">
                <span className="text-lg md:text-xl font-black uppercase">Ukupna Vrijednost:</span>
                <span className="text-xl md:text-2xl font-black text-primary line-through">1,195€+</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            {...fadeIn}
            className="glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-primary/30 shadow-[0_0_80px_rgba(190,242,100,0.15)] relative overflow-hidden sticky top-32"
          >
            <div className="absolute top-0 right-0 bg-primary text-black px-8 py-2 font-black rotate-45 translate-x-10 translate-y-6 text-xs md:text-base">
              BEST OFFER
            </div>
            
            <h3 className="text-2xl md:text-4xl font-black mb-2 uppercase">PROJEKT90 ČLANSTVO</h3>
            <p className="text-muted-foreground mb-8 text-sm md:text-base">Jednokratna uplata za 90 dana pune transformacije.</p>
            
            <div className="flex items-baseline gap-3 mb-10">
              <span className="text-5xl md:text-7xl font-black">49€</span>
              <span className="text-lg md:text-xl text-muted-foreground font-bold uppercase tracking-widest">/ jednokratno</span>
            </div>

            <button 
              onClick={() => openAuth('register')}
              className="w-full py-5 md:py-6 bg-primary text-black rounded-2xl font-black text-xl md:text-2xl hover:scale-[1.02] transition-transform shadow-lg mb-8"
            >
              PRIDRUŽI SE ODMAH
            </button>

            <div className="space-y-4 pt-8 border-t border-white/5">
              {[
                'Neograničen pristup svim sadržajima',
                'Novi treninzi svaka 4 tjedna',
                'Sudjelovanje u izazovima za nagrade',
                'Direktna podrška u community-u'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="font-bold text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground mt-8 font-medium text-xs">
              Sigurno plaćanje osigurano od strane Stripe-a.
            </p>

          </motion.div>
        </div>
      </section>

      {/* 2-2 Grid Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            {
              icon: Target,
              title: "Precizni Planovi",
              desc: "Svaki trening i obrok su znanstveno optimizirani za maksimalne rezultate u najkraćem vremenu."
            },
            {
              icon: Smartphone,
              title: "Sve na Dlanu",
              desc: "Naša platforma radi savršeno na mobitelu. Prati napredak, treniraj i komuniciraj bilo gdje."
            },
            {
              icon: Users,
              title: "Moćna Zajednica",
              desc: "Više nikada nećeš trenirati sam. Okruži se ljudima koji imaju iste ciljeve i ambicije."
            },
            {
              icon: Trophy,
              title: "Stvarni Rezultati",
              desc: "Preko 10,000 transformacija potvrđuje da naš sistem radi bez obzira na tvoju početnu točku."
            }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              {...fadeIn}
              className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border-white/5 hover:border-primary/20 transition-colors group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="text-xl md:text-3xl font-black mb-3 md:mb-4 uppercase tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why your tries failed section */}
      <section className="py-32 px-6 bg-primary/5">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase">ZAŠTO DO SADA <br /><span className="text-red-500">NISI USPIO?</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">Većina programa propadne jer im nedostaje jedan od ova tri stupa:</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Nemaš Sistem", desc: "Nasumični treninzi daju nasumične rezultate. Projekt90 pruža jasnu mapu puta." },
              { title: "Nemaš Fokus", desc: "Previše informacija stvara paralizu. Mi ti kažemo točno što i kada raditi." },
              { title: "Nemaš Pleme", desc: "Kada motivacija padne, disciplina i zajednica su ti koji te drže na putu." }
            ].map((item, i) => (
              <motion.div key={i} {...fadeIn} className="text-center p-8 glass rounded-3xl border-red-500/10">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformations Section */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeIn} className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-8xl font-black uppercase leading-none mb-6">REKLAME LAŽU. <br /><span className="text-primary">BROJKE NE.</span></h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium italic">Transformacije naših članova su najbolji dokaz efikasnosti Projekt90 sistema.</p>
            </div>
            <div className="hidden md:block">
              <div className="flex -space-x-4 mb-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-zinc-800" />
                ))}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Pridruži se transformaciji</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                {...fadeIn}
                className="relative aspect-[3/4] rounded-[2rem] overflow-hidden glass border-white/10 group shadow-2xl"
              >
                <div className="absolute top-6 left-6 z-20 flex gap-2">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-black uppercase text-white">Prije</span>
                  <span className="px-3 py-1 bg-primary rounded-full text-xs font-black uppercase text-black">Poslije</span>
                </div>
                <img 
                  src={`https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop`} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  alt="Transformation"
                  loading="lazy"
                />
                <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black to-transparent z-10">
                  <p className="text-2xl font-black mb-1">MARKO P.</p>
                  <p className="text-primary font-bold">-14kg & definicija</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prizes Section */}
      <section className="py-32 px-6 bg-primary">
        <div className="max-w-7xl mx-auto text-black">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeIn}>
              <h2 className="text-5xl md:text-8xl font-black uppercase leading-none mb-8 tracking-tighter">
                TRENIRAJ. <br />OSVOJI. <br />PONAVLJAJ.
              </h2>
              <p className="text-xl md:text-2xl font-bold mb-12 leading-tight">
                Projekt90 te nagrađuje za tvoj trud. Svaki mjesec najbolji napredak osvaja brutalne nagrade od naših partnera i sponzora.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Gift, title: "500€ Cash", desc: "Novčana nagrada za pobjednika" },
                  { icon: Users, title: "1-1 Coaching", desc: "6 mjeseci Protocol coachinga" },
                  { icon: Target, title: "Trening", desc: "Privatni trening s Ursom" },
                  { icon: Star, title: "Suplementi", desc: "Full stack suplementacije" }
                ].map((item, i) => (
                  <div key={i} className="bg-black/5 p-6 rounded-3xl border border-black/10">
                    <item.icon className="w-8 h-8 mb-4" />
                    <h4 className="text-xl font-black uppercase tracking-tighter leading-tight">{item.title}</h4>
                    <p className="font-medium opacity-80 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              {...fadeIn}
              className="relative aspect-square bg-black rounded-[3rem] overflow-hidden flex items-center justify-center p-12"
            >
              <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop')] bg-cover" />
              <div className="relative z-10 text-center text-primary">
                <Trophy className="w-32 h-32 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(190,242,100,0.5)]" />
                <h3 className="text-5xl font-black uppercase mb-4 tracking-tighter text-white">GLAVNA NAGRADA SEZONE</h3>
                <p className="text-4xl font-black uppercase">NAGRADA IZNENAĐENJA</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeIn} className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-8">ČESTA <br /><span className="text-primary">PITANJA</span></h2>
            <p className="text-xl text-muted-foreground font-medium">Sve što te zanima prije nego kreneš na svoj put od 90 dana.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { 
                q: "Mogu li trenirati od kuće?", 
                a: "Naravno! Imamo specifične programe dizajnirane za trening kod kuće sa minimalno opreme, kao i full gym programe." 
              },
              { 
                q: "Što ako sam početnik?", 
                a: "Projekt90 je dizajniran da te vodi od nule. Svaka vježba ima video instrukcije i objašnjenje tehnike." 
              },
              { 
                q: "Kako funkcionira prehrana?", 
                a: "Naš pametni kalkulator izračunava tvoje potrebe, a ti dobivaš bazu recepata i fleksibilan plan koji se prilagođava tebi." 
              },
              { 
                q: "Kada mogu otkazati pretplatu?", 
                a: "Bilo kada. Nema ugovorne obveze. Jednim klikom u postavkama profila možeš prekinuti članstvo." 
              }
            ].map((item, i) => (
              <motion.div key={i} {...fadeIn} className="glass rounded-2xl overflow-hidden border-white/5">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                  className="w-full p-6 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl font-bold">{item.q}</span>
                  <ChevronDown className={`w-6 h-6 text-primary transition-transform ${activeAccordion === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeAccordion === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="p-6 pt-0 text-muted-foreground text-lg leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-8 h-8 text-primary fill-primary" />
                <span className="text-2xl font-black tracking-tighter">PROJEKT90</span>
              </div>
              <p className="text-muted-foreground text-lg max-w-sm mb-8 leading-relaxed">
                Elitna platforma za transformaciju tijela i uma. Pridruži se pokretu i postani najbolja verzija sebe.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/stjepanursa" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-black transition-all cursor-pointer">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://facebook.com/stjepanursa" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-black transition-all cursor-pointer">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://nemaneide.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-black transition-all cursor-pointer">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-sm mb-6">Navigacija</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="hover:text-primary cursor-pointer transition-colors">Treninzi</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Prehrana</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Rezultati</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Blog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black uppercase tracking-widest text-sm mb-6">Pravno</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li className="hover:text-primary cursor-pointer transition-colors">Uvjeti korištenja</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Privatnost</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Povrat novca</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Kontakt</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-4 text-center md:text-left">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                © 2026 by Nema Neide. Sva prava pridržana.
              </p>
              <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                Powered by Appercept
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
