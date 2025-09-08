import React from 'react';
import { NavBar } from '@/components/layout/NavBar';

export const Header = ({ className = '', variant = 'main' }) => {
  const baseClasses =
    'inset-x-0 top-0 z-40 h-16 w-full backdrop-blur transition-colors fixed text-foreground shadow-md';

  const variantClasses = {
    main: 'from-primary/10 to-primary/60',
    dashboard: 'from-background to-background border-b',
  };

  return (
    <header className={`${baseClasses} ${className}`}>
      <div
        className={`flex h-full w-full items-center bg-gradient-to-r ${variantClasses[variant]} px-4 sm:px-6 lg:px-8`}
      >
        <NavBar />
      </div>
    </header>
  );
};

export default Header;
