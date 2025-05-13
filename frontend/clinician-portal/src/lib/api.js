/**
 * API utilities for interacting with HealthLinc backend services
 */

/**
 * Base fetch function with authentication and error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function fetchWithAuth(url, options = {}) {
  // Get token from localStorage or context
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized 
    if (response.status === 401) {
      // Redirect to login or refresh token
      window.location.href = '/auth/login?session=expired';
      return null;
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error ${response.status}`);
    }

    // Return JSON data if content exists
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * DocuLinc API methods for clinical documentation
 */
export const docuLincAPI = {
  /**
   * Get available documentation templates
   * @returns {Promise<Array>} List of templates
   */
  getTemplates: async () => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/doculinc/templates`);
  },

  /**
   * Get a specific template by ID
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Template data
   */
  getTemplate: async (templateId) => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/doculinc/templates/${templateId}`);
  },

  /**
   * Enhance clinical documentation
   * @param {Object} documentData - Clinical document data
   * @returns {Promise<Object>} Enhanced document
   */
  enhanceDocumentation: async (documentData) => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/doculinc/enhance`, {
      method: 'POST',
      body: JSON.stringify(documentData)
    });
  }
};

/**
 * MatchLinc API methods for diagnosis-procedure validation
 */
export const matchLincAPI = {
  /**
   * Validate diagnosis-procedure code matching
   * @param {Object} validationData - Codes to validate
   * @returns {Promise<Object>} Validation results
   */
  validateCodes: async (validationData) => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/matchlinc/validate`, {
      method: 'POST',
      body: JSON.stringify(validationData)
    });
  },

  /**
   * Get coding rules
   * @param {string} diagnosisCode - Optional diagnosis code filter
   * @param {string} procedureCode - Optional procedure code filter
   * @returns {Promise<Array>} List of coding rules
   */
  getCodingRules: async (diagnosisCode, procedureCode) => {
    const params = new URLSearchParams();
    if (diagnosisCode) params.append('diagnosis_code', diagnosisCode);
    if (procedureCode) params.append('procedure_code', procedureCode);
    
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/matchlinc/coding-rules?${params.toString()}`);
  }
};

/**
 * ReviewerLinc API methods for fee schedule management
 */
export const reviewerLincAPI = {
  /**
   * Get payer contracts
   * @returns {Promise<Array>} List of contracts
   */
  getContracts: async () => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/reviewerlinc/contracts`);
  },

  /**
   * Get fee schedules
   * @param {string} payerId - Optional payer ID filter
   * @returns {Promise<Array>} List of fee schedules
   */
  getFeeSchedules: async (payerId) => {
    const params = payerId ? `?payer_id=${payerId}` : '';
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/reviewerlinc/fee-schedules${params}`);
  }
};

/**
 * ClaimTrackerLinc API methods for claim tracking
 */
export const claimTrackerLincAPI = {
  /**
   * Get tracked claims
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of tracked claims
   */
  getTrackedClaims: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/claimtrackerlinc/claims?${params.toString()}`);
  },

  /**
   * Check for duplicate claims
   * @param {Object} claimData - Claim data to check
   * @returns {Promise<Object>} Duplicate check result
   */
  checkDuplicateClaim: async (claimData) => {
    return fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL || ''}/claimtrackerlinc/check-duplicate`, {
      method: 'POST',
      body: JSON.stringify(claimData)
    });
  }
};
