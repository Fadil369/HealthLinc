import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const variants = {
    default: 'bg-neutral-100 dark:bg-dark-700 text-neutral-800 dark:text-dark-200',
    primary: 'bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-300',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300',
    error: 'bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-300',
    outline: 'bg-transparent border border-neutral-300 dark:border-dark-600 text-neutral-700 dark:text-dark-300',
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}