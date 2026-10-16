/**
 * Resolves the appropriate API base URL dynamically for apps/web.
 * In the browser on production, returns '/api/v1' to route through Next.js reverse proxy rewrites,
 * avoiding localhost leakage, mixed content SSL errors, and cross-origin CORS issues.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If explicitly configured with an external public https API url, use it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    // Always use same-origin relative URL in browser
    return '/api/v1';
  }

  // Server-side (Node.js SSR / Server Components / API routes)
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001/api/v1'
  );
}
