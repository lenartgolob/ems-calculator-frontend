import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock } from 'lucide-react';
export default function PrivacyPolicy() {
  const { t } = useTranslation('legal');
  // Helper to render section content safely
  const renderSection = (sectionKey: string) => {
    const section = t(`privacy.sections.${sectionKey}`, {
      returnObjects: true
    }) as any;
    if (!section) return null;
    return (
      <div className="mb-8 border-b border-gray-100 pb-8 last:border-0">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="bg-primary-50 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
            {sectionKey.replace('section', '')}
          </span>
          {section.title}
        </h2>

        <div className="pl-11 space-y-4 text-gray-600 leading-relaxed">
          {section.content &&
          section.content.map((paragraph: string, idx: number) =>
          <p key={idx}>{paragraph}</p>
          )}

          {section.items &&
          <ul className="list-disc pl-5 space-y-2 mt-4">
              {section.items.map((item: string, idx: number) =>
            <li key={idx}>{item}</li>
            )}
            </ul>
          }

          {section.footer &&
          <p className="mt-4 font-medium text-gray-900">{section.footer}</p>
          }
        </div>
      </div>);

  };
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-8 py-10 text-white">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {t('privacy.title', 'Privacy Policy')}
            </h1>
            <p className="text-primary-100 text-center max-w-2xl mx-auto">
              We are committed to protecting your personal data and ensuring
              transparency in how we handle your information.
            </p>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {[
            'section1',
            'section2',
            'section3',
            'section4',
            'section5',
            'section6',
            'section7',
            'section8'].
            map((key) =>
            <Fragment key={key}>{renderSection(key)}</Fragment>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>);

}