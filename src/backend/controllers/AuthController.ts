import { NextResponse } from 'next/server';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { sendOtpEmail } from '../utils/mailer';
import { signToken } from '../utils/jwt';
import { z } from 'zod';

const authService = new AuthService();
const userRepo = new UserRepository();

// Zod schemas for strict request validation
const RequestOtpSchema = z.object({
  email: z.string().email(),
});

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  // Registration expansion fallback payload if the user doesn't already exist
  name: z.string().optional(),
  mobile: z.string().optional(),
  bloodGroup: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
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

      const { email } = parsed.data;
      const otp = authService.generateOTP();
      
      authService.storeOTP(email, otp);
      
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

      const { email, otp, name, mobile, bloodGroup, city, country, lat, lng } = parsed.data;

      const isValid = authService.verifyOTP(email, otp);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 401 });
      }

      // Check if user exists to fetch ID, otherwise create gracefully if full data is provided
      let targetUser = await userRepo.findByEmail(email);

      if (!targetUser) {
        // Complete registration if payload contains everything
        if (!name || !mobile || !bloodGroup || !city || !country || lat === undefined || lng === undefined) {
          return NextResponse.json({ 
            error: 'User does not exist. Full registration payload required to continue.' 
          }, { status: 404 }); // 404 triggers FE to send full register payload instead of just login
        }
        
        targetUser = await userRepo.createUser({
          name,
          email,
          mobile,
          blood_group: bloodGroup,
          location_city: city,
          location_country: country,
          location_lat: lat,
          location_lng: lng,
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
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

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
