import axios from 'axios';

// Base API URLs from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const FHIR_ENDPOINT = `${API_URL}/fhir`;
const MCP_ENDPOINT = `${API_URL}/mcp`;

// Create an axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthlinc-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// FHIR API methods
export const fhirApi = {
  // Patient methods
  getPatient: async (patientId) => {
    const response = await api.get(`${FHIR_ENDPOINT}/Patient/${patientId}`);
    return response.data;
  },
  
  searchPatients: async (params) => {
    const response = await api.get(`${FHIR_ENDPOINT}/Patient`, { params });
    return response.data;
  },
  
  // Claim methods
  getClaim: async (claimId) => {
    const response = await api.get(`${FHIR_ENDPOINT}/Claim/${claimId}`);
    return response.data;
  },
  
  submitClaim: async (claimData) => {
    const response = await api.post(`${FHIR_ENDPOINT}/Claim`, claimData);
    return response.data;
  },
  
  searchClaims: async (params) => {
    const response = await api.get(`${FHIR_ENDPOINT}/Claim`, { params });
    return response.data;
  },
  
  // Observation methods
  getObservations: async (patientId) => {
    const response = await api.get(`${FHIR_ENDPOINT}/Observation`, {
      params: { patient: patientId }
    });
    return response.data;
  },
};

// MCP API for agent interactions
export const mcpApi = {
  // ClaimLinc methods
  submitClaim: async (claimData) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'ClaimLinc',
      task: 'submit',
      data: claimData
    });
    return response.data;
  },
  
  verifyClaim: async (claimId) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'ClaimLinc',
      task: 'verify',
      data: { claim_id: claimId }
    });
    return response.data;
  },
  
  disputeClaim: async (claimId, reason, supportingDocs = []) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'ClaimLinc',
      task: 'dispute',
      data: { 
        claim_id: claimId,
        reason,
        supporting_documents: supportingDocs
      }
    });
    return response.data;
  },
  
  checkEligibility: async (patientId, procedureCodes, diagnosisCodes, insuranceId) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'ClaimLinc',
      task: 'check',
      data: {
        patient_id: patientId,
        procedure_codes: procedureCodes,
        diagnosis_codes: diagnosisCodes,
        insurance_id: insuranceId
      }
    });
    return response.data;
  },
  
  // RecordLinc methods
  getRecords: async (patientId) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'RecordLinc',
      task: 'read',
      data: { patient_id: patientId }
    });
    return response.data;
  },
  
  // AuthLinc methods
  login: async (username, password) => {
    const response = await api.post(MCP_ENDPOINT, {
      agent: 'AuthLinc',
      task: 'login',
      data: { username, password }
    });
    
    // If login successful, store the token
    if (response.data && response.data.token) {
      localStorage.setItem('healthlinc-auth-token', response.data.token);
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('healthlinc-auth-token');
  },
};

export default api;
