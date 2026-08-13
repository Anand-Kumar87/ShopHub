export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js'; // 🔥 Supabase client added for database saving

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key if available (for backend), otherwise Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
    try {
        const { firstName, lastName, email, phone, subject, message } = await req.json();
        
        const senderName = `${firstName} ${lastName}`.trim();

        // 🔥 STEP 1: SAVE INQUIRY TO DATABASE FOR ADMIN PANEL
        const { error: dbError } = await supabase.from('inquiries').insert([{
            sender: senderName,
            email: email,
            phone: phone || '',
            subject: subject,
            message: message,
            status: 'unread',
            created_at: new Date().toISOString(),
            date: new Date().toISOString()
        }]);

        if (dbError) {
            console.error("Supabase Save Error:", dbError);
            // We log the error but still try to send the email so you don't miss the message
        }

        // 🔥 STEP 2: SEND PREMIUM EMAIL NOTIFICATION
        // Nodemailer Transporter Setup (Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Premium HTML Email Template
        const mailOptions = {
            from: '"ShopHub Portal" <' + process.env.EMAIL_USER + '>',
            to: process.env.EMAIL_USER, 
            replyTo: email, 
            subject: `New Client Inquiry: ${subject}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <div style="background-color: #1c1917; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">ShopHub<span style="color: #a8a29e;">.</span></h1>
                        <p style="color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 12px; margin-bottom: 0; font-weight: bold;">Client Inquiry Alert</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 40px 30px; color: #44403c;">
                        <h2 style="margin-top: 0; font-size: 22px; font-weight: 300; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">New Message Received</h2>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; width: 35%; color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Client Name</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; font-weight: bold; color: #1c1917; font-size: 14px;">${senderName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Email Address</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Phone</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; color: #1c1917; font-size: 14px;">${phone || '<span style="color: #a8a29e; font-style: italic;">Not provided</span>'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Subject</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; font-weight: bold; color: #1c1917; font-size: 14px;">${subject}</td>
                            </tr>
                        </table>

                        <div style="margin-top: 35px;">
                            <p style="color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 12px;">Message Details</p>
                            <div style="background-color: #fafaf9; padding: 25px; border-radius: 12px; font-size: 14px; line-height: 1.8; color: #1c1917; white-space: pre-wrap; border: 1px solid #f5f5f4;">${message}</div>
                        </div>

                        <!-- Action Button -->
                        <div style="text-align: center; margin-top: 45px;">
                            <a href="mailto:${email}?subject=RE: ${subject}" style="background-color: #1c1917; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">Reply to Client</a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #fafaf9; padding: 25px; text-align: center; border-top: 1px solid #e7e5e4;">
                        <p style="color: #a8a29e; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">This is an automated concierge notification from ShopHub.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return NextResponse.json({ success: true, message: 'Message sent successfully!' });

    } catch (error) {
        console.error("Contact API Error:", error);
        return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
    }
}
