import { useState, useEffect } from 'react';
import { Dumbbell, Utensils, ChevronDown, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { awardXP } from '../lib/xp';

const workoutPlan = [
  {
    day: 'Ponedjeljak',
    focus: 'Push (Prsa, Ramena, Triceps)',
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '8-10' },
      { name: 'Overhead Press', sets: '3', reps: '10-12' },
      { name: 'Incline DB Flys', sets: '3', reps: '12-15' },
      { name: 'Tricep Pushdowns', sets: '4', reps: '12-15' },
    ],
  },
  { day: 'Utorak', focus: 'Pull (Leđa, Biceps)', exercises: [{ name: 'Deadlifts', sets: '3', reps: '5' }] },
  { day: 'Srijeda', focus: 'Dan odmora', exercises: [] },
  { day: 'Četvrtak', focus: 'Noge', exercises: [{ name: 'Squats', sets: '4', reps: '8' }] },
  { day: 'Petak', focus: 'Gornji dio tijela', exercises: [] },
  { day: 'Subota', focus: 'Cijelo tijelo', exercises: [] },
  { day: 'Nedjelja', focus: 'Dan odmora', exercises: [] },
];

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

  useEffect(() => {
    if (profile?.macroCalc && !loaded) {
      setCalc(profile.macroCalc);
      setLoaded(true);
    }
  }, [profile, loaded]);

  const handleLogWorkout = async (dayName: string) => {
    if (!user || !profile || user.uid === 'mock-123' || loggedToday.has(dayName)) return;
    setLoggingDay(dayName);
    try {
      await awardXP(user.uid, 25, profile.xp ?? 0);
      setLoggedToday((prev) => new Set(prev).add(dayName));
    } catch (err) {
      console.error('Failed to log workout:', err);
    } finally {
      setLoggingDay(null);
    }
  };

  const calculateMacros = () => {
    let bmr = 10 * calc.weight + 6.25 * calc.height - 5 * calc.age;
    bmr = calc.gender === 'male' ? bmr + 5 : bmr - 161;
    const tdee = bmr * calc.activity;
    let targetCalories = tdee;
    if (calc.goal === 'cut') targetCalories -= 500;
    if (calc.goal === 'bulk') targetCalories += 500;
    const p = Math.round(calc.weight * 2.2);
    const f = Math.round((targetCalories * 0.25) / 9);
    const c = Math.round((targetCalories - p * 4 - f * 9) / 4);
    return { p, c, f, calories: Math.round(targetCalories) };
  };

  const macros = calculateMacros();

  const saveMacros = async () => {
    if (!user || user.uid === 'mock-123') return;
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
          <div className="ursa-card p-6 bg-gradient-to-br from-[#161616] to-[#0A0A0A] border-primary/20">
            <h2 className="text-sm font-black text-primary uppercase tracking-widest mb-1">
              Današnji Trening
            </h2>
            <h3 className="text-3xl font-black uppercase mb-4">Push (Prsa, Ramena, Triceps)</h3>
            <button className="w-full py-4 bg-primary text-black rounded-xl font-black text-lg shadow-[0_0_20px_rgba(212,255,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
              ZAPOČNI TRENING
            </button>
          </div>

          <div className="space-y-4">
            {workoutPlan.map((day) => (
              <div key={day.day} className="ursa-card overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full p-6 flex justify-between items-center"
                >
                  <span className="font-black text-xl uppercase tracking-tighter">{day.day}</span>
                  <ChevronDown
                    className={cn('transition-transform', expandedDay === day.day && 'rotate-180')}
                  />
                </button>
                {expandedDay === day.day && (
                  <div className="px-6 pb-6">
                    {day.exercises.length > 0 ? (
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center py-2 border-b border-white/5"
                          >
                            <span className="font-bold">{ex.name}</span>
                            <span className="text-primary font-black">
                              {ex.sets}x{ex.reps}
                            </span>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                />
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
      )}
    </div>
  );
}
