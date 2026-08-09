export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function POST(request) {
    // 🔥 SOLUTION: PrismaClient ko function ke ANDAR likha hai
    // Taaki Vercel isko build ke time par run karke error na de!
    const prisma = new PrismaClient();

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Security best practice: Always return same message even if user not found
        // so attackers can't guess registered emails.
        if (!user) {
            await prisma.$disconnect();
            return NextResponse.json({ message: 'If an account exists, a reset email has been sent.' }, { status: 200 });
        }

        // 2. Generate Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 Hour from now

        // 3. Save Token to Database
        await prisma.user.update({
            where: { email: user.email },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: tokenExpiry
            }
        });

        // 4. Create Reset URL (Frontend page where user types new password)
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // 5. Send Email
        const mailOptions = {
            from: `"ShopHub Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request - ShopHub',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1f2937; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">ShopHub</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563; line-height: 1.6;">Hello ${user.name},</p>
            <p style="color: #4b5563; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password. This link is valid for 1 hour.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
            </p>
          </div>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);

        // Disconnect connection gracefully
        await prisma.$disconnect();

        return NextResponse.json({ message: 'If an account exists, a reset email has been sent.' }, { status: 200 });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
    }
}
