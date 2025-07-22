import { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import { useLanguage } from '../contexts/LanguageContext';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { addPaymentMethod } = usePayment();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message || 'Failed to create payment method');
      setLoading(false);
      return;
    }

    try {
      await addPaymentMethod(paymentMethod.id);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-300 mb-2">
          Card Details
        </label>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethods() {
  const { paymentMethods, removePaymentMethod, setDefaultPaymentMethod, stripe } = usePayment();
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      try {
        await removePaymentMethod(paymentMethodId);
      } catch (error) {
        console.error('Failed to remove payment method:', error);
      }
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod(paymentMethodId);
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (!stripe) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t('payment.methods.title') || 'Payment Methods'}
              </h1>
              <p className="text-gray-400">
                {t('payment.methods.subtitle') || 'Manage your payment methods and billing information'}
              </p>
            </div>
            
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Payment Method
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Payment Method Form */}
        {showAddForm && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Add New Payment Method</h2>
            <Elements stripe={stripe}>
              <AddPaymentMethodForm onSuccess={() => setShowAddForm(false)} />
            </Elements>
          </div>
        )}

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
              <CreditCardIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Payment Methods</h3>
              <p className="text-gray-400 mb-4">
                Add a payment method to start using BrainSAIT services
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-colors"
              >
                Add Your First Payment Method
              </button>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-gray-900/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-200 ${
                  method.isDefault
                    ? 'border-primary-500 ring-1 ring-primary-500/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getCardIcon(method.brand || '')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white capitalize">
                          {method.brand || 'Card'} •••• {method.last4}
                        </h3>
                        {method.isDefault && (
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <p className="text-gray-400 text-sm">
                          Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
                        title="Set as default"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove payment method"
                      disabled={method.isDefault && paymentMethods.length === 1}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">Secure Payment Processing</h4>
              <p className="text-blue-300/80 text-sm">
                Your payment information is encrypted and securely processed by Stripe. 
                We never store your complete card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
