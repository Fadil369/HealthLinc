import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-dark-950';
  
  const variants = {
    primary: 'bg-accent-500 hover:bg-accent-600 text-white focus:ring-accent-400 dark:bg-accent-600 dark:hover:bg-accent-700 dark:focus:ring-accent-500',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500 dark:bg-secondary-700 dark:hover:bg-secondary-800',
    outline: 'bg-transparent border border-neutral-300 dark:border-dark-600 hover:bg-neutral-100 dark:hover:bg-dark-800 text-neutral-700 dark:text-dark-300 focus:ring-neutral-500 dark:focus:ring-dark-500',
    ghost: 'bg-transparent hover:bg-neutral-100 dark:hover:bg-dark-800 text-neutral-700 dark:text-dark-300 focus:ring-neutral-500',
    link: 'bg-transparent underline-offset-4 hover:underline text-accent-600 dark:text-accent-500 hover:text-accent-700 dark:hover:text-accent-400 p-0 focus:ring-0',
  };
  
  const sizes = {
    sm: 'text-sm h-8 px-3',
    md: 'text-base h-10 px-4',
    lg: 'text-lg h-12 px-6',
  };

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        variant !== 'link' && sizes[size],
        disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className={cn('mr-2', { '-ml-1': variant !== 'link' })}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={cn('ml-2', { '-mr-1': variant !== 'link' })}>{icon}</span>
      )}
    </button>
  );
}