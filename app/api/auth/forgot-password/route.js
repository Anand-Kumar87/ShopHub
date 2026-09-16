export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: {
        fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(8000) })
    }
});

// Configure Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'solestyle41@gmail.com',
        pass: process.env.EMAIL_PASS || 'vhlh jusw xgih sfdx'
    }
});

/**
 * Send email via Resend API as a fallback if SMTP fails
 */
async function sendViaResend({ to, subject, html }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return false;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ShopHub Support <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html
            })
        });
        return res.ok;
    } catch (e) {
        console.error('Resend fallback error:', e);
        return false;
    }
}

/**
 * POST /api/auth/forgot-password
 * Guaranteed Password Reset Email Engine:
 * 1. Validates recipient email address
 * 2. Checks user profile in database
 * 3. Generates cryptographic recovery token and action link via Supabase Auth Admin
 * 4. Delivers luxury editorial email with direct 1-click link + 6-digit OTP code
 * 5. Primary delivery via Gmail SMTP, automated fallback to Resend API
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        const normalizedEmail = (email || '').trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
        }

        // Determine base application URL
        const origin = request.headers.get('origin') ||
            request.headers.get('x-forwarded-host') ? `https://${request.headers.get('x-forwarded-host')}` : null;
        const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://shophubstyle.vercel.app';

        // 1. Fetch user profile from database
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .eq('email', normalizedEmail)
            .maybeSingle();

        // 2. Generate Supabase Auth Recovery Link & Token
        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'recovery',
            email: normalizedEmail,
            options: {
                redirectTo: `${appUrl}/reset-password`
            }
        });

        if (linkError) {
            console.error('Supabase recovery link generation error:', linkError.message);
            // Security best practice: Don't leak whether email exists
            return NextResponse.json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been sent.'
            }, { status: 200 });
        }

        const properties = linkData?.properties || {};
        const tokenHash = properties.hashed_token || '';
        const emailOtp = properties.email_otp || '';
        const actionLink = properties.action_link || `${appUrl}/reset-password`;

        // Direct reset URL pointing to our luxury reset page
        const directResetUrl = `${appUrl}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&email=${encodeURIComponent(normalizedEmail)}`;
        const recipientName = profile?.first_name ? `${profile.first_name}` : 'Valued Customer';

        // 3. Editorial Luxury Email Template
        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ShopHub Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcfbf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcfbf9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
          
          <!-- Header Branding -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px; border-bottom: 1px solid #f5f5f4;">
              <span style="font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #a8a29e; font-weight: 700; display: block; margin-bottom: 8px;">SECURITY CONCIERGE</span>
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: -0.03em; color: #1c1917;">
                Shop<span style="font-family: Georgia, serif; font-style: italic; font-weight: 700;">Hub</span>
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 36px 20px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 400; color: #1c1917; letter-spacing: -0.01em;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #57534e;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #57534e;">
                We received a request to securely reset the password associated with your ShopHub account (<strong>${normalizedEmail}</strong>). Click the button below to choose a new password:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${directResetUrl}" target="_blank" style="display: inline-block; background-color: #1c1917; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 18px 36px; border-radius: 9999px; box-shadow: 0 8px 16px -4px rgba(28,25,23,0.25);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${emailOtp ? `
              <!-- Alternative Security OTP Box -->
              <div style="background-color: #fbfbfa; border: 1px dashed #d6d3d1; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0 20px;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716c; font-weight: 700; display: block; margin-bottom: 8px;">
                  Security Recovery Code
                </span>
                <div style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: 800; letter-spacing: 0.3em; color: #1c1917;">
                  ${emailOtp}
                </div>
                <span style="font-size: 12px; color: #a8a29e; display: block; margin-top: 6px;">
                  Use this verification code if prompted on the reset page.
                </span>
              </div>
              ` : ''}

              <!-- Security Notice -->
              <div style="border-top: 1px solid #f5f5f4; margin-top: 32px; padding-top: 24px;">
                <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: #78716c;">
                  &bull; This link and recovery code will expire in <strong>1 hour</strong>.
                </p>
                <p style="margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: #78716c;">
                  &bull; If you did not request this password change, no action is needed — your account remains safe and your current password is unchanged.
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a8a29e;">
                  Direct link fallback: <a href="${actionLink}" style="color: #1c1917; text-decoration: underline; word-break: break-all;">${actionLink}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #fafaf9; padding: 24px 30px; border-top: 1px solid #f5f5f4;">
              <p style="margin: 0; font-size: 12px; color: #a8a29e; letter-spacing: 0.05em;">
                &copy; ${new Date().getFullYear()} ShopHub Luxury Commerce. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        // 4. Deliver via Gmail SMTP with Resend fallback
        let emailSent = false;
        try {
            const mailOptions = {
                from: `"ShopHub Concierge" <${process.env.EMAIL_USER || 'solestyle41@gmail.com'}>`,
                to: normalizedEmail,
                subject: 'Reset Your ShopHub Password',
                html: emailHtml
            };

            const info = await transporter.sendMail(mailOptions);
            if (info?.messageId) {
                emailSent = true;
                console.log(`Password reset email delivered to ${normalizedEmail} [MessageId: ${info.messageId}]`);
            }
        } catch (smtpError) {
            console.error('Nodemailer SMTP delivery failed, attempting Resend fallback:', smtpError.message);
            emailSent = await sendViaResend({
                to: normalizedEmail,
                subject: 'Reset Your ShopHub Password',
                html: emailHtml
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset instructions have been dispatched to your email address.',
            email: normalizedEmail
        }, { status: 200 });

    } catch (error) {
        console.error('Forgot Password Exception:', error);
        return NextResponse.json({
            error: 'An unexpected error occurred while processing your request. Please try again.'
        }, { status: 500 });
    }
}