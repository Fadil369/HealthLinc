import { useState } from 'react';
import { matchLincAPI } from '../lib/api';

/**
 * Hook for diagnosis-procedure code validation
 * @returns {Object} Validation functions and state
 */
export function useCodeValidation() {
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Validate diagnosis and procedure codes
   * @param {Object} data - Validation request data
   * @returns {Promise<Object>} Validation results
   */
  const validateCodes = async (data) => {
    setValidating(true);
    setError(null);
    
    try {
      const results = await matchLincAPI.validateCodes(data);
      setValidationResults(results);
      return results;
    } catch (err) {
      setError(err.message || 'Failed to validate codes');
      console.error('Code validation error:', err);
      throw err;
    } finally {
      setValidating(false);
    }
  };

  /**
   * Get coding rules for diagnosis or procedure codes
   * @param {string} diagnosisCode - Optional diagnosis code
   * @param {string} procedureCode - Optional procedure code
   * @returns {Promise<Array>} Coding rules
   */
  const getCodingRules = async (diagnosisCode, procedureCode) => {
    setValidating(true);
    setError(null);
    
    try {
      return await matchLincAPI.getCodingRules(diagnosisCode, procedureCode);
    } catch (err) {
      setError(err.message || 'Failed to retrieve coding rules');
      console.error('Error getting coding rules:', err);
      throw err;
    } finally {
      setValidating(false);
    }
  };

  /**
   * Reset validation state
   */
  const resetValidation = () => {
    setValidationResults(null);
    setError(null);
  };

  return {
    validationResults,
    validating,
    error,
    validateCodes,
    getCodingRules,
    resetValidation
  };
}
