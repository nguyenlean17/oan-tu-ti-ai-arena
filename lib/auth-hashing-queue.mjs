/**
 * Asynchronous Hashing Queue & Concurrency Limiter for UET Arena
 * Replaces hard `hashing >= 4 -> throw 503` drop logic.
 * Instead, queues incoming hash requests up to MAX_CONCURRENT workers.
 * Features:
 * - FIFO queuing
 * - Per-task timeout (default 8,000ms)
 * - Automatic queue drainage
 * - Prevents CPU exhaustion while avoiding instant 503 drops under burst logins
 */

import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);

export class HashingQueue {
  constructor(maxConcurrent = 4, maxQueueSize = 200, timeoutMs = 8000) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.timeoutMs = timeoutMs;
    this.activeCount = 0;
    this.queue = [];
  }

  async hash(password, salt) {
    if (this.queue.length >= this.maxQueueSize) {
      throw Object.assign(new Error('Hàng đợi đăng nhập đã đầy. Vui lòng thử lại sau giây lát.'), { status: 503 });
    }

    return new Promise((resolve, reject) => {
      const item = {
        password,
        salt,
        resolve,
        reject,
        timer: null
      };

      item.timer = setTimeout(() => {
        const idx = this.queue.indexOf(item);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          reject(Object.assign(new Error('Hệ thống đang xử lý tải cao. Vui lòng thử lại.'), { status: 503 }));
        }
      }, this.timeoutMs);

      this.queue.push(item);
      this._drain();
    });
  }

  async _drain() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    clearTimeout(item.timer);
    this.activeCount++;

    try {
      const derived = await derive(item.password, item.salt, 64, {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024
      });
      item.resolve(derived);
    } catch (err) {
      item.reject(err);
    } finally {
      this.activeCount--;
      this._drain();
    }
  }

  get stats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

export const defaultHashingQueue = new HashingQueue(4, 200, 8000);
