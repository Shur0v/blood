import { UserRepository } from '../repositories/UserRepository';

// This abstracts OTP state into memory temporarily.
// In production, this should ideally be Redis or a Database VerificationToken model.
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Generates a secure numeric 6-digit OTP
   */
  public generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Stores the OTP for a target email temporarily for 10 minutes
   * @param email Target user email
   * @param otp 6-digit string
   */
  public storeOTP(email: string, otp: string) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email, { code: otp, expiresAt });
  }

  /**
   * Verifies an OTP request
   * @returns boolean Validation success
   */
  public verifyOTP(email: string, otp: string): boolean {
    const record = otpStore.get(email);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return false; // Expired
    }

    if (record.code === otp) {
      otpStore.delete(email); // Invalidate once used
      return true;
    }

    return false;
  }
}
