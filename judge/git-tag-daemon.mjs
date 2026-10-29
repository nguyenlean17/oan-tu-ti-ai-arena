/**
 * Git Tag Daemon for Oan Tu Ti AI Arena
 * Automatically monitors registered team repositories for official submission tags:
 * e.g., 'submit-v1', 'submit-v2', 'v1.0.0'
 * Fetches the tagged bot.py, validates AST, and stages it for judge evaluation.
 */

import { createHash } from 'node:crypto';

export function parseGitTag(tag) {
  if (typeof tag !== 'string') return null;
  const match = /^submit-v?(\d+(\.\d+)?)$/i.exec(tag.trim());
  if (!match) return null;
  return {
    raw: tag.trim(),
    version: match[1],
    numeric: parseFloat(match[1])
  };
}

export function buildRawGithubUrl(repo, tag, filePath = 'bot.py') {
  // Normalize repo: owner/repo
  const cleanRepo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').trim();
  return `https://raw.githubusercontent.com/${cleanRepo}/${tag}/${filePath}`;
}

export async function fetchTaggedBot(repo, tag, filePath = 'bot.py', fetchFn = fetch) {
  const url = buildRawGithubUrl(repo, tag, filePath);
  const response = await fetchFn(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Không thể tải ${filePath} từ ${repo}@${tag} (HTTP ${response.status})`);
  }

  const source = await response.text();
  if (!source || !source.trim()) {
    throw new Error('Tệp bot.py tải về rỗng.');
  }

  if (Buffer.byteLength(source, 'utf8') > 65536) {
    throw new Error('Tệp bot.py vượt quá dung lượng tối đa 64 KiB.');
  }

  const sha = createHash('sha256').update(source).digest('hex');
  return {
    source,
    sha,
    provenance: `git-tag:${repo}@${tag}:${filePath}`
  };
}

export function sortSubmissionTags(tags) {
  return tags
    .map(t => parseGitTag(t))
    .filter(Boolean)
    .sort((a, b) => b.numeric - a.numeric)
    .map(t => t.raw);
}
