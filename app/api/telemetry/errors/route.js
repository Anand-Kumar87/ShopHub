import { NextResponse } from 'next/server';
import { telemetryRateLimiter } from '../../../utils/cacheUtils';
import { verifyServerAuth } from '../../../utils/serverAuth';
import { createClient } from '@supabase/supabase-js';

// In-memory ring buffer for real-time error observability (max 200 items)
const MAX_BUFFER_SIZE = 200;
const errorRingBuffer = [];
let errorCounter = 0;

// Supabase client for async error logging if configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let dbClient = null;
if (supabaseUrl && serviceRoleKey) {
    dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
        global: {
            fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(3000) })
        }
    });
}

/**
 * In-memory buffer insertion with deduplication
 */
function recordErrorIncident(incident) {
    errorCounter++;

    // Check if an identical error message was reported within the last 60 seconds
    const existing = errorRingBuffer.find(
        item => item.message === incident.message && (Date.now() - new Date(item.timestamp).getTime()) < 60000
    );

    if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
        existing.lastSeen = new Date().toISOString();
        existing.latestUrl = incident.url;
        return existing.id;
    }

    if (errorRingBuffer.length >= MAX_BUFFER_SIZE) {
        errorRingBuffer.shift(); // Evict oldest
    }

    errorRingBuffer.push(incident);
    return incident.id;
}

/**
 * POST /api/telemetry/errors
 * Centralized endpoint for reporting client and server exceptions.
 * Rate-limited per IP to protect backend under 200k-500k DAU.
 */
export async function POST(request) {
    try {
        // 1. IP-based Rate Limiting (max 30 errors/min per IP to prevent spam during crash loops)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown-ip';

        const rateKey = `telemetry_rate_${ip}`;
        const currentRate = telemetryRateLimiter.get(rateKey) || 0;

        if (currentRate >= 30) {
            // Silently accept with 429 without failing client execution
            return NextResponse.json(
                { success: false, message: 'Telemetry rate limit exceeded' },
                { status: 429 }
            );
        }
        telemetryRateLimiter.set(rateKey, currentRate + 1, 60);

        // 2. Parse payload safely
        let body = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        const {
            message = 'Unknown error',
            stack = null,
            componentStack = null,
            url = request.headers.get('referer') || '',
            userAgent = request.headers.get('user-agent') || 'unknown',
            userId = null,
            level = 'error',
            metadata = {}
        } = body;

        const incidentId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const incident = {
            id: incidentId,
            message: String(message).slice(0, 1000), // Protect against oversized payloads
            stack: stack ? String(stack).slice(0, 5000) : null,
            componentStack: componentStack ? String(componentStack).slice(0, 3000) : null,
            url: String(url).slice(0, 500),
            userAgent: String(userAgent).slice(0, 300),
            userId: userId ? String(userId).slice(0, 100) : null,
            level,
            metadata: typeof metadata === 'object' ? metadata : {},
            occurrences: 1,
            timestamp: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };

        // 3. Record in high-speed in-memory ring buffer
        recordErrorIncident(incident);

        // 4. Fire-and-forget database persistence (non-blocking, never fails the response)
        if (dbClient) {
            Promise.resolve().then(async () => {
                try {
                    await dbClient.from('telemetry_errors').insert([
                        {
                            incident_id: incident.id,
                            message: incident.message,
                            stack: incident.stack,
                            component_stack: incident.componentStack,
                            url: incident.url,
                            user_agent: incident.userAgent,
                            user_id: incident.userId,
                            level: incident.level,
                            metadata: incident.metadata,
                            created_at: incident.timestamp
                        }
                    ]);
                } catch {
                    // Suppress DB errors so telemetry logger never crashes the app
                }
            });
        }

        // Always return 202 Accepted immediately
        return NextResponse.json({ success: true, incidentId }, { status: 202 });

    } catch (err) {
        console.error('Telemetry ingestion failure:', err);
        return NextResponse.json({ error: 'Internal telemetry processing error' }, { status: 500 });
    }
}

/**
 * GET /api/telemetry/errors
 * Returns real-time telemetry error logs for admin observability.
 * Protected by verifyServerAuth with requireAdmin: true.
 */
export async function GET(request) {
    try {
        const auth = await verifyServerAuth(request, { requireAdmin: true });
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.error || 'Unauthorized' },
                { status: auth.status || 401 }
            );
        }

        return NextResponse.json({
            status: 'healthy',
            totalRecorded: errorCounter,
            activeCount: errorRingBuffer.length,
            errors: [...errorRingBuffer].reverse() // Most recent first
        }, {
            headers: {
                'Cache-Control': 'no-store'
            }
        });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to retrieve telemetry' }, { status: 500 });
    }
}
