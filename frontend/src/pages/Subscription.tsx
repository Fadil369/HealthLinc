import { useState } from 'react';
import { usePayment } from '../hooks/usePayment';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  CheckIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function Subscription() {
  const { 
    subscriptionTiers, 
    currentSubscription, 
    createSubscription, 
    cancelSubscription, 
    loading 
  } = usePayment();
  const { language, t } = useLanguage();
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'past_due':
        return 'text-yellow-400';
      case 'canceled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleSubscribe = async (tierId: string) => {
    // This would typically open a payment method selection modal
    // For now, we'll assume a default payment method exists
    try {
      await createSubscription(tierId, 'default');
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      setShowCancelConfirmation(false);
    } catch (error) {
      console.error('Cancel subscription failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              {t('subscription.title') || 'Subscription Management'}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('subscription.subtitle') || 'Choose the perfect plan for your healthcare integration needs'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-12 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Current Subscription</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSubscription.status)}`}>
                {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
              </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Plan</p>
                <p className="text-white font-medium">
                  {subscriptionTiers.find(tier => tier.id === currentSubscription.tier)?.name || currentSubscription.tier}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Next Billing Date</p>
                <p className="text-white font-medium flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {formatDate(currentSubscription.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Auto-Renewal</p>
                <p className="text-white font-medium">
                  {currentSubscription.cancelAtPeriodEnd ? 'Disabled' : 'Enabled'}
                </p>
              </div>
            </div>

            {currentSubscription.status === 'active' && !currentSubscription.cancelAtPeriodEnd && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCancelConfirmation(true)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="grid lg:grid-cols-4 gap-8">
          {subscriptionTiers.map((tier) => {
            const isCurrentTier = currentSubscription?.tier === tier.id;
            const isPopular = tier.isPopular;

            return (
              <div
                key={tier.id}
                className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
                  isPopular 
                    ? 'border-primary-500 ring-1 ring-primary-500/20' 
                    : 'border-gray-800 hover:border-gray-700'
                } ${isCurrentTier ? 'ring-2 ring-green-500/50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <StarIcon className="w-4 h-4 mr-1" />
                      Popular
                    </div>
                  </div>
                )}

                {isCurrentTier && (
                  <div className="absolute -top-3 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">${tier.price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading || isCurrentTier}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isCurrentTier
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {loading ? 'Processing...' : isCurrentTier ? 'Current Plan' : `Subscribe to ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Cancel Subscription</h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelConfirmation(false)}
                  className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
