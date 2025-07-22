import React from 'react';
import { Users, Calendar, FileText, Shield, Video, Activity, Plus, CalendarPlus, Upload, Zap } from 'lucide-react';

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
    teal: "bg-teal-50 border-teal-200 text-teal-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    red: "bg-red-50 border-red-200 text-red-600"
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-102 group animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
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
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 text-white"
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
  return (
    <div className="space-y-8 font-inter">
      {/* Header */}
      <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, Dr. Sarah Wilson. Here's your practice overview.</p>
      </div>

      {/* Summary Cards Grid - Two rows, three columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <SummaryCard
          title="Active Patients"
          value="1,247"
          subtitle="↗ +15 this week"
          icon={<Users size={24} />}
          trend="+12%"
          color="teal"
        />
        
        <SummaryCard
          title="Upcoming Appointments"
          value="23"
          subtitle="Next: Dr. Smith at 2:30 PM"
          icon={<Calendar size={24} />}
          color="blue"
        />
        
        <SummaryCard
          title="Notes to Review"
          value="8"
          subtitle="AI-suggested notes awaiting sign-off"
          icon={<FileText size={24} />}
          color="amber"
        />
        
        {/* Row 2 */}
        <SummaryCard
          title="Authorizations Pending"
          value="12"
          subtitle="Avg. turnaround: 2.3 days"
          icon={<Shield size={24} />}
          color="purple"
        />
        
        <SummaryCard
          title="Live Telehealth Sessions"
          value="3"
          subtitle="2 scheduled, 1 in progress"
          icon={<Video size={24} />}
          color="green"
        />
        
        <SummaryCard
          title="System Health"
          value="Optimal"
          subtitle="All microservices operational"
          icon={<Activity size={24} />}
          color="green"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <QuickActionButton
            label="New Patient"
            icon={<Plus size={20} />}
            onClick={() => console.log('New Patient')}
            color="teal"
          />
          
          <QuickActionButton
            label="Schedule Visit"
            icon={<CalendarPlus size={20} />}
            onClick={() => console.log('Schedule Visit')}
            color="blue"
          />
          
          <QuickActionButton
            label="Upload Device Data"
            icon={<Upload size={20} />}
            onClick={() => console.log('Upload Device Data')}
            color="purple"
          />
          
          <QuickActionButton
            label="Run RCM Scan"
            icon={<Zap size={20} />}
            onClick={() => console.log('Run RCM Scan')}
            color="amber"
          />
        </div>
      </div>

      {/* Approve All Authorization Button */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Authorizations</h3>
            <p className="text-gray-600 mt-1">12 authorizations ready for approval</p>
          </div>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-102 hover:shadow-lg">
            Approve All
          </button>
        </div>
      </div>
    </div>
  );
}
