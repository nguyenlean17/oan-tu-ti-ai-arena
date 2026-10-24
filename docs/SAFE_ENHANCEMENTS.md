# Selective integration from `enhancements`

This branch starts from `main` at `ac4eeaa`, retaining its responsive-layout fixes.
The example strategies are adapted from `enhancements` at `72b5558`.

## Included

- **Starter Config:** adjust `BOT_CONFIG` weights in the existing Python editor;
  no new language, execution path or scoring policy is introduced.
- **Heuristic Hunter:** an additional educational example using the same
  `choose_move(state)` contract. Both examples appear in the bot library, direct
  Python play and the official submission page's download links.
- **Offline replay:** open an official replay and choose **Tải HTML ngoại tuyến**.
  The file contains the saved move sequence, board frames and runtime/source-hash
  metadata. It works without a backend or external assets. It never runs Python.
  The existing JSON download remains available.

To convert a downloaded individual replay from the command line:

```sh
node scripts/export-replay-html.mjs replay.json replay.html
```

The converter refuses to overwrite an existing output file. It reads a replay,
not a Python source file or whole tournament export. Board moves are checked by
the existing engine before rendering. The HTML is a viewing copy, not a signed
record or a substitute for the server's official result verification; it cannot
be imported to change standings. Only display metadata is exported, never bot
source or account information. Untrusted text is escaped, and the HTML prohibits
network access through its Content Security Policy.

## Intentionally excluded

Host-Python match runners and diagnostics, dynamic Elo, alternate tie-break rules,
automatic matchmaking and the AST plagiarism checker are not integrated. They
require additional correctness, policy or security work. Official rules, auth,
submission quotas, database schema and the WASI judge are unchanged.

## Verification

`npm test` includes replay validation, injection checks and playback controls.
`tests/judge.test.mjs` validates the new examples and runs both seats through the
official WASI runner, alongside the existing hostile-code regression cases.
New examples are reference strategies, not a claim of tournament strength.
