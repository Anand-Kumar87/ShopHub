import { supabase } from '../../utils/supabase';

// 🔥 DYNAMIC PREMIUM SEO & OPEN GRAPH (WhatsApp/Insta Sharing)
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

// यह लेआउट आपके page.js को बिना छेड़े रेंडर करेगा
export default function ProductLayout({ children }) {
    return <>{children}</>;
}
