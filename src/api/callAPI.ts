import type { ApiPayload } from '../types/payloadTypes';

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\//, '');
}

const API_BASE = '/api';
const SUBMIT_PATH = '/calculator-calculate';
const RESULTS_PATH = '/calculator-results';

export async function submitCalculatorCalculation(
payload: ApiPayload)
: Promise<any> {
  const url = joinUrl(API_BASE, SUBMIT_PATH);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get('content-type') || '';
  const parsed = contentType.includes('application/json') ?
  await response.json() :
  await response.text();

  if (!response.ok) {
    const err: any = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    );
    err.response = { data: parsed };
    throw err;
  }

  return parsed;
}

export async function getCalculatorResults(uuid: string): Promise<any> {
  const url = new URL(joinUrl(API_BASE, RESULTS_PATH), window.location.origin);
  url.searchParams.set('uuid', uuid);
  url.searchParams.set('_t', String(Date.now()));

  const response = await fetch(url.toString(), {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const parsed = contentType.includes('application/json') ?
  await response.json() :
  await response.text();

  if (!response.ok) {
    const err: any = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    );
    err.response = { data: parsed };
    throw err;
  }

  return parsed;
}