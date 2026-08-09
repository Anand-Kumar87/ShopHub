export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';


export async function POST(req) {
    try {
        const { firstName, lastName, email, phone, subject, message } = await req.json();

        // Nodemailer Transporter Setup (Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email Options
        const mailOptions = {
            from: '"ShopHub" <' + process.env.EMAIL_USER + '>',  // भेजने वाला (आपकी वेबसाइट)
            to: process.env.EMAIL_USER, // प्राप्त करने वाला (आप खुद)
            replyTo: email, // अगर आप रिप्लाई करेंगे तो सीधा कस्टमर को जाएगा
            subject: `New Contact Inquiry: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #1c1917; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 10px;">
                    <h2 style="font-weight: 300;">New Contact Submission</h2>
                    <p>You have received a new message from the ShopHub Contact Form.</p>
                    <div style="background-color: #fafaf9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <p><strong>Message:</strong></p>
                        <p style="background-color: #f5f5f4; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: 'Message sent successfully!' });

    } catch (error) {
        console.error("Contact Email Error:", error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}