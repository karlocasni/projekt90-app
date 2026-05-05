import { Trophy } from 'lucide-react';

export default function Challenges() {
  return (
    <div className="py-6 px-4 md:px-0">
      <div className="glass rounded-3xl p-10 text-center border border-white/5">
        <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="font-heading font-black text-3xl uppercase tracking-tighter mb-3">
          IZAZOVI
        </h1>
        <p className="text-muted-foreground text-base">
          30-dnevni izazovi dolaze uskoro.
        </p>
      </div>
    </div>
  );
}
