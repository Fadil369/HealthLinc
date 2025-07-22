import React, { createContext, useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  tier: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentContextType {
  stripe: Stripe | null;
  subscriptionTiers: SubscriptionTier[];
  currentSubscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  createSubscription: (tierId: string, paymentMethodId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  addPaymentMethod: (paymentMethodId: string) => Promise<void>;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  createPaymentIntent: (amount: number, description?: string) => Promise<PaymentIntent>;
  fetchSubscriptionStatus: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export { PaymentContext };

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 17,
      description: 'Single claim request and response',
      features: [
        '1 claim request',
        'Basic support',
        'Email notifications',
        'Basic reporting'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Integration',
      price: 363,
      description: 'Full NPHIES integration with basic features',
      features: [
        'Unlimited claims',
        'Eligibility checks',
        'Basic reporting',
        'Email support',
        'API access'
      ],
      isPopular: true
    },
    {
      id: 'premium',
      name: 'Premium Integration',
      price: 693,
      description: 'Advanced NPHIES integration with premium features',
      features: [
        'Everything in Pro',
        'Batch processing',
        'Advanced reporting',
        'Priority support',
        'Custom integrations',
        'Real-time monitoring'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise Integration',
      price: 963,
      description: 'Complete NPHIES solution for large organizations',
      features: [
        'Everything in Premium',
        'Dedicated support',
        'Custom development',
        'SLA guarantee',
        'On-premise deployment',
        'Training & consultation'
      ]
    }
  ];

  useEffect(() => {
    initializeStripe();
  }, []);

  const initializeStripe = async () => {
    try {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const fetchSubscriptionStatus = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/subscription/status`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  }, [user, API_BASE]);

  const fetchPaymentMethods = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/payment/methods`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  }, [user, API_BASE]);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
      fetchPaymentMethods();
    }
  }, [user, fetchSubscriptionStatus, fetchPaymentMethods]);

  const createSubscription = async (tierId: string, paymentMethodId: string) => {
    if (!user || !stripe) {
      throw new Error('User not authenticated or Stripe not loaded');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/subscription/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tier: tierId,
          payment_method_id: paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create subscription');
      }

      const data = await response.json();
      
      // Handle 3D Secure if required
      if (data.client_secret) {
        const { error } = await stripe.confirmCardPayment(data.client_secret);
        if (error) {
          throw new Error(error.message);
        }
      }

      setCurrentSubscription(data.subscription);
      toast.success('Subscription created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user || !currentSubscription) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/subscription/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      setCurrentSubscription(data);
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentMethodId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/payment/methods`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add payment method');
      }

      await fetchPaymentMethods();
      toast.success('Payment method added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
      throw error;
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/payment/methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }

      await fetchPaymentMethods();
      toast.success('Payment method removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove payment method');
      throw error;
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/payment/methods/${paymentMethodId}/default`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      await fetchPaymentMethods();
      toast.success('Default payment method updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update default payment method');
      throw error;
    }
  };

  const createPaymentIntent = async (amount: number, description?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE}/payment/intent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        description: description || 'BrainSAIT Payment',
        currency: 'sar',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return response.json();
  };

  return (
    <PaymentContext.Provider value={{
      stripe,
      subscriptionTiers,
      currentSubscription,
      paymentMethods,
      loading,
      createSubscription,
      cancelSubscription,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      createPaymentIntent,
      fetchSubscriptionStatus,
    }}>
      {children}
    </PaymentContext.Provider>
  );
}
