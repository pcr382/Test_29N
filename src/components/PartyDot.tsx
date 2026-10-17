import React from 'react';

interface PartyDotProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PartyDot: React.FC<PartyDotProps> = ({ color = '#64748b', size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
};
