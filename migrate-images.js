/**
 * migrate-images.js
 *
 * One-time migration: finds products whose `images` column still has
 * old base64 data-URL strings, uploads each image to the Supabase
 * Storage bucket ("images/products/..."), and rewrites the product's
 * `images` column to point at the new public URL instead.
 *
 * SETUP
 * 1. In the project folder (or anywhere), save this file.
 * 2. npm install @supabase/supabase-js
 * 3. Get your SERVICE ROLE key: Supabase Dashboard -> Project Settings
 *    -> API -> "service_role" secret (NOT the anon/public key).
 *    ⚠️ This key bypasses RLS. Never put it in client-side code, never
 *    commit it to git, never share it. Use it only for this local
 *    one-time script, then close the terminal.
 * 4. Set the two env vars below (in your shell, or a local .env you
 *    load with `node -r dotenv/config migrate-images.js`), then run:
 *       node migrate-images.js
 *
 * SAFETY
 * - This only touches products whose `images` array contains a
 *   `data:image/...;base64,...` string — products already using URLs
 *   are left untouched.
 * - It's safe to re-run: already-migrated products are skipped
 *   automatically on the next run (no base64 left to find).
 * - Recommended: export/backup your `products` table before running,
 *   in case you want to roll back.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;               // e.g. https://xxxx.supabase.co
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BUCKET = 'images';
const FOLDER = 'products';

function isBase64Image(str) {
    return typeof str === 'string' && str.startsWith('data:image/');
}

function parseDataUrl(dataUrl) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return null;
    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    return { mimeType, base64Data, ext };
}

async function migrateProduct(product) {
    const images = product.images;
    if (!Array.isArray(images) || images.length === 0) return null;

    const hasBase64 = images.some(isBase64Image);
    if (!hasBase64) return null; // nothing to do for this product

    console.log(`\nMigrating "${product.name}" (${product.id})...`);

    const newImageUrls = [];

    for (let i = 0; i < images.length; i++) {
        const img = images[i];

        if (!isBase64Image(img)) {
            newImageUrls.push(img); // already a real URL — keep as-is
            continue;
        }

        const parsed = parseDataUrl(img);
        if (!parsed) {
            console.warn(`  ⚠️  Image ${i}: couldn't parse data URL, skipping this one image.`);
            continue;
        }

        const buffer = Buffer.from(parsed.base64Data, 'base64');
        const filePath = `${FOLDER}/${product.id}-${i}.${parsed.ext}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, buffer, { contentType: parsed.mimeType, upsert: true });

        if (uploadError) {
            console.error(`  ❌ Upload failed for image ${i}:`, uploadError.message);
            continue;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        newImageUrls.push(publicUrlData.publicUrl);
        console.log(`  ✅ Image ${i} uploaded -> ${publicUrlData.publicUrl}`);
    }

    if (newImageUrls.length === 0) {
        console.warn(`  ⚠️  No images could be migrated for this product — leaving the row untouched.`);
        return null;
    }

    const { error: updateError } = await supabase
        .from('products')
        .update({ images: newImageUrls })
        .eq('id', product.id);

    if (updateError) {
        console.error(`  ❌ Failed to update product row:`, updateError.message);
        return null;
    }

    console.log(`  ✔️  Product row updated with new URLs.`);
    return product.id;
}

async function main() {
    console.log('Fetching all products...');
    const { data: products, error } = await supabase.from('products').select('id, name, images');

    console.log('DEBUG: fetch finished. error =', error ? error.message : 'none', '| products fetched =', products ? products.length : 0);

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`Found ${products.length} products. Checking each for base64 images...`);

    const migrated = [];
    for (const product of products) {
        const result = await migrateProduct(product);
        if (result) migrated.push(result);
    }

    console.log('\n----------------------------------------');
    if (migrated.length === 0) {
        console.log('No products needed migration. Nothing to do.');
    } else {
        console.log(`Done. Migrated ${migrated.length} product(s):`);
        migrated.forEach((id) => console.log(`  - ${id}`));
    }
    console.log('----------------------------------------');
}

main().catch((err) => {
    console.error('FATAL ERROR:', err && err.message ? err.message : err);
    process.exit(1);
});
