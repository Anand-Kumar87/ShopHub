/**
 * migrate-category-images.js
 *
 * Same idea as migrate-images.js, but for the `categories` table,
 * where `image` is a single text field (not an array like products).
 *
 * SETUP (same as before):
 * 1. npm install @supabase/supabase-js  (skip if already installed)
 * 2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars in the
 *    SAME terminal window, then run:
 *       node migrate-category-images.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BUCKET = 'images';
const FOLDER = 'categories';

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

async function migrateCategory(category) {
    const img = category.image;
    if (!isBase64Image(img)) return null; // nothing to do

    console.log(`\nMigrating category "${category.name}" (id: ${category.id})...`);

    const parsed = parseDataUrl(img);
    if (!parsed) {
        console.warn('  ⚠️  Could not parse data URL, skipping.');
        return null;
    }

    const buffer = Buffer.from(parsed.base64Data, 'base64');
    const filePath = `${FOLDER}/${category.id}.${parsed.ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: parsed.mimeType, upsert: true });

    if (uploadError) {
        console.error('  ❌ Upload failed:', uploadError.message);
        return null;
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    console.log(`  ✅ Uploaded -> ${publicUrlData.publicUrl}`);

    const { error: updateError } = await supabase
        .from('categories')
        .update({ image: publicUrlData.publicUrl })
        .eq('id', category.id);

    if (updateError) {
        console.error('  ❌ Failed to update category row:', updateError.message);
        return null;
    }

    console.log('  ✔️  Category row updated with new URL.');
    return category.id;
}

async function main() {
    console.log('Fetching all categories...');
    const { data: categories, error } = await supabase.from('categories').select('id, name, image');

    console.log('DEBUG: fetch finished. error =', error ? error.message : 'none', '| categories fetched =', categories ? categories.length : 0);

    if (error) {
        console.error('Failed to fetch categories:', error.message);
        process.exit(1);
    }

    console.log(`Found ${categories.length} categories. Checking each for base64 images...`);

    const migrated = [];
    for (const category of categories) {
        const result = await migrateCategory(category);
        if (result) migrated.push(result);
    }

    console.log('\n----------------------------------------');
    if (migrated.length === 0) {
        console.log('No categories needed migration. Nothing to do.');
    } else {
        console.log(`Done. Migrated ${migrated.length} categor${migrated.length === 1 ? 'y' : 'ies'}:`);
        migrated.forEach((id) => console.log(`  - id ${id}`));
    }
    console.log('----------------------------------------');
}

main().catch((err) => {
    console.error('FATAL ERROR:', err && err.message ? err.message : err);
    process.exit(1);
});
