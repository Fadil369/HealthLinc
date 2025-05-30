/**
 * General utility functions for the HealthLinc application
 */

/**
 * Format currency values
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}-${randomPart}`;
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time in milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse error message from API response
 * @param {Error|Object|string} error - Error object or response
 * @returns {string} Formatted error message
 */
export function parseErrorMessage(error) {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) return error.message;
  
  if (error.message) return error.message;
  
  if (error.error) {
    return typeof error.error === 'string' 
      ? error.error 
      : JSON.stringify(error.error);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Get display status for a claim
 * @param {string} status - Raw status value
 * @returns {Object} Status display information
 */
export function getClaimStatusDisplay(status) {
  const statusMap = {
    draft: { label: 'Draft', color: 'gray' },
    submitted: { label: 'Submitted', color: 'blue' },
    inprocess: { label: 'In Process', color: 'yellow' },
    completed: { label: 'Completed', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    returned: { label: 'Returned', color: 'orange' },
    cancelled: { label: 'Cancelled', color: 'gray' },
  };
  
  return statusMap[status] || { label: status, color: 'gray' };
}

/**
 * Format a date with options
 * @param {Date|string} date - Date to format
 * @param {Object} options - Format options
 * @returns {string} Formatted date
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', {
    ...defaultOptions,
    ...options
  }).format(dateObj);
}
