import React from 'react';
import { Search, Bell, Settings, User, LogOut } from 'lucide-react';

export const TopNav: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          {/* Neuronal Network Icon */}
          <div className="relative w-8 h-8 group cursor-pointer">
            <svg 
              viewBox="0 0 32 32" 
              className="w-full h-full text-teal-600 transition-transform duration-300 group-hover:scale-110"
              fill="currentColor"
            >
              {/* Central node */}
              <circle cx="16" cy="16" r="3" className="animate-pulse" />
              
              {/* Outer nodes */}
              <circle cx="8" cy="8" r="2" />
              <circle cx="24" cy="8" r="2" />
              <circle cx="8" cy="24" r="2" />
              <circle cx="24" cy="24" r="2" />
              <circle cx="4" cy="16" r="1.5" />
              <circle cx="28" cy="16" r="1.5" />
              <circle cx="16" cy="4" r="1.5" />
              <circle cx="16" cy="28" r="1.5" />
              
              {/* Connections with subtle animation */}
              <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDelay: '0.1s' }} />
              <line x1="24" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <line x1="8" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
              <line x1="24" y1="24" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              <line x1="4" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <line x1="28" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <line x1="16" y1="4" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <line x1="16" y1="28" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-gray-900 tracking-tight font-inter">BrainSAIT</span>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-200 group-focus-within:text-teal-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, appointments..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg bg-gray-50 focus:bg-white"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 text-sm text-gray-500">Recent searches</div>
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">John Doe - Patient</div>
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Cardiology appointment</div>
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Blood pressure readings</div>
              </div>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group">
            <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          </button>

          {/* User Avatar & Dropdown */}
          <div className="relative user-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-102 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">Dr. Sarah Wilson</div>
                <div className="text-xs text-gray-500">Physician</div>
              </div>
              <div className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">Dr. Sarah Wilson</div>
                  <div className="text-xs text-gray-500">sarah.wilson@brainsait.com</div>
                </div>
                <a
                  href="#"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <User className="w-4 h-4 mr-3 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
                  My Profile
                </a>
                <a
                  href="#"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
                  Settings
                </a>
                <hr className="my-2 border-gray-100" />
                <a
                  href="#"
                  className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 group"
                >
                  <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
