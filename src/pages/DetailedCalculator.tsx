import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Battery,
  ChevronRight,
  FileText,
  Mail,
  Settings,
  Sun,
  Upload,
  Zap
} from 'lucide-react';

type PricingPeriod = {
  id: string;
  vt_cena?: string;
  mt_cena?: string;
  et_cena?: string;
  date_from?: string;
  date_to?: string;
};

type FormValues = {
  tarifa: 'vtmt' | 'et' | 'din';
  vtmt_periods: PricingPeriod[];
  et_periods: PricingPeriod[];
  pribitek_procent: string;

  visoka_b1: string;
  visoka_b2: string;
  visoka_b3: string;
  visoka_b4: string;
  nizka_b2: string;
  nizka_b3: string;
  nizka_b4: string;
  nizka_b5: string;

  csv_files: File[];

  prehod: 'prehod_vtmt' | 'prehod_et' | 'prehod_din';
  new_vtmt_periods: PricingPeriod[];
  new_et_periods: PricingPeriod[];
  new_dynamic_surcharge: string;

  enable_sell_pricing: boolean;
  sell_pricing_type: 'sell_vtmt' | 'sell_et' | 'sell_din';
  sell_vtmt_periods: PricingPeriod[];
  sell_et_periods: PricingPeriod[];
  sell_dynamic_surcharge: string;

  konf_baterija: 'konf_baterija_ne' | 'konf_baterija_da';
  konf_baterija_kapaciteta_vrednost: string;
  konf_max_moc_praznjenje: string;
  konf_max_moc_polnjenje: string;
  konf_charge_efficiency: string;
  konf_discharge_efficiency: string;
  konf_initial_soc_pct: string;
  konf_min_soc_pct: string;

  konf_soncna: 'konf_soncna_ne' | 'konf_soncna_da';
  solar_address: string;
  konf_soncna_moc: string;
  konf_soncna_paneli: string;
  surface_azimuth: string;
  surface_azimuth_custom: string;
  surface_tilt: string;
  altitude: string;
  latitude: string;
  longitude: string;

  email: string;
};

const defaultValues: FormValues = {
  tarifa: 'vtmt',
  vtmt_periods: [{ id: '1', vt_cena: '', mt_cena: '' }],
  et_periods: [{ id: '1', et_cena: '' }],
  pribitek_procent: '',

  visoka_b1: '',
  visoka_b2: '',
  visoka_b3: '',
  visoka_b4: '',
  nizka_b2: '',
  nizka_b3: '',
  nizka_b4: '',
  nizka_b5: '',

  csv_files: [],

  prehod: 'prehod_din',
  new_vtmt_periods: [{ id: '1', vt_cena: '', mt_cena: '' }],
  new_et_periods: [{ id: '1', et_cena: '' }],
  new_dynamic_surcharge: '',

  enable_sell_pricing: false,
  sell_pricing_type: 'sell_din',
  sell_vtmt_periods: [{ id: '1', vt_cena: '', mt_cena: '' }],
  sell_et_periods: [{ id: '1', et_cena: '' }],
  sell_dynamic_surcharge: '',

  konf_baterija: 'konf_baterija_ne',
  konf_baterija_kapaciteta_vrednost: '',
  konf_max_moc_praznjenje: '',
  konf_max_moc_polnjenje: '',
  konf_charge_efficiency: '95',
  konf_discharge_efficiency: '95',
  konf_initial_soc_pct: '100',
  konf_min_soc_pct: '10',

  konf_soncna: 'konf_soncna_ne',
  solar_address: '',
  konf_soncna_moc: '',
  konf_soncna_paneli: '',
  surface_azimuth: '',
  surface_azimuth_custom: '',
  surface_tilt: '',
  altitude: '',
  latitude: '',
  longitude: '',

  email: ''
};

type AddressSuggestion = {
  properties?: {
    place_id?: string | number;
    formatted?: string;
    name?: string;
    lat?: number;
    lon?: number;
  };
};

const inputClass =
  'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 border';
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
const sectionTitleClass = 'text-lg font-semibold text-gray-900 flex items-center gap-2';
const helperClass = 'text-sm text-gray-500';

type ValidationError = {
  loc: string;
  message: string;
};

const errorInputClass = 'border-red-500 focus:border-red-500 focus:ring-red-500';

const steps = [
  { id: 'current', label: 'Current State' },
  { id: 'desired', label: 'Desired State' },
  { id: 'contact', label: 'Contact' }
] as const;

type StepId = (typeof steps)[number]['id'];

export default function DetailedCalculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StepId>('current');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [currentStepErrors, setCurrentStepErrors] = useState<ValidationError[]>([]);
  const [desiredStepErrors, setDesiredStepErrors] = useState<ValidationError[]>([]);
  const [values, setValues] = useState<FormValues>(defaultValues);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showManualSolarFields, setShowManualSolarFields] = useState(false);

  const updateValue = (key: keyof FormValues, value: FormValues[keyof FormValues]) => {
    setValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const hasError = (loc: string) => currentStepErrors.some((err) => err.loc === loc);
  const inputClassFor = (loc: string) => (hasError(loc) ? `${inputClass} ${errorInputClass}` : inputClass);

  const normalizeNumber = (value: string) => value.replace(',', '.').trim();
  const parseNumber = (value: string) => {
    const raw = normalizeNumber(value);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  };

  const validateCurrentStep = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (values.tarifa === 'vtmt') {
      if (!values.vtmt_periods[0].vt_cena?.toString().trim()) {
        errors.push({ loc: 'current.pricing.vt', message: 'VT price is required.' });
      }
      if (!values.vtmt_periods[0].mt_cena?.toString().trim()) {
        errors.push({ loc: 'current.pricing.mt', message: 'MT price is required.' });
      }
    }

    if (values.tarifa === 'et') {
      if (!values.et_periods[0].et_cena?.toString().trim()) {
        errors.push({ loc: 'current.pricing.et', message: 'ET price is required.' });
      }
    }

    if (values.tarifa === 'din') {
      const surcharge = parseNumber(values.pribitek_procent);
      if (surcharge === null) {
        errors.push({ loc: 'current.pricing.dynamic_surcharge', message: 'Dynamic surcharge is required.' });
      } else if (surcharge < 0 || surcharge > 100) {
        errors.push({ loc: 'current.pricing.dynamic_surcharge', message: 'Dynamic surcharge must be between 0 and 100.' });
      }
    }

    const highFields: Array<{ key: keyof FormValues; label: string }> = [
      { key: 'visoka_b1', label: 'B1' },
      { key: 'visoka_b2', label: 'B2' },
      { key: 'visoka_b3', label: 'B3' },
      { key: 'visoka_b4', label: 'B4' }
    ];
    const lowFields: Array<{ key: keyof FormValues; label: string }> = [
      { key: 'nizka_b2', label: 'B2' },
      { key: 'nizka_b3', label: 'B3' },
      { key: 'nizka_b4', label: 'B4' },
      { key: 'nizka_b5', label: 'B5' }
    ];

    const hasAnyHigh = highFields.some((f) => String(values[f.key]).trim() !== '');
    const hasAnyLow = lowFields.some((f) => String(values[f.key]).trim() !== '');

    const missingHigh = hasAnyHigh && highFields.some((f) => String(values[f.key]).trim() == '');
    const missingLow = hasAnyLow && lowFields.some((f) => String(values[f.key]).trim() == '');

    if (hasAnyHigh || hasAnyLow) {
      if (hasAnyHigh !== hasAnyLow || missingHigh || missingLow) {
        errors.push({
          loc: 'current.power_limits',
          message: 'Either all or none of the agreed power limits should be set.'
        });
      }
    }

    if (values.csv_files.length == 0) {
      errors.push({ loc: 'current.consumption.files', message: 'Consumption data file is required.' });
    }

    return errors;
  };

  const hasDesiredError = (loc: string) => desiredStepErrors.some((err) => err.loc === loc);
  const inputClassForDesired = (loc: string) => (hasDesiredError(loc) ? `${inputClass} ${errorInputClass}` : inputClass);

  const validateDesiredStep = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (values.prehod === 'prehod_vtmt') {
      if (!values.new_vtmt_periods[0].vt_cena?.toString().trim()) {
        errors.push({ loc: 'desired.pricing.vt', message: 'VT price is required.' });
      }
      if (!values.new_vtmt_periods[0].mt_cena?.toString().trim()) {
        errors.push({ loc: 'desired.pricing.mt', message: 'MT price is required.' });
      }
    }

    if (values.prehod === 'prehod_et') {
      if (!values.new_et_periods[0].et_cena?.toString().trim()) {
        errors.push({ loc: 'desired.pricing.et', message: 'ET price is required.' });
      }
    }

    if (values.prehod === 'prehod_din') {
      const surcharge = parseNumber(values.new_dynamic_surcharge);
      if (surcharge === null) {
        errors.push({ loc: 'desired.pricing.dynamic_surcharge', message: 'Dynamic surcharge is required.' });
      } else if (surcharge < 0 || surcharge > 100) {
        errors.push({
          loc: 'desired.pricing.dynamic_surcharge',
          message: 'Dynamic surcharge must be between 0 and 100.'
        });
      }
    }

    if (values.enable_sell_pricing) {
      if (values.sell_pricing_type === 'sell_vtmt') {
        if (!values.sell_vtmt_periods[0].vt_cena?.toString().trim()) {
          errors.push({ loc: 'desired.sell.vt', message: 'VT sell price is required.' });
        }
        if (!values.sell_vtmt_periods[0].mt_cena?.toString().trim()) {
          errors.push({ loc: 'desired.sell.mt', message: 'MT sell price is required.' });
        }
      }

      if (values.sell_pricing_type === 'sell_et') {
        if (!values.sell_et_periods[0].et_cena?.toString().trim()) {
          errors.push({ loc: 'desired.sell.et', message: 'ET sell price is required.' });
        }
      }

      if (values.sell_pricing_type === 'sell_din') {
        const surcharge = parseNumber(values.sell_dynamic_surcharge);
        if (surcharge === null) {
          errors.push({ loc: 'desired.sell.dynamic_surcharge', message: 'Dynamic sell surcharge is required.' });
        } else if (surcharge < 0 || surcharge > 100) {
          errors.push({
            loc: 'desired.sell.dynamic_surcharge',
            message: 'Dynamic sell surcharge must be between 0 and 100.'
          });
        }
      }
    }

    if (values.konf_baterija === 'konf_baterija_da') {
      const capacity = parseNumber(values.konf_baterija_kapaciteta_vrednost);
      const maxDischarge = parseNumber(values.konf_max_moc_praznjenje);
      const maxCharge = parseNumber(values.konf_max_moc_polnjenje);
      const chargeEff = parseNumber(values.konf_charge_efficiency);
      const dischargeEff = parseNumber(values.konf_discharge_efficiency);
      const initialSoc = parseNumber(values.konf_initial_soc_pct);
      const minSoc = parseNumber(values.konf_min_soc_pct);

      if (capacity === null || capacity <= 0) {
        errors.push({ loc: 'desired.battery.capacity', message: 'Battery capacity must be greater than 0.' });
      }
      if (maxDischarge === null || maxDischarge <= 0) {
        errors.push({
          loc: 'desired.battery.max_discharge',
          message: 'Max discharge power must be greater than 0.'
        });
      }
      if (maxCharge === null || maxCharge <= 0) {
        errors.push({ loc: 'desired.battery.max_charge', message: 'Max charge power must be greater than 0.' });
      }

      if (chargeEff === null || chargeEff <= 0 || chargeEff > 100) {
        errors.push({
          loc: 'desired.battery.charge_eff',
          message: 'Charge efficiency must be between 0 and 100.'
        });
      }
      if (dischargeEff === null || dischargeEff <= 0 || dischargeEff > 100) {
        errors.push({
          loc: 'desired.battery.discharge_eff',
          message: 'Discharge efficiency must be between 0 and 100.'
        });
      }
      if (initialSoc === null || initialSoc < 0 || initialSoc > 100) {
        errors.push({ loc: 'desired.battery.initial_soc', message: 'Initial SoC must be between 0 and 100.' });
      }
      if (minSoc === null || minSoc < 0 || minSoc > 100) {
        errors.push({ loc: 'desired.battery.min_soc', message: 'Minimum SoC must be between 0 and 100.' });
      }
    }

    if (values.konf_soncna === 'konf_soncna_da') {
      const power = parseNumber(values.konf_soncna_moc);
      const panels = parseNumber(values.konf_soncna_paneli);
      const tilt = parseNumber(values.surface_tilt);
      const azimuth = values.surface_azimuth === 'custom'
        ? parseNumber(values.surface_azimuth_custom)
        : parseNumber(values.surface_azimuth);
      const lat = parseNumber(values.latitude);
      const lon = parseNumber(values.longitude);
      const alt = parseNumber(values.altitude);

      if (power === null || power <= 0) {
        errors.push({ loc: 'desired.solar.power', message: 'Solar power is required.' });
      }
      if (panels === null || panels <= 0) {
        errors.push({ loc: 'desired.solar.panels', message: 'Panel count is required.' });
      }
      if (tilt === null) {
        errors.push({ loc: 'desired.solar.tilt', message: 'Roof tilt is required.' });
      }
      if (azimuth === null) {
        errors.push({ loc: 'desired.solar.azimuth', message: 'Roof orientation is required.' });
      }
      if (lat === null) {
        errors.push({ loc: 'desired.solar.latitude', message: 'Latitude is required.' });
      }
      if (lon === null) {
        errors.push({ loc: 'desired.solar.longitude', message: 'Longitude is required.' });
      }
      if (alt === null) {
        errors.push({ loc: 'desired.solar.altitude', message: 'Altitude is required.' });
      }

      if (!showManualSolarFields && (lat === null || lon === null || alt === null)) {
        errors.push({
          loc: 'desired.solar.address',
          message: 'Select a valid address or enter coordinates manually.'
        });
      }
    }

    return errors;
  };


  const updatePeriodValue = (
    key: 'vtmt_periods' | 'et_periods' | 'new_vtmt_periods' | 'new_et_periods' | 'sell_vtmt_periods' | 'sell_et_periods',
    index: number,
    field: keyof PricingPeriod,
    value: string
  ) => {
    setValues((prev) => {
      const updated = [...prev[key]];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    updateValue('csv_files', [...values.csv_files, ...files]);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    updateValue('csv_files', values.csv_files.filter((_, i) => i !== index));
  };

  const fetchAddressSuggestions = async (text: string) => {
    const res = await fetch(`/api/geocode/autocomplete?text=${encodeURIComponent(text)}`);
    if (!res.ok) {
      throw new Error('Autocomplete failed');
    }
    return res.json();
  };

  const fetchElevation = async (lat: number, lon: number) => {
    const res = await fetch(`/api/geocode/elevation?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
      throw new Error('Elevation fetch failed');
    }
    return res.json();
  };

  useEffect(() => {
    if (values.konf_soncna !== 'konf_soncna_da') {
      setAddressSuggestions([]);
      return;
    }

    const query = values.solar_address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    let active = true;
    setAddressLoading(true);
    setAddressError(null);

    const timeout = setTimeout(() => {
      fetchAddressSuggestions(query)
        .then((data) => {
          if (!active) return;
          setAddressSuggestions(Array.isArray(data?.features) ? data.features : []);
          setAddressLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setAddressSuggestions([]);
          setAddressLoading(false);
          setAddressError('Unable to fetch address suggestions.');
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [values.solar_address, values.konf_soncna]);

  const handleSelectSuggestion = async (feature: AddressSuggestion) => {
    const label = feature?.properties?.formatted || feature?.properties?.name || '';
    const lat = feature?.properties?.lat;
    const lon = feature?.properties?.lon;
    updateValue('solar_address', label);
    updateValue('latitude', lat !== undefined ? String(lat) : '');
    updateValue('longitude', lon !== undefined ? String(lon) : '');
    setAddressSuggestions([]);
    setAddressError(null);

    if (lat !== undefined && lon !== undefined) {
      try {
        const elevationData = await fetchElevation(lat, lon);
        const elevation = elevationData?.elevation;
        updateValue('altitude', elevation !== undefined ? String(elevation) : '');
        setShowManualSolarFields(false);
      } catch {
        setAddressError('Unable to fetch elevation.');
        setShowManualSolarFields(true);
      }
    } else {
      setShowManualSolarFields(true);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (activeTab !== 'contact') {
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    navigate('/status');
  };

  const stepLabel = useMemo(() => {
    const active = steps.find((step) => step.id === activeTab);
    return active?.label ?? 'Current State';
  }, [activeTab]);

  const goNext = () => {
    if (activeTab === 'current') {
      const errors = validateCurrentStep();
      if (errors.length > 0) {
        setCurrentStepErrors(errors);
        return;
      }
      setCurrentStepErrors([]);
      setActiveTab('desired');
      return;
    }
    if (activeTab === 'desired') {
      const errors = validateDesiredStep();
      if (errors.length > 0) {
        setDesiredStepErrors(errors);
        return;
      }
      setDesiredStepErrors([]);
      setActiveTab('contact');
    }
  };

  const goBack = () => {
    if (activeTab === 'contact') {
      setActiveTab('desired');
    } else if (activeTab === 'desired') {
      setCurrentStepErrors([]);
      setDesiredStepErrors([]);
      setActiveTab('current');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Detailed Analysis</h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            Provide detailed consumption data and tariff information for a precise calculation of your potential
            savings.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex flex-col items-center ${activeTab === step.id ? 'text-primary-600' : 'text-gray-400'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        activeTab === step.id
                          ? 'bg-primary-100 text-primary-600 font-bold'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className="h-0.5 w-full bg-gray-200 mx-4" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">
            {activeTab === 'current' && (
              <>
                {currentStepErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">Please fix the following issues:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {currentStepErrors.map((err, idx) => (
                        <li key={`${err.loc}-${idx}`}>{err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className={sectionTitleClass}>
                        <Settings className="w-5 h-5 text-primary-500" />
                        Current Pricing
                      </h2>
                      <p className={helperClass}>Set your existing billing method and rates.</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-400">{stepLabel}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Billing Method</label>
                      <select
                        className={inputClassFor('current.pricing.tariff_type')}
                        value={values.tarifa}
                        onChange={(e) => updateValue('tarifa', e.target.value as FormValues['tarifa'])}
                      >
                        <option value="vtmt">VT/MT (High/Low)</option>
                        <option value="et">ET (Single Tariff)</option>
                        <option value="din">Dynamic Pricing</option>
                      </select>
                    </div>
                  </div>

                  {values.tarifa === 'vtmt' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>VT price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassFor('current.pricing.vt')}
                          value={values.vtmt_periods[0].vt_cena ?? ''}
                          onChange={(e) => updatePeriodValue('vtmt_periods', 0, 'vt_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>MT price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassFor('current.pricing.mt')}
                          value={values.vtmt_periods[0].mt_cena ?? ''}
                          onChange={(e) => updatePeriodValue('vtmt_periods', 0, 'mt_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {values.tarifa === 'et' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>ET price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassFor('current.pricing.et')}
                          value={values.et_periods[0].et_cena ?? ''}
                          onChange={(e) => updatePeriodValue('et_periods', 0, 'et_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {values.tarifa === 'din' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Dynamic surcharge (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            className={`${inputClass} pr-10`}
                            value={values.pribitek_procent}
                            onChange={(e) => updateValue('pribitek_procent', e.target.value)}
                            placeholder="10"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <div>
                    <h2 className={sectionTitleClass}>
                      <Zap className="w-5 h-5 text-primary-500" />
                      Agreed Power Limits
                    </h2>
                    <p className={helperClass}>Fill in contractual power limits for each season and block.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">High Season</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'visoka_b1', label: 'Block B1' },
                          { key: 'visoka_b2', label: 'Block B2' },
                          { key: 'visoka_b3', label: 'Block B3' },
                          { key: 'visoka_b4', label: 'Block B4' }
                        ].map((item) => (
                          <div key={item.key}>
                            <label className={labelClass}>{item.label}</label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`${inputClass} pr-10`}
                                value={values[item.key as keyof FormValues] as string}
                                onChange={(e) => updateValue(item.key as keyof FormValues, e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">kW</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Low Season</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'nizka_b2', label: 'Block B2' },
                          { key: 'nizka_b3', label: 'Block B3' },
                          { key: 'nizka_b4', label: 'Block B4' },
                          { key: 'nizka_b5', label: 'Block B5' }
                        ].map((item) => (
                          <div key={item.key}>
                            <label className={labelClass}>{item.label}</label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`${inputClass} pr-10`}
                                value={values[item.key as keyof FormValues] as string}
                                onChange={(e) => updateValue(item.key as keyof FormValues, e.target.value)}
                                placeholder="0.00"
                              />
                              <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">kW</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <div>
                    <h2 className={sectionTitleClass}>
                      <Upload className="w-5 h-5 text-primary-500" />
                      Consumption Data
                    </h2>
                    <p className={helperClass}>Upload CSV or Excel files with hourly consumption data.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Upload files</label>
                      <div className={`border-2 border-dashed rounded-lg p-8 text-center bg-gray-50 ${hasError('current.consumption.files') ? 'border-red-400' : 'border-gray-300'}`}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          multiple
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 rounded-md bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Select files
                        </button>
                        <p className="mt-3 text-xs text-gray-500">Supported: CSV, XLSX, XLS (max 10MB each)</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Selected files</h4>
                      {values.csv_files.length === 0 ? (
                        <p className="text-sm text-gray-500">No files selected yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {values.csv_files.map((file, index) => (
                            <li
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4 text-xs text-gray-500">
                        Need help?{' '}
                        <a
                          href="/calculator/navodila_moj_elektro.pdf"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                          download
                        >
                          Download instructions
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Next
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'desired' && (
              <>
                {desiredStepErrors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">Please fix the following issues:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {desiredStepErrors.map((err, idx) => (
                        <li key={`${err.loc}-${idx}`}>{err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className={sectionTitleClass}>
                        <Settings className="w-5 h-5 text-primary-500" />
                        New Tariff Configuration
                      </h2>
                      <p className={helperClass}>Choose a desired billing method to compare savings.</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-400">{stepLabel}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Switch to</label>
                      <select
                        className={inputClassForDesired('desired.pricing.tariff_type')}
                        value={values.prehod}
                        onChange={(e) => updateValue('prehod', e.target.value as FormValues['prehod'])}
                      >
                        <option value="prehod_vtmt">VT/MT (High/Low)</option>
                        <option value="prehod_et">ET (Single Tariff)</option>
                        <option value="prehod_din">Dynamic Pricing</option>
                      </select>
                    </div>
                  </div>

                  {values.prehod === 'prehod_vtmt' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>VT price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassForDesired('desired.pricing.vt')}
                          value={values.new_vtmt_periods[0].vt_cena ?? ''}
                          onChange={(e) => updatePeriodValue('new_vtmt_periods', 0, 'vt_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>MT price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassForDesired('desired.pricing.mt')}
                          value={values.new_vtmt_periods[0].mt_cena ?? ''}
                          onChange={(e) => updatePeriodValue('new_vtmt_periods', 0, 'mt_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {values.prehod === 'prehod_et' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>ET price (EUR/kWh)</label>
                        <input
                          type="text"
                          className={inputClassForDesired('desired.pricing.et')}
                          value={values.new_et_periods[0].et_cena ?? ''}
                          onChange={(e) => updatePeriodValue('new_et_periods', 0, 'et_cena', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {values.prehod === 'prehod_din' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Dynamic surcharge (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            className={`${inputClassForDesired('desired.pricing.dynamic_surcharge')} pr-10`}
                            value={values.new_dynamic_surcharge}
                            onChange={(e) => updateValue('new_dynamic_surcharge', e.target.value)}
                            placeholder="10"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <div>
                    <h2 className={sectionTitleClass}>
                      <FileText className="w-5 h-5 text-primary-500" />
                      Sell Pricing Configuration
                    </h2>
                    <p className={helperClass}>Configure compensation for exported energy if you sell surplus.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Enable selling</label>
                      <select
                        className={inputClass}
                        value={values.enable_sell_pricing ? 'yes' : 'no'}
                        onChange={(e) => updateValue('enable_sell_pricing', e.target.value === 'yes')}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {values.enable_sell_pricing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Billing method</label>
                          <select
                            className={inputClassForDesired('desired.sell.tariff_type')}
                            value={values.sell_pricing_type}
                            onChange={(e) => updateValue('sell_pricing_type', e.target.value as FormValues['sell_pricing_type'])}
                          >
                            <option value="sell_vtmt">VT/MT (High/Low)</option>
                            <option value="sell_et">ET (Single Tariff)</option>
                            <option value="sell_din">Dynamic Pricing</option>
                          </select>
                        </div>
                      </div>

                      {values.sell_pricing_type === 'sell_vtmt' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>VT price (EUR/kWh)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.sell.vt')}
                              value={values.sell_vtmt_periods[0].vt_cena ?? ''}
                              onChange={(e) => updatePeriodValue('sell_vtmt_periods', 0, 'vt_cena', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>MT price (EUR/kWh)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.sell.mt')}
                              value={values.sell_vtmt_periods[0].mt_cena ?? ''}
                              onChange={(e) => updatePeriodValue('sell_vtmt_periods', 0, 'mt_cena', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}

                      {values.sell_pricing_type === 'sell_et' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>ET price (EUR/kWh)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.sell.et')}
                              value={values.sell_et_periods[0].et_cena ?? ''}
                              onChange={(e) => updatePeriodValue('sell_et_periods', 0, 'et_cena', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}

                      {values.sell_pricing_type === 'sell_din' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>Dynamic surcharge (%)</label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`${inputClassForDesired('desired.sell.dynamic_surcharge')} pr-10`}
                                value={values.sell_dynamic_surcharge}
                                onChange={(e) => updateValue('sell_dynamic_surcharge', e.target.value)}
                                placeholder="10"
                              />
                              <span className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Selling is disabled. No export pricing will be applied.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <div>
                    <h2 className={sectionTitleClass}>
                      <Battery className="w-5 h-5 text-primary-500" />
                      Battery Storage
                    </h2>
                    <p className={helperClass}>Add battery parameters to evaluate storage savings.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Add battery</label>
                      <select
                        className={inputClass}
                        value={values.konf_baterija}
                        onChange={(e) => updateValue('konf_baterija', e.target.value as FormValues['konf_baterija'])}
                      >
                        <option value="konf_baterija_ne">No</option>
                        <option value="konf_baterija_da">Yes</option>
                      </select>
                    </div>
                  </div>

                  {values.konf_baterija === 'konf_baterija_da' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className={labelClass}>Capacity (kWh)</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.battery.capacity')}
                            value={values.konf_baterija_kapaciteta_vrednost}
                            onChange={(e) => updateValue('konf_baterija_kapaciteta_vrednost', e.target.value)}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Max discharge power (kW)</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.battery.max_discharge')}
                            value={values.konf_max_moc_praznjenje}
                            onChange={(e) => updateValue('konf_max_moc_praznjenje', e.target.value)}
                            placeholder="0.0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Max charge power (kW)</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.battery.max_charge')}
                            value={values.konf_max_moc_polnjenje}
                            onChange={(e) => updateValue('konf_max_moc_polnjenje', e.target.value)}
                            placeholder="0.0"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-700 mb-4">Optional parameters</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div>
                            <label className={labelClass}>Charge efficiency (%)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.battery.charge_eff')}
                              value={values.konf_charge_efficiency}
                              onChange={(e) => updateValue('konf_charge_efficiency', e.target.value)}
                              placeholder="95"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Discharge efficiency (%)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.battery.discharge_eff')}
                              value={values.konf_discharge_efficiency}
                              onChange={(e) => updateValue('konf_discharge_efficiency', e.target.value)}
                              placeholder="95"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Initial SoC (%)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.battery.initial_soc')}
                              value={values.konf_initial_soc_pct}
                              onChange={(e) => updateValue('konf_initial_soc_pct', e.target.value)}
                              placeholder="100"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Minimum SoC (%)</label>
                            <input
                              type="text"
                              className={inputClassForDesired('desired.battery.min_soc')}
                              value={values.konf_min_soc_pct}
                              onChange={(e) => updateValue('konf_min_soc_pct', e.target.value)}
                              placeholder="10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Battery is not added for this analysis.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-6">
                  <div>
                    <h2 className={sectionTitleClass}>
                      <Sun className="w-5 h-5 text-primary-500" />
                      Solar Plant Configuration
                    </h2>
                    <p className={helperClass}>Enter solar details to estimate self-consumption and export.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Add solar plant</label>
                      <select
                        className={inputClass}
                        value={values.konf_soncna}
                        onChange={(e) => updateValue('konf_soncna', e.target.value as FormValues['konf_soncna'])}
                      >
                        <option value="konf_soncna_ne">No</option>
                        <option value="konf_soncna_da">Yes</option>
                      </select>
                    </div>
                  </div>

                  {values.konf_soncna === 'konf_soncna_da' ? (
                    <div className="space-y-6">
                      {!showManualSolarFields ? (
                        <div>
                          <label className={labelClass}>Address</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.solar.address')}
                            value={values.solar_address}
                            onChange={(e) => {
                              updateValue('solar_address', e.target.value);
                              setShowManualSolarFields(false);
                            }}
                            placeholder="Start typing an address"
                          />
                          {addressLoading && <p className="mt-2 text-xs text-gray-500">Looking up address...</p>}
                          {addressError && <p className="mt-2 text-xs text-red-500">{addressError}</p>}
                          {addressSuggestions.length > 0 && (
                            <div className="mt-2 rounded-md border border-gray-200 bg-white shadow-sm max-h-56 overflow-auto">
                              {addressSuggestions.map((feature, idx) => (
                                <button
                                  key={`${feature?.properties?.place_id ?? idx}`}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(feature)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {feature?.properties?.formatted || feature?.properties?.name || 'Address option'}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowManualSolarFields(true)}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                          >
                            Enter coordinates manually
                          </button>
                        </div>
                      ) : (
                        <div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className={labelClass}>Altitude (m)</label>
                              <input
                                type="text"
                                className={inputClassForDesired('desired.solar.altitude')}
                                value={values.altitude}
                                onChange={(e) => updateValue('altitude', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Latitude</label>
                              <input
                                type="text"
                                className={inputClassForDesired('desired.solar.latitude')}
                                value={values.latitude}
                                onChange={(e) => updateValue('latitude', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Longitude</label>
                              <input
                                type="text"
                                className={inputClassForDesired('desired.solar.longitude')}
                                value={values.longitude}
                                onChange={(e) => updateValue('longitude', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowManualSolarFields(false)}
                            className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                          >
                            Enter address
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Solar power (kW)</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.solar.power')}
                            value={values.konf_soncna_moc}
                            onChange={(e) => updateValue('konf_soncna_moc', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Panel count</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.solar.panels')}
                            value={values.konf_soncna_paneli}
                            onChange={(e) => updateValue('konf_soncna_paneli', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={labelClass}>Roof orientation</label>
                          <select
                            className={inputClassForDesired('desired.solar.azimuth')}
                            value={values.surface_azimuth}
                            onChange={(e) => {
                              updateValue('surface_azimuth', e.target.value);
                              if (e.target.value !== 'custom') {
                                updateValue('surface_azimuth_custom', '');
                              }
                            }}
                          >
                            <option value="">Select orientation</option>
                            <option value="0">North</option>
                            <option value="180">South</option>
                            <option value="90">East</option>
                            <option value="270">West</option>
                            <option value="315">Northwest</option>
                            <option value="45">Northeast</option>
                            <option value="135">Southeast</option>
                            <option value="225">Southwest</option>
                            <option value="custom">Custom</option>
                          </select>
                          {values.surface_azimuth === 'custom' && (
                            <div className="mt-3">
                              <input
                                type="text"
                                className={inputClassForDesired('desired.solar.azimuth')}
                                value={values.surface_azimuth_custom}
                                onChange={(e) => updateValue('surface_azimuth_custom', e.target.value)}
                                placeholder="Enter azimuth in degrees"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className={labelClass}>Roof tilt (degrees)</label>
                          <input
                            type="text"
                            className={inputClassForDesired('desired.solar.tilt')}
                            value={values.surface_tilt}
                            onChange={(e) => updateValue('surface_tilt', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      Solar plant is not added for this analysis.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Next
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'contact' && (
              <>
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className={sectionTitleClass}>
                        <Mail className="w-5 h-5 text-primary-500" />
                        Contact Details
                      </h2>
                      <p className={helperClass}>
                        We will fully simulate the entire year to ensure the most accurate results. After submitting, you
                        will receive a full report by email in about 15 minutes.
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-gray-400">{stepLabel}</span>
                  </div>

                  <div className="max-w-md">
                    <label className={labelClass}>Email address</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={values.email}
                      onChange={(e) => updateValue('email', e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-8 space-y-4">
                  <label className="flex items-start gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      I accept the{' '}
                      <button
                        type="button"
                        onClick={() => window.open('/calculator/terms-and-conditions', '_blank', 'noopener,noreferrer')}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Terms of Use
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => window.open('/calculator/privacy-policy', '_blank', 'noopener,noreferrer')}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {!termsAccepted && (
                    <p className="text-xs text-red-500">Please accept the terms to continue.</p>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !termsAccepted}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Processing...' : 'Calculate'}
                    {!isSubmitting && <ChevronRight className="ml-2 w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
