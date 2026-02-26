import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export default function Footer() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link
              to="/privacy-policy"
              className="text-gray-500 hover:text-primary-600 text-sm">

              {t('navigation.privacyPolicy', 'Privacy Policy')}
            </Link>
            <Link
              to="/terms-and-conditions"
              className="text-gray-500 hover:text-primary-600 text-sm">

              {t('navigation.termsAndConditions', 'Terms and Conditions')}
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-400">
              &copy; {currentYear} MegaTel. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>);

}