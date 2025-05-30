import React from 'react';
import { Network } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'minimal';
  showText?: boolean;
}

export function Logo({ className, variant = 'default', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <Network 
          size={variant === 'minimal' ? 24 : 32} 
          className="text-primary-600"
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 to-secondary-600/30 blur-sm rounded-full" />
      </div>
      {showText && (
        <span className={`ml-2 ${variant === 'minimal' ? 'text-lg' : 'text-xl'} font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent`}>
          BrainSAIT
        </span>
      )}
    </div>
  );
}