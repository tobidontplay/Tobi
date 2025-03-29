import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the public key from environment variables
// IMPORTANT: Only use test keys (pk_test_...) during development, never live keys
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Create a payment intent using our backend API
export async function createPaymentIntent(amount: number, currency: string = 'usd', metadata?: Record<string, string>) {
  try {
    console.log('Creating payment intent:', { amount, currency, metadata });
    
    // Call our backend API to create a payment intent
    const response = await fetch('http://localhost:4000/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // The backend will convert to cents
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment initialization failed');
    }

    const data = await response.json();
    console.log('Payment intent created with client secret');
    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Export the Stripe promise for use in components
export { stripePromise };