import React from 'react';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';
import { Appointment } from '../../types';
import { Avatar } from '../ui/Avatar';

interface AppointmentListProps {
  appointments: Appointment[];
  className?: string;
}

export function AppointmentList({ appointments, className }: AppointmentListProps) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-neutral-500 dark:text-neutral-400">No upcoming appointments</p>
      </div>
    );
  }

  const getAppointmentTypeIcon = (type: Appointment['type']) => {
    if (type === 'telehealth') {
      return <Video size={16} className="text-primary-500" />;
    }
    return <MapPin size={16} className="text-secondary-500" />;
  };

  return (
    <ul className={`divide-y divide-neutral-200 dark:divide-neutral-700 ${className}`}>
      {appointments.map((appointment, index) => (
        <li key={appointment.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <Avatar
              fallback={appointment.patientName.substring(0, 2)}
              size="sm"
              className="flex-shrink-0 mt-1"
            />
            <div className="flex-grow min-w-0">
              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {appointment.patientName}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  <span>{appointment.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center">
                  {getAppointmentTypeIcon(appointment.type)}
                  <span className="ml-1 capitalize">{appointment.type}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className={cn(
                "inline-block px-2 py-1 text-xs rounded-full",
                appointment.status === 'confirmed' && "bg-primary-100 text-primary-800",
                appointment.status === 'scheduled' && "bg-neutral-100 text-neutral-800",
                appointment.status === 'in-progress' && "bg-warning-100 text-warning-800",
                appointment.status === 'completed' && "bg-success-100 text-success-800",
                appointment.status === 'canceled' && "bg-error-100 text-error-800"
              )}>
                {appointment.status}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}