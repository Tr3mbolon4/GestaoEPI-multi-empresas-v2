import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Menu, X } from 'lucide-react';

export const DashboardLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 p-4 flex items-center justify-between" style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2d3a4f'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            data-testid="mobile-menu-button"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md overflow-hidden shadow">
              <img 
                src="/logo-gestao-epi.jpg" 
                alt="Gestão EPI" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-bold">Gestão EPI</span>
          </div>
          <div className="w-10"></div>
        </div>
        
        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};
