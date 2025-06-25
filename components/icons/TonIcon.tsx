
import React from 'react';

interface TonIconProps {
  className?: string;
}

export const TonIcon: React.FC<TonIconProps> = ({ className }) => {
  return (
    <img 
      src="https://i.ibb.co/D20KSW6/ton-symbol.png" 
      alt="TON Symbol" 
      className={className} 
    />
  );
};
