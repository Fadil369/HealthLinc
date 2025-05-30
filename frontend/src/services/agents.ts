import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/agents' 
  : 'http://localhost:8000/agents';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// DocuLinc AI Assistant API
export const getDocumentationAssistance = async (data: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/doculinc`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to get documentation assistance' };
  }
};

// Scheduling Intelligence API
export const getSchedulingIntelligence = async (data: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/scheduling`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to get scheduling intelligence' };
  }
};

// RCM Optimization API
export const getRCMOptimization = async (data: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/rcm`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to get RCM optimization' };
  }
};

// Compliance Monitoring API
export const getComplianceMonitoring = async (data: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/compliance`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to get compliance monitoring' };
  }
};

// Telehealth Concierge API
export const getTelehealthConcierge = async (data: any): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(`${API_URL}/telehealth`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to get telehealth concierge' };
  }
};
