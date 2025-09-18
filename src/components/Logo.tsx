import React from 'react';
import { Building, Users } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Building className={`${sizeClasses[size]} text-blue-800`} />
        <Users className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-600" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold text-blue-800`}>
            CitizenVoiceMMS
          </span>
          <span className="text-xs text-blue-600 -mt-1">Municipal Management</span>
        </div>
      )}
    </div>
  );
};

export default Logo;