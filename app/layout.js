import './styles/globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext'; // <-- Currency Provider Import
import { Toaster } from 'react-hot-toast';

// 🔥 NEW: MOBILE ZOOM FIX (इसे लगाने से मोबाइल पर बटन क्लिक करने पर स्क्रीन ज़ूम नहीं होगी)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 🔥 1. PREMIUM SEO & META TAGS
export const metadata = {
  title: 'ShopHub. | Premium Curated Fashion & Essentials',
  description: 'Discover our meticulously curated selection of premium essentials. ShopHub offers modern, luxury, and timeless pieces designed for the modern lifestyle.',
  keywords: ['luxury fashion', 'premium clothing', 'ShopHub', 'designer wear', 'accessories'],
  openGraph: {
    title: 'ShopHub. | The Collection',
    description: 'Discover our meticulously curated selection of premium essentials.',
    url: 'https://shophub.com',
    siteName: 'ShopHub',
    images: [
      {
        // यह वो तस्वीर है जो लिंक शेयर करने पर दिखेगी
        url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'ShopHub Premium Collection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </head>
      <body className="bg-gray-50 min-h-screen flex flex-col font-sans">
        {/* Wrap everything inside Context Providers including CurrencyProvider */}
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CurrencyProvider>

                {/* 🔥 2. LUXURY TOAST NOTIFICATIONS */}
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1c1917', // stone-900
                      color: '#fff',
                      borderRadius: '100px', // Pill shape for luxury feel
                      padding: '16px 24px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#1c1917',
                      },
                    },
                    error: {
                      style: {
                        background: '#ef4444', // red-500
                        color: '#fff',
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#ef4444',
                      },
                    },
                  }}
                />

                {/* 1. Global Header */}
                <Header />

                {/* 2. Main Page Content (Hero, Categories, Newsletter, etc.) */}
                <main className="flex-grow relative">
                  {children}
                </main>

                {/* 3. Global Footer */}
                <Footer />

              </CurrencyProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
