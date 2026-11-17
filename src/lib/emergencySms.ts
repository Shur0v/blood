export const PRICE_PAISA = 3500;
export const MAX_RECIPIENTS = 50;
export const BATCH_SIZE = 10;
export const RADIUS_KM = 5;
export const BATCH_DELAY_MS = 5 * 60_000;
export const CONSENT_AGE_MS = 90 * 86400_000;
export const CONTACT_INTERVAL_MS = 24 * 60 * 60_000;
export const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

type Point = { latitude: number; longitude: number };
export type Candidate = Point & {
  userId: string; phoneDigest: string; lastContact: number | null; language: string;
};

export function distanceKm(a: Point, b: Point) {
  const radians = Math.PI / 180;
  const halfLat = (b.latitude - a.latitude) * radians / 2;
  const halfLng = (b.longitude - a.longitude) * radians / 2;
  const h = Math.sin(halfLat) ** 2 + Math.cos(a.latitude * radians) *
    Math.cos(b.latitude * radians) * Math.sin(halfLng) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function selectRecipients(branch: Point, candidates: Candidate[], limit = MAX_RECIPIENTS) {
  const ranked = candidates
    .map(candidate => ({ candidate, km: distanceKm(branch, candidate) }))
    .filter(entry => entry.km <= RADIUS_KM)
    .sort((a, b) => a.km - b.km ||
      (a.candidate.lastContact ?? 0) - (b.candidate.lastContact ?? 0) ||
      a.candidate.userId.localeCompare(b.candidate.userId));
  const used = new Set<string>();
  const result: Candidate[] = [];
  for (const { candidate } of ranked) {
    if (result.length >= Math.min(limit, MAX_RECIPIENTS)) break;
    if (used.has(candidate.phoneDigest)) continue;
    used.add(candidate.phoneDigest);
    result.push(candidate);
  }
  return result;
}

export const TEMPLATE_VERSION = 'emergency-sms-v1';
export function renderTemplate(language: string, hospital: string, area: string, group: string, neededAt: Date, link: string, body?: string) {
  const bangla = language === 'bn';
  const time = new Intl.DateTimeFormat(bangla ? 'bn-BD' : 'en-GB', {
    timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(neededAt);
  if (body) {
    const values: Record<string, string> = { hospital, area, group, time, link };
    return body.replace(/\{([a-z]+)\}/g, (_, field: string) => values[field] ?? '');
  }
  return bangla
    ? 'BloodNet: ' + hospital + ', ' + area + '-তে ' + group + ' রক্তদাতার অনুরোধ। প্রয়োজন ' + time + '-এর মধ্যে। সাড়া দিতে বা বার্তা বন্ধ করতে ' + link
    : 'BloodNet: ' + group + ' donor requested at ' + hospital + ', ' + area + ' by ' + time + '. Respond or opt out: ' + link;
}

const TEMPLATE_FIELDS = ['hospital', 'area', 'group', 'time', 'link'] as const;

export function validTemplateBody(body: string) {
  const matches = [...body.matchAll(/\{([a-z]+)\}/g)].map(match => match[1]);
  return matches.length === TEMPLATE_FIELDS.length && TEMPLATE_FIELDS.every(field => matches.includes(field)) &&
    /^[\p{L}\p{M}\p{N}\s.,!?+():;'-]+$/u.test(body.replace(/\{[a-z]+\}/g, '')) &&
    !/https?|www\.|\p{N}{5}/iu.test(body.replace(/\{[a-z]+\}/g, ''));
}

export function smsSegments(body: string) {
  const gsmBasic = new Set('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà');
  const gsmExtended = new Set('^{}\\[~]|€');
  let length = 0;
  for (const char of body) {
    if (!gsmBasic.has(char) && !gsmExtended.has(char)) return body.length <= 70 ? 1 : Math.ceil(body.length / 67);
    length += gsmExtended.has(char) ? 2 : 1;
  }
  return length <= 160 ? 1 : Math.ceil(length / 153);
}
