/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically called by Next.js when the server starts.
 * It's the perfect place to initialize server-side services like logging.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeLogger } = await import('./lib/logger');
    initializeLogger();
  }
}
