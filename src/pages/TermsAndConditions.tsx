import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Scale } from 'lucide-react';
export default function TermsAndConditions() {
  const { t } = useTranslation('legal');
  const renderSection = (sectionKey: string) => {
    const section = t(`terms.sections.${sectionKey}`, {
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

          {sectionKey === 'section9' && section.email &&
          <div className="mt-4 p-4 bg-primary-50 rounded-lg inline-block">
              <a
              href={`mailto:${section.email}`}
              className="text-primary-700 font-medium hover:text-primary-800 flex items-center gap-2">

                <Mail className="w-4 h-4" />
                {section.email}
              </a>
            </div>
          }
        </div>
      </div>);

  };
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 px-8 py-10 text-white">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Scale className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {t('terms.title', 'Terms and Conditions')}
            </h1>
            <p className="text-gray-400 text-center max-w-2xl mx-auto">
              Please read these terms carefully before using our services.
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
            'section8',
            'section9'].
            map((key) =>
            <Fragment key={key}>{renderSection(key)}</Fragment>
            )}
          </div>
        </div>
      </div>
    </div>);

}
// Helper icon component
function Mail(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">

      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>);

}