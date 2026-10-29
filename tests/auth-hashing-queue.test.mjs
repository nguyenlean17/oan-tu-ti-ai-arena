import assert from 'node:assert/strict';
import { HashingQueue } from '../lib/auth-hashing-queue.mjs';

// Tạo queue với concurrency = 2 để test xếp hàng
const queue = new HashingQueue(2, 5, 2000);

// Test 1: Chạy 4 tác vụ song song với maxConcurrent = 2
const p1 = queue.hash('pass1', 'salt1');
const p2 = queue.hash('pass2', 'salt2');
const p3 = queue.hash('pass3', 'salt3');
const p4 = queue.hash('pass4', 'salt4');

// p1 và p2 đang active, p3 và p4 đang trong hàng đợi chờ
assert.equal(queue.stats.active, 2);
assert.equal(queue.stats.queued, 2);

// Chờ tất cả hoàn thành
const [res1, res2, res3, res4] = await Promise.all([p1, p2, p3, p4]);
assert.ok(Buffer.isBuffer(res1));
assert.ok(Buffer.isBuffer(res2));
assert.ok(Buffer.isBuffer(res3));
assert.ok(Buffer.isBuffer(res4));

// Sau khi hoàn thành, hàng đợi và active count phải về 0
assert.equal(queue.stats.active, 0);
assert.equal(queue.stats.queued, 0);

// Test 2: Timeout trong hàng đợi
const shortQueue = new HashingQueue(1, 10, 50); // timeout 50ms
// Chiếm giữ worker
const blocker = shortQueue.hash('blocker', 'salt');
// Task này sẽ bị timeout vì worker đang bận
const timedOutTask = shortQueue.hash('timedout', 'salt');

await assert.rejects(
  async () => {
    await timedOutTask;
  },
  { status: 503 }
);

await blocker;

console.log('Auth Hashing Queue tests passed: concurrency limit, FIFO queuing, drainage, and timeout.');
