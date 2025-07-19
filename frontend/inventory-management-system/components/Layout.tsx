
import React, { useState } from 'react';
import VerticalNav from './VerticalNav';
import HorizontalNav from './HorizontalNav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  return (
    <div className="flex h-screen bg-light">
      <VerticalNav isOpen={isMobileNavOpen} closeNav={toggleMobileNav} />
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleMobileNav}
          aria-hidden="true"
        ></div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <HorizontalNav onMenuClick={toggleMobileNav} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;