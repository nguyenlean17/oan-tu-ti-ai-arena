# Operations, practice and a measured load demonstration

These additions live on `integrate-safe-enhancements`. PostgreSQL is required for
the operations/practice endpoints. The official scoring rules, authenticated team
membership and WASI execution boundary remain in place.

## Operator and student views

- `/operations`: administrator-only readiness, worker heartbeats, official and
  practice queues, backup evidence, a sandbox self-test and advisory AST review.
- `/practice`: authenticated students submit a bot to a separate persistent Elo
  ladder. Valid bots match automatically only when the worker's corresponding
  official queue is empty. Ratings never change official tournament standings.
- `/competition`: students see their own queued/running verdicts and queue
  position. This is a position, not a promised waiting-time estimate.
- `/load-demo`: read-only dashboard **only when `ARENA_LOAD_DEMO=1`**. The regular
  local and production profiles do not enable it. It grants no admin mutations.

All writes retain session authorization and Origin checks. Admin telemetry is
not public in the normal deployment. Practice responses never expose bot source
to other participants. The demonstration port binds `127.0.0.1`, not all interfaces.

## Bot feedback and academic review

E01: syntax; E02: interface/startup Python error; E03: illegal move; E04: deadline;
E05: unsupported capability; E06: resource/output limit. Codes come from the real
sandbox outcome and travel in the existing verdict message contract. Editing a
guest-local input dictionary is not automatically a tournament violation.

The AST reviewer parses source without importing or executing it. It uses a
bounded, trusted parser in the restricted worker, with process time/memory/output
limits. Approved starter exemptions require an exact normalized structure after
masking numeric configuration, not a comment or variable name. Submissions are
identified by immutable IDs, so multiple `bot.py` files do not overwrite one another.
The first 100 latest valid submissions are compared; truncation is explicit.
Similarity suggestions are not proof of plagiarism and never change scores.

## Practice policy

The latest valid version becomes active; an invalid replacement does not remove
the previous valid bot. Updating source does not reset rating. Both seats are
played with one pinned seed, then one K=24 Elo update is committed per pair.
Submission limits: 50 versions, 2 pending, one version per five seconds. Matching
is capped at two pairs per opponent per UTC day and twenty pairs per user/day.
These are compute/abuse limits, not a complete defense against colluding accounts.

Operations jobs use their own tables and fenced leases. Duplicate results do not
update ratings twice. Official work is leased before background practice. Only
workers advertising `operations-v1` receive the new job types, allowing an older
worker to continue official work during rollout.

## Isolated, repeatable load run

```sh
npm run load:init
docker build -f docker/Dockerfile.local -t uet-arena-app:operations .
docker build -f judge/Dockerfile -t uet-arena-judge:operations .
npm run load:demo
```

Open **http://localhost:3002/load-demo**. Administrator credentials for the isolated
database are generated in `.secrets/load-admin.json`; they are never in a report.
The normal local stack on port 3000, Vercel and unrelated Docker projects are not
used. `compose.load.yaml` has independent secrets, networks, volume and database.

The run creates 4,000 synthetic accounts/memberships with pre-created sessions;
therefore the burst measures authenticated HTTP submission, not mass password
hashing or 4,000 simultaneous users. A real registration is tested separately.
Concurrency ramps through 1, 8, 16, 32 and 64. Eight deliberately invalid/output-
flooding bots check verdict handling inside WASI. A separate 32-team official
tournament runs at the same time. One **load-project** worker is stopped and
restarted; its unfinished lease can expire and be reassigned. The app is restarted
after the queues drain to check persistent practice ratings.

Client measurements include attempts, successful acceptance, non-2xx/network
errors, retries and per-window latency. Queue counts come from PostgreSQL; CPU
and RAM come from Docker. Missing telemetry is not reported as a zero-valued
resource measurement. The Windows telemetry file is an ephemeral snapshot, with
last-complete-read retention; the final report is saved separately.

Use `LOAD_TOTAL=64 LOAD_CHAOS=0` for a smaller shakedown (set environment variables
with the appropriate syntax for your shell). The 4,000-team intake event is not
automatically frozen into a 121,000-game tournament. The 32-team demonstration
does complete and its replay/source hashes and unique result commits are verified.

Results live in `output/operations/`; credentials in `.secrets/`; backups in
`backups/load/`. These directories are ignored by Git. The dashboard can replay
recorded samples; that mode is labelled separately from current telemetry.

```sh
docker compose -f compose.load.yaml stop
docker compose -f compose.load.yaml up -d --scale judge=2 --wait
```

Stopping preserves the demonstration database. Do not use `down -v` unless you
intend to delete its stored data. Fixture accounts are not real VNU participants.

## Backup evidence and scheduled operation at the university

```sh
npm run local:backup
node tests/local-backup.test.mjs
```

The restore test creates a distinct temporary database, restores the dump and
compares record counts before dropping **only that temporary database**. It writes
`backups/local/restore-verified.json`, which the app reads through a read-only
mount. Unknown or missing evidence stays unconfirmed. A successful previous
restore is not a guarantee that every future backup is recoverable.

On a university Linux host, install the supplied `deploy/uet-arena-backup.service`
and `.timer` into `/etc/systemd/system/` after adapting `User=arena`, the Node path
and `/opt/uet-arena` to the actual installation. The service account needs Docker
access (a privileged capability) and access to its private backup directory.
Then run `systemctl enable --now uet-arena-backup.timer` and inspect
`systemctl list-timers uet-arena-backup.timer`. The timer runs around 02:00 in the
host's timezone; configure that timezone deliberately. It is provided, **not
installed automatically on this Windows workstation**.

Copy dumps to an independent NAS/server under the university's retention and
access policies. Monitor disk usage and failed timers. Test restore regularly.
The readiness view reports configured HTTPS, not remote certificate validity;
verify DNS, TLS and firewall access from outside the university before an event.

## University HTTPS profile

Create an ignored environment file containing the real `ARENA_DOMAIN`, then use
`docker compose -f compose.local.yaml -f deploy/compose.local-public.yaml --env-file .env.campus up -d --build --wait`. This overlay shares the local app's `web` network and blocks the worker endpoint on the public reverse proxy. Do not combine the older SQLite public overlay with the PostgreSQL profile. Point DNS and firewall/NAT at the university server before enabling automatic certificates. Off-host workers need a separate authenticated private HTTPS/VPN endpoint; the public proxy deliberately does not expose `/api/judge`. No DNS or real certificate has been configured on this workstation.
