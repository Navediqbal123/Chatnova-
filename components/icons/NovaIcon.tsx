import React from 'react';

export const NovaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className || "w-8 h-8 text-purple-400"}
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM12.87 14.33l-1.04-2.22-2.22-1.04 2.22-1.04 1.04-2.22 1.04 2.22 2.22 1.04-2.22 1.04-1.04 2.22z" />
    </svg>
);
