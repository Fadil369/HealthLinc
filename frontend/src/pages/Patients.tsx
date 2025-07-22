import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { mockPatients } from '../data/mockData';

export function Patients() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    document.title = "Patients | BrainSAIT";
  }, []);

  const filteredPatients = mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedPatientData = mockPatients.find(p => p.id === selectedPatient);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleClosePatientDetails = () => {
    setSelectedPatient(null);
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Patients</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Manage and view patient records
            </p>
          </div>
          
          <Button 
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
          >
            New Patient
          </Button>
        </div>
      </motion.div>
      
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name, MRN, or phone..."
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-primary-500 focus:border-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              icon={<Filter size={16} />}
              className="sm:w-auto w-full"
            >
              Filters
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-850">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  DOB
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Last Visit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Alerts
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer transition-colors ${patient.id === selectedPatient ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                  onClick={() => handleSelectPatient(patient.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar 
                        src={patient.avatar} 
                        alt={patient.name}
                        className="flex-shrink-0"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {patient.name}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          MRN: {patient.id.padStart(6, '0')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    {patient.dob}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    {getFormattedDate(patient.lastVisit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.alerts && patient.alerts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.alerts.map((alert, index) => (
                          <Badge key={index} variant="warning" size="sm">
                            {alert}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-400 dark:text-neutral-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ChevronRight size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(patient.id);
                        }}
                        className="text-primary-600"
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Patient Detail Slide-over */}
      {selectedPatient && selectedPatientData && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 max-w-xl w-full bg-white dark:bg-neutral-900 shadow-lg z-50 overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Patient Details</h2>
            <button 
              onClick={handleClosePatientDetails}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center">
              <Avatar 
                src={selectedPatientData.avatar} 
                alt={selectedPatientData.name}
                size="lg"
              />
              <div className="ml-4">
                <h3 className="text-xl font-semibold">{selectedPatientData.name}</h3>
                <div className="flex gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{getAge(selectedPatientData.dob)} years</span>
                  <span>•</span>
                  <span>DOB: {selectedPatientData.dob}</span>
                </div>
                <div className="mt-2">
                  {selectedPatientData.alerts && selectedPatientData.alerts.length > 0 && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400">
                      <AlertTriangle size={12} className="mr-1" />
                      {selectedPatientData.alerts.length} Alert{selectedPatientData.alerts.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Demographics" className="md:col-span-2">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'MRN', value: selectedPatientData.id.padStart(6, '0') },
                    { label: 'Gender', value: 'Female' },
                    { label: 'Phone', value: '(555) 123-4567' },
                    { label: 'Email', value: 'sophia.rodriguez@example.com' },
                    { label: 'Address', value: '123 Main St, Anytown, CA 90210' },
                    { label: 'Insurance', value: 'Blue Cross #BCS1234567' },
                  ].map((item) => (
                    <div key={item.label} className="py-1">
                      <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.label}</dt>
                      <dd className="text-sm text-neutral-900 dark:text-neutral-100">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              
              <Card title="Recent Vitals">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Blood Pressure', value: '120/80 mmHg' },
                    { label: 'Heart Rate', value: '72 bpm' },
                    { label: 'Temperature', value: '98.6°F' },
                    { label: 'Weight', value: '145 lbs' },
                    { label: 'Height', value: '5\'6"' },
                    { label: 'BMI', value: '23.4' },
                  ].map((item) => (
                    <div key={item.label} className="py-1">
                      <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.label}</dt>
                      <dd className="text-sm text-neutral-900 dark:text-neutral-100">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              
              <Card title="AI Care Suggestions">
                <div className="space-y-3">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Diabetes screening recommended
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Based on family history and recent lab values
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Consider adjusting allergy medication
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Patient reported continued symptoms at last visit
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Schedule Appointment</Button>
              <Button variant="outline">Add Clinical Note</Button>
              <Button variant="outline">View History</Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}