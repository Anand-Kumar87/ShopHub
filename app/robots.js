export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-hub-umber.vercel.app'; // अपनी साइट का डोमेन डालें

    return {
        rules: {
            userAgent: '*', // दुनिया के हर सर्च इंजन (Google, Bing, Yahoo) के लिए
            allow: '/', // पूरी वेबसाइट को स्कैन करने की इजाज़त है
            disallow: [
                '/admin',        // एडमिन पैनल Google पर नहीं आना चाहिए
                '/account',      // यूज़र का प्राइवेट पेज
                '/checkout',     // पेमेंट वाला पेज
                '/api/',         // बैकएंड API के लिंक्स
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`, // Google को साइटमैप का पता बता रहे हैं
    };
}
