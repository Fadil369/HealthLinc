/**
 * FHIR data utilities for formatting and parsing FHIR resources
 */

/**
 * Format a FHIR date for display
 * @param {string} fhirDate - Date string in FHIR format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatFhirDate(fhirDate, options = {}) {
  if (!fhirDate) return '';
  
  try {
    const date = new Date(fhirDate);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(date);
  } catch (e) {
    console.error('Error formatting FHIR date:', e);
    return fhirDate;
  }
}

/**
 * Format a patient name from FHIR HumanName resource
 * @param {Object} name - FHIR HumanName object
 * @returns {string} Formatted name
 */
export function formatPatientName(name) {
  if (!name) return 'Unknown';
  
  const given = Array.isArray(name.given) ? name.given.join(' ') : (name.given || '');
  const family = name.family || '';
  
  return `${given} ${family}`.trim() || 'Unknown';
}

/**
 * Format a patient address from FHIR Address resource
 * @param {Object} address - FHIR Address object
 * @returns {string} Formatted address
 */
export function formatPatientAddress(address) {
  if (!address) return '';
  
  const line = Array.isArray(address.line) ? address.line.join(', ') : (address.line || '');
  const city = address.city || '';
  const state = address.state || '';
  const postalCode = address.postalCode || '';
  
  return [line, city, `${state} ${postalCode}`].filter(Boolean).join(', ');
}

/**
 * Format ICD-10 diagnosis code with description
 * @param {Object} coding - FHIR Coding object
 * @returns {string} Formatted diagnosis code
 */
export function formatDiagnosisCode(coding) {
  if (!coding) return '';
  
  const code = coding.code || '';
  const display = coding.display || '';
  
  return display ? `${code} - ${display}` : code;
}

/**
 * Format CPT procedure code with description
 * @param {Object} coding - FHIR Coding object
 * @returns {string} Formatted procedure code
 */
export function formatProcedureCode(coding) {
  if (!coding) return '';
  
  const code = coding.code || '';
  const display = coding.display || '';
  
  return display ? `${code} - ${display}` : code;
}

/**
 * Create a FHIR resource reference
 * @param {string} resourceType - FHIR resource type
 * @param {string} id - Resource ID
 * @param {string} display - Optional display text
 * @returns {Object} FHIR Reference object
 */
export function createReference(resourceType, id, display) {
  return {
    reference: `${resourceType}/${id}`,
    ...(display ? { display } : {})
  };
}

/**
 * Extract resource ID from a FHIR reference
 * @param {Object|string} reference - FHIR reference object or string
 * @returns {string|null} Resource ID or null if invalid
 */
export function getResourceId(reference) {
  if (!reference) return null;
  
  const refString = typeof reference === 'string' 
    ? reference 
    : reference.reference;
  
  if (!refString) return null;
  
  const parts = refString.split('/');
  return parts.length === 2 ? parts[1] : null;
}
