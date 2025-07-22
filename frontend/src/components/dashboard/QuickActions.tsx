import React from 'react';
import { UserPlus, Calendar, Upload, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

export function QuickActions() {
  const actions = [
    { label: 'New Patient', icon: <UserPlus size={18} />, onClick: () => {} },
    { label: 'Schedule Visit', icon: <Calendar size={18} />, onClick: () => {} },
    { label: 'Upload Device Data', icon: <Upload size={18} />, onClick: () => {} },
    { label: 'Run RCM Scan', icon: <BarChart size={18} />, onClick: () => {} },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.1 }}
        >
          <Button
            variant="outline"
            size="sm"
            icon={action.icon}
            onClick={action.onClick}
            className="bg-white dark:bg-neutral-800"
          >
            {action.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}