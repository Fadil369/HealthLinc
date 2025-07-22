import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  Shield, 
  Video, 
  LineChart, 
  Lock, 
  Signal, 
  Settings
} from 'lucide-react';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem = ({ to, label, icon }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 my-1 rounded-2xl text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-teal-50 text-teal-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-102'
      }`}
    >
      <div className={`flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
        isActive ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'
      }`}>
        {icon}
      </div>
      <span className="ml-3 whitespace-nowrap">{label}</span>
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/patients', label: 'Patients', icon: <Users size={18} /> },
    { to: '/appointments', label: 'Appointments', icon: <Calendar size={18} /> },
    { to: '/clinical-notes', label: 'Clinical Notes', icon: <BookOpen size={18} /> },
    { to: '/prior-auth', label: 'Prior Auth', icon: <Shield size={18} /> },
    { to: '/telehealth', label: 'Telehealth', icon: <Video size={18} /> },
    { to: '/rcm-optimizer', label: 'RCM Optimizer', icon: <LineChart size={18} /> },
    { to: '/monitor-compliance', label: 'Monitor & Compliance', icon: <Lock size={18} /> },
    { to: '/iot-data-hub', label: 'IoT Data Hub', icon: <Signal size={18} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full fixed left-0 top-16 z-30 overflow-y-auto">
      <nav className="flex-1 space-y-1 px-3 py-6">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">BrainSAIT v1.0</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-500 ml-2">System Health: Optimal</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
