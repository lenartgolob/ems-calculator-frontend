import type { ConsumptionData } from './calculator';

export type ApiPayload = {
  current_configuration: {
    pricing: any;
    consumption_data: {raw_data: ConsumptionData[];};
    power_limits: {
      high_season: Record<string, number | null>;
      low_season: Record<string, number | null>;
    };
  };
  desired_configuration: {
    pricing: any;
    sell_pricing: any | null;
    battery: any | null;
    solar_plant: any | null;
  };
  email: string;
};