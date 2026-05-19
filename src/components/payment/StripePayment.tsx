import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ onPaymentSuccess }: { onPaymentSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/feed`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
          <CreditCard className="w-4 h-4" />
          <span>Sigurno Plaćanje</span>
        </div>
        
        <PaymentElement options={{ wallets: { applePay: 'auto', googlePay: 'auto' } }} />
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm font-medium p-4 bg-red-500/10 rounded-xl">
          {errorMessage}
        </div>
      )}

      <button
        disabled={!stripe || loading}
        className="w-full py-5 bg-primary text-black rounded-2xl font-black text-xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50"
      >
        {loading ? 'OBRADA...' : 'PLATI 49€ I KRENI'}
      </button>
    </form>
  );
};

export default function StripePayment({ onSuccess }: { onSuccess: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntent = async () => {
      try {
        const createIntent = httpsCallable(functions, 'createPaymentIntent');
        
        // Add a timeout to the fetch
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        const result = await Promise.race([
          createIntent(),
          timeoutPromise
        ]) as { data: { clientSecret: string } };

        if (result.data?.clientSecret) {
          setClientSecret(result.data.clientSecret);
        } else {
          throw new Error('No clientSecret returned');
        }
      } catch (err: any) {
        console.warn('Error fetching PaymentIntent:', err);
        
        // If we're on localhost and the function fails (e.g. not deployed),
        // we show a descriptive error so the user knows what to do.
        if (window.location.hostname === 'localhost') {
          setError('Backend nije dostupan. Provjerite jeste li pokrenuli Firebase emulatore ili deployali funkcije.');
        } else {
          setError('Trenutno ne možemo pokrenuti plaćanje. Molimo pokušajte kasnije.');
        }
      }
    };

    fetchIntent();
  }, []);

  if (error) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-red-500/20 rounded-xl p-8 text-center bg-red-500/5">
        <p className="text-sm text-red-500 font-bold mb-2">POGREŠKA</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-xs font-bold text-primary hover:underline"
        >
          POKUŠAJ PONOVO
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-black/20 animate-pulse">
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
          Priprema sigurnog plaćanja...
        </p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#D4FF00',
        colorBackground: '#161616',
        colorText: '#ffffff',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '16px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onPaymentSuccess={onSuccess} />
    </Elements>
  );
}
