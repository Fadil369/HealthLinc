import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  Shield, 
  Video, 
  Play,
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
          ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-400 shadow-sm'
          : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-dark-50 hover:scale-102'
      }`}
    >
      <div className={`flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
        isActive ? 'text-accent-600 dark:text-accent-400' : 'text-gray-500 dark:text-dark-400 group-hover:text-gray-700 dark:group-hover:text-dark-200'
      }`}>
        {icon}
      </div>
      <span className="ml-3 whitespace-nowrap">{label}</span>
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const { t, direction } = useLanguage();
  
  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: <Home size={18} /> },
    { to: '/patients', label: t('nav.patients'), icon: <Users size={18} /> },
    { to: '/appointments', label: t('nav.appointments'), icon: <Calendar size={18} /> },
    { to: '/clinical-notes', label: t('nav.clinicalNotes'), icon: <BookOpen size={18} /> },
    { to: '/prior-auth', label: t('nav.priorAuth'), icon: <Shield size={18} /> },
    { to: '/telehealth', label: t('nav.telehealth'), icon: <Video size={18} /> },
    { to: '/healthflicks', label: 'HealthFlicks', icon: <Play size={18} /> },
    { to: '/rcm-optimizer', label: t('nav.rcmOptimizer'), icon: <LineChart size={18} /> },
    { to: '/monitor-compliance', label: t('nav.monitorCompliance'), icon: <Lock size={18} /> },
    { to: '/iot-data-hub', label: t('nav.iotDataHub'), icon: <Signal size={18} /> },
    { to: '/settings', label: t('nav.settings'), icon: <Settings size={18} /> },
  ];

  return (
    <aside className={`w-64 bg-white dark:bg-dark-950 border-r border-gray-200 dark:border-dark-800 h-full fixed ${direction === 'rtl' ? 'right-0' : 'left-0'} top-16 z-30 overflow-y-auto`}>
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
        <div className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-4 border border-gray-200 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-dark-400 font-medium">{t('common.version')}</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-500 dark:text-dark-400 ml-2">{t('common.systemHealthOptimal')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
