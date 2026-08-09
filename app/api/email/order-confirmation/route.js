export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    try {
        const order = await req.json();

        // 1. फाइनल टोटल को सेट करना
        const displayTotal = order.formatted_total || `₹${Number(order.total_amount).toFixed(2)}`;

        // 🔥 2. स्मार्ट कनवर्ज़न लॉजिक (ताकि Subtotal, Tax आदि सही करेंसी में दिखें)
        let rate = 1;
        let currencySymbol = order.currency || '₹';

        if (order.formatted_total && order.total_amount && order.total_amount > 0) {
            // "INR 8,999.00" में से सिर्फ नंबर (8999.00) निकालकर एक्सचेंज रेट पता करना
            const numericFormatted = Number(order.formatted_total.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(numericFormatted)) {
                rate = numericFormatted / order.total_amount;
            }
            // सिंबल (INR/₹/$) को अलग करना
            currencySymbol = order.formatted_total.replace(/[0-9.,]/g, '').trim();
        }

        // 🔥 3. आइटम्स को लूप करके HTML टेबल में बदलना (सही प्राइस के साथ)
        const itemsHtml = order.items && order.items.length > 0
            ? order.items.map(item => `
            <tr>
                <td style="padding: 15px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-weight: bold; font-size: 14px; color: #1c1917;">${item.name}</p>
                    <p style="margin: 4px 0 0; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 1px;">
                        Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ''} ${item.color ? `| Color: ${item.color}` : ''}
                    </p>
                </td>
                <td style="padding: 15px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: bold; color: #1c1917;">
                    ${currencySymbol} ${((item.salePrice || item.price) * item.quantity * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
            </tr>
        `).join('')
            : '<tr><td colspan="2">No items found</td></tr>';

        // 4. Premium Luxury HTML Template
        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fafaf9; padding: 40px 20px;">
                <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    
                    <h1 style="text-align: center; margin: 0 0 5px; font-size: 28px; font-weight: 300; letter-spacing: -1px; color: #1c1917;">
                        Shop<span style="font-weight: bold; font-style: italic;">Hub</span>
                    </h1>
                    <p style="text-align: center; color: #a8a29e; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px;">Tax Invoice & Confirmation</p>
                    
                    <h2 style="font-size: 18px; font-weight: normal; color: #1c1917; margin-bottom: 10px;">Hello ${order.shipping?.firstName || order.customerName || 'Customer'},</h2>
                    <p style="color: #57534e; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                        Thank you for shopping with ShopHub. We've securely received your order and our artisans are getting it ready for shipment.
                    </p>

                    <div style="background-color: #f5f5f4; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between;">
                        <div>
                            <p style="margin: 0; font-size: 10px; color: #78716c; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                            <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #1c1917; font-style: italic;">${order.orderNumber}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-size: 10px; color: #78716c; text-transform: uppercase; letter-spacing: 1px;">Order Date</p>
                            <p style="margin: 5px 0 0; font-size: 14px; font-weight: bold; color: #1c1917;">${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #1c1917; border-bottom: 2px solid #1c1917; padding-bottom: 10px; margin-bottom: 0;">Order Summary</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        ${itemsHtml}
                    </table>

                    <table style="width: 100%; font-size: 14px; color: #57534e;">
                        <tr>
                            <td style="padding: 5px 0;">Subtotal</td>
                            <td style="text-align: right;">${currencySymbol} ${(order.totals?.subtotal * rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ${order.totals?.discount > 0 ? `
                        <tr>
                            <td style="padding: 5px 0; color: #16a34a;">Discount Applied</td>
                            <td style="text-align: right; color: #16a34a;">-${currencySymbol} ${(order.totals.discount * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>` : ''}
                        <tr>
                            <td style="padding: 5px 0;">Shipping</td>
                            <td style="text-align: right;">${order.totals?.shipping === 0 ? 'Complimentary' : `${currencySymbol} ${(order.totals?.shipping * rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;">Estimated Tax</td>
                            <td style="text-align: right;">${currencySymbol} ${(order.totals?.tax * rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 0 0; font-weight: bold; font-size: 18px; color: #1c1917; border-top: 1px solid #e5e5e5; margin-top: 15px;">Total Paid</td>
                            <td style="padding: 20px 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #1c1917; border-top: 1px solid #e5e5e5; margin-top: 15px;">
                                ${displayTotal}
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e5e5e5; padding-top: 30px;">
                        <p style="font-size: 14px; color: #57534e;">We will notify you once your order is dispatched.</p>
                        <p style="font-size: 12px; color: #a8a29e; margin-bottom: 5px;">This is a computer generated tax invoice.</p>
                        <p style="font-size: 12px; color: #a8a29e; margin-top: 0;">If you have any questions, please contact our concierge at <a href="mailto:solestyle41@gmail.com" style="color: #1c1917; text-decoration: underline;">solestyle41@gmail.com</a></p>
                    </div>
                </div>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'ShopHub <onboarding@resend.dev>',
            to: order.email,
            subject: `ShopHub Order Confirmed & Invoice: ${order.orderNumber}`,
            html: emailHtml
        });

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Email API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}