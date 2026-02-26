import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Calculator, FileText } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
export default function Header() {
  const { t } = useTranslation('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const navLinks = [
  {
    path: '/',
    label: t('navigation.calculator', 'Calculator'),
    icon: Calculator
  },
  {
    path: '/detailed',
    label: t('navigation.detailedCalculator', 'Detailed Calculator'),
    icon: FileText
  }];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img
              src="/megatel-logo.png"
              alt="MegaTel"
              className="h-10 w-auto" />

          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200 ${isActive(link.path) ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>

                {link.label}
              </Link>
            )}
            <div className="pl-4 border-l border-gray-200">
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">

              <span className="sr-only">Open main menu</span>
              {isMenuOpen ?
              <X className="block h-6 w-6" aria-hidden="true" /> :

              <Menu className="block h-6 w-6" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen &&
      <div className="md:hidden bg-white border-b border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) =>
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setIsMenuOpen(false)}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive(link.path) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'}`}>

                <div className="flex items-center">
                  <link.icon className="w-5 h-5 mr-3" />
                  {link.label}
                </div>
              </Link>
          )}
          </div>
        </div>
      }
    </header>);

}