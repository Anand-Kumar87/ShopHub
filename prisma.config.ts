// Avoid importing @prisma/config to prevent module resolution errors in some setups.
// Export a plain config object instead of using defineConfig.
export default {
    earlyAccess: true,
    datasource: {
        url: process.env.DATABASE_URL,
    },
} as const;