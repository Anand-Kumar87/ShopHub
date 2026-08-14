/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // अगर Unsplash की इमेजेज़ हैं
      },
      {
        protocol: 'https',
        hostname: 'lpirgaoexkspfulhfycc.supabase.co', // आपके Supabase प्रोजेक्ट का URL
      },
    ],
  },
};

module.exports = nextConfig;
