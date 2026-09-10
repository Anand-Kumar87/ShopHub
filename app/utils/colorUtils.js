// utils/colorUtils.js
//
// Lets the admin panel accept EITHER a hex code (#F5EADF) OR a plain color
// name ("Cream Beige") for a product's colors, and makes both render
// correctly everywhere on the storefront:
//   - resolveSwatchColor(value)  -> always returns something CSS can use
//                                   as backgroundColor (for the round color dots)
//   - resolveColorLabel(value)   -> always returns a human-readable name
//                                   (for text like "Colors: Cream Beige, ...")

const NAMED_COLORS = {
    'cream beige': '#F5EADF',
    'cream': '#FFFDD0',
    'beige': '#F5F5DC',
    'classic white': '#FFFFFF',
    'off white': '#FAF9F6',
    'ivory': '#FFFFF0',
    'white': '#FFFFFF',
    'deep brown': '#5C3A2E',
    'chocolate brown': '#3D2B1F',
    'brown': '#8B4513',
    'tan': '#D2B48C',
    'camel': '#C19A6B',
    'khaki': '#C3B091',
    'charcoal grey': '#3A3A3A',
    'charcoal gray': '#3A3A3A',
    'charcoal': '#36454F',
    'dark grey': '#3A3A3A',
    'dark gray': '#3A3A3A',
    'grey': '#808080',
    'gray': '#808080',
    'light grey': '#D3D3D3',
    'light gray': '#D3D3D3',
    'steel grey': '#71797E',
    'steel gray': '#71797E',
    'slate': '#708090',
    'stone': '#928E85',
    'sand': '#C2B280',
    'core black': '#0A0A0A',
    'jet black': '#0A0A0A',
    'black': '#000000',
    'navy': '#001F3F',
    'navy blue': '#000080',
    'royal blue': '#4169E1',
    'sky blue': '#87CEEB',
    'blue': '#0000FF',
    'teal': '#008080',
    'turquoise': '#40E0D0',
    'sea green': '#2E8B57',
    'forest green': '#228B22',
    'olive': '#808000',
    'green': '#008000',
    'mint': '#98FF98',
    'mustard': '#FFDB58',
    'mustard yellow': '#FFDB58',
    'yellow': '#FFFF00',
    'gold': '#FFD700',
    'maroon': '#800000',
    'burgundy': '#800020',
    'wine': '#722F37',
    'red': '#FF0000',
    'rust': '#B7410E',
    'coral': '#FF7F50',
    'peach': '#FFE5B4',
    'rose gold': '#B76E79',
    'pink': '#FFC0CB',
    'lavender': '#E6E6FA',
    'purple': '#800080',
    'silver': '#C0C0C0',
    'nude': '#E3BC9A'
};

function isHexColor(value) {
    return typeof value === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function titleCase(str) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Always returns something safe to use as a CSS backgroundColor.
 * - Hex code in  -> hex code out (unchanged)
 * - Known name in (e.g. "Charcoal Grey") -> matching hex out
 * - Unknown name in -> returned as-is (covers plain CSS keywords like "red"
 *   that don't need a dictionary lookup)
 */
export function resolveSwatchColor(value) {
    if (!value) return '#CCCCCC';
    const trimmed = String(value).trim();
    if (isHexColor(trimmed)) return trimmed;
    const match = NAMED_COLORS[trimmed.toLowerCase()];
    return match || trimmed;
}

/**
 * Always returns a human-readable label.
 * - Hex code in  -> nearest known color name out (e.g. "#F5EADF" -> "Cream Beige")
 * - Name in      -> the same name, title-cased
 */
export function resolveColorLabel(value) {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!isHexColor(trimmed)) {
        return titleCase(trimmed);
    }

    const target = hexToRgb(trimmed);
    let closestName = trimmed; // fallback: show the hex itself if nothing is close
    let closestDist = Infinity;

    for (const [name, hex] of Object.entries(NAMED_COLORS)) {
        const rgb = hexToRgb(hex);
        const dist = (rgb.r - target.r) ** 2 + (rgb.g - target.g) ** 2 + (rgb.b - target.b) ** 2;
        if (dist < closestDist) {
            closestDist = dist;
            closestName = name;
        }
    }

    return titleCase(closestName);
}