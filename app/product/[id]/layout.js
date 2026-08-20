import { supabase } from '../../utils/supabase';

// 🔥 Next.js को सख्त निर्देश: कुछ भी सेव (Cache) मत करो, हमेशा लाइव डेटा लाओ!
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// 🔥 1. DYNAMIC PREMIUM SEO (Meta Tags)
export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) return { title: 'ShopHub | Premium Collection' };

    try {
        // वापस से आपके भरोसेमंद Supabase Client का इस्तेमाल
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return {
                title: 'ShopHub | Premium Collection',
            };
        }

        const ogImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80';

        return {
            title: `${product.name} | ShopHub.`,
            description: product.description ? product.description.substring(0, 150) + '...' : 'Premium curated essential for your modern lifestyle.',
            openGraph: {
                title: `${product.name} | ShopHub.`,
                description: product.description ? product.description.substring(0, 150) + '...' : 'Shop this premium piece now.',
                images: [{ url: ogImage }],
                type: 'website',
                siteName: 'ShopHub',
            },
            twitter: {
                card: 'summary_large_image',
                title: product.name,
                images: [ogImage],
            },
        };
    } catch (error) {
        return { title: 'ShopHub | Premium Collection' };
    }
}

// 🔥 2. JSON-LD RICH SNIPPETS (Google Search Magic)
export default async function ProductLayout({ children, params }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shophubstyle.vercel.app';

    let jsonLd = null;

    if (id) {
        try {
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (product) {
                jsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: product.name,
                    image: product.images?.[0] || product.image,
                    description: product.description || `Buy ${product.name} at ShopHub.`,
                    sku: product.sku || product.id,
                    offers: {
                        '@type': 'Offer',
                        url: `${baseUrl}/product/${product.id}`,
                        priceCurrency: 'INR',
                        price: product.salePrice || product.price,
                        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        itemCondition: 'https://schema.org/NewCondition',
                    }
                };

                // अगर रिव्यु हैं, तो स्टार रेटिंग दिखाओ
                if (product.rating && product.reviews && product.reviews.length > 0) {
                    jsonLd.aggregateRating = {
                        '@type': 'AggregateRating',
                        ratingValue: product.rating,
                        reviewCount: product.reviews.length,
                    };
                }
            }
        } catch (error) {
            console.error("SEO JSON-LD Error:", error);
        }
    }

    return (
        <>
            {/* JSON-LD स्क्रिप्ट सिर्फ तभी रेंडर होगी जब प्रोडक्ट मिलेगा */}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
