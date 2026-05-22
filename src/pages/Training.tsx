import { useState, useEffect } from 'react';
import { Dumbbell, Utensils, ChevronDown, Calculator, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { awardXP } from '../lib/xp';

import { workoutPlanMale, workoutPlanFemale, trainingDescription } from '../data/trainingData';
import { homeWorkoutPlanMale, homeWorkoutPlanFemale, homeTrainingDescription } from '../data/homeTrainingData';
import { dietPlan } from '../data/dietData';

type CalcState = {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activity: number;
  goal: string;
};

const defaultCalc: CalcState = {
  weight: 80,
  height: 180,
  age: 25,
  gender: 'male',
  activity: 1.55,
  goal: 'bulk',
};

const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

export default function Training() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'training' | 'diet'>('training');
  const [expandedDay, setExpandedDay] = useState<string | null>('Ponedjeljak');
  const [calc, setCalc] = useState<CalcState>(defaultCalc);
  const [savingMacros, setSavingMacros] = useState(false);
  const [macrosSaved, setMacrosSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [loggingDay, setLoggingDay] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [trainingMode, setTrainingMode] = useState<'gym' | 'home'>('gym');

  const isFemale = profile?.gender === 'female';
  const workoutPlan = trainingMode === 'gym'
    ? (isFemale ? workoutPlanFemale : workoutPlanMale)
    : (isFemale ? homeWorkoutPlanFemale : homeWorkoutPlanMale);
  const currentDescription = trainingMode === 'gym' ? trainingDescription : homeTrainingDescription;

  useEffect(() => {
    if (profile?.macroCalc && !loaded) {
      setCalc(profile.macroCalc);
      setLoaded(true);
    }
    
    if (profile?.loggedWorkouts) {
      const currentWeek = getWeekStart();
      if (profile.loggedWorkouts.weekStart === currentWeek) {
        setLoggedToday(new Set(profile.loggedWorkouts.days));
      } else {
        setLoggedToday(new Set());
      }
    }
  }, [profile, loaded]);

  const handleLogWorkout = async (dayName: string) => {
    if (!user || !profile || loggedToday.has(dayName)) return;
    setLoggingDay(dayName);
    try {
      await awardXP(user.uid, 25, profile.xp ?? 0);
      const newLoggedSet = new Set(loggedToday).add(dayName);
      setLoggedToday(newLoggedSet);
      
      const weekStart = getWeekStart();
      await setDoc(doc(db, 'profiles', user.uid), {
        loggedWorkouts: {
          weekStart,
          days: Array.from(newLoggedSet)
        }
      }, { merge: true });
    } catch (err) {
      console.error('Failed to log workout:', err);
    } finally {
      setLoggingDay(null);
    }
  };

  const calculateMacros = () => {
    // Protein: 2.5g per kg
    let p = Math.round(calc.weight * 2.5);
    
    // Limits: 150g max for women, 250g max for men
    if (calc.gender === 'female') {
      p = Math.min(p, 150);
    } else {
      p = Math.min(p, 250);
    }

    // Fats: Always 70g
    const f = 70;

    // Carbs: cut = kg * 2, bulk = kg * 5
    const cMultiplier = calc.goal === 'cut' ? 2 : 5;
    const c = Math.round(calc.weight * cMultiplier);
    
    // Total calories
    const calories = (p * 4) + (c * 4) + (f * 9);
    
    return { p, c, f, calories };
  };

  const macros = calculateMacros();

  const saveMacros = async () => {
    if (!user) return;
    setSavingMacros(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), { macroCalc: calc }, { merge: true });
      setMacrosSaved(true);
      setTimeout(() => setMacrosSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save macros:', err);
    } finally {
      setSavingMacros(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto">
      <header className="mb-10 flex bg-white/5 p-1 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('training')}
          className={cn(
            'flex-1 py-3 rounded-xl font-bold text-sm',
            activeTab === 'training' ? 'bg-primary text-black' : 'text-white/60',
          )}
        >
          TRENING
        </button>
        <button
          onClick={() => setActiveTab('diet')}
          className={cn(
            'flex-1 py-3 rounded-xl font-bold text-sm',
            activeTab === 'diet' ? 'bg-primary text-black' : 'text-white/60',
          )}
        >
          PREHRANA
        </button>
      </header>

      {activeTab === 'training' ? (
        <div className="space-y-6">
          <div className="ursa-card p-6 bg-white/5 border border-white/10 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
            <p>
              {showFullDescription ? currentDescription.full : currentDescription.short}
            </p>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-primary font-bold mt-2 hover:underline"
            >
              {showFullDescription ? 'Prikaži manje' : 'Pročitaj više...'}
            </button>
          </div>

          {/* Gym / Home toggle */}
          <div className="flex bg-white/5 p-1 rounded-2xl w-full max-w-xs">
            <button
              onClick={() => setTrainingMode('gym')}
              className={cn('flex-1 py-2.5 rounded-xl font-black text-sm transition-all', trainingMode === 'gym' ? 'bg-primary text-black' : 'text-white/60 hover:text-white')}
            >
              🏋️ TERETANA
            </button>
            <button
              onClick={() => setTrainingMode('home')}
              className={cn('flex-1 py-2.5 rounded-xl font-black text-sm transition-all', trainingMode === 'home' ? 'bg-primary text-black' : 'text-white/60 hover:text-white')}
            >
              🏠 KUĆNI
            </button>
          </div>

          <div className="space-y-4">
            {workoutPlan.map((day) => (
              <div key={day.day} className="ursa-card overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full p-6 flex justify-between items-center"
                >
                  <span className="font-black text-xl uppercase tracking-tighter">
                    {day.day} - {day.focus}
                  </span>
                  <ChevronDown
                    className={cn('transition-transform', expandedDay === day.day && 'rotate-180')}
                  />
                </button>
                {expandedDay === day.day && (
                  <div className="px-6 pb-6">
                    {day.exercises.length > 0 ? (
                      <div className="space-y-4">
                        {day.notes && (
                          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-4">
                            <p className="text-sm text-primary/90 leading-relaxed italic">
                              {day.notes}
                            </p>
                          </div>
                        )}
                        {day.exercises.map((ex, i) => (
                          <div
                            key={i}
                            className="flex flex-col py-3 border-b border-white/5 gap-1"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{ex.name}</span>
                                {ex.videoUrl && (
                                  <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors" title="Pogledaj video vježbe">
                                    <PlayCircle className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                              <span className="text-primary font-black ml-4 whitespace-nowrap">
                                {ex.sets}x{ex.reps}
                              </span>
                            </div>
                            {ex.note && (
                              <span className="text-xs text-muted-foreground opacity-80">{ex.note}</span>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleLogWorkout(day.day)}
                          disabled={loggedToday.has(day.day) || loggingDay === day.day || !user}
                          className="mt-2 w-full py-3 bg-white/10 text-white rounded-xl font-black text-sm disabled:opacity-50 transition-all hover:bg-white/20 active:scale-95"
                        >
                          {loggedToday.has(day.day)
                            ? '✓ TRENING ZABILJEŽEN'
                            : loggingDay === day.day
                              ? 'BILJEŽENJE...'
                              : 'ZABILJEŽI TRENING +25 XP'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Dan odmora. Kvalitetan san i hidracija.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-sm text-primary/90 leading-relaxed italic">
              Svaki dan treninga, poslije treninga uzimamo PWM - post workout meal. On se sastoji od jedne do dvije mjerice whey proteina i voća po izboru.{"\n"}
              <span className="not-italic font-black block mt-2 text-primary">
                NAPOMENA: ako postavljeni makro ciljevi ne idu ka tvom željenom cilju (npr. ako si na masi, a pomoću tih makrosa ne dobivaš na kilaži, postpuno povećavaj količinu ugljikohidrata. Sve obrnuto za definiciju.)
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="ursa-card p-8">
              <h3 className="text-2xl font-black mb-6 uppercase flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Kalkulator
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase mb-1 block">
                    Težina (kg)
                  </label>
                  <input
                    type="number"
                    value={calc.weight}
                    onChange={(e) => setCalc({ ...calc, weight: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase mb-1 block">
                    Spol
                  </label>
                  <select
                    value={calc.gender}
                    onChange={(e) => setCalc({ ...calc, gender: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 appearance-none text-white"
                  >
                    <option value="male" className="bg-black text-white">Muško</option>
                    <option value="female" className="bg-black text-white">Žensko</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-muted-foreground uppercase mb-1 block">
                    Cilj
                  </label>
                  <select
                    value={calc.goal}
                    onChange={(e) => setCalc({ ...calc, goal: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 appearance-none bg-no-repeat bg-right pr-10"
                  >
                    <option value="cut">Definicija (Gubitak masti)</option>
                    <option value="bulk">Masa (Dobivanje mišića)</option>
                  </select>
                </div>
                <button
                  onClick={saveMacros}
                  disabled={savingMacros || !user}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-black text-sm transition-colors disabled:opacity-50"
                >
                  {macrosSaved ? '✓ SPREMLJENO' : savingMacros ? 'SPREMANJE...' : 'SPREMI MAKROSE'}
                </button>
              </div>
            </div>
            <div className="ursa-card p-8 bg-primary text-black flex flex-col justify-center items-center shadow-[0_0_30px_rgba(212,255,0,0.3)] border-none">
              <h3 className="font-black text-4xl mb-2">{macros.calories} KCAL</h3>
              <div className="flex gap-4 font-black uppercase text-xs opacity-80">
                <span>P: {macros.p}g</span>
                <span>U: {macros.c}g</span>
                <span>M: {macros.f}g</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black uppercase tracking-tight mt-8 mb-4">Plan Prehrane (Prilagođeno tebi)</h3>
            {dietPlan.map((dayPlan) => (
              <div key={`diet-${dayPlan.day}`} className="ursa-card overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === dayPlan.day ? null : dayPlan.day)}
                  className="w-full p-6 flex justify-between items-center"
                >
                  <span className="font-black text-xl uppercase tracking-tighter">{dayPlan.day}</span>
                  <ChevronDown className={cn('transition-transform', expandedDay === dayPlan.day && 'rotate-180')} />
                </button>
                {expandedDay === dayPlan.day && (
                  <div className="px-6 pb-6 space-y-4">
                    {['dorucak', 'rucak', 'uzina', 'vecera'].map((mealKey) => {
                      const meal = dayPlan.meals[mealKey as keyof typeof dayPlan.meals];
                      const mealTitles: Record<string, string> = { dorucak: 'Doručak', rucak: 'Ručak', uzina: 'Užina', vecera: 'Večera' };
                      
                      let mealKcal = 0;
                      let mealP = 0;
                      let mealC = 0;
                      let mealF = 0;

                      const ingredientsWithMacros = meal.ingredients.map(ing => {
                        const amount = (ing.unit === 'g' || ing.unit === 'ml') 
                          ? Math.round(ing.baseAmount * (macros.calories / 2000)) 
                          : ing.baseAmount;
                        
                        const factor = (ing.unit === 'kom') ? amount : amount / 100;
                        const k = Math.round(ing.macrosPer100.kcal * factor);
                        const p = Math.round(ing.macrosPer100.p * factor);
                        const c = Math.round(ing.macrosPer100.c * factor);
                        const f = Math.round(ing.macrosPer100.f * factor);
                        
                        mealKcal += k;
                        mealP += p;
                        mealC += c;
                        mealF += f;

                        return { ...ing, amount, k, p, c, f };
                      });

                      return (
                        <div key={mealKey} className="border border-white/10 rounded-xl p-4 bg-white/5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">{mealTitles[mealKey]}</h4>
                              <p className="font-bold text-lg leading-tight mt-1">{meal.name}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <span className="block font-black text-primary text-sm">{mealKcal} kcal</span>
                              <span className="text-[9px] uppercase text-muted-foreground font-bold tracking-wider">
                                P: {mealP}g | U: {mealC}g | M: {mealF}g
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {ingredientsWithMacros.map((ing, i) => (
                              <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <div>
                                  <span className="text-white/80 block">{ing.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{ing.k} kcal (P:{ing.p} U:{ing.c} M:{ing.f})</span>
                                </div>
                                <span className="font-bold text-right shrink-0 ml-4">{ing.amount} {ing.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
