import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Signal, Upload, Wifi, AlertCircle, TrendingUp, Activity, Thermometer, Heart, Droplet } from 'lucide-react';

interface Device {
  id: string;
  patientName: string;
  deviceType: string;
  lastPing: string;
  status: 'online' | 'offline' | 'warning';
  batteryLevel: number;
  dataType: string;
  location: string;
}

interface VitalReading {
  id: string;
  patientId: string;
  timestamp: string;
  type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'glucose';
  value: number | string;
  unit: string;
  isAnomaly: boolean;
  aiInsight?: string;
}

const mockDevices: Device[] = [
  {
    id: 'DEV-001',
    patientName: 'Sarah Johnson',
    deviceType: 'Continuous Glucose Monitor',
    lastPing: '2 min ago',
    status: 'online',
    batteryLevel: 85,
    dataType: 'Glucose levels',
    location: 'Home'
  },
  {
    id: 'DEV-002',
    patientName: 'Michael Chen',
    deviceType: 'Blood Pressure Monitor',
    lastPing: '5 min ago',
    status: 'online',
    batteryLevel: 92,
    dataType: 'BP readings',
    location: 'Home'
  },
  {
    id: 'DEV-003',
    patientName: 'Emma Wilson',
    deviceType: 'Heart Rate Monitor',
    lastPing: '45 min ago',
    status: 'warning',
    batteryLevel: 15,
    dataType: 'Heart rate',
    location: 'Mobile'
  },
  {
    id: 'DEV-004',
    patientName: 'Robert Davis',
    deviceType: 'Smart Thermometer',
    lastPing: '2 hours ago',
    status: 'offline',
    batteryLevel: 0,
    dataType: 'Temperature',
    location: 'Home'
  }
];

const mockVitalReadings: VitalReading[] = [
  {
    id: 'VR-001',
    patientId: 'PAT-001',
    timestamp: '2024-03-16 14:30:00',
    type: 'glucose',
    value: '285',
    unit: 'mg/dL',
    isAnomaly: true,
    aiInsight: 'Glucose levels significantly elevated. Recommend immediate insulin adjustment and patient contact.'
  },
  {
    id: 'VR-002',
    patientId: 'PAT-002',
    timestamp: '2024-03-16 14:25:00',
    type: 'blood_pressure',
    value: '140/90',
    unit: 'mmHg',
    isAnomaly: false
  },
  {
    id: 'VR-003',
    patientId: 'PAT-003',
    timestamp: '2024-03-16 14:20:00',
    type: 'heart_rate',
    value: 115,
    unit: 'bpm',
    isAnomaly: true,
    aiInsight: 'Elevated heart rate detected during rest period. Consider cardiac evaluation.'
  },
  {
    id: 'VR-004',
    patientId: 'PAT-004',
    timestamp: '2024-03-16 14:15:00',
    type: 'temperature',
    value: 101.2,
    unit: '°F',
    isAnomaly: true,
    aiInsight: 'Fever detected. Monitor for infection signs and consider antipyretic treatment.'
  }
];

export function IoTDataHub() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedVital, setSelectedVital] = useState<VitalReading | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType.includes('Glucose')) return <Droplet className="w-4 h-4" />;
    if (deviceType.includes('Blood Pressure')) return <Activity className="w-4 h-4" />;
    if (deviceType.includes('Heart Rate')) return <Heart className="w-4 h-4" />;
    if (deviceType.includes('Thermometer')) return <Thermometer className="w-4 h-4" />;
    return <Signal className="w-4 h-4" />;
  };

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'glucose':
        return <Droplet className="w-4 h-4" />;
      case 'blood_pressure':
        return <Activity className="w-4 h-4" />;
      case 'heart_rate':
        return <Heart className="w-4 h-4" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <Signal className="w-4 h-4" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const anomalyCount = mockVitalReadings.filter(reading => reading.isAnomaly).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">IoT Data Hub</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Monitor connected devices and analyze patient vital signs
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Connected Devices</p>
              <p className="text-2xl font-bold">{mockDevices.length}</p>
            </div>
            <Signal size={24} className="text-primary-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100">Online</p>
              <p className="text-2xl font-bold">{mockDevices.filter(d => d.status === 'online').length}</p>
            </div>
            <Wifi size={24} className="text-success-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Anomalies</p>
              <p className="text-2xl font-bold">{anomalyCount}</p>
            </div>
            <AlertCircle size={24} className="text-warning-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-info-500 to-info-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-info-100">Data Points</p>
              <p className="text-2xl font-bold">12.4K</p>
            </div>
            <TrendingUp size={24} className="text-info-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Ingestion */}
        <Card title="Data Ingestion" icon={<Upload size={20} />}>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                Upload device data files or connect live streams
              </p>
              <input
                type="file"
                accept=".csv,.json,.xml"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  Choose File
                </Button>
              </label>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* MQTT Stream Status */}
            <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-success-900 dark:text-success-100">MQTT Stream</h3>
                  <p className="text-sm text-success-700 dark:text-success-300">Connected to broker</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-success-600">Live</span>
                </div>
              </div>
            </div>

            {/* Device List */}
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Connected Devices</h3>
              <div className="space-y-2">
                {mockDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <p className="font-medium text-sm">{device.patientName}</p>
                        <p className="text-xs text-neutral-500">{device.deviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getDeviceStatusColor(device.status)} size="sm">
                        {device.status}
                      </Badge>
                      <span className="text-xs text-neutral-500">{device.lastPing}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Analytics View */}
        <Card title="Vital Signs Analytics" icon={<Activity size={20} />}>
          <div className="space-y-4">
            {mockVitalReadings.map((reading) => (
              <div
                key={reading.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  reading.isAnomaly
                    ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 hover:bg-error-100 dark:hover:bg-error-900/30'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => reading.isAnomaly && setSelectedVital(reading)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getVitalIcon(reading.type)}
                    <span className="font-medium capitalize">{reading.type.replace('_', ' ')}</span>
                    {reading.isAnomaly && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                        <span className="text-xs text-error-600">Anomaly</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">{reading.timestamp.split(' ')[1]}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">{reading.value}</span>
                    <span className="text-sm text-neutral-500 ml-1">{reading.unit}</span>
                  </div>
                  {reading.isAnomaly && (
                    <Button variant="ghost" size="sm" className="text-error-600">
                      View AI Insight
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insight Modal */}
      {selectedVital && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedVital(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-error-500" />
              <h3 className="text-lg font-bold">Anomaly Detected</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Reading</p>
                <p className="text-xl font-bold">
                  {selectedVital.value} {selectedVital.unit}
                </p>
                <p className="text-sm text-neutral-500">{selectedVital.timestamp}</p>
              </div>
              
              {selectedVital.aiInsight && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">AI Recommendation</h4>
                  <p className="text-sm text-primary-700 dark:text-primary-300">{selectedVital.aiInsight}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedVital(null)}>
                  Close
                </Button>
                <Button>
                  Create Alert
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Device Detail Modal */}
      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedDevice(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Device Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Device ID</p>
                  <p className="font-medium">{selectedDevice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Patient</p>
                  <p className="font-medium">{selectedDevice.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Type</p>
                  <p className="font-medium">{selectedDevice.deviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{selectedDevice.location}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-neutral-500 mb-2">Battery Level</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      selectedDevice.batteryLevel > 50 ? 'bg-success-500' : 
                      selectedDevice.batteryLevel > 20 ? 'bg-warning-500' : 'bg-error-500'
                    }`}
                    style={{ width: `${selectedDevice.batteryLevel}%` }}
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-1">{selectedDevice.batteryLevel}%</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedDevice(null)}>
                  Close
                </Button>
                <Button>
                  Configure
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
