import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { fhirApi } from '@/lib/api';

// Custom hook to fetch patient data
export const usePatient = (patientId) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fhirApi.getPatient(patientId),
    enabled: !!session && !!patientId,
  });
};

// Custom hook to fetch claims for a patient
export const usePatientClaims = (patientId) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['claims', patientId],
    queryFn: () => fhirApi.searchClaims({ patient: patientId }),
    enabled: !!session && !!patientId,
  });
};

// Custom hook for eligibility check
export const useEligibilityCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [error, setError] = useState(null);
  
  const checkEligibility = async (patientId, procedureCodes, diagnosisCodes, insuranceId) => {
    setIsChecking(true);
    setError(null);
    
    try {
      const data = await mcpApi.checkEligibility(
        patientId, 
        procedureCodes, 
        diagnosisCodes, 
        insuranceId
      );
      setEligibilityData(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check eligibility');
      throw err;
    } finally {
      setIsChecking(false);
    }
  };
  
  return { checkEligibility, isChecking, eligibilityData, error };
};

// Custom hook to fetch observations for a patient
export const usePatientObservations = (patientId) => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['observations', patientId],
    queryFn: () => fhirApi.getObservations(patientId),
    enabled: !!session && !!patientId,
  });
};
