export type HeightUnit = 'cm' | 'in';

// Product defaults: Asia uses inches; other regions use centimetres.
const ASIAN_COUNTRIES = new Set([
  'afghanistan', 'armenia', 'azerbaijan', 'bahrain', 'bangladesh', 'bhutan', 'brunei',
  'cambodia', 'china', 'cyprus', 'georgia', 'india', 'indonesia', 'iran', 'iraq',
  'israel', 'japan', 'jordan', 'kazakhstan', 'kuwait', 'kyrgyzstan', 'laos',
  'lebanon', 'malaysia', 'maldives', 'mongolia', 'myanmar', 'nepal', 'north korea',
  'oman', 'pakistan', 'palestine', 'philippines', 'qatar', 'saudi arabia',
  'singapore', 'south korea', 'sri lanka', 'syria', 'taiwan', 'tajikistan',
  'thailand', 'timor-leste', 'turkey', 'turkmenistan', 'united arab emirates',
  'uzbekistan', 'vietnam', 'yemen', 'hong kong', 'macao', 'macau',
  'türkiye', 'turkiye', 'viet nam', 'lao people’s democratic republic',
  "lao people's democratic republic", 'republic of korea',
  "democratic people's republic of korea", 'state of palestine',
  'iran (islamic republic of)', 'syrian arab republic', 'brunei darussalam', 'east timor',
]);
export function defaultHeightUnit(country: string): HeightUnit {
  return ASIAN_COUNTRIES.has(country.trim().toLowerCase()) ? 'in' : 'cm';
}
export function heightFromCm(cm: number, unit: HeightUnit) {
  return unit === 'in' ? Math.round(cm / 2.54 * 10) / 10 : cm;
}
export function heightToCm(value: number, unit: HeightUnit) {
  return unit === 'in' ? Math.round(value * 2.54 * 100) / 100 : value;
}
export function formatHeight(cm: number, unit: HeightUnit) {
  const value = heightFromCm(cm, unit);
  if (unit === 'cm') return `${value} cm`;
  const totalInches = Math.round(cm / 2.54);
  return `${value} in (${Math.floor(totalInches / 12)} ft ${totalInches % 12} in)`;
}
