import { supabase } from '../../utils/supabase';

// 🔥 1. DYNAMIC PREMIUM SEO (Meta Tags)
export async function generateMetadata({ params }) {
    const { id } = params;

    try {
        const { data: product } = await supabase
            .from('products')
            .select('name, description, images, image')
            .eq('id', id)
            .single();

        if (!product) {
            return {
                title: 'Product Not Found | ShopHub.',
                description: 'Discover premium curated fashion at ShopHub.',
            };
        }

        const ogImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80';

        return {
            title: `${product.name} | ShopHub.`,
            description: product.description ? product.description.substring(0, 150) + '...' : 'Premium curated essential for your modern lifestyle.',
            openGraph: {
                title: `${product.name} | ShopHub.`,
                description: product.description ? product.description.substring(0, 150) + '...' : 'Shop this premium piece now.',
                images: [
                    {
                        url: ogImage,
                        width: 1200,
                        height: 630,
                        alt: product.name,
                    },
                ],
                type: 'website',
                siteName: 'ShopHub',
            },
            twitter: {
                card: 'summary_large_image',
                title: product.name,
                description: product.description ? product.description.substring(0, 100) + '...' : '',
                images: [ogImage],
            },
        };
    } catch (error) {
        return {
            title: 'ShopHub. | Premium Collection',
        };
    }
}

// 🔥 2. JSON-LD RICH SNIPPETS (Google Search Magic)
export default async function ProductLayout({ children, params }) {
    const { id } = params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shophub.com';

    // प्रोडक्ट का सारा डेटा सर्वर पर मंगाएं
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    // अगर प्रोडक्ट नहीं है, तो सिर्फ पेज दिखा दें
    if (!product) {
        return <>{children}</>;
    }

    // Google के लिए 'Structured Data' तैयार करें
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images?.[0] || product.image,
        description: product.description || `Buy ${product.name} at ShopHub.`,
        sku: product.sku || product.id,
        offers: {
            '@type': 'Offer',
            url: `${baseUrl}/product/${product.id}`,
            priceCurrency: 'INR', // अगर आप इंटरनेशनल कर रहे हैं तो इसे डायनामिक भी कर सकते हैं
            price: product.salePrice || product.price,
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
        },
    };

    //  अगर प्रोडक्ट पर रिव्यु (Reviews) हैं, तो स्टार रेटिंग (Star Rating) भी जोड़ें
    if (product.rating && product.reviews && product.reviews.length > 0) {
        jsonLd.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews.length,
        };
    }

    return (
        <>
            {/*  यह स्क्रिप्ट यूज़र को नहीं दिखेगी, सिर्फ Google के बॉट्स इसे पढ़ेंगे */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
