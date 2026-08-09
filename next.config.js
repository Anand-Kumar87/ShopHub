/** @type {import('next').NextConfig} */
const nextConfig = {
  // swcMinify hata diya hai kyunki latest Next.js mein yeh automatically on hota hai

  images: {
    // domains ki jagah ab remotePatterns use hota hai (security ke liye)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Yeh kisi bhi image URL ko allow kar dega. Tum chaho toh isko apne specific domain se replace kar sakte ho baad mein.
      },
    ],
  },
};

module.exports = nextConfig;