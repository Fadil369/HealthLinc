import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { direction } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <TopNav />
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 ${direction === 'rtl' ? 'mr-64' : 'ml-64'} pt-16`}>
          <div className="container mx-auto max-w-7xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}