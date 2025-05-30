import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  chartData?: number[];
  className?: string;
  animateIndex?: number;
}

export function SummaryCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  chartData,
  className,
  animateIndex = 0,
}: SummaryCardProps) {
  const colorStyles = {
    primary: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
    secondary: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/20',
    success: 'text-success-600 bg-success-50 dark:bg-success-900/20',
    warning: 'text-warning-600 bg-warning-50 dark:bg-warning-900/20',
    error: 'text-error-600 bg-error-50 dark:bg-error-900/20',
  };

  const trendColorStyles = {
    up: 'text-success-600 bg-success-50 dark:bg-success-900/20',
    down: 'text-error-600 bg-error-50 dark:bg-error-900/20',
    neutral: 'text-neutral-600 bg-neutral-50 dark:bg-neutral-900/20',
  };

  const renderTrendIcon = () => {
    if (trend?.direction === 'up') {
      return <ArrowUpRight size={14} className="text-success-600" />;
    } else if (trend?.direction === 'down') {
      return <ArrowDownRight size={14} className="text-error-600" />;
    }
    return null;
  };

  // Simple sparkline renderer
  const renderSparkline = () => {
    if (!chartData || chartData.length < 2) return null;
    
    // Calculate min and max for scaling
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min;
    
    // Normalize points to 0-40 range (for height in pixels)
    const normalizedPoints = chartData.map(point => 
      range === 0 ? 20 : 40 - ((point - min) / range) * 40
    );
    
    // Create SVG path
    const width = 100; // Width of sparkline
    const pointWidth = width / (normalizedPoints.length - 1);
    
    let path = `M 0,${normalizedPoints[0]}`;
    
    for (let i = 1; i < normalizedPoints.length; i++) {
      path += ` L ${i * pointWidth},${normalizedPoints[i]}`;
    }
    
    return (
      <div className="absolute bottom-2 right-2 opacity-40 pointer-events-none">
        <svg width={width} height="40" className="overflow-visible">
          <path
            d={path}
            fill="none"
            stroke={`currentColor`}
            strokeWidth="1.5"
            className={cn(
              'text-primary-500 dark:text-primary-400',
              { 'text-success-500 dark:text-success-400': trend?.direction === 'up' },
              { 'text-error-500 dark:text-error-400': trend?.direction === 'down' }
            )}
          />
        </svg>
      </div>
    );
  };

  return (
    <Card className={className} animateIndex={animateIndex}>
      <div className="flex justify-between items-start">
        <div className={cn(
          'p-2 rounded-lg',
          colorStyles[color]
        )}>
          {icon}
        </div>
      </div>
      
      <div className="mt-3">
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
            {value}
          </p>
          
          {trend && (
            <div className={cn(
              'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              trendColorStyles[trend.direction]
            )}>
              {renderTrendIcon()}
              <span className="ml-1">{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
      </div>
      
      {chartData && renderSparkline()}
    </Card>
  );
}