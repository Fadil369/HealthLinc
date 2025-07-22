import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid, List, 
  Plus, Clock, User, MapPin, Video, Phone, Bell, Brain, 
  CheckCircle, AlertCircle, Filter, Search, Settings, Zap,
  Users, FileText, MessageSquare, Heart, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { mockAppointments } from '../data/mockData';

export function Appointments() {
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    document.title = "Appointments | BrainSAIT";
  }, []);
  
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    
    if (viewType === 'day') {
      return new Intl.DateTimeFormat('en-US', options).format(currentDate);
    } else if (viewType === 'week') {
      const startOfWeek = new Date(currentDate);
      const day = currentDate.getDay();
      startOfWeek.setDate(currentDate.getDate() - day);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.getMonth();
      const endMonth = endOfWeek.getMonth();
      
      if (startMonth === endMonth) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
      }
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
    }
  };
  
  // Generate days for calendar
  const generateDaysForCalendar = () => {
    const days = [];
    let startDate: Date;
    
    if (viewType === 'day') {
      return [currentDate];
    } else if (viewType === 'week') {
      startDate = new Date(currentDate);
      const day = currentDate.getDay();
      startDate.setDate(currentDate.getDate() - day);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfMonth = startDate.getDay();
      
      // Add days from previous month
      for (let i = 0; i < firstDayOfMonth; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() - (firstDayOfMonth - i));
        days.push(date);
      }
      
      // Add days of the current month
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        days.push(date);
      }
      
      // Add days from next month to complete the grid (if needed)
      const totalDaysSoFar = days.length;
      const remainingCells = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
      
      for (let i = 0; i < remainingCells; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + daysInMonth + i);
        days.push(date);
      }
    }
    
    return days;
  };
  
  // Filter appointments by date
  const getAppointmentsForDate = (date: Date) => {
    // For the mock data, we'll use a simple approach
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return mockAppointments.filter(appointment => {
      if (appointment.date === 'Today') {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return dateStr === today;
      }
      if (appointment.date === 'Tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dateStr === tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      // Handle other dates
      return false;
    });
  };
  
  const days = generateDaysForCalendar();
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Appointments</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              View and manage your schedule with AI insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="sm"
              icon={<Search size={16} />}
              onClick={() => setShowAIInsights(!showAIInsights)}
            >
              AI Insights
            </Button>
            <Button 
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
            >
              New Appointment
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar/List View */}
        <div className={`${showAIInsights ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              icon={<ChevronLeft size={16} />}
              className="p-2"
              aria-label="Previous"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="whitespace-nowrap"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              icon={<ChevronRight size={16} />}
              className="p-2"
              aria-label="Next"
            />
            <span className="font-medium text-sm sm:text-base">{formatDateRange()}</span>
          </div>
          
          <div className="flex w-full sm:w-auto justify-between sm:justify-start items-center space-x-3">
            <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 text-sm rounded-l-lg ${
                  viewType === 'month'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } transition-colors`}
              >
                Month
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 text-sm ${
                  viewType === 'week'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } transition-colors`}
              >
                Week
              </button>
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 text-sm rounded-r-lg ${
                  viewType === 'day'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } transition-colors`}
              >
                Day
              </button>
            </div>
            
            <div className="inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setDisplayMode('calendar')}
                className={`p-1.5 rounded-l-lg ${
                  displayMode === 'calendar'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } transition-colors`}
                aria-label="Calendar view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded-r-lg ${
                  displayMode === 'list'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                } transition-colors`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {displayMode === 'calendar' ? (
          <div className="p-4">
            {viewType === 'month' && (
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 p-2">
                    {day}
                  </div>
                ))}
                
                {days.map((date, i) => {
                  const appointments = getAppointmentsForDate(date);
                  const isCurrentDay = isToday(date);
                  const inCurrentMonth = isCurrentMonth(date);
                  
                  return (
                    <div 
                      key={i}
                      className={`min-h-[100px] p-2 border rounded-lg ${
                        inCurrentMonth 
                          ? 'border-neutral-200 dark:border-neutral-700' 
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850'
                      } ${
                        isCurrentDay 
                          ? 'ring-2 ring-primary-500 dark:ring-primary-400' 
                          : ''
                      }`}
                    >
                      <div className={`text-right mb-1 text-sm font-medium ${
                        inCurrentMonth 
                          ? isCurrentDay 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-neutral-800 dark:text-neutral-200'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {appointments.slice(0, 2).map((appointment, index) => (
                          <div 
                            key={index}
                            className={`text-xs p-1 rounded truncate ${
                              appointment.type === 'telehealth' 
                                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' 
                                : 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300'
                            }`}
                          >
                            {appointment.time} - {appointment.patientName}
                          </div>
                        ))}
                        
                        {appointments.length > 2 && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                            +{appointments.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {viewType === 'week' && (
              <div className="flex flex-col">
                <div className="grid grid-cols-8 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="p-2 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Time
                  </div>
                  {days.map((date, i) => (
                    <div 
                      key={i}
                      className={`p-2 text-center text-sm font-medium ${
                        isToday(date) 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full mx-auto mt-1 ${
                        isToday(date) 
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' 
                          : ''
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-8 h-[600px] overflow-y-auto">
                  <div className="border-r border-neutral-200 dark:border-neutral-700">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i}
                        className="h-[100px] p-1 text-right pr-2 text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700"
                      >
                        {(i + 8) % 12 || 12}{i + 8 < 12 ? 'am' : 'pm'}
                      </div>
                    ))}
                  </div>
                  
                  {days.map((date, dayIndex) => (
                    <div key={dayIndex} className="relative">
                      {Array.from({ length: 12 }).map((_, hourIndex) => {
                        const hour = hourIndex + 8;
                        const appointments = mockAppointments.filter(appt => {
                          if ((appt.date === 'Today' && isToday(date)) || 
                              (appt.date === 'Tomorrow' && date.getDate() === new Date().getDate() + 1)) {
                            const apptHour = parseInt(appt.time.split(':')[0]) + (appt.time.includes('PM') ? 12 : 0);
                            return apptHour === hour;
                          }
                          return false;
                        });
                        
                        return (
                          <div 
                            key={hourIndex}
                            className="h-[100px] border-b border-r border-neutral-200 dark:border-neutral-700 p-1 relative"
                          >
                            {appointments.map((appt, i) => (
                              <div 
                                key={i}
                                className={`absolute inset-x-1 rounded p-1 text-xs z-10 ${
                                  appt.type === 'telehealth' 
                                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' 
                                    : 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300'
                                }`}
                                style={{ 
                                  top: `${i * 25}px`,
                                  height: '60px'
                                }}
                              >
                                <div className="font-medium truncate">{appt.patientName}</div>
                                <div>{appt.time}</div>
                                <div className="capitalize text-[10px]">{appt.type}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {viewType === 'day' && (
              <div className="flex flex-col h-[600px] overflow-y-auto">
                <div className="text-center p-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                    isToday(currentDate) 
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' 
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}>
                    {currentDate.getDate()}
                  </span>
                  <h3 className="font-medium mt-1">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h3>
                </div>
                
                {Array.from({ length: 12 }).map((_, i) => {
                  const hour = i + 8;
                  const timeLabel = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;
                  
                  // Filter appointments for this hour
                  const appointments = mockAppointments.filter(appt => {
                    if ((appt.date === 'Today' && isToday(currentDate)) || 
                        (appt.date === 'Tomorrow' && 
                         currentDate.getDate() === new Date().getDate() + 1)) {
                      const apptHour = parseInt(appt.time.split(':')[0]) + (appt.time.includes('PM') ? 12 : 0);
                      return apptHour === hour;
                    }
                    return false;
                  });
                  
                  return (
                    <div key={i} className="flex min-h-[100px] border-t border-neutral-200 dark:border-neutral-700">
                      <div className="w-16 p-2 text-right text-sm font-medium text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-700">
                        {timeLabel}
                      </div>
                      <div className="flex-1 p-1 relative">
                        {appointments.length === 0 ? (
                          <div className="h-full border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center">
                            <Button variant="ghost\" size="sm">+ Add</Button>
                          </div>
                        ) : (
                          <div className="space-y-1 p-1">
                            {appointments.map((appt, index) => (
                              <div 
                                key={index}
                                className={`p-2 rounded-lg ${
                                  appt.type === 'telehealth' 
                                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' 
                                    : 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{appt.patientName}</div>
                                    <div className="text-sm">{appt.time}</div>
                                    <div className="text-xs capitalize mt-1 flex items-center">
                                      <Badge 
                                        variant={appt.type === 'telehealth' ? 'primary' : 'secondary'} 
                                        size="sm"
                                      >
                                        {appt.type}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                      Edit
                                    </Button>
                                    {appt.type === 'telehealth' && (
                                      <Button variant="primary" size="sm" className="h-7 px-2 text-xs">
                                        Join
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-3">
              {mockAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    appointment.type === 'telehealth'
                      ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {appointment.patientName}
                        </span>
                        <Badge
                          variant={appointment.type === 'telehealth' ? 'primary' : 'secondary'}
                          size="sm"
                          className="ml-2"
                        >
                          {appointment.type}
                        </Badge>
                        <Badge
                          variant={
                            appointment.status === 'confirmed' ? 'success' :
                            appointment.status === 'scheduled' ? 'default' :
                            'warning'
                          }
                          size="sm"
                          className="ml-1"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        <CalendarIcon size={14} className="mr-1" />
                        {appointment.date}, {appointment.time}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      {appointment.type === 'telehealth' && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          disabled={appointment.date !== 'Today'}
                        >
                          Start Session
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* AI Insights Panel */}
        {showAIInsights && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-1"
          >
            <Card title="AI Scheduling Assistant" icon={<Brain size={20} />} className="h-full">
              <div className="space-y-4">
                {/* Daily Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center justify-between">
                      <TrendingUp size={16} className="text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">85%</span>
                    </div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">Utilization</p>
                  </div>
                  <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                    <div className="flex items-center justify-between">
                      <CheckCircle size={16} className="text-success-600 dark:text-success-400" />
                      <span className="text-xs font-medium text-success-700 dark:text-success-300">96%</span>
                    </div>
                    <p className="text-xs text-success-600 dark:text-success-400 mt-1">On Time</p>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                    <Zap size={14} className="mr-1" />
                    Schedule Optimization
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                      <p className="text-xs font-medium text-warning-700 dark:text-warning-300">
                        Gap at 2:00 PM - 3:00 PM
                      </p>
                      <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                        Consider scheduling urgent care slot
                      </p>
                    </div>
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                      <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        High demand period: 9 AM - 11 AM
                      </p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                        3 patients on waitlist
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patient Risk Alerts */}
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-2 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    Patient Alerts
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-error-700 dark:text-error-300">Sarah Johnson</span>
                        <Heart size={12} className="text-error-500" />
                      </div>
                      <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                        Missed last 2 appointments
                      </p>
                    </div>
                    <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-warning-700 dark:text-warning-300">Mike Chen</span>
                        <Clock size={12} className="text-warning-500" />
                      </div>
                      <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                        Overdue for follow-up
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Users size={14} className="mr-2" />
                      View Waitlist
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare size={14} className="mr-2" />
                      Send Reminders
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText size={14} className="mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}