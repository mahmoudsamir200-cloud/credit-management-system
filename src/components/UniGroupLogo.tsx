import React from 'react';
import { DEFAULT_COMPANY_LOGO, DEFAULT_COMPANY_NAME_AR, DEFAULT_COMPANY_NAME } from '../utils/companyBranding';

interface UniGroupLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  variant?: 'full' | 'icon' | 'badge';
  showSubtitle?: boolean;
  className?: string;
  customLogoUrl?: string;
  customCompanyName?: string;
  subtitleText?: string;
}

export const UniGroupLogo: React.FC<UniGroupLogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  className = '',
  customLogoUrl,
  customCompanyName,
  subtitleText,
}) => {
  const logoSrc = customLogoUrl || '/assets/unigroup_logo.jpg' || DEFAULT_COMPANY_LOGO;
  const companyName = customCompanyName || DEFAULT_COMPANY_NAME_AR;
  const subtitle = subtitleText || 'نظام إدارة الائتمان والتحصيل';

  // Sizing definitions for icon box
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
    '2xl': 'w-16 h-16',
    hero: 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  // Font sizing definitions
  const titleSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm sm:text-base font-bold',
    lg: 'text-base sm:text-lg font-bold',
    xl: 'text-lg sm:text-xl font-extrabold',
    '2xl': 'text-xl sm:text-2xl font-black',
    hero: 'text-2xl sm:text-3xl font-black',
  }[size];

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-xs sm:text-sm',
    '2xl': 'text-sm sm:text-base',
    hero: 'text-sm sm:text-base',
  }[size];

  if (variant === 'icon') {
    return (
      <div 
        className={`${iconDimensions} rounded-xl overflow-hidden bg-white/10 p-1 border border-white/20 shadow-md flex items-center justify-center shrink-0 ${className}`}
        title={companyName}
      >
        <img
          src={logoSrc}
          alt={companyName}
          className="w-full h-full object-contain rounded-lg"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-xs ${className}`}>
        <div className="w-6 h-6 rounded-lg bg-white/90 p-0.5 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
          <img
            src={logoSrc}
            alt={companyName}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-xs font-bold text-slate-100 tracking-tight">{DEFAULT_COMPANY_NAME}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Icon Container with glossy styling */}
      <div className={`${iconDimensions} rounded-xl bg-white p-1 shadow-md shadow-blue-500/10 border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-200`}>
        <img
          src={logoSrc}
          alt={companyName}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={(e) => {
            // Fallback gracefully to default if custom fails
            const target = e.currentTarget;
            if (target.src !== DEFAULT_COMPANY_LOGO) {
              target.src = DEFAULT_COMPANY_LOGO;
            }
          }}
        />
      </div>

      {/* Corporate Titles */}
      <div className="flex flex-col text-right justify-center">
        <h1 className={`${titleSizes} text-white tracking-tight leading-tight drop-shadow-xs flex items-center gap-1.5`}>
          <span>{companyName}</span>
          <span className="text-[11px] font-semibold text-blue-400 font-mono tracking-wider">Uni-Group</span>
        </h1>
        {showSubtitle && (
          <p className={`${subSizes} text-blue-300/80 font-medium leading-none mt-1`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
