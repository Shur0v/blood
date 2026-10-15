import { getPrisma } from '../config/db';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { securityDigest } from '../utils/security';

const protectedOtp=(email:string,otp:string)=>`hmac-sha256:${securityDigest(`otp:${email}:${otp}`)}`;

export class AuthService {
  /**
   * Generates a secure numeric 6-digit OTP
   */
  public generateOTP(): string {
    return randomInt(100000,1000000).toString();
  }

  /**
   * Stores the OTP for a target email for 10 minutes in DB.
   * @param email Target user email
   * @param otp 6-digit string
   */
  public async storeOTP(email: string, otp: string) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await getPrisma().otpVerification.upsert({
      where: { email },
      update: { code: protectedOtp(email,otp), expires_at: expiresAt },
      create: { email, code: protectedOtp(email,otp), expires_at: expiresAt },
    });
  }

  /**
   * Verifies an OTP request
   * @returns boolean Validation success
   */
  public async verifyOTP(email: string, otp: string): Promise<boolean> {
    const record = await getPrisma().otpVerification.findUnique({
      where: { email },
    });

    if (!record) return false;

    if (Date.now() > new Date(record.expires_at).getTime()) {
      await this.invalidateOTP(email);
      return false; // Expired
    }

    const candidate=record.code.startsWith('hmac-sha256:')?protectedOtp(email,otp):otp;
    if (record.code.length === candidate.length && timingSafeEqual(Buffer.from(record.code),Buffer.from(candidate))) {
      return true;
    }

    return false;
  }

  /**
   * Explicitly invalidates an OTP after full auth flow succeeds
   */
  public async invalidateOTP(email: string) {
    await getPrisma().otpVerification.deleteMany({
      where: { email },
    });
  }

  public async consumeOTP(email:string,otp:string):Promise<boolean> {
    const result=await getPrisma().otpVerification.deleteMany({where:{email,expires_at:{gt:new Date()},code:{in:[otp,protectedOtp(email,otp)]}}});
    return result.count===1;
  }
}
