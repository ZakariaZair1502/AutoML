import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import styles from '@/styles/Navbar.module.css';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, onClick }) => (
  <li className={styles.nav__item}>
    <a 
      href={href}
      className={cn(
        styles.nav__link,
        "flex items-center text-light-blue font-medium relative py-2 hover:text-white transition-colors"
      )}
      onClick={onClick}
    >
      <i className="ri-arrow-right-up-line mr-2 text-lg transition-transform group-hover:translate-y-[-3px] group-hover:text-accent"></i>
      <span>{children}</span>
    </a>
  </li>
);

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY >= 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'auto' : 'hidden';
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <header className={cn(
      "sticky top-0 left-0 w-full z-50 bg-opacity-95 backdrop-blur-md shadow transition-all",
      isScrolled ? "py-2 bg-[rgba(22,33,62,0.98)]" : "py-4 bg-[rgba(22,33,62,0.95)]"
    )}>
      <nav className="container mx-auto px-6 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <span className="mr-2 text-3xl">⚙️</span>
          AutoModler
        </a>

        <div className={cn(
          styles.nav__menu,
          "fixed top-0 right-0 h-full w-64 md:w-auto md:static bg-[rgba(22,33,62,0.98)] md:bg-transparent p-8 md:p-0 transition-transform duration-300 md:translate-x-0 z-50",
          isMenuOpen ? styles['show-menu'] + " translate-x-0" : "translate-x-full"
        )}>
          <ul className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <NavLink href="/supervised" onClick={closeMenu}>supervised</NavLink>
            <NavLink href="/unsupervised" onClick={closeMenu}>unsupervised</NavLink>
            <NavLink href="/preprocessing" onClick={closeMenu}>preprocessing</NavLink>
            <NavLink href="/dashboard" onClick={closeMenu}>dashboard</NavLink>
            <NavLink href="#" onClick={closeMenu}>Contact</NavLink>
          </ul>

          <button 
            className={cn(styles.nav__close, "absolute top-4 right-4 text-2xl text-white md:hidden")}
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <i className="ri-close-large-line"></i>
          </button>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div 
            className={cn(
              styles.nav__overlay,
              styles.active,
              "fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            )}
            onClick={closeMenu}
          />
        )}

        <button 
          className={cn(styles.nav__toggle, "text-2xl text-white md:hidden")}
          onClick={toggleMenu}
          aria-label="Open menu"
        >
          <i className="ri-menu-line"></i>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
