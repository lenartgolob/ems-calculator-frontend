import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === 'en' ? 'en' : 'sl';
  const toggleLanguage = () => {
    const next = current === 'en' ? 'sl' : 'en';
    i18n.changeLanguage(next);
  };
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 transition-colors rounded-md hover:bg-gray-100 hover:text-primary-600"
      aria-label="Switch Language">

      <Globe className="w-4 h-4" />
      <span className="uppercase">{current}</span>
    </button>);

}