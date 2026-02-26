import React, { useState, Component } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Sun,
  Battery,
  Mail,
  ArrowRight,
  CheckCircle2,
  BarChart3 } from
'lucide-react';
import { submitCalculatorCalculation } from '../api/callAPI';
import type { ConsumptionData } from '../types/calculator';
import type { ApiPayload } from '../types/payloadTypes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line } from
'recharts';
// --- Logic from original file ---
const VOLTAGE = 230;
const HOURS_PER_YEAR = 8760;
const normalizeNumber = (value: string) => value.replace(',', '.').trim();
const parseNumber = (value: string) => {
  const raw = normalizeNumber(value);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};
const buildHourlyWeights = (startDate: Date) => {
  const dailyProfile = [
  0.4, 0.35, 0.3, 0.3, 0.35, 0.5, 0.8, 1.0, 0.9, 0.8, 0.7, 0.7, 0.7, 0.7, 0.8,
  0.9, 1.1, 1.2, 1.1, 0.9, 0.7, 0.6, 0.5, 0.45];

  const seasonalFactor = [
  1.2, 1.2, 1.1, 1.0, 0.9, 0.85, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2];

  const weights: number[] = [];
  for (let i = 0; i < HOURS_PER_YEAR; i += 1) {
    const current = new Date(startDate.getTime() + i * 3600 * 1000);
    const hour = current.getHours();
    const month = current.getMonth();
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const weekendFactor = isWeekend ? 0.95 : 1;
    const dailyFactor = dailyProfile[hour] ?? 0.5;
    const seasonal = seasonalFactor[month] ?? 1;
    const wave =
    1 + 0.05 * Math.sin(2 * Math.PI * (current.getDate() + month) / 31);
    weights.push(dailyFactor * seasonal * weekendFactor * wave);
  }
  return weights;
};
const distributeWithCap = (weights: number[], total: number, cap: number) => {
  const values = new Array(weights.length).fill(0);
  const active = new Set(weights.map((_, i) => i));
  let remainingTotal = total;
  while (active.size > 0) {
    const activeWeights = Array.from(active).map((i) => weights[i]);
    const weightSum = activeWeights.reduce((sum, w) => sum + w, 0);
    if (weightSum <= 0) break;
    const scale = remainingTotal / weightSum;
    let anyCapped = false;
    for (const i of Array.from(active)) {
      const raw = weights[i] * scale;
      if (raw > cap) {
        values[i] = cap;
        remainingTotal -= cap;
        active.delete(i);
        anyCapped = true;
      }
    }
    if (!anyCapped) {
      for (const i of Array.from(active)) {
        values[i] = weights[i] * scale;
      }
      break;
    }
  }
  return values;
};
// --- Component ---
export default function Calculator() {
  const { t } = useTranslation('calculator');
  // State
  const [phases, setPhases] = useState<'1' | '3'>('1');
  const [amperes, setAmperes] = useState('');
  const [yearlyConsumption, setYearlyConsumption] = useState('');
  const [desiredSolarKw, setDesiredSolarKw] = useState('');
  const [desiredBatteryKwh, setDesiredBatteryKwh] = useState('');
  const [email, setEmail] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    // Parse input values
    const consumption = parseNumber(yearlyConsumption) || 0;
    const solar = parseNumber(desiredSolarKw) || 0;
    const battery = parseNumber(desiredBatteryKwh) || 0;
    const amperesNum = parseNumber(amperes) || 0;
    const phasesNum = Number(phases);
    // Build hourly consumption data (same logic as original)
    const maxPowerW = phasesNum * VOLTAGE * amperesNum;
    const maxPowerKw = maxPowerW / 1000;
    const capKwh = maxPowerKw;
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const weights = buildHourlyWeights(startDate);
    const hourlyValues = distributeWithCap(weights, consumption, capKwh);
    const consumptionData: ConsumptionData[] = hourlyValues.map((val, i) => ({
      timestamp: new Date(startDate.getTime() + i * 3600 * 1000).toISOString(),
      consumption: val
    }));
    // Build API payload
    const payload: ApiPayload = {
      current_configuration: {
        pricing: {
          tariff_type: 'ET',
          et_pricing_periods: [
          {
            id: '1',
            et_cena: 0.15,
            date_from: '2024-01-01',
            date_to: '2024-12-31'
          }]

        },
        consumption_data: {
          raw_data: consumptionData
        },
        power_limits: {
          high_season: {},
          low_season: {}
        }
      },
      desired_configuration: {
        pricing: {
          tariff_type: 'ET',
          et_pricing_periods: [
          {
            id: '1',
            et_cena: 0.15,
            date_from: '2024-01-01',
            date_to: '2024-12-31'
          }]

        },
        sell_pricing: null,
        battery:
        battery > 0 ?
        {
          enabled: true,
          capacity_kwh: battery
        } :
        null,
        solar_plant:
        solar > 0 ?
        {
          enabled: true,
          power_kw: solar
        } :
        null
      },
      email: email
    };
    // Fire API call in background (don't await for navigation)
    submitCalculatorCalculation(payload).catch((err) => {
      console.warn('Background API submission failed:', err);
    });
    // Generate local results for immediate display
    const monthlyData = generateMockMonthlyData(consumption, solar, battery);
    const financials = calculateMockFinancials(consumption, solar, battery);
    setResults({
      monthlyData,
      financials
    });
    setShowResults(true);
    setIsCalculating(false);
  };
  // Helper to generate chart data
  const generateMockMonthlyData = (
  consumption: number,
  solar: number,
  battery: number) =>
  {
    const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'];

    // Simple seasonality curve
    const solarSeasonality = [
    0.4, 0.5, 0.8, 1.0, 1.2, 1.25, 1.3, 1.2, 1.0, 0.7, 0.5, 0.4];

    const consumptionSeasonality = [
    1.2, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.2, 1.3];

    return months.map((month, i) => {
      const monthlyCons = consumption / 12 * consumptionSeasonality[i];
      const monthlySolar = solar * 1100 / 12 * solarSeasonality[i]; // Approx 1100 kWh/kWp
      // Battery effect (simplified: assume it captures 80% of excess solar up to its capacity cycles)
      const excessSolar = Math.max(0, monthlySolar - monthlyCons);
      const batterySavings = Math.min(excessSolar, battery * 30 * 0.8); // Daily cycles
      return {
        name: month,
        consumption: Math.round(monthlyCons),
        production: Math.round(monthlySolar),
        gridImport: Math.round(
          Math.max(0, monthlyCons - monthlySolar + batterySavings)
        )
      };
    });
  };
  const calculateMockFinancials = (
  consumption: number,
  solar: number,
  battery: number) =>
  {
    const baseRate = 0.15; // EUR/kWh
    const currentCost = consumption * baseRate;
    const solarProduction = solar * 1100;
    const selfSufficiency = Math.min(
      1,
      (solarProduction + battery * 200) / consumption
    ); // Simplified
    const newCost = currentCost * (1 - selfSufficiency * 0.9); // 90% efficiency
    return {
      currentCost: Math.round(currentCost),
      newCost: Math.round(newCost),
      savings: Math.round(currentCost - newCost),
      roiYears: (
      (solar * 1000 + battery * 800) / (
      currentCost - newCost)).
      toFixed(1)
    };
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title', 'Energy Savings Calculator')}
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            {t(
              'subtitle',
              'Calculate your potential savings with solar energy and battery storage optimization.'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <form onSubmit={handleCalculate} className="space-y-8">
              {/* Connection Settings */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg border-b border-gray-100 pb-2">
                  <Zap className="w-5 h-5 text-primary-500" />
                  <h3>{t('sections.connection', 'Connection Settings')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phases */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fields.phases', 'Connection Phases')}
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPhases('1')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${phases === '1' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>

                        1-Phase
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhases('3')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${phases === '3' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>

                        3-Phase
                      </button>
                    </div>
                  </div>

                  {/* Amperes */}
                  <div>
                    <label
                      htmlFor="amperes"
                      className="block text-sm font-medium text-gray-700 mb-2">

                      {t('fields.amperes', 'Fuse Size (Amperes)')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="amperes"
                        value={amperes}
                        onChange={(e) => setAmperes(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 pl-4 pr-12 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm border shadow-sm"
                        placeholder="e.g. 20"
                        required />

                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consumption & Solar */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg border-b border-gray-100 pb-2">
                  <Sun className="w-5 h-5 text-primary-500" />
                  <h3>
                    {t('sections.consumption', 'Consumption & Production')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Yearly Consumption */}
                  <div>
                    <label
                      htmlFor="consumption"
                      className="block text-sm font-medium text-gray-700 mb-2">

                      {t('fields.yearlyConsumption', 'Yearly Consumption')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="consumption"
                        value={yearlyConsumption}
                        onChange={(e) => setYearlyConsumption(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 pl-4 pr-12 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm border shadow-sm"
                        placeholder="e.g. 5000"
                        required />

                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">kWh</span>
                      </div>
                    </div>
                  </div>

                  {/* Solar Power */}
                  <div>
                    <label
                      htmlFor="solar"
                      className="block text-sm font-medium text-gray-700 mb-2">

                      {t('fields.desiredSolarKw', 'Desired Solar Power')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="solar"
                        value={desiredSolarKw}
                        onChange={(e) => setDesiredSolarKw(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 pl-4 pr-12 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm border shadow-sm"
                        placeholder="e.g. 11" />

                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">kW</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery */}
                  <div>
                    <label
                      htmlFor="battery"
                      className="block text-sm font-medium text-gray-700 mb-2">

                      {t('fields.desiredBatteryKwh', 'Battery Capacity')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="battery"
                        value={desiredBatteryKwh}
                        onChange={(e) => setDesiredBatteryKwh(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 pl-4 pr-12 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm border shadow-sm"
                        placeholder="e.g. 10" />

                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg border-b border-gray-100 pb-2">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <h3>{t('sections.contact', 'Contact Details')}</h3>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2">

                    {t('fields.email', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 px-4 py-2.5 focus:border-primary-500 focus:ring-primary-500 sm:text-sm border shadow-sm"
                    placeholder="your@email.com"
                    required />

                  <p className="mt-2 text-xs text-gray-500">
                    We'll send a detailed report to this email address.
                  </p>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">

                  {isCalculating ?
                  <>
                      <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">

                        <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4">
                      </circle>
                        <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                      </svg>
                      Calculating...
                    </> :

                  <>
                      {t('buttons.calculate', 'Calculate Savings')}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Section - Inline */}
        {showResults && results &&
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Potential Savings
              </h2>
              <p className="text-gray-600">
                Based on your inputs and our optimization algorithms
              </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Estimated Annual Savings
                </p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary-600">
                    €{results.financials.savings}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">/ year</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Return on Investment
                </p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary-600">
                    {results.financials.roiYears}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">years</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Current Annual Cost
                </p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    €{results.financials.currentCost}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Production vs Consumption Chart */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    Production vs Consumption
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.monthlyData}>
                      <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0" />

                      <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#6b7280'
                      }} />

                      <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#6b7280'
                      }} />

                      <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      cursor={{
                        fill: '#f9fafb'
                      }} />

                      <Legend />
                      <Bar
                      dataKey="consumption"
                      name="Consumption"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]} />

                      <Bar
                      dataKey="production"
                      name="Solar Production"
                      fill="#0094b3"
                      radius={[4, 4, 0, 0]} />

                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid Import Reduction */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Battery className="w-5 h-5 text-primary-500" />
                    Grid Import Reduction
                  </h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.monthlyData}>
                      <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0" />

                      <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#6b7280'
                      }} />

                      <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#6b7280'
                      }} />

                      <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} />

                      <Legend />
                      <Line
                      type="monotone"
                      dataKey="consumption"
                      name="Original Import"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      dot={false} />

                      <Line
                      type="monotone"
                      dataKey="gridImport"
                      name="New Import (Optimized)"
                      stroke="#0094b3"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#0094b3',
                        strokeWidth: 2,
                        stroke: '#fff'
                      }} />

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary-50 rounded-xl p-8 text-center border border-primary-100">
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Ready to start saving?
              </h3>
              <p className="text-primary-700 mb-6 max-w-2xl mx-auto">
                This is a preliminary estimate. For a detailed analysis and
                formal offer, please proceed to our detailed calculator or
                contact our sales team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                href="/calculator/detailed"
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors">

                  Go to Detailed Calculator
                </a>
                <button className="inline-flex justify-center items-center px-6 py-3 border border-primary-200 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}