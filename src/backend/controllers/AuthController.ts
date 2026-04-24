import { NextResponse } from 'next/server';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { sendOtpEmail } from '../utils/mailer';
import { signToken } from '../utils/jwt';
import { verifyLocationProof } from '../utils/locationProof';
import { validateStructuredPhone } from '../utils/phone';
import { MAX_SERVICE_CITIES, buildLockedUntil } from '../services/ServiceCityService';
import { ensureNotRestricted, getFingerprintHash, getIpHash, recordRiskEvent } from '../utils/risk';
import { getPrisma } from '../config/db';
import { z } from 'zod';

const authService = new AuthService();
const userRepo = new UserRepository();

// Zod schemas for strict request validation
const RequestOtpSchema = z.object({
  email: z.string().email(),
  deviceFingerprint: z.string().min(6).max(512).optional(),
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  // Registration expansion fallback payload if the user doesn't already exist
  name: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  mobile: z.string().optional(),
  phone: z.object({
    country_name: z.string().min(1),
    country_code: z.string().length(2),
    dial_code: z.string().regex(/^\+\d+$/),
    local_phone_number: z.string().regex(/^\d+$/),
    full_phone_number: z.string().regex(/^\+\d+$/),
  }).optional(),
  bloodGroup: z.string().optional(),
  location: z.object({
    city: z.string().min(1),
    country: z.string().min(1),
    formatted_location: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    provider_place_id: z.string().min(1),
    token: z.string().min(1),
  }).optional(),
  locations: z.array(z.object({
    city: z.string().min(1),
    country: z.string().min(1),
    formatted_location: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    provider_place_id: z.string().min(1),
    token: z.string().min(1),
  })).max(MAX_SERVICE_CITIES).optional(),
  deviceFingerprint: z.string().min(6).max(512).optional(),
});

export class AuthController {
  
  /**
   * Request OTP Route Logic handler
   * Connects to POST /api/auth/otp/request
   */
  static async requestOtp(req: Request) {
    try {
      const body = await req.json();
      const parsed = RequestOtpSchema.safeParse(body);
      
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid email format provided' }, { status: 400 });
      }

      const { email, deviceFingerprint } = parsed.data;
      const fingerprintHash = getFingerprintHash(deviceFingerprint);
      const ipHash = getIpHash(req);

      const existingUser = await userRepo.findByEmail(email);
      const restricted = await ensureNotRestricted({
        userId: existingUser?.id,
        fingerprintHash,
        ipHash,
      });
      if (restricted.blocked) {
        await recordRiskEvent({
          eventType: 'RESTRICTED_AUTH_ATTEMPT',
          reason: 'Restricted identity attempted OTP request.',
          userId: existingUser?.id,
          fingerprintHash,
          ipHash,
          scoreDelta: 5,
        });
        return NextResponse.json({ error: 'This identity is restricted from authentication.' }, { status: 403 });
      }

      const otp = authService.generateOTP();
      
      await authService.storeOTP(email, otp);
      await recordRiskEvent({
        eventType: 'OTP_REQUEST',
        reason: 'OTP requested for authentication.',
        fingerprintHash,
        ipHash,
      });
      
      // Dispatch email
      const mailSent = await sendOtpEmail(email, otp);
      if (!mailSent) {
        return NextResponse.json({ error: 'Failed to dispatch email. Please check server configuration.' }, { status: 500 });
      }

      return NextResponse.json({ message: 'OTP dispatched successfully' }, { status: 200 });
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: 'Internal server error while requesting OTP' }, { status: 500 });
    }
  }

  /**
   * Verify OTP Route Logic handler
   * Connects to POST /api/auth/otp/verify
   */
  static async verifyOtp(req: Request) {
    try {
      const body = await req.json();
      const parsed = VerifyOtpSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
      }

      const { email, otp, name, dateOfBirth, mobile, phone, bloodGroup, location, locations, deviceFingerprint } = parsed.data;
      const fingerprintHash = getFingerprintHash(deviceFingerprint);
      const ipHash = getIpHash(req);

      const isValid = await authService.verifyOTP(email, otp);
      if (!isValid) {
        await recordRiskEvent({
          eventType: 'OTP_VERIFY_FAILED',
          reason: 'OTP verify failed or expired.',
          fingerprintHash,
          ipHash,
          scoreDelta: 2,
        });
        return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 401 });
      }

      // Check if user exists to fetch ID, otherwise create gracefully if full data is provided
      let targetUser = await userRepo.findByEmail(email);

      const identityBlocked = await ensureNotRestricted({
        userId: targetUser?.id,
        fingerprintHash,
        ipHash,
      });
      if (identityBlocked.blocked) {
        await recordRiskEvent({
          eventType: 'RESTRICTED_AUTH_ATTEMPT',
          reason: 'Restricted identity attempted OTP verify.',
          userId: targetUser?.id,
          fingerprintHash,
          ipHash,
          scoreDelta: 5,
        });
        return NextResponse.json({ error: 'This account or identity is restricted.' }, { status: 403 });
      }

      if (!targetUser) {
        const phoneValidation = phone ? validateStructuredPhone(phone) : null;
        if (phone && !phoneValidation?.ok) {
          return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
        }
        const normalizedMobile = phoneValidation?.ok
          ? phoneValidation.normalized.full_phone_number
          : mobile;

        // Complete registration if payload contains everything
        const submittedLocations = locations?.length ? locations : (location ? [location] : []);
        if (!name || !dateOfBirth || !normalizedMobile || !bloodGroup || submittedLocations.length === 0) {
          return NextResponse.json({ 
            error: 'User does not exist. Full registration payload required to continue.' 
          }, { status: 404 }); // 404 triggers FE to send full register payload instead of just login
        }

        if (submittedLocations.length > MAX_SERVICE_CITIES) {
          return NextResponse.json({ error: `Maximum ${MAX_SERVICE_CITIES} cities allowed.` }, { status: 400 });
        }

        const validatedLocations = submittedLocations.map((item) => {
          const locationProof = verifyLocationProof(item.token);
          if (!locationProof) {
            return { ok: false as const, error: 'Invalid location proof token. Please reselect your city.' };
          }

          const matches =
            locationProof.city === item.city &&
            locationProof.country === item.country &&
            locationProof.formatted_location === item.formatted_location &&
            locationProof.latitude === item.latitude &&
            locationProof.longitude === item.longitude &&
            locationProof.provider_place_id === item.provider_place_id;

          if (!matches) {
            return { ok: false as const, error: 'Location payload mismatch. Please select from suggestions only.' };
          }

          return { ok: true as const, data: item };
        });

        const invalid = validatedLocations.find((item) => !item.ok);
        if (invalid && !invalid.ok) {
          return NextResponse.json({ error: invalid.error }, { status: 400 });
        }

        const readyLocations = validatedLocations
          .filter((item): item is { ok: true; data: z.infer<typeof VerifyOtpSchema>['locations'][number] } => item.ok)
          .map((item) => item.data);

        if (fingerprintHash) {
          const device = await getPrisma().deviceFingerprint.findUnique({
            where: { fingerprint_hash: fingerprintHash },
          });
          if ((device?.signup_count ?? 0) >= 4) {
            await recordRiskEvent({
              eventType: 'ACCOUNT_CREATION_LIMIT_HIT',
              reason: 'Signup attempted above device threshold.',
              fingerprintHash,
              ipHash,
              scoreDelta: 15,
            });
          }
        }

        const firstLocation = readyLocations[0];
        targetUser = await getPrisma().$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              name,
              email,
              mobile: normalizedMobile,
              date_of_birth: new Date(dateOfBirth),
              ...(phoneValidation?.ok && {
                phone_country_name: phoneValidation.normalized.country_name,
                phone_country_code: phoneValidation.normalized.country_code,
                phone_dial_code: phoneValidation.normalized.dial_code,
                phone_local_number: phoneValidation.normalized.local_phone_number,
              }),
              blood_group: bloodGroup,
              location_city: firstLocation.city,
              location_country: firstLocation.country,
              location_formatted: firstLocation.formatted_location,
              location_lat: firstLocation.latitude,
              location_lng: firstLocation.longitude,
              place_id: firstLocation.provider_place_id,
              health_data: {
                location_formatted: firstLocation.formatted_location,
                location_provider: 'geoapify',
                service_city_count: readyLocations.length,
                ...(phoneValidation?.ok && {
                  phone: {
                    country_name: phoneValidation.normalized.country_name,
                    country_code: phoneValidation.normalized.country_code,
                    dial_code: phoneValidation.normalized.dial_code,
                    local_phone_number: phoneValidation.normalized.local_phone_number,
                    full_phone_number: phoneValidation.normalized.full_phone_number,
                  },
                }),
              },
            },
          });

          await tx.userServiceCity.createMany({
            data: readyLocations.map((item) => ({
              user_id: created.id,
              city: item.city,
              country: item.country,
              formatted_location: item.formatted_location,
              lat: item.latitude,
              lng: item.longitude,
              provider_place_id: item.provider_place_id,
              locked_until: buildLockedUntil(),
            })),
            skipDuplicates: true,
          });

          if (fingerprintHash) {
            await tx.deviceFingerprint.upsert({
              where: { fingerprint_hash: fingerprintHash },
              update: {
                last_seen_at: new Date(),
                signup_count: { increment: 1 },
              },
              create: {
                fingerprint_hash: fingerprintHash,
                signup_count: 1,
                last_seen_at: new Date(),
              },
            });
          }

          await tx.networkFingerprint.upsert({
            where: { ip_hash: ipHash },
            update: {
              last_seen_at: new Date(),
            },
            create: {
              ip_hash: ipHash,
              last_seen_at: new Date(),
            },
          });

          return created;
        });

        await recordRiskEvent({
          eventType: 'ACCOUNT_CREATED',
          reason: 'New account created via OTP verification.',
          userId: targetUser.id,
          fingerprintHash,
          ipHash,
          scoreDelta: 0,
        });
      }

      // Mint Custom JWT Token
      const token = signToken({ user_id: targetUser.id, role: 'USER' });

      // Build strictly secure HTTP-only response payload
      const response = NextResponse.json({ 
        message: 'Authentication successful',
        user: { id: targetUser.id, name: targetUser.name, email: targetUser.email, role: 'USER' }
      }, { status: 200 });

      // Append cookie headers natively
      // Secure logic evaluates string correctly. Exp in 7 days matching JWT.
      response.cookies.set({
        name: 'bloodnet_session',
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
      });

      // OTP should be consumed only after full auth process succeeds
      await authService.invalidateOTP(email);

      return response;
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: 'Internal server error while verifying OTP' }, { status: 500 });
    }
  }

  /**
   * Immediate logout capability dumping session cookies
   * Connects to POST /api/auth/logout
   */
  static async logout() {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    response.cookies.delete('bloodnet_session');
    return response;
  }
}
