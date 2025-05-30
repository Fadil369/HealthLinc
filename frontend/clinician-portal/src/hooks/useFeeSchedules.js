import { useState, useEffect } from 'react';
import { reviewerLincAPI } from '../lib/api';

/**
 * Hook for managing fee schedules and contracts
 * @returns {Object} Fee schedule functions and state
 */
export function useFeeSchedules() {
  const [contracts, setContracts] = useState([]);
  const [feeSchedules, setFeeSchedules] = useState([]);
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all payer contracts
   */
  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reviewerLincAPI.getContracts();
      setContracts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payer contracts');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load fee schedules, optionally filtered by payer
   * @param {string} payerId - Optional payer ID to filter
   */
  const loadFeeSchedules = async (payerId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await reviewerLincAPI.getFeeSchedules(payerId);
      setFeeSchedules(data || []);
      if (payerId) {
        setSelectedPayer(payerId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load fee schedules');
      console.error('Error loading fee schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of contracts
  useEffect(() => {
    loadContracts();
  }, []);

  return {
    contracts,
    feeSchedules,
    selectedPayer,
    loading,
    error,
    loadContracts,
    loadFeeSchedules,
    setSelectedPayer
  };
}
