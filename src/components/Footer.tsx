import React from 'react';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-20">
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">ML Studio</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Une plateforme moderne pour l'apprentissage automatique et l'analyse de données.
              Créez, testez et déployez vos modèles avec élégance.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Liens Rapides</h4>
            <ul className="space-y-2">
              {[
                { name: 'Documentation', href: '#' },
                { name: 'Tutoriels', href: '#' },
                { name: 'API Reference', href: '#' },
                { name: 'Support', href: '#' },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-purple-300 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Nous Contacter</h4>
            <div className="flex space-x-4">
              {[
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Mail, href: '#', label: 'Email' },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-gray-300 text-sm">
            <span>Fait avec</span>
            <Heart className="w-4 h-4 text-red-400 animate-pulse" />
            <span>pour la communauté ML</span>
          </div>
          
          <div className="text-gray-400 text-sm">
            © 2024 ML Studio. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
