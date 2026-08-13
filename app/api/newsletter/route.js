export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 🔥 Added Node.js runtime for Vercel consistency

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js'; // 🔥 Supabase client added for database saving

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req) {
    try {
        const { email } = await req.json();

        // 🔥 STEP 1: SAVE SUBSCRIBER TO DATABASE
        // नोट: अगर आपके डेटाबेस में टेबल का नाम 'subscribers' है, तो 'newsletter_subscribers' की जगह वो लिख दें।
        const { error: dbError } = await supabase.from('newsletter_subscribers').insert([{
            email: email,
            status: 'active',
            created_at: new Date().toISOString()
        }]);

        if (dbError) {
            console.error("Supabase Save Error:", dbError);
            // अगर कोई पहले से सब्सक्राइब कर चुका है (Duplicate Email), तो भी हम ईमेल सेंड होने देंगे।
        }

        // 🔥 STEP 2: SEND PREMIUM EMAIL NOTIFICATION
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
            to: process.env.EMAIL_USER, // Admin Email (You)
            replyTo: email,
            subject: `New Newsletter Subscriber! 🎉`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <div style="background-color: #1c1917; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">ShopHub<span style="color: #a8a29e;">.</span></h1>
                        <p style="color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 12px; margin-bottom: 0; font-weight: bold;">New Subscriber Alert</p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 40px 30px; color: #44403c; text-align: center;">
                        <h2 style="margin-top: 0; font-size: 22px; font-weight: 300; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">We Have a New Subscriber! 🎉</h2>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin-top: 20px;">Great news! Someone just joined the ShopHub exclusive newsletter list. You can now send them future updates and collections.</p>
                        
                        <div style="background-color: #fafaf9; padding: 25px; border-radius: 12px; margin-top: 30px; border: 1px solid #f5f5f4;">
                            <p style="color: #a8a29e; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px; margin-top: 0;">Subscriber Email</p>
                            <a href="mailto:${email}" style="font-size: 18px; font-weight: bold; color: #1c1917; text-decoration: none;">${email}</a>
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
        return NextResponse.json({ success: true, message: 'Subscribed successfully!' });

    } catch (error) {
        console.error("Newsletter Email Error:", error);
        return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }
}
