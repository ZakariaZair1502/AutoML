import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import LiquidEther from '@/components/ui/liquidether';

interface LayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar = true, showFooter = true }) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
  {/* Background animation */}
  <div className="absolute inset-0 z-0">
    <LiquidEther
      colors={['#5227FF', '#FF9FFC', '#B19EEF']}
      mouseForce={39}
      cursorSize={100}
      isViscous={false}
      viscous={30}
      iterationsViscous={32}
      iterationsPoisson={32}
      resolution={0.5}
      isBounce={false}
      autoDemo={true}
      autoSpeed={0.5}
      autoIntensity={2.2}
      takeoverDuration={0.25}
      autoResumeDelay={3000}
      autoRampDuration={0.6}
    />
  </div>

  {/* Navbar */}
  {showNavbar && (
    <div className="relative z-20">
      <Navbar />
    </div>
  )}

  {/* Main content */}
  <main className="relative z-10 text-white animate-fade-in">
    {children}
  </main>

  {/* Footer */}
  {showFooter && (
    <div className="relative z-20">
      <Footer />
    </div>
  )}
</div>

    
  );
};

export default Layout;
