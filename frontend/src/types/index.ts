export interface Patient {
  id: string;
  avatar: string;
  name: string;
  dob: string;
  lastVisit: string;
  alerts?: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: 'in-office' | 'telehealth';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'canceled';
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  content: string;
  status: 'draft' | 'ai-review' | 'reviewed' | 'signed';
  aiSuggestions?: string[];
}

export interface PriorAuth {
  id: string;
  patientId: string;
  patientName: string;
  medicationOrService: string;
  insuranceProvider: string;
  status: 'pending' | 'submitted' | 'approved' | 'denied';
  createdAt: string;
  estimatedTurnaround?: string;
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  data?: number[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
}