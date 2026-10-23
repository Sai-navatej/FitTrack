import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 text-neutral-100 flex">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-6 px-8 border-t border-neutral-900 text-center text-xs text-neutral-400">
          FitTrack &copy; {new Date().getFullYear()} &bull; Built with MERN, Recharts & Tailwind CSS
        </footer>
      </div>
    </div>
  );
};

export default Layout;
