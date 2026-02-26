import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Download,
  Share2,
  Printer,
  Battery,
  Sun,
  Zap,
  TrendingDown,
  Euro } from
'lucide-react';
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
  Line,
  AreaChart,
  Area } from
'recharts';
export default function Results() {
  const { uuid } = useParams();
  // Mock data for the detailed results view
  const monthlyData = [
  {
    name: 'Jan',
    consumption: 400,
    production: 120,
    grid: 280
  },
  {
    name: 'Feb',
    consumption: 380,
    production: 180,
    grid: 200
  },
  {
    name: 'Mar',
    consumption: 350,
    production: 300,
    grid: 50
  },
  {
    name: 'Apr',
    consumption: 300,
    production: 450,
    grid: 0
  },
  {
    name: 'May',
    consumption: 280,
    production: 550,
    grid: 0
  },
  {
    name: 'Jun',
    consumption: 250,
    production: 600,
    grid: 0
  },
  {
    name: 'Jul',
    consumption: 260,
    production: 620,
    grid: 0
  },
  {
    name: 'Aug',
    consumption: 270,
    production: 580,
    grid: 0
  },
  {
    name: 'Sep',
    consumption: 290,
    production: 480,
    grid: 0
  },
  {
    name: 'Oct',
    consumption: 320,
    production: 350,
    grid: 0
  },
  {
    name: 'Nov',
    consumption: 360,
    production: 180,
    grid: 180
  },
  {
    name: 'Dec',
    consumption: 420,
    production: 100,
    grid: 320
  }];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Actions */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analysis Report
            </h1>
            <p className="text-sm text-gray-500">ID: {uuid}</p>
          </div>
          <div className="flex gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Total Savings
              </h3>
              <Euro className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">€1,240</span>
              <span className="ml-2 text-sm text-green-600 font-medium">
                +12% vs avg
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Projected annual savings
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Self Sufficiency
              </h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">78%</span>
              <span className="ml-2 text-sm text-gray-500">of total usage</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-yellow-500 h-1.5 rounded-full"
                style={{
                  width: '78%'
                }}>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Payback Period
              </h3>
              <TrendingDown className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">6.2</span>
              <span className="ml-2 text-sm text-gray-500">years</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Based on current energy prices
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                CO2 Reduction
              </h3>
              <div className="w-5 h-5 text-green-600 font-bold text-xs flex items-center justify-center border border-green-600 rounded-full">
                CO2
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">4.2</span>
              <span className="ml-2 text-sm text-gray-500">tons/year</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Equivalent to planting 120 trees
            </p>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Energy Balance - Wide */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Monthly Energy Balance
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
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

          {/* Grid Independence - Narrow */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Grid Independence
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0094b3" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0094b3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0" />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: '#6b7280'
                    }} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: '#6b7280'
                    }} />

                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="grid"
                    stroke="#0094b3"
                    fillOpacity={1}
                    fill="url(#colorGrid)" />

                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              Grid dependency is lowest in summer months due to high solar
              production.
            </p>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">
              Recommended System Configuration
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Sun className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Solar Plant</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  11.2 kWp
                </p>
                <p className="text-sm text-gray-500 mt-1">28 x 400W Panels</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Battery className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Battery Storage</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">10 kWh</p>
                <p className="text-sm text-gray-500 mt-1">LFP Technology</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Inverter</h4>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  Hybrid 10kW
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  3-Phase Smart Inverter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);

}