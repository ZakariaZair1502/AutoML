import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn(
      "bg-dark-blue py-8 mt-auto",
      className
    )}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <a href="/" className="text-xl font-bold text-white flex items-center">
              <span className="mr-2 text-2xl">⚙️</span>
              AutoModler
            </a>
            <p className="mt-2 text-gray-light/70 max-w-md">
              Simplify your machine learning workflow with our intuitive platform for data preprocessing, model training, and evaluation.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/supervised" className="text-light-blue hover:text-white transition-colors">
                    Supervised Learning
                  </a>
                </li>
                <li>
                  <a href="/unsupervised" className="text-light-blue hover:text-white transition-colors">
                    Unsupervised Learning
                  </a>
                </li>
                <li>
                  <a href="/preprocessing" className="text-light-blue hover:text-white transition-colors">
                    Data Preprocessing
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-light-blue hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-light-blue hover:text-white transition-colors">
                    Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-light-blue hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.1)] flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-light/70 text-sm">
            © {new Date().getFullYear()} AutoModler. All rights reserved.
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-light-blue hover:text-accent transition-all transform hover:-translate-y-1">
              <i className="ri-github-fill text-xl"></i>
            </a>
            <a href="#" className="text-light-blue hover:text-accent transition-all transform hover:-translate-y-1">
              <i className="ri-twitter-fill text-xl"></i>
            </a>
            <a href="#" className="text-light-blue hover:text-accent transition-all transform hover:-translate-y-1">
              <i className="ri-linkedin-fill text-xl"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
