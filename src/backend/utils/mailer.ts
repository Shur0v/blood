import nodemailer from 'nodemailer';

/**
 * Mailer Transporter instance using generic SMTP/Nodemailer Setup.
 * Expected data: Environment variables for SMTP hosts and credentials.
 * Future extension: Can be swapped with Resend/SendGrid APIs if needed without changing signature.
 */
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Dispatches an OTP code to a specified email address.
 * @param toEmail - Target user email
 * @param otp - 6 digit generated code
 */
export const sendOtpEmail = async (toEmail: string, otp: string) => {
  try {
    await transporter.sendMail({
      from: `"BloodNet Admin" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'BloodNet Login Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FF3131;">Verify your login</h2>
          <p>Your one-time verification code is:</p>
          <div style="background-color: #fce8e8; color: #FF3131; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; letter-spacing: 5px; border-radius: 8px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; font-size: 14px; text-align: center; color: #777;">Code expires in 10 minutes.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
};
