import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  animateIndex?: number;
  headerAction?: React.ReactNode;
}

export function Card({
  children,
  className,
  title,
  icon,
  footer,
  isLoading = false,
  animateIndex = 0,
  headerAction,
}: CardProps) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      custom={animateIndex}
      variants={variants}
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-xl shadow-soft-md overflow-hidden',
        'border border-neutral-200 dark:border-neutral-700',
        'transition-shadow hover:shadow-soft-lg',
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary-600 dark:text-primary-400">{icon}</div>}
            {title && (
              <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-100">
                {title}
              </h3>
            )}
          </div>
          {headerAction && (
            <div>{headerAction}</div>
          )}
        </div>
      )}
      
      <div className={cn('px-6 py-4', { 'pt-0': title || icon })}>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
          </div>
        ) : (
          children
        )}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700">
          {footer}
        </div>
      )}
    </motion.div>
  );
}