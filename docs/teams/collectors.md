# Collectors: Oct 14-30

**Team:** Rudra, Satya
**Your job:** make sure every approved source lands clean in the archive, every day.

## Status
- **#34 (Rudra): done.** PR #54 strips HTML from summaries with `clean_html()` in `collectors/pipeline/text.py` and keeps the original in `raw`. Older rows saved before the fix still have entities like `&amp;`, so the Reader decodes them on display.
- **#48 (Rudra): done.** The daily run has passed every day since Oct 13.
- **#32: done.** `db.py` handles new-style Supabase keys (`sb_secret_...`).
- **#33 (Satya), JSON API collector: on hold until after Oct 30.** Search comes first. When it restarts, start with the Federal Register API (no key needed), confirm the config shape with Gagan before coding, and avoid APIs that need a key until Gagan sets up the secret.

## Every day (Rudra)
After lunch, open the repo's Actions tab and check "Daily collect." The 7:17 AM schedule usually starts around midday. If it failed, post in #pipeline-collectors with the `FAILED` line from the log.

Or from a terminal:
```bash
gh run list --repo osucryptoclub/research-pipeline --workflow collect.yml --limit 1
```

## When Curators add a source
Run it with `python run.py --dry-run --source <id>` and check that the links are real, the dates parse, and the tags fit. If it fails (for example a 403 from a site that blocks bots), say so on the PR **before** it's approved. One broken approved source turns the whole daily run red.

## Rules for this team
- Never write to the real database from your laptop. Always use `--dry-run`.
- Tests never hit the network. Use saved sample responses in `collectors/tests/fixtures/`.
- Don't edit `.github/workflows/` without Gagan.

## Commands
```bash
cd collectors && source .venv/bin/activate
python -m pytest -q
ruff check .
python run.py --dry-run --source <id>
python ../scripts/validate_config.py
```
