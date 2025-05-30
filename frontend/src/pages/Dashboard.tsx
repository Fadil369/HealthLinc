import React from 'react';
import { Users, Calendar, FileText, Shield, Video, Activity, Plus, CalendarPlus, Upload, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Summary Card Component
const SummaryCard = ({ title, value, subtitle, icon, trend, color = "teal" }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}) => {
  const colorClasses = {
    teal: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-700 p-6 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-dark-800/10 transition-all duration-200 hover:scale-102 group animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-50 mb-1">{value}</h3>
        <p className="text-sm text-gray-600 dark:text-dark-300">{title}</p>
        <p className="text-xs text-gray-400 dark:text-dark-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ label, icon, onClick, color = "teal" }: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}) => {
  const colorClasses = {
    teal: "bg-accent-500 hover:bg-accent-600 dark:bg-accent-600 dark:hover:bg-accent-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white"
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-102 hover:shadow-lg ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 font-inter">
      {/* Header */}
      <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-50 tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-dark-300 mt-2">{t('dashboard.subtitle')}</p>
      </div>

      {/* Summary Cards Grid - Two rows, three columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <SummaryCard
          title={t('dashboard.activePatients')}
          value="1,247"
          subtitle="↗ +15 this week"
          icon={<Users size={24} />}
          trend="+12%"
          color="teal"
        />
        
        <SummaryCard
          title={t('dashboard.upcomingAppointments')}
          value="23"
          subtitle="Next: Dr. Smith at 2:30 PM"
          icon={<Calendar size={24} />}
          color="blue"
        />
        
        <SummaryCard
          title={t('dashboard.notesToReview')}
          value="8"
          subtitle="AI-suggested notes awaiting sign-off"
          icon={<FileText size={24} />}
          color="amber"
        />
        
        {/* Row 2 */}
        <SummaryCard
          title={t('dashboard.authorizationsPending')}
          value="12"
          subtitle="Avg. turnaround: 2.3 days"
          icon={<Shield size={24} />}
          color="purple"
        />
        
        <SummaryCard
          title={t('dashboard.liveTelehealthSessions')}
          value="3"
          subtitle="2 scheduled, 1 in progress"
          icon={<Video size={24} />}
          color="green"
        />
        
        <SummaryCard
          title={t('dashboard.systemHealth')}
          value="Optimal"
          subtitle="All microservices operational"
          icon={<Activity size={24} />}
          color="green"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-50 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="flex flex-wrap gap-4">
          <QuickActionButton
            label={t('dashboard.newPatient')}
            icon={<Plus size={20} />}
            onClick={() => console.log('New Patient')}
            color="teal"
          />
          
          <QuickActionButton
            label={t('dashboard.scheduleVisit')}
            icon={<CalendarPlus size={20} />}
            onClick={() => console.log('Schedule Visit')}
            color="blue"
          />
          
          <QuickActionButton
            label={t('dashboard.uploadDeviceData')}
            icon={<Upload size={20} />}
            onClick={() => console.log('Upload Device Data')}
            color="purple"
          />
          
          <QuickActionButton
            label={t('dashboard.runRcmScan')}
            icon={<Zap size={20} />}
            onClick={() => console.log('Run RCM Scan')}
            color="amber"
          />
        </div>
      </div>

      {/* Approve All Authorization Button */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-dark-800 dark:to-dark-900 rounded-2xl border border-teal-200 dark:border-dark-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">{t('dashboard.authorizationsPending')}</h3>
            <p className="text-gray-600 dark:text-dark-300 mt-1">12 authorizations ready for approval</p>
          </div>
          <button className="bg-accent-500 hover:bg-accent-600 dark:bg-accent-600 dark:hover:bg-accent-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-102 hover:shadow-lg">
            Approve All
          </button>
        </div>
      </div>
    </div>
  );
}
