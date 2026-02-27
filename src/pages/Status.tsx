import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitCalculatorCalculation } from '../api/callAPI';
import type { ApiPayload } from '../types/payloadTypes';

export default function Status() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + 5));
    }, 300);

    const run = async () => {
      try {
        const stored = sessionStorage.getItem('apiPayload');
        if (!stored) {
          throw new Error('Missing request data. Please go back and submit the form again.');
        }
        const payload = JSON.parse(stored) as ApiPayload;

        const result = await submitCalculatorCalculation(payload);
        sessionStorage.removeItem('apiPayload');
        sessionStorage.removeItem('formEmail');
        sessionStorage.removeItem('formValues');

        if (!isMounted) return;
        setProgress(100);
        setStatus('success');

        if (result?.uuid) {
          setTimeout(() => {
            navigate(`/results/${result.uuid}`);
          }, 800);
        }
      } catch (error: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(error?.message || 'Unable to process your request.');
      } finally {
        clearInterval(interval);
      }
    };

    run();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="mb-8 flex justify-center">
          {status === 'processing' && (
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary-100 rounded-full animate-spin border-t-primary-600"></div>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-primary-600">
                {progress}%
              </div>
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'processing' && 'Analyzing Data...'}
          {status === 'success' && 'Calculation Complete!'}
          {status === 'error' && 'Something went wrong'}
        </h2>

        <p className="text-gray-500 mb-8">
          {status === 'processing' && 'We are crunching the numbers to find your optimal energy setup.'}
          {status === 'success' && 'Redirecting you to your personalized report...'}
          {status === 'error' && (errorMessage || 'Please try again later or contact support.')}
        </p>

        {status === 'processing' && (
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
