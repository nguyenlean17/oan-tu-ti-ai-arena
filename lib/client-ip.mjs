/**
 * Client IP Resolver for UET Arena
 * Accurately extracts real client IP behind reverse proxies (Nginx, Caddy, Cloudflare, Vercel)
 * without collapsing all visitors into 'local'.
 */

export function sanitizeIp(raw) {
  if (!raw || typeof raw !== 'string') return 'unknown';
  let ip = raw.trim();

  // Strip IPv4-mapped IPv6 prefix (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  // Remove port if present (e.g., 203.0.113.195:44321)
  if (/^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  return ip;
}

export function extractClientIp(request) {
  if (!request || !request.headers) return 'local';

  // 1. Cloudflare header
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return sanitizeIp(cfIp);

  // 2. Vercel edge header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return sanitizeIp(vercelIp.split(',')[0]);

  // 3. Nginx / Caddy standard real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return sanitizeIp(realIp);

  // 4. Standard X-Forwarded-For header (client is first in list)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstHop = xForwardedFor.split(',')[0];
    if (firstHop) return sanitizeIp(firstHop);
  }

  // Fallback for local development
  return '127.0.0.1';
}
