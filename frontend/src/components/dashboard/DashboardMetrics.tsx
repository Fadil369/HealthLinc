import React from 'react';
import { SummaryCard } from './SummaryCard';
import { Users, Calendar, FileText, Shield, Video, Activity } from 'lucide-react';
import { DashboardMetric } from '../../types';

interface DashboardMetricsProps {
  metrics?: DashboardMetric[];
}

const defaultMetrics: DashboardMetric[] = [
  {
    id: '1',
    title: 'Active Patients',
    value: '1,234',
    change: {
      value: 5.3,
      trend: 'up',
    },
    data: [25, 30, 28, 32, 36, 34, 38]
  },
  {
    id: '2',
    title: 'Upcoming Appointments',
    value: '28',
    change: {
      value: 2.1,
      trend: 'down',
    },
    data: [18, 15, 16, 14, 12, 10, 13]
  },
  {
    id: '3',
    title: 'Notes to Review',
    value: '15',
    change: {
      value: 3.2,
      trend: 'up',
    },
    data: [8, 9, 12, 10, 11, 13, 15]
  },
  {
    id: '4',
    title: 'Authorizations Pending',
    value: '7',
    change: {
      value: 1.8,
      trend: 'down',
    },
    data: [10, 8, 9, 7, 6, 8, 7]
  },
  {
    id: '5',
    title: 'Live Telehealth Sessions',
    value: '3',
    change: {
      value: 0,
      trend: 'neutral',
    },
    data: [2, 4, 3, 3, 2, 3, 3]
  },
  {
    id: '6',
    title: 'System Health',
    value: '100%',
    change: {
      value: 0,
      trend: 'neutral',
    },
    data: [100, 99, 100, 100, 98, 100, 100]
  }
];

const iconMap = {
  'Active Patients': <Users size={20} />,
  'Upcoming Appointments': <Calendar size={20} />,
  'Notes to Review': <FileText size={20} />,
  'Authorizations Pending': <Shield size={20} />,
  'Live Telehealth Sessions': <Video size={20} />,
  'System Health': <Activity size={20} />
};

const colorMap = {
  'Active Patients': 'primary',
  'Upcoming Appointments': 'secondary',
  'Notes to Review': 'warning',
  'Authorizations Pending': 'error',
  'Live Telehealth Sessions': 'primary',
  'System Health': 'success'
} as const;

export function DashboardMetrics({ metrics = defaultMetrics }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <SummaryCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          icon={iconMap[metric.title as keyof typeof iconMap] || <Activity size={20} />}
          trend={metric.change ? {
            value: metric.change.value,
            direction: metric.change.trend,
            label: metric.change.trend === 'up' ? 'increase' : metric.change.trend === 'down' ? 'decrease' : 'no change'
          } : undefined}
          chartData={metric.data}
          color={colorMap[metric.title as keyof typeof colorMap] || 'primary'}
          animateIndex={index}
        />
      ))}
    </div>
  );
}