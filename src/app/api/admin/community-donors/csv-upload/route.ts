import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

const FALLBACK_CITY_DATA = [
  { city: 'Dhaka', country: 'Bangladesh', country_code: 'BD', lat: 23.8103, lon: 90.4125 },
  { city: 'Chattogram', country: 'Bangladesh', country_code: 'BD', lat: 22.3569, lon: 91.7832 },
  { city: 'Delhi', country: 'India', country_code: 'IN', lat: 28.6139, lon: 77.2090 },
  { city: 'Kolkata', country: 'India', country_code: 'IN', lat: 22.5726, lon: 88.3639 },
  { city: 'Mumbai', country: 'India', country_code: 'IN', lat: 19.0760, lon: 72.8777 },
  { city: 'New York', country: 'United States', country_code: 'US', lat: 40.7128, lon: -74.0060 },
  { city: 'Sydney', country: 'Australia', country_code: 'AU', lat: -33.8688, lon: 151.2093 },
  { city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', lat: 52.3676, lon: 4.9041 },
];

interface ResolvedCity {
  lat: number;
  lon: number;
  country: string;
  country_code: string;
  formatted: string;
  place_id: string;
}

interface ParsedCommunityRow {
  originalRow: string;
  organizationName: string;
  city: string;
  country: string;
  number: string;
  contactPerson: string | null;
}

const normalizeCountry = (value: string) => {
  const v = value.trim().toLowerCase();
  if (v === 'us' || v === 'usa' || v === 'u.s.a.' || v === 'u.s.' || v === 'united states of america') return 'united states';
  if (v === 'uk' || v === 'u.k.' || v === 'great britain') return 'united kingdom';
  return v;
};

const parseRow = (row: string): ParsedCommunityRow => {
  const parts = row.split(',').map((p) => p.trim()).filter(Boolean);

  // Preferred format:
  // "Organization, City - Country, Number, Contact(optional)"
  if (parts.length >= 3 && parts[1].includes(' - ')) {
    const [city, country] = parts[1].split(/\s-\s(.+)/, 2);
    return {
      originalRow: row,
      organizationName: (parts[0] || '').trim(),
      city: (city || '').trim(),
      country: (country || '').trim(),
      number: (parts[2] || '').replace(/[^0-9]/g, ''),
      contactPerson: parts[3] || null,
    };
  }

  // Legacy fallback: "Organization, City, Number, Contact(optional)"
  return {
    originalRow: row,
    organizationName: parts[0] || '',
    city: parts[1] || '',
    country: '',
    number: parts[2] ? parts[2].replace(/[^0-9]/g, '') : '',
    contactPerson: parts[3] || null,
  };
};

const ensureAdminSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
};

export async function POST(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const csvText = body.csvText as string;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const rows = csvText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    const parsedRows = rows.map(parseRow);

    const uniqueLocations = Array.from(
      new Set(
        parsedRows
          .map((r) => `${r.city.toLowerCase()}|${normalizeCountry(r.country)}`)
          .filter((x) => x.split('|')[0]),
      ),
    );
    const cityCache: Record<string, ResolvedCity | null> = {};
    const apiKey = process.env.GEOAPIFY_API_KEY;

    for (const location of uniqueLocations) {
      const [city, countryNormalized] = location.split('|');
      const cacheKey = `${city}|${countryNormalized}`;
      if (cityCache[cacheKey] !== undefined) continue;
      const countryText = countryNormalized || '';

      let resolved: ResolvedCity | null = null;
      if (apiKey) {
        try {
          const geoUrl = new URL('https://api.geoapify.com/v1/geocode/search');
          geoUrl.searchParams.set('text', countryText ? `${city}, ${countryText}` : city);
          geoUrl.searchParams.set('type', 'city');
          geoUrl.searchParams.set('format', 'json');
          geoUrl.searchParams.set('apiKey', apiKey);

          const res = await fetch(geoUrl.toString(), { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            const results = data.results || [];
            const match = results.find((r: any) => r.result_type === 'city' || r.city);
            if (match && match.city && match.country && match.country_code) {
              if (countryText && normalizeCountry(String(match.country || '')) !== countryText) {
                continue;
              }
              resolved = {
                lat: match.lat,
                lon: match.lon,
                country: match.country,
                country_code: match.country_code.toUpperCase(),
                formatted: match.formatted || `${match.city}, ${match.country}`,
                place_id: match.place_id,
              };
            }
          }
        } catch {
          // continue with fallback
        }
      }

      if (!resolved) {
        const fallbackMatch = FALLBACK_CITY_DATA.find(
          (f) =>
            (f.city.toLowerCase() === city.toLowerCase() || f.city.toLowerCase().includes(city.toLowerCase())) &&
            (!countryText || normalizeCountry(f.country) === countryText),
        );
        if (fallbackMatch) {
          resolved = {
            lat: fallbackMatch.lat,
            lon: fallbackMatch.lon,
            country: fallbackMatch.country,
            country_code: fallbackMatch.country_code.toUpperCase(),
            formatted: `${fallbackMatch.city}, ${fallbackMatch.country}`,
            place_id: `fallback-${fallbackMatch.city.toLowerCase()}-${fallbackMatch.country_code.toLowerCase()}`,
          };
        }
      }

      cityCache[cacheKey] = resolved;
    }

    let createdCount = 0;
    let failedCount = 0;
    const failures: Array<{ row: string; reason: string }> = [];

    for (const row of parsedRows) {
      if (!row.organizationName || !row.city || !row.number) {
        failedCount += 1;
        failures.push({ row: row.originalRow, reason: 'Missing required fields (Organization, City, Number).' });
        continue;
      }
      if (row.country && row.country.trim().length < 2) {
        failedCount += 1;
        failures.push({ row: row.originalRow, reason: 'Country is too short.' });
        continue;
      }

      const resolvedCity = cityCache[`${row.city.toLowerCase()}|${normalizeCountry(row.country)}`];
      if (!resolvedCity) {
        failedCount += 1;
        failures.push({
          row: row.originalRow,
          reason: row.country
            ? `Could not resolve city/country: ${row.city}, ${row.country}`
            : `Could not resolve city: ${row.city}`,
        });
        continue;
      }

      const parsedPhone = parsePhoneNumberFromString(row.number, resolvedCity.country_code as CountryCode);
      if (!parsedPhone || !parsedPhone.isValid()) {
        failedCount += 1;
        failures.push({ row: row.originalRow, reason: `Invalid phone number for ${resolvedCity.country}` });
        continue;
      }

      try {
        await getPrisma().communityDonor.create({
          data: {
            organization_name: row.organizationName,
            contact_person: row.contactPerson,
            mobile: parsedPhone.number,
            phone_country_name: resolvedCity.country,
            phone_country_code: resolvedCity.country_code,
            phone_dial_code: `+${parsedPhone.countryCallingCode}`,
            phone_local_number: String(parsedPhone.nationalNumber),
            location_city: row.city,
            location_country: resolvedCity.country,
            location_formatted: resolvedCity.formatted,
            location_lat: resolvedCity.lat,
            location_lng: resolvedCity.lon,
            place_id: resolvedCity.place_id,
            source: 'Community CSV Upload',
            added_by_admin: auth.session.user_id,
            verification_status: 'VERIFIED',
            is_active: true,
          },
        });
        createdCount += 1;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          failedCount += 1;
          failures.push({ row: row.originalRow, reason: 'Duplicate Number (already exists).' });
          continue;
        }
        failedCount += 1;
        failures.push({ row: row.originalRow, reason: 'Database insertion error.' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        createdCount,
        failedCount,
        failures,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
