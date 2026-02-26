import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Calculator from './pages/Calculator';
import DetailedCalculator from './pages/DetailedCalculator';
import Status from './pages/Status';
import Results from './pages/Results';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
// Placeholder components for routes we haven't built yet but need for routing to work
const NotFound = () =>
<div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
    <p className="text-gray-600 mb-8">Page not found</p>
    <a href="/calculator" className="text-primary-600 hover:text-primary-700 font-medium">
      Go back home
    </a>
  </div>;

export function App() {
  return (
    <Router basename="/calculator">
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/detailed" element={<DetailedCalculator />} />
            <Route path="/status" element={<Status />} />
            <Route path="/results/:uuid" element={<Results />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>);

}