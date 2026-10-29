import assert from 'node:assert/strict';
import { extractClientIp, sanitizeIp } from '../lib/client-ip.mjs';

// Test 1: Sanitize IP
assert.equal(sanitizeIp('::ffff:192.168.1.5'), '192.168.1.5');
assert.equal(sanitizeIp('203.0.113.195:54321'), '203.0.113.195');
assert.equal(sanitizeIp('  14.232.208.10  '), '14.232.208.10');
assert.equal(sanitizeIp(null), 'unknown');

// Test 2: Cloudflare header
const reqCf = { headers: new Headers({ 'cf-connecting-ip': '1.1.1.1' }) };
assert.equal(extractClientIp(reqCf), '1.1.1.1');

// Test 3: Vercel header
const reqVercel = { headers: new Headers({ 'x-vercel-forwarded-for': '2.2.2.2, 3.3.3.3' }) };
assert.equal(extractClientIp(reqVercel), '2.2.2.2');

// Test 4: Caddy / Nginx X-Real-IP
const reqReal = { headers: new Headers({ 'x-real-ip': '14.232.1.2' }) };
assert.equal(extractClientIp(reqReal), '14.232.1.2');

// Test 5: Standard X-Forwarded-For
const reqXff = { headers: new Headers({ 'x-forwarded-for': '118.70.1.2, 10.0.0.1' }) };
assert.equal(extractClientIp(reqXff), '118.70.1.2');

// Test 6: Fallback loopback
const reqEmpty = { headers: new Headers() };
assert.equal(extractClientIp(reqEmpty), '127.0.0.1');

console.log('Client IP extraction tests passed: Cloudflare, Vercel, Nginx/Caddy, XFF, sanitization, and fallback.');
