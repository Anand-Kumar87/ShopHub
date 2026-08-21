import { supabase } from './utils/supabase'; // अपने supabase फाइल का सही पाथ दें

export default async function sitemap() {
    // अपनी वेबसाइट का असली डोमेन यहाँ डालें (जैसे https://shop-hub-umber.vercel.app)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shophubstyle.vercel.app';

    // 1. डेटाबेस से सिर्फ 'Active' प्रोडक्ट्स मंगवाएं
    const { data: products } = await supabase
        .from('products')
        .select('id, created_at')
        .eq('status', 'active');

    // 2. हर प्रोडक्ट का डायनामिक URL जनरेट करें
    const productUrls = (products || []).map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: product.created_at || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8, // प्रोडक्ट्स की प्रायोरिटी अच्छी होती है
    }));

    // 3. वेबसाइट के स्टेटिक (Main) पेजेज़ के URL
    const staticUrls = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0, // होमपेज सबसे ज़रूरी
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9, // शॉप पेज
        },
        {
            url: `${baseUrl}/contact`, // अगर आपका कांटेक्ट पेज है
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        }
    ];

    // 4. दोनों को मिलाकर Google को भेज दें
    return [...staticUrls, ...productUrls];
}
