import { useState, useEffect, useCallback } from 'react';
import { claimTrackerLincAPI } from '../lib/api';

/**
 * Hook for claim tracking and duplicate detection
 * @param {Object} initialFilters - Initial filter criteria
 * @returns {Object} Claim tracking functions and state
 */
export function useClaimTracking(initialFilters = {}) {
  const [claims, setClaims] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load tracked claims with optional filters
   * @param {Object} filterParams - Optional filter parameters
   */
  const loadClaims = useCallback(async (filterParams = null) => {
    setLoading(true);
    setError(null);
    
    const activeFilters = filterParams || filters;
    
    try {
      const data = await claimTrackerLincAPI.getTrackedClaims(activeFilters);
      setClaims(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tracked claims');
      console.error('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Update filters and reload claims
   * @param {Object} newFilters - Filter parameters
   */
  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadClaims(updatedFilters);
  };

  /**
   * Check if a claim is a potential duplicate
   * @param {Object} claimData - Claim data to check
   * @returns {Promise<Object>} Duplicate check result
   */
  const checkDuplicateClaim = async (claimData) => {
    setLoading(true);
    setError(null);
    
    try {
      return await claimTrackerLincAPI.checkDuplicateClaim(claimData);
    } catch (err) {
      setError(err.message || 'Failed to check for duplicate claims');
      console.error('Error checking duplicates:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initial load of claims
  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  return {
    claims,
    filters,
    loading,
    error,
    loadClaims,
    updateFilters,
    checkDuplicateClaim
  };
}
