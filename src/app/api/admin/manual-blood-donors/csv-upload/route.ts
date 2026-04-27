import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

const FALLBACK_CITY_DATA = [
  { city: 'Dhaka', country: 'Bangladesh', country_code: 'BD', lat: 23.8103, lon: 90.4125 },
  { city: 'Chattogram', country: 'Bangladesh', country_code: 'BD', lat: 22.3569, lon: 91.7832 },
  { city: 'Khulna', country: 'Bangladesh', country_code: 'BD', lat: 22.8456, lon: 89.5403 },
  { city: 'Rajshahi', country: 'Bangladesh', country_code: 'BD', lat: 24.3745, lon: 88.6042 },
  { city: 'Sylhet', country: 'Bangladesh', country_code: 'BD', lat: 24.8949, lon: 91.8687 },
  { city: 'Barishal', country: 'Bangladesh', country_code: 'BD', lat: 22.7010, lon: 90.3535 },
  { city: 'Rangpur', country: 'Bangladesh', country_code: 'BD', lat: 25.7439, lon: 89.2752 },
  { city: 'Mymensingh', country: 'Bangladesh', country_code: 'BD', lat: 24.7471, lon: 90.4203 },
  { city: 'Delhi', country: 'India', country_code: 'IN', lat: 28.6139, lon: 77.2090 },
  { city: 'Kolkata', country: 'India', country_code: 'IN', lat: 22.5726, lon: 88.3639 },
  { city: 'Mumbai', country: 'India', country_code: 'IN', lat: 19.0760, lon: 72.8777 },
];

const ALLOWED_BLOOD_GROUPS = new Set(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']);

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

interface ResolvedCity {
  lat: number;
  lon: number;
  country: string;
  country_code: string;
  formatted: string;
  place_id: string;
}

export async function POST(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const csvText = body.csvText as string;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const rows = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const parsedRows = rows.map(row => {
      const parts = row.split(',').map(p => p.trim());
      return {
        originalRow: row,
        name: parts[0] || '',
        city: parts[1] || '',
        bloodGroup: parts[2] ? parts[2].toUpperCase() : '',
        number: parts[3] ? parts[3].replace(/[^0-9]/g, '') : '',
      };
    });

    const uniqueCities = Array.from(new Set(parsedRows.map(r => r.city).filter(Boolean)));
    const cityCache: Record<string, ResolvedCity | null> = {};

    const apiKey = process.env.GEOAPIFY_API_KEY;

    for (const city of uniqueCities) {
      const cacheKey = city.toLowerCase();
      if (cityCache[cacheKey] !== undefined) continue;

      let resolved: ResolvedCity | null = null;

      if (apiKey) {
        try {
          const geoUrl = new URL('https://api.geoapify.com/v1/geocode/search');
          geoUrl.searchParams.set('text', city);
          geoUrl.searchParams.set('type', 'city');
          geoUrl.searchParams.set('format', 'json');
          geoUrl.searchParams.set('apiKey', apiKey);

          const res = await fetch(geoUrl.toString(), { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            const results = data.results || [];
            const match = results.find((r: any) => r.result_type === 'city' || r.city);
            if (match && match.city && match.country && match.country_code) {
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
        } catch (error) {
          console.error('[csv-upload] Geoapify error:', error);
        }
      }

      if (!resolved) {
        const fallbackMatch = FALLBACK_CITY_DATA.find(f => f.city.toLowerCase() === city.toLowerCase() || f.city.toLowerCase().includes(city.toLowerCase()));
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
      if (!row.name || !row.city || !row.bloodGroup || !row.number) {
        failedCount++;
        failures.push({ row: row.originalRow, reason: 'Missing required fields (Name, Location, Blood Group, Number)' });
        continue;
      }

      if (!ALLOWED_BLOOD_GROUPS.has(row.bloodGroup)) {
        failedCount++;
        failures.push({ row: row.originalRow, reason: `Invalid Blood Group: ${row.bloodGroup}` });
        continue;
      }

      const resolvedCity = cityCache[row.city.toLowerCase()];
      if (!resolvedCity) {
        failedCount++;
        failures.push({ row: row.originalRow, reason: `Could not resolve city: ${row.city}` });
        continue;
      }

      const phoneNumber = parsePhoneNumberFromString(row.number, resolvedCity.country_code as CountryCode);
      if (!phoneNumber || !phoneNumber.isValid()) {
        failedCount++;
        failures.push({ row: row.originalRow, reason: `Invalid phone number format for country ${resolvedCity.country}` });
        continue;
      }

      try {
        await getPrisma().manualBloodDonor.create({
          data: {
            name: row.name,
            mobile: phoneNumber.number,
            phone_country_code: resolvedCity.country_code,
            phone_dial_code: `+${phoneNumber.countryCallingCode}`,
            phone_local_number: phoneNumber.nationalNumber,
            blood_group: row.bloodGroup,
            location_city: row.city,
            location_country: resolvedCity.country,
            location_formatted: resolvedCity.formatted,
            location_lat: resolvedCity.lat,
            location_lng: resolvedCity.lon,
            place_id: resolvedCity.place_id,
            is_active_donor: true,
            verification_status: 'VERIFIED',
            source: 'Direct CSV Bulk Upload',
            added_by_admin: auth.session.user_id,
            health_data: { isBulkCsvEntry: true } as Prisma.InputJsonValue,
          }
        });
        createdCount++;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          failedCount++;
          failures.push({ row: row.originalRow, reason: 'Duplicate Number (Mobile already exists)' });
          continue;
        }
        failedCount++;
        failures.push({ row: row.originalRow, reason: 'Database insertion error' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        createdCount,
        failedCount,
        failures
      }
    });

  } catch (error: any) {
    console.error('[csv-upload][POST]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
