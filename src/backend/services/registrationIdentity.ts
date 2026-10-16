import { findLoginUser } from './loginEmails';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../config/db';
import { MedicalError } from '../utils/medicalPrivacy';

type IdentityDatabase = Pick<Prisma.TransactionClient, 'user' | 'userLoginEmail' | '$queryRaw'>;

export class RegistrationConflict extends MedicalError {
  constructor(public field: 'email' | 'phone') {
    super(field === 'email'
      ? 'This email address is already registered. Please log in instead, or use a different email address.'
      : 'This phone number is already linked to an account. Please log in with your registered email address, or use a different phone number.', 409);
  }
  get code() { return this.field === 'email' ? 'EMAIL_ALREADY_REGISTERED' : 'PHONE_ALREADY_REGISTERED'; }
}

function phoneDigits(mobile: string) {
  return /^[+\d\s().-]+$/.test(mobile) ? mobile.replace(/\D/g, '').replace(/^00/, '') : '';
}

export async function assertRegistrationAvailable(email: string, mobile?: string, db: IdentityDatabase = getPrisma()) {
  if (await findLoginUser(email,db)) {
    throw new RegistrationConflict('email');
  }
  if (!mobile) return;
  if (await db.user.findUnique({ where: { mobile }, select: { id: true } })) throw new RegistrationConflict('phone');
  const digits = phoneDigits(mobile);
  if (!digits) return;
  // Existing accounts can contain spaces, punctuation or an international 00 prefix.
  // Compare complete international numbers; local numbers from different countries must not collide.
  const matching = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "User"
    WHERE (mobile ~ '^[+0-9[:space:]().-]+$'
      AND regexp_replace(regexp_replace(mobile, '[^0-9]', '', 'g'), '^00', '') = ${digits})
      OR (phone_dial_code IS NOT NULL AND phone_local_number IS NOT NULL
        AND regexp_replace(phone_dial_code || phone_local_number, '[^0-9]', '', 'g') = ${digits})
    LIMIT 1
  `;
  if (matching.length) throw new RegistrationConflict('phone');
}

export async function lockRegistrationIdentity(tx: Prisma.TransactionClient, email: string, mobile: string) {
  // Serialize registrations for the same identity across workers, including email case variants.
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`registration-email:${email.trim().toLowerCase()}`}, 0))`;
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`registration-phone:${phoneDigits(mobile) || mobile}`}, 0))`;
  await assertRegistrationAvailable(email, mobile, tx);
}
