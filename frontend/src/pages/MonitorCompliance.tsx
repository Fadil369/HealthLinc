import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Lock, Shield, AlertTriangle, CheckCircle, Eye, Filter, Download, Activity } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: string;
  service: 'OAuth' | 'Webhooks' | 'iFrame' | 'API' | 'Database';
  event: string;
  user: string;
  severity: 'info' | 'warning' | 'error';
  details: string;
}

interface ComplianceItem {
  standard: 'HIPAA' | 'GDPR' | 'FHIR';
  status: 'compliant' | 'warning' | 'violation';
  lastAudit: string;
  score: number;
  issues: string[];
}

const mockAuditEvents: AuditEvent[] = [
  {
    id: 'AUD-001',
    timestamp: '2024-03-16 14:32:15',
    service: 'OAuth',
    event: 'User login successful',
    user: 'dr.chen@brainsait.com',
    severity: 'info',
    details: 'Standard authentication flow completed'
  },
  {
    id: 'AUD-002',
    timestamp: '2024-03-16 14:30:42',
    service: 'API',
    event: 'Patient data accessed',
    user: 'nurse.williams@brainsait.com',
    severity: 'info',
    details: 'Patient ID: PAT-12345, View operation'
  },
  {
    id: 'AUD-003',
    timestamp: '2024-03-16 14:28:33',
    service: 'Webhooks',
    event: 'Failed webhook delivery',
    user: 'system',
    severity: 'warning',
    details: 'Telehealth session webhook failed - retry scheduled'
  },
  {
    id: 'AUD-004',
    timestamp: '2024-03-16 14:25:18',
    service: 'iFrame',
    event: 'Unauthorized access attempt',
    user: 'unknown',
    severity: 'error',
    details: 'Access denied to DrChrono iframe from unauthorized domain'
  }
];

const complianceData: ComplianceItem[] = [
  {
    standard: 'HIPAA',
    status: 'compliant',
    lastAudit: '2024-03-01',
    score: 98,
    issues: []
  },
  {
    standard: 'GDPR',
    status: 'warning',
    lastAudit: '2024-02-28',
    score: 85,
    issues: ['Data retention policy needs update', 'Missing consent tracking for EU patients']
  },
  {
    standard: 'FHIR',
    status: 'compliant',
    lastAudit: '2024-03-10',
    score: 95,
    issues: []
  }
];

export function MonitorCompliance() {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceItem | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-error-500" />;
    }
  };

  const filteredEvents = mockAuditEvents.filter(event => {
    const serviceMatch = selectedService === 'all' || event.service === selectedService;
    const severityMatch = selectedSeverity === 'all' || event.severity === selectedSeverity;
    return serviceMatch && severityMatch;
  });

  const alertsCount = mockAuditEvents.filter(event => event.severity === 'error').length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Monitoring & Compliance</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time system monitoring and compliance management
        </p>
      </motion.div>

      {/* Alert Banner */}
      {alertsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-error-500 mr-3" />
            <div>
              <h3 className="text-error-900 dark:text-error-100 font-medium">
                Security Alert Detected
              </h3>
              <p className="text-error-700 dark:text-error-300 text-sm">
                {alertsCount} unauthorized access attempt(s) detected in the last hour.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto text-error-600 hover:text-error-700">
              View Details
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Stream Panel */}
        <div className="lg:col-span-2">
          <Card 
            title="Live Audit Stream" 
            icon={<Activity size={20} />}
            headerAction={
              <div className="flex items-center space-x-2">
                <select 
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="text-sm border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 dark:bg-neutral-800"
                >
                  <option value="all">All Services</option>
                  <option value="OAuth">OAuth</option>
                  <option value="Webhooks">Webhooks</option>
                  <option value="iFrame">iFrame</option>
                  <option value="API">API</option>
                  <option value="Database">Database</option>
                </select>
                <select 
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="text-sm border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 dark:bg-neutral-800"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <Button variant="ghost" size="sm">
                  <Filter size={16} />
                </Button>
              </div>
            }
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(event.severity)} size="sm">
                        {event.severity}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {event.service}
                      </Badge>
                      <span className="text-xs text-neutral-500">{event.timestamp}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{event.event}</p>
                    <p className="text-xs text-neutral-500">User: {event.user}</p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">{event.details}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-neutral-500">
              <span>Showing {filteredEvents.length} events</span>
              <Button variant="ghost" size="sm">
                <Download size={16} className="mr-2" />
                Export Logs
              </Button>
            </div>
          </Card>
        </div>

        {/* Compliance Summary */}
        <div className="lg:col-span-1">
          <Card title="Compliance Summary" icon={<Shield size={20} />}>
            <div className="space-y-4">
              {complianceData.map((item) => (
                <div
                  key={item.standard}
                  className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedCompliance(item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getComplianceIcon(item.status)}
                      <span className="font-medium">{item.standard}</span>
                    </div>
                    <Badge variant={getComplianceColor(item.status)} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Score</span>
                      <span className="font-medium">{item.score}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.score >= 90 ? 'bg-success-500' : 
                          item.score >= 75 ? 'bg-warning-500' : 'bg-error-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-500">
                      Last audit: {item.lastAudit}
                    </div>
                    {item.issues.length > 0 && (
                      <div className="text-xs text-warning-600">
                        {item.issues.length} issue(s) found
                      </div>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    <Eye size={16} className="mr-2" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* System Health */}
          <Card title="System Health" icon={<Lock size={20} />} className="mt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium">API Gateway</span>
                </div>
                <Badge variant="success" size="sm">Healthy</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge variant="success" size="sm">Healthy</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-warning-500" />
                  <span className="text-sm font-medium">Webhook Service</span>
                </div>
                <Badge variant="warning" size="sm">Degraded</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium">Authentication</span>
                </div>
                <Badge variant="success" size="sm">Healthy</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Compliance Detail Modal */}
      {selectedCompliance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedCompliance(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">{selectedCompliance.standard} Compliance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Compliance Score</p>
                <p className="text-2xl font-bold">{selectedCompliance.score}%</p>
              </div>
              
              {selectedCompliance.issues.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Issues Found:</p>
                  <ul className="space-y-1">
                    {selectedCompliance.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-warning-600 flex items-start">
                        <span className="mr-2">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedCompliance(null)}>
                  Close
                </Button>
                <Button>
                  Generate Report
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
