import { getPrisma } from '../config/db';

export class AuthService {
  /**
   * Generates a secure numeric 6-digit OTP
   */
  public generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
      update: { code: otp, expires_at: expiresAt },
      create: { email, code: otp, expires_at: expiresAt },
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

    if (record.code === otp) {
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
}
