import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building2, AlertCircle, ArrowRight, CheckCircle, MapPin } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, createPaymentIntent } from '../lib/stripe';
import ShippingAddressForm, { ShippingAddress } from './ShippingAddressForm';
import { supabase } from '../lib/supabase';

interface PaymentSystemProps {
  onBack: () => void;
  amount: number;
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  selectedCountry: string;
}

// Checkout form component with real Stripe integration
const CheckoutForm = ({ 
  amount, 
  currencySymbol,
  clientSecret,
  userInfo,
  shippingAddress,
  productDetails
}: { 
  amount: number; 
  currencySymbol: string;
  clientSecret: string;
  userInfo: any;
  shippingAddress: ShippingAddress;
  productDetails: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not been properly initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Confirm the payment with Stripe using the client secret
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Payment failed');
      }
      
      if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Save order to Supabase
        try {
          console.log('Attempting to save order to Supabase...');
          
          const orderData = {
            customer_name: `${userInfo.firstName} ${userInfo.lastName}`,
            customer_email: userInfo.email,
            customer_phone: userInfo.phone,
            product_name: productDetails.name || 'Custom Frame',
            product_id: productDetails.id || 'FRAME-CUSTOM',
            quantity: productDetails.quantity || 1,
            total_price: amount,
            status: 'pending',
            shipping_address: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}, ${shippingAddress.country}`,
            payment_method: 'credit_card',
            payment_id: paymentIntent.id,
            notes: productDetails.notes || ''
          };
          
          console.log('Order data prepared:', orderData);
          
          const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select();
          
          if (error) {
            console.error('Error saving order to Supabase:', error);
            console.error('Error code:', error.code);
            console.error('Error details:', error.details);
            // Continue with payment completion even if order saving fails
          } else {
            console.log('Order saved to Supabase successfully:', data);
          }
        } catch (saveError) {
          console.error('Exception when saving order to Supabase:', saveError);
          // Continue with payment completion even if order saving fails
        }
        
        setPaymentComplete(true);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="p-6 bg-green-900/20 rounded-lg border border-green-500/30 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p className="text-gray-300 mb-4">Your order has been processed successfully.</p>
        <a 
          href="/order-confirmation" 
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg font-semibold transition-all"
        >
          View Order Details
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-6 bg-purple-900/20 rounded-lg border border-purple-500/30">
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">Card Details</label>
        <div className="p-4 bg-black/30 rounded-lg border border-purple-500/30">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
              },
            }}
          />
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-semibold transition-all ${
          !stripe || loading
            ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {loading ? 'Processing...' : `Pay ${currencySymbol}${amount.toLocaleString()}`}
        <ArrowRight className="w-5 h-5" />
      </button>
    </form>
  );
};

export default function PaymentSystem({ onBack, amount, userInfo, selectedCountry }: PaymentSystemProps) {
  // Add checkout step state
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);

  // Convert amount to local currency
  const localAmount = selectedCountry === 'Nigeria' 
    ? Math.round(amount * 1200) // Using an example conversion rate
    : amount;

  const currencySymbol = selectedCountry === 'Nigeria' ? '₦' : '$';

  // Initialize payment when a payment method is selected
  useEffect(() => {
    if (paymentMethod && checkoutStep === 'payment') {
      initializePayment();
    }
  }, [paymentMethod]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!shippingAddress) {
        throw new Error('Shipping address is required');
      }
      
      // Create appropriate metadata based on user info and shipping address
      const metadata = {
        customerName: `${userInfo.firstName} ${userInfo.lastName}`,
        customerEmail: userInfo.email,
        customerPhone: userInfo.phone,
        shippingAddress: JSON.stringify({
          fullName: shippingAddress.fullName,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone
        })
      };
      
      // Use the appropriate currency based on country
      const currency = selectedCountry === 'Nigeria' ? 'ngn' : 'usd';
      
      // Create payment intent with the right currency and metadata
      const secret = await createPaymentIntent(localAmount, currency, metadata);
      setClientSecret(secret);
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelection = (method: string) => {
    setPaymentMethod(method);
    // This will trigger the useEffect to initialize payment
  };

  // Handle shipping address submission
  const handleShippingSubmit = (address: ShippingAddress) => {
    setShippingAddress(address);
    setCheckoutStep('payment');
  };

  // Handle back button from payment to shipping
  const handleBackToShipping = () => {
    setCheckoutStep('shipping');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white py-20 px-4">
      <button
        onClick={checkoutStep === 'shipping' ? onBack : handleBackToShipping}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-white hover:text-purple-400 transition-colors rounded-full bg-purple-600/20 backdrop-blur-sm hover:bg-purple-600/30"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {checkoutStep === 'shipping' ? 'Shipping Information' : 'Complete Your Purchase'}
          </h1>
          <p className="text-xl text-gray-300">
            {checkoutStep === 'shipping' 
              ? 'Please provide your shipping details to continue.'
              : 'Select your preferred payment method to complete your order.'}
          </p>
        </div>

        {checkoutStep === 'shipping' ? (
          <ShippingAddressForm 
            onSubmit={handleShippingSubmit}
            onBack={onBack}
            initialData={{
              fullName: `${userInfo.firstName} ${userInfo.lastName}`,
              addressLine1: '',
              addressLine2: '',
              city: '',
              state: '',
              postalCode: '',
              country: selectedCountry,
              phone: userInfo.phone,
              isDefault: true
            }}
          />
        ) : (
          <>
            <div className="bg-purple-900/20 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between items-center py-3 border-b border-purple-500/30">
                <span>Subtotal</span>
                <span>{currencySymbol}{localAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-purple-500/30">
                <span>Processing Fee</span>
                <span>{selectedCountry === 'Nigeria' ? '1.4%' : '2.9% + $0.30'}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-lg font-semibold">
                <span>Total</span>
                <span>{currencySymbol}{(localAmount * (selectedCountry === 'Nigeria' ? 1.014 : 1.029) + (selectedCountry === 'Nigeria' ? 0 : 0.30)).toLocaleString()}</span>
              </div>
            </div>

            {/* Shipping Address Summary */}
            {shippingAddress && (
              <div className="bg-purple-900/20 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold">Shipping Address</h2>
                  </div>
                  <button 
                    onClick={handleBackToShipping}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-gray-300">
                  <p className="font-medium">{shippingAddress.fullName}</p>
                  <p>{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p>{shippingAddress.country}</p>
                  <p className="mt-1">{shippingAddress.phone}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {selectedCountry === 'United States' ? (
                <>
                  <button
                    onClick={() => handlePaymentMethodSelection('card')}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      paymentMethod === 'card'
                        ? 'border-purple-400 bg-purple-900/40'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                      <span>Credit or Debit Card</span>
                    </div>
                    <span className="text-sm text-purple-400">Visa, Mastercard, Amex</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelection('digital')}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      paymentMethod === 'digital'
                        ? 'border-purple-400 bg-purple-900/40'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6 text-purple-400" />
                      <span>Digital Wallet</span>
                    </div>
                    <span className="text-sm text-purple-400">Apple Pay, Google Pay</span>
                  </button>

                  {paymentMethod && (
                    <div className="mt-6">
                      {loading ? (
                        <div className="p-6 bg-purple-900/20 rounded-lg border border-purple-500/30 text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-gray-300">Initializing payment...</p>
                        </div>
                      ) : clientSecret ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          {shippingAddress && (
                            <CheckoutForm 
                              amount={localAmount} 
                              currencySymbol={currencySymbol}
                              clientSecret={clientSecret}
                              userInfo={userInfo}
                              shippingAddress={shippingAddress}
                              productDetails={{
                                name: 'Custom Frame',
                                id: 'FRAME-CUSTOM',
                                quantity: 1,
                                notes: 'Order placed through website'
                              }}
                            />
                          )}
                        </Elements>
                      ) : error ? (
                        <div className="p-6 bg-red-900/20 rounded-lg border border-red-500/30 text-center">
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">Payment Setup Failed</h3>
                          <p className="text-gray-300 mb-4">{error}</p>
                          <button 
                            onClick={() => {
                              setError(null);
                              initializePayment();
                            }}
                            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg font-semibold transition-all"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => handlePaymentMethodSelection('local_card')}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      paymentMethod === 'local_card'
                        ? 'border-purple-400 bg-purple-900/40'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                      <span>Local Card</span>
                    </div>
                    <span className="text-sm text-purple-400">Verve, Mastercard</span>
                  </button>
                  <button
                    onClick={() => handlePaymentMethodSelection('bank_transfer')}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-purple-400 bg-purple-900/40'
                        : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-purple-400" />
                      <span>Bank Transfer</span>
                    </div>
                    <span className="text-sm text-purple-400">Direct Bank Transfer</span>
                  </button>
                </>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!paymentMethod && (
              <div className="mt-8 flex justify-center">
                <p className="text-gray-300 text-center">
                  Select a payment method to continue
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
