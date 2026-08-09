export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const { email } = await req.json();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: '"ShopHub" <' + process.env.EMAIL_USER + '>',
            to: process.env.EMAIL_USER, // Admin Email
            subject: `New Newsletter Subscriber! 🎉`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New Subscriber</h2>
                    <p>Good news! Someone just subscribed to the ShopHub Newsletter.</p>
                    <p><strong>Email Address:</strong> ${email}</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: 'Subscribed successfully!' });

    } catch (error) {
        console.error("Newsletter Email Error:", error);
        return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }
}
