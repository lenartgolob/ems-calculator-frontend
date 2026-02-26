export interface PricingPeriod {
  id: string;
  vt_cena?: string | number;
  mt_cena?: string | number;
  et_cena?: string | number;
  date_from: string;
  date_to: string;
}

export interface CurrentPricing {
  tariff_type: 'VT/MT' | 'ET' | 'Dynamic';
  vt_mt_pricing_periods?: PricingPeriod[];
  et_pricing_periods?: PricingPeriod[];
  dynamic_surcharge?: number;
}

export interface NewPricing {
  tariff_type: 'VT/MT' | 'ET' | 'Dynamic';
  vt_mt_pricing_periods?: PricingPeriod[];
  et_pricing_periods?: PricingPeriod[];
  dynamic_surcharge?: number;
  surplus_price_eur?: number;
}

export interface ConsumptionData {
  timestamp: string;
  consumption: number;
}

export interface DailyData {
  consumption_kwh: number;
  calculation_date: string;
  current_cost_eur: number;
  solar_production_kwh: number;
  desired_baseline_cost_eur: number;
  desired_solar_baseline_cost_eur?: number;
  solar_import_reduction_cost_eur: number;
  solar_with_export_cost_eur: number;
  desired_optimized_cost_eur: number;
}

export interface CalculationResult {
  uuid: string;
  email: string;
  timestamp: string;
  configuration_id?: number;
  analysis_days?: number;
  current_cost: number;
  optimized_cost: number;
  baseline_cost?: number;
  total_savings: number;
  savings_percentage: number;
  baseline_savings?: number;
  baseline_savings_percentage?: number;
  total_consumption?: number;
  total_solar_production?: number;
  daily_data?: DailyData[];
  raw_data?: any;
}