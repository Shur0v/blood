const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'united states',
  us: 'united states',
  'u.s.a': 'united states',
  'u.s': 'united states',
  america: 'united states',
  'united states of america': 'united states',
  uk: 'united kingdom',
  'u.k': 'united kingdom',
  britain: 'united kingdom',
  england: 'united kingdom',
  uae: 'united arab emirates',
  russia: 'russian federation',
  vietnam: 'viet nam',
  korea: 'south korea',
  'south korea': 'korea, republic of',
  'north korea': "korea, democratic people's republic of",
  laos: "lao people's democratic republic",
  bolivia: 'bolivia, plurinational state of',
  moldova: 'moldova, republic of',
  tanzania: 'tanzania, united republic of',
  venezuela: 'venezuela, bolivarian republic of',
  syria: 'syrian arab republic',
  palestine: 'palestine, state of',
};

export const NEARBY_COUNTRY_MAP: Record<string, string[]> = {
  nepal: ['india', 'bangladesh', 'pakistan', 'bhutan'],
  bangladesh: ['india', 'nepal', 'pakistan'],
  india: ['nepal', 'bangladesh', 'pakistan', 'sri lanka'],
  pakistan: ['india', 'bangladesh', 'nepal'],
  'united states': ['canada', 'mexico', 'united kingdom'],
  canada: ['united states', 'united kingdom'],
  'united kingdom': ['ireland', 'france', 'netherlands'],
  australia: ['new zealand', 'singapore', 'india'],
  spain: ['portugal', 'france', 'italy'],
  netherlands: ['belgium', 'germany', 'france'],
  italy: ['france', 'spain', 'switzerland'],
  poland: ['germany', 'czech republic', 'slovakia'],
  france: ['spain', 'italy', 'belgium'],
  germany: ['netherlands', 'france', 'poland'],
};

const countryNameFromCode = (code: string): string | null => {
  if (!code || code.length !== 2) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase())?.toLowerCase() || null;
  } catch {
    return null;
  }
};

export const normalizeCountryToken = (value?: string | null): string => {
  const base = (value || '')
    .toLowerCase()
    .replace(/[().,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  if (COUNTRY_ALIASES[base]) return COUNTRY_ALIASES[base];
  const fromCode = countryNameFromCode(base);
  return fromCode || base;
};

