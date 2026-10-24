# Docker account login

From the repository root:

```sh
npm run competition:init
docker compose up --build -d
```

Open **http://localhost:3000** and register with your name, email, phone number, and password (12–128 characters). Any syntactically valid email domain is accepted; the app does not verify mailbox ownership or send email.

The Docker copy has independent accounts and data. Sites is public and anonymous; it has no sign-in or account features. On `/competition`, an entrant creates a team of up to four people or requests to join an existing team. BTC can manage accounts and teams there, including one-use password-reset links that expire after 30 minutes; BTC must deliver the link manually over a trusted channel.

The `arena-data` named volume stores `auth.sqlite`, `competition.sqlite` and `casual.sqlite`. Restarting or rebuilding preserves them. Previous Docker D1 data is copied to the new casual SQLite database, with the original retained. `docker compose down` stops services without removing the volume. Avoid `docker compose down -v` unless you intend to erase that copy's accounts and games. Full tournament instructions: [Vietnamese manual](../docs/HUONG_DAN_SU_DUNG.md).

Passwords are salted with random 16-byte salts and hashed using Node scrypt (N=32768, r=8, p=1). Sessions use random 32-byte tokens; only SHA-256 token hashes are stored. Session cookies are HttpOnly, SameSite=Lax, and expire after seven days. Login/signup have persistent per-email and per-IP limits; authentication forms use CSRF tokens, and all mutation requests must come from `PUBLIC_ORIGIN`. Logout revokes the current session on the server. User identity headers are stripped at the gateway and rebuilt from the verified session. The internal Worker only listens on the container's loopback interface.

The default published port binds to the host's loopback address. For a different port, set both `ARENA_PORT` and `PUBLIC_ORIGIN`, for example `ARENA_PORT=3001` and `PUBLIC_ORIGIN=http://localhost:3001`. The Docker image now runs Next.js production on loopback 8787 behind the gateway, not the Wrangler development server. A public deployment needs HTTPS and its exact `PUBLIC_ORIGIN`; the optional Caddy override is in `deploy/compose.public.yaml`. Never publish the internal web port or mount Docker socket into judge. Each bot runs in a separate Wasmtime/CPython WASI process with read-only stdlib and no network capabilities.

## Organizer access

Registration never grants organizer rights automatically. Register your account first, then the Docker host owner can run:

```sh
docker compose exec app node docker/admin.mjs your@email.com
```

For the official tournament, open `/competition` then **Ban tổ chức**; the CLI grant applies directly. The old practice organizer screen has its own **Thiết lập quản trị** bootstrap and cannot publish official tournament results.

## Bots

Open **Bot của tôi** or **Tạo bot mới** to load/download Sprinter, Guardian or Tactician. You can also select them directly in **Chơi trực tiếp → Đấu bot của tôi** without submitting a version first. All three are standalone Python files under `public/bots/` and support both player sides.

## Checks and maintenance

```sh
docker compose ps
docker compose logs --tail 50 app
npm test
npm run test:bots
npm run test:docker
```

`test:bots` needs Python 3 (`OTT_PYTHON` overrides its path). It uses the original JavaScript engine to check complete games and legal moves. `test:docker` targets the running Docker app on loopback, creates clearly labeled test accounts and records, and checks login, cookie flags, CSRF, logout, account isolation, friend-room ownership, and spoofed identity rejection. It never uses your personal password. Only test records are created; existing records are untouched.

Docker volume behavior: [Docker volumes documentation](https://docs.docker.com/engine/storage/volumes/). Password hashing: [Node crypto documentation](https://nodejs.org/docs/latest-v22.x/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).
