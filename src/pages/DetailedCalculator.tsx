import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  AlertCircle,
  Check,
  ChevronRight,
  Settings,
  Zap } from
'lucide-react';
// Simplified version of the detailed calculator for the UI demo
// In a real app, this would include the full formik/yup validation logic from the original file
// Preserving the visual structure and key inputs
export default function DetailedCalculator() {
  const { t } = useTranslation('calculator');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tariff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    navigate('/status');
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section - matching Calculator page */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Detailed Analysis
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Provide detailed consumption data and tariff information for a
            precise calculation of your potential savings.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Progress Steps */}
          <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div
                className={`flex flex-col items-center ${activeTab === 'tariff' ? 'text-primary-600' : 'text-gray-400'}`}>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeTab === 'tariff' ? 'bg-primary-100 text-primary-600 font-bold' : 'bg-gray-200'}`}>

                  1
                </div>
                <span className="text-xs font-medium">Tariff</span>
              </div>
              <div className="h-0.5 w-full bg-gray-200 mx-4" />
              <div
                className={`flex flex-col items-center ${activeTab === 'consumption' ? 'text-primary-600' : 'text-gray-400'}`}>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeTab === 'consumption' ? 'bg-primary-100 text-primary-600 font-bold' : 'bg-gray-200'}`}>

                  2
                </div>
                <span className="text-xs font-medium">Consumption</span>
              </div>
              <div className="h-0.5 w-full bg-gray-200 mx-4" />
              <div
                className={`flex flex-col items-center ${activeTab === 'system' ? 'text-primary-600' : 'text-gray-400'}`}>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${activeTab === 'system' ? 'bg-primary-100 text-primary-600 font-bold' : 'bg-gray-200'}`}>

                  3
                </div>
                <span className="text-xs font-medium">System</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            {/* Tariff Section */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-500" />
                  Tariff Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Method
                    </label>
                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 border">
                      <option value="vtmt">VT/MT (High/Low Tariff)</option>
                      <option value="et">ET (Single Tariff)</option>
                      <option value="dynamic">Dynamic Pricing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network Charge Group
                    </label>
                    <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 border">
                      <option value="household">Household</option>
                      <option value="small_business">Small Business</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-500" />
                  Consumption Data
                </h3>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer bg-gray-50">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-primary-600 hover:text-primary-500">
                      Upload a file
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    CSV files from your energy provider (max 10MB)
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-500" />
                  Proposed System
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Solar Power (kW)
                    </label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 border"
                      placeholder="11" />

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Battery Capacity (kWh)
                    </label>
                    <input
                      type="number"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 border"
                      placeholder="10" />

                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-4">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">

                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70">

                  {isSubmitting ? 'Processing...' : 'Calculate Detailed Report'}
                  {!isSubmitting && <ChevronRight className="ml-2 w-4 h-4" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>);

}