import assert from 'node:assert/strict';
import { parseGitTag, buildRawGithubUrl, sortSubmissionTags, fetchTaggedBot } from '../judge/git-tag-daemon.mjs';

// Test 1: Parse git tags
assert.deepEqual(parseGitTag('submit-v1'), { raw: 'submit-v1', version: '1', numeric: 1 });
assert.deepEqual(parseGitTag('submit-v2.5'), { raw: 'submit-v2.5', version: '2.5', numeric: 2.5 });
assert.equal(parseGitTag('random-tag'), null);
assert.equal(parseGitTag('submit-invalid'), null);

// Test 2: Build raw URL
const url1 = buildRawGithubUrl('uet-team-01/bot-repo', 'submit-v1');
assert.equal(url1, 'https://raw.githubusercontent.com/uet-team-01/bot-repo/submit-v1/bot.py');

const url2 = buildRawGithubUrl('https://github.com/uet-team-02/ai-player.git', 'submit-v2', 'src/bot.py');
assert.equal(url2, 'https://raw.githubusercontent.com/uet-team-02/ai-player/submit-v2/src/bot.py');

// Test 3: Sort tags by highest version
const sortedTags = sortSubmissionTags(['submit-v1', 'submit-v3', 'ignored-tag', 'submit-v2']);
assert.deepEqual(sortedTags, ['submit-v3', 'submit-v2', 'submit-v1']);

// Test 4: Mock fetch tagged bot
const mockFetchSuccess = async () => ({
  ok: true,
  status: 200,
  text: async () => 'def choose_move(state):\n    return state["legal_moves"][0]\n'
});

const result = await fetchTaggedBot('org/repo', 'submit-v1', 'bot.py', mockFetchSuccess);
assert.ok(result.source.includes('def choose_move'));
assert.ok(/^[a-f0-9]{64}$/.test(result.sha));
assert.equal(result.provenance, 'git-tag:org/repo@submit-v1:bot.py');

// Test 5: Mock 404 error handling
const mockFetch404 = async () => ({ ok: false, status: 404 });
await assert.rejects(
  () => fetchTaggedBot('org/repo', 'submit-v1', 'bot.py', mockFetch404),
  /HTTP 404/
);

console.log('Git Tag Daemon tests passed: tag parsing, url building, sorting, and safe fetching.');
