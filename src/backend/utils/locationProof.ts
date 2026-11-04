import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const RegistrationAreaSchema = z.object({ name: z.string().trim().min(1).max(120), placeId: z.string().min(1).max(256) }).strict();
export type RegistrationArea = z.infer<typeof RegistrationAreaSchema>;

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters long.');
  }
  return secret;
};

export interface LocationSelectionPayload {
  city: string;
  country: string;
  formatted_location: string;
  latitude: number;
  longitude: number;
  provider_place_id: string;
  registrationArea?: RegistrationArea;
}

interface LocationProofTokenPayload extends LocationSelectionPayload {
  type: 'location_proof';
}

export const signLocationProof = (payload: LocationSelectionPayload): string => {
  return jwt.sign(
    {
      type: 'location_proof',
      ...payload,
    } satisfies LocationProofTokenPayload,
    getSecret(),
    { expiresIn: '10m' },
  );
};

export const verifyLocationProof = (token: string): LocationProofTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getSecret()) as Partial<LocationProofTokenPayload>;
    if (decoded.type !== 'location_proof') {
      return null;
    }
    if (!decoded.city || !decoded.country || !decoded.formatted_location || !decoded.provider_place_id) {
      return null;
    }
    if (typeof decoded.latitude !== 'number' || typeof decoded.longitude !== 'number') {
      return null;
    }

    if (decoded.registrationArea !== undefined && !RegistrationAreaSchema.safeParse(decoded.registrationArea).success) return null;
    return decoded as LocationProofTokenPayload;
  } catch (error) {
    return null;
  }
};
