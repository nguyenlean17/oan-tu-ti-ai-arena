# Oẳn Tù Tì 2.0 — AI Coding Arena

Vietnamese-first programming-tournament MVP, built on the existing 9×9 game rules from `nguyenlean17/network-programming`.

## Live site

https://oan-tu-ti-arena.wittylarch64.chatgpt.site

The Site starts owner-private. Sign in with the owning ChatGPT account. Site visibility is controlled by the hosting platform, independently of the GitHub repository.

## Included

- Sign in with ChatGPT; editable name and team.
- Python bot editor and `.py` uploads, immutable version history, SHA-256 hashes, downloads.
- Real Python practice execution using Pyodide in a Web Worker inside an opaque-origin sandbox iframe.
- Original FRONTLINE board placement, legal moves and capture rules; P1 targets I1, P2 targets A9.
- Two deterministic reference strategies; reproducible seed 42; a 200-ply draw limit.
- Interactive replay with play/pause, stepping, scrubbing and JSON export.
- Database-backed submissions, practice matches, profiles, tournament registration, organizer controls and audit trail.
- Personal practice rankings; server-run reference exhibitions with swapped sides.
- Tournament creation, registration deadlines, version-pinned entries and submission locks.
- Responsive interface, keyboard navigation, reduced-motion support and Vietnamese API documentation.

## Run locally

Node 22.13+:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_dry_shocker.sql
npm run dev
```

Visit the printed loopback URL. Local sign-in uses the starter's `Seedy` development identity; production identity is injected by Sites. The local and hosted databases are independent.

```sh
npm test
npm run check:python
npx tsc --noEmit
```

`check:python` requires Python 3 on PATH (or `OTT_PYTHON`). It checks that the browser Python engine produces a replay accepted by the original JavaScript rules.

## Organizer setup

Open **Ban tổ chức → Thiết lập quản trị** while the Site is still owner-private. The first signed-in owner to claim setup becomes the single application administrator. This bootstrap must be completed before changing the Site audience. Other accounts cannot use organizer API operations.

## Python API

```python
def choose_move(state):
    return state["legal_moves"][0]
```

`state` contains `board` (9×9, empty cells are `None`, pieces have `player` and `type`), `player` (`P1` or `P2`), `legal_moves`, `turn`, and `history`. A move is `{"from": "B8", "to": "B7"}`. Use only standard-library Python. Upload limit: 64 KB. Browser practice has a 90-second runtime load deadline and a 15-second match deadline; the parent destroys the iframe on cancellation or timeout.

## Trust boundaries and deliberate MVP scope

Student Python is never evaluated by the website backend. The practice iframe has an opaque origin, no app credentials, and a restrictive CSP permitting the pinned Pyodide CDN; the worker is destroyed after each match. It is a learning sandbox, not an official tournament judge, and browser memory is subject to browser limits rather than a dedicated VM quota. The server validates the move sequence before saving, but does not attest that a submitted bot generated it. Practice results cannot become official standings.

The PDF explicitly recommends an end-to-end prototype with two example bots before public registration. This MVP delivers that prototype. **Untrusted Python tournament scheduling, a continuously hosted container runner, official result publication, finals brackets, ZIP submissions, email verification/recovery, appeals and prizes are outside this release.** The UI does not pretend a runner is connected and refuses official publication. A production judge must run each bot in a separate hardened sandbox, enforce CPU/RAM/process/filesystem/network quotas, authenticate job results, independently replay/verify moves, and publish immutable results tied to registered hashes. The original repository's multiplayer application remains intact.

Scoring is 3/1/0; ties in the personal practice table use number of wins. This table is not a final tournament ranking. No entrants, prize funds, official dates or public participation numbers are fabricated.

## Deployment

React/Vinext + Cloudflare Workers; D1 migrations live in `drizzle/`; `.openai/hosting.json` carries the Site identity and the logical `DB` binding. Sites owns authentication and deployment. Keep `.env*`, `.wrangler`, `.sites-runtime`, `node_modules`, build artifacts and credentials out of Git. Pyodide is loaded on demand from jsDelivr, so the first Python match requires Internet connectivity.
