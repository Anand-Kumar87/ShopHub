// app/utils/logger.js
//
// Centralized error reporting utility.
// Captures full stack traces, component stacks, and client environment context,
// logging them to the dedicated /api/telemetry/errors backend service.

// Client-side debounce cache to suppress runaway error loops
const recentClientErrors = new Set();

/**
 * Serialize error object safely
 */
function serializeError(error) {
    if (!error) {
        return { message: 'Unknown error', stack: null };
    }
    if (typeof error === 'string') {
        return { message: error, stack: null };
    }
    return {
        message: error.message || error.name || String(error),
        stack: error.stack || null,
        digest: error.digest || null
    };
}

/**
 * Capture and report an exception to the centralized telemetry service
 * @param {Error|string|any} error - The error or exception caught
 * @param {Object} context - Optional context (e.g., componentStack, userId, metadata)
 */
export function captureException(error, context = {}) {
    const { message, stack, digest } = serializeError(error);

    // Also log to console in local / browser environments
    if (typeof window !== 'undefined') {
        console.error('[ShopHub Telemetry]', message, error);
    } else {
        console.error('[ShopHub Server Telemetry]', message, stack);
    }

    // Client-side deduplication (suppress same error reported repeatedly within 5 seconds)
    const errorSignature = `${message}_${context.componentStack?.slice(0, 100) || ''}`;
    if (recentClientErrors.has(errorSignature)) {
        return;
    }
    recentClientErrors.add(errorSignature);
    setTimeout(() => recentClientErrors.delete(errorSignature), 5000);

    const payload = {
        message,
        stack,
        componentStack: context.componentStack || null,
        url: typeof window !== 'undefined' ? window.location.href : context.url || '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        userId: context.userId || null,
        level: context.level || 'error',
        metadata: {
            ...context.metadata,
            digest,
            timestamp: new Date().toISOString()
        }
    };

    // Dispatch to telemetry backend asynchronously
    if (typeof window !== 'undefined') {
        try {
            const body = JSON.stringify(payload);
            // Use keepalive fetch to ensure delivery even if page unloads
            fetch('/api/telemetry/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true
            }).catch(() => {
                // Silently handle offline or blocked telemetry
            });
        } catch {
            // Suppress telemetry transport errors
        }
    }
}

/**
 * Capture a custom warning or message
 * @param {string} message
 * @param {'info'|'warning'|'error'} level
 * @param {Object} context
 */
export function captureMessage(message, level = 'info', context = {}) {
    captureException(new Error(message), { ...context, level });
}

/**
 * Attach unhandled window error and rejection listeners (called once on client startup)
 */
let isListenerInitialized = false;
export function initGlobalErrorListeners() {
    if (typeof window === 'undefined' || isListenerInitialized) return;
    isListenerInitialized = true;

    // Listen for uncaught runtime exceptions
    window.addEventListener('error', (event) => {
        // Ignore cross-origin script error noise without actionable stack
        if (event.message === 'Script error.' && !event.filename) return;

        captureException(event.error || event.message, {
            metadata: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        });
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        captureException(reason instanceof Error ? reason : new Error(String(reason || 'Unhandled Promise Rejection')), {
            metadata: { type: 'unhandled_rejection' }
        });
    });
}
