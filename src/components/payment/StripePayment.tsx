import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  ExpressCheckoutElement,
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

  const processPayment = async (isExpress = false) => {
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    if (!isExpress) {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'An error occurred.');
        setLoading(false);
        return;
      }
    }

    try {
      const createIntent = httpsCallable(functions, 'createPaymentIntent');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      );

      const result = await Promise.race([
        createIntent(),
        timeoutPromise
      ]) as { data: { clientSecret: string } };

      const clientSecret = result.data?.clientSecret;
      if (!clientSecret) throw new Error('No clientSecret returned');

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/feed`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment.');
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Purchase', { value: 49, currency: 'EUR' });
        }
        onPaymentSuccess();
      }
    } catch (err: any) {
      console.warn('Error processing payment:', err);
      if (window.location.hostname === 'localhost') {
        setErrorMessage('Backend nije dostupan. Provjerite jeste li pokrenuli Firebase emulatore ili deployali funkcije.');
      } else {
        setErrorMessage('Trenutno ne možemo pokrenuti plaćanje. Molimo pokušajte kasnije.');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await processPayment(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
          <CreditCard className="w-4 h-4" />
          <span>Sigurno Plaćanje</span>
        </div>
        
        <div className="mb-6">
          <ExpressCheckoutElement onConfirm={() => processPayment(true)} />
        </div>

        <div className="relative flex items-center py-4 mb-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-white/40 text-xs font-bold">ILI KARTICOM</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <PaymentElement options={{ wallets: { applePay: 'never', googlePay: 'never' } }} />
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
  const options = {
    mode: 'payment' as const,
    amount: 4900,
    currency: 'eur',
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
