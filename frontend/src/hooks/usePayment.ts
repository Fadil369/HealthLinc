import { useContext } from 'react';
import { PaymentContext } from '../contexts/PaymentContext';

export function usePayment() {
  const context = useContext(PaymentContext);
  
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
}
