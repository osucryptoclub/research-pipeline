# Collectors: this week

**Your job:** make sure every approved source actually lands in the archive every morning, and get the pipeline reading APIs, not just RSS.

**Goal by around Oct 20:** the API collector works, and every new source from Curators runs cleanly.

## Tasks

### 1. JSON API collector (top priority)
Many of the new sources will be APIs that return JSON instead of RSS feeds. Today only RSS works.

- Add `collectors/pipeline/types/json_api.py` with `collect(source: dict, user_agent: str) -> list[dict]`, the same shape as `rss.py`. Split it into `collect()` (does the HTTP request) and `parse()` (turns the response into items), so tests can call `parse()` without the network.
- Each item needs `source_id`, `url`, `title`, `summary`, `published_at` (ISO 8601 or `None`), and `raw` (the original record).
- APIs all look different, so the source's entry in `sources.yaml` should say where things are. For example, add fields like `items_path` (where the list of records is), and `title_field`, `url_field`, `date_field`. Keep it as simple as the first real API needs. Don't design for every API ever.
- Register it in `COLLECTORS` in `collectors/pipeline/types/__init__.py`, add `json_api` to `SUPPORTED_TYPES` in `scripts/validate_config.py`, and teach the validator about any new required fields.
- If an API needs a key, read it from an environment variable named in the config. Never put the key in `sources.yaml`.
- Build it around the first real API source the Curators pick. Ask them in Slack.

**Done when:** that source works with `python run.py --dry-run --source <id>`, and the tests run `parse()` on a saved sample response in `collectors/tests/`.

### 2. Check every new source
When Curators add a source, run it with `--dry-run` and check that the links are real, the dates parse, the titles make sense, and the tags fit. Report problems on their PR.

### 3. Clean RSS summaries
RSS summaries often contain HTML tags and codes like `&amp;`. Strip them to plain text in `rss.py` before saving, and keep the original in `raw`.

**Done when:** tests cover HTML tags, HTML codes, and empty or missing summaries.

### 4. Morning check
Every day, someone confirms that the 7:17am Daily collect run passed:
`gh run list --repo osucryptoclub/research-pipeline --workflow collect.yml --limit 1`
If it failed, open the run, find the failing source, and post in Slack. News we miss can't be collected later.

## Rules for this team
- Use `--dry-run` on your laptop. You never need the secret database key.
- Tests never call the internet. Save a sample response file and parse that.
- Don't edit `.github/workflows/` without a lead.

## Work with
- **Curators:** which sources are coming, and which are APIs
- **Archive:** the shape of the items you send

## Start here
Read `collectors/run.py` and `collectors/pipeline/types/rss.py`, then run `python run.py --dry-run --source sec-press-releases` from `collectors/`.
