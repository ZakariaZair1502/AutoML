
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen relative overflow-hidden ">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-green-800 to-slate-900"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Glass Morphism Container */}
      <div className="relative min-h-screen flex flex-col backdrop-blur-sm">
        {/* Navigation */}
        <div className="relative z-20">
          <Navbar />
        </div>

        {/* Main Content */}
        <main className="flex-grow relative z-10 animate-fade-in">
          <div className="relative">
            {children}
          </div>
        </main>

        {/* Footer */}
        {showFooter && (
          <div className="relative z-20">
            <Footer />
          </div>
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-30"></div>
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-30"></div>
    </div>
  );
};

export default Layout;
