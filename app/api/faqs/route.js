import { NextResponse } from 'next/server';

export async function GET() {
    const faqs = [
        {
            id: 1,
            question: "What is your return policy?",
            answer: "We offer a 30-day money-back guarantee. If you are not satisfied, return the item within 30 days for a full refund."
        },
        {
            id: 2,
            question: "How long does shipping take?",
            answer: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days."
        },
        {
            id: 3,
            question: "Do you ship internationally?",
            answer: "Yes, we ship to over 100 countries worldwide. Shipping costs apply."
        },
        {
            id: 4,
            question: "How can I track my order?",
            answer: "Once your order ships, you will receive an email with a tracking number. You can also view your order status in your Account Dashboard."
        }
    ];

    // Notice: Humne yahan "export async function GET" use kiya hai, "export default" nahi.
    return NextResponse.json(faqs, { status: 200 });
}