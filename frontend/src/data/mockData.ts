import { Patient, Appointment, ClinicalNote, PriorAuth, UserProfile } from '../types';

// Mock data for the application
export const mockPatients: Patient[] = [
  {
    id: '1',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    name: 'Sophia Rodriguez',
    dob: '1985-04-12',
    lastVisit: '2023-11-15',
    alerts: ['Low BP', 'Glucose monitor alert']
  },
  {
    id: '2',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    name: 'James Wilson',
    dob: '1978-09-23',
    lastVisit: '2023-11-20'
  },
  {
    id: '3',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
    name: 'Emma Johnson',
    dob: '1992-07-03',
    lastVisit: '2023-11-18',
    alerts: ['Medication refill needed']
  },
  {
    id: '4',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    name: 'Michael Thompson',
    dob: '1965-12-18',
    lastVisit: '2023-11-22',
    alerts: ['Elevated heart rate']
  },
  {
    id: '5',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    name: 'Olivia Martinez',
    dob: '2001-02-15',
    lastVisit: '2023-11-23'
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Sophia Rodriguez',
    date: 'Today',
    time: '2:30 PM',
    type: 'telehealth',
    status: 'confirmed'
  },
  {
    id: '2',
    patientId: '3',
    patientName: 'Emma Johnson',
    date: 'Today',
    time: '4:00 PM',
    type: 'in-office',
    status: 'scheduled'
  },
  {
    id: '3',
    patientId: '2',
    patientName: 'James Wilson',
    date: 'Tomorrow',
    time: '10:15 AM',
    type: 'telehealth',
    status: 'confirmed'
  },
  {
    id: '4',
    patientId: '5',
    patientName: 'Olivia Martinez',
    date: 'Dec 02, 2023',
    time: '1:00 PM',
    type: 'in-office',
    status: 'scheduled'
  },
  {
    id: '5',
    patientId: '4',
    patientName: 'Michael Thompson',
    date: 'Dec 03, 2023',
    time: '11:30 AM',
    type: 'telehealth',
    status: 'scheduled'
  }
];

export const mockClinicalNotes: ClinicalNote[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Sophia Rodriguez',
    date: '2023-11-15',
    content: 'Patient presented with symptoms of seasonal allergies. Prescribed antihistamines.',
    status: 'ai-review',
    aiSuggestions: ['Add ICD-10 code for seasonal allergic rhinitis (J30.2)', 'Consider documenting previous allergy history']
  },
  {
    id: '2',
    patientId: '3',
    patientName: 'Emma Johnson',
    date: '2023-11-18',
    content: 'Follow-up for hypertension. Blood pressure 130/85, improved from last visit.',
    status: 'draft'
  },
  {
    id: '3',
    patientId: '2',
    patientName: 'James Wilson',
    date: '2023-11-20',
    content: 'Annual physical. All vital signs within normal range.',
    status: 'signed'
  }
];

export const mockPriorAuths: PriorAuth[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Sophia Rodriguez',
    medicationOrService: 'MRI - Brain',
    insuranceProvider: 'Blue Cross',
    status: 'pending',
    createdAt: '2023-11-14',
    estimatedTurnaround: '48 hours'
  },
  {
    id: '2',
    patientId: '4',
    patientName: 'Michael Thompson',
    medicationOrService: 'Humira',
    insuranceProvider: 'Aetna',
    status: 'submitted',
    createdAt: '2023-11-10',
    estimatedTurnaround: '72 hours'
  },
  {
    id: '3',
    patientId: '5',
    patientName: 'Olivia Martinez',
    medicationOrService: 'Physical Therapy - 12 sessions',
    insuranceProvider: 'UnitedHealthcare',
    status: 'approved',
    createdAt: '2023-11-05'
  }
];

export const currentUser: UserProfile = {
  id: '1',
  name: 'Dr. Sarah Chen',
  avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
  role: 'Physician',
  email: 'sarah@brainsait.com'
};

export const getUpcomingAppointments = (): Appointment[] => {
  return mockAppointments.slice(0, 3);
};