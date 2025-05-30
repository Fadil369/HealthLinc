import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Shield, User, FileText, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';

interface AuthRequest {
  id: string;
  patientName: string;
  procedure: string;
  payer: string;
  status: 'pending' | 'approved' | 'denied' | 'submitted';
  submittedDate: string;
  estimatedTurnaround: string;
  priority: 'low' | 'medium' | 'high';
}

const mockAuthRequests: AuthRequest[] = [
  {
    id: 'PA-001',
    patientName: 'Sarah Johnson',
    procedure: 'MRI Brain',
    payer: 'Blue Cross Blue Shield',
    status: 'pending',
    submittedDate: '2024-03-15',
    estimatedTurnaround: '3-5 business days',
    priority: 'high'
  },
  {
    id: 'PA-002',
    patientName: 'Michael Chen',
    procedure: 'Physical Therapy',
    payer: 'Aetna',
    status: 'approved',
    submittedDate: '2024-03-14',
    estimatedTurnaround: '2-3 business days',
    priority: 'medium'
  },
  {
    id: 'PA-003',
    patientName: 'Emma Wilson',
    procedure: 'Specialist Referral',
    payer: 'Medicare',
    status: 'submitted',
    submittedDate: '2024-03-16',
    estimatedTurnaround: '5-7 business days',
    priority: 'low'
  }
];

export function PriorAuth() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<AuthRequest | null>(null);

  const steps = [
    { number: 1, title: 'Patient & Rx', completed: true },
    { number: 2, title: 'Form Mapping', completed: false },
    { number: 3, title: 'Review & Submit', completed: false },
    { number: 4, title: 'Status', completed: false }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'denied':
        return <AlertCircle className="w-4 h-4 text-error-500" />;
      default:
        return <Clock className="w-4 h-4 text-primary-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'denied':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Prior Authorization Engine</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Streamline authorization requests with AI-powered form filling
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Authorization Form */}
        <div className="lg:col-span-2">
          <Card title="New Authorization Request" icon={<Shield size={20} />}>
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step.number <= activeStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                  }`}>
                    {step.completed ? <CheckCircle size={16} /> : step.number}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      step.number <= activeStep ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Form Content based on active step */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
                      placeholder="Search patient..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Procedure/Service
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
                      placeholder="Enter procedure..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Insurance Payer
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800">
                    <option>Select payer...</option>
                    <option>Blue Cross Blue Shield</option>
                    <option>Aetna</option>
                    <option>Medicare</option>
                    <option>Medicaid</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setActiveStep(2)}>
                    Continue to Form Mapping
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">AI Smart Fill Enabled</h3>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Fields have been automatically populated from patient records. Review and modify as needed.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Diagnosis Code (ICD-10)
                    </label>
                    <input
                      type="text"
                      value="M79.3"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      CPT Code
                    </label>
                    <input
                      type="text"
                      value="72148"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveStep(3)}>
                    Review & Submit
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Authorization Requests List */}
        <div className="lg:col-span-1">
          <Card title="Recent Requests" icon={<FileText size={20} />}>
            <div className="space-y-3">
              {mockAuthRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium text-sm">{request.id}</span>
                    </div>
                    <Badge variant={getPriorityColor(request.priority)} size="sm">
                      {request.priority}
                    </Badge>
                  </div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{request.patientName}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{request.procedure}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={getStatusColor(request.status)} size="sm">
                      {request.status}
                    </Badge>
                    <span className="text-xs text-neutral-500">{request.submittedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payer Rules Sidebar */}
          <Card title="Payer Rules" icon={<User size={20} />} className="mt-6">
            <div className="space-y-3">
              <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
                <h4 className="font-medium text-info-900 dark:text-info-100">Blue Cross Blue Shield</h4>
                <p className="text-sm text-info-700 dark:text-info-300 mt-1">
                  Requires prior auth for MRI procedures
                </p>
                <p className="text-xs text-info-600 dark:text-info-400 mt-2">
                  Est. turnaround: 3-5 business days
                </p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <h4 className="font-medium">DataLinc Analytics</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  97% approval rate for similar requests
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
