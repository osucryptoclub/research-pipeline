# Source curators: Oct 14-30

**Your job:** decide what goes into the archive. You are step one. Collectors, Archive and Reader are all waiting on your sources, so speed matters most here.

**Goal by Fri Oct 30:** 10+ sources for Research's two papers, approved by Research and added to `config/sources.yaml`.

## Tasks

### 1. The two new topics: done
`energy-compute` and `privacy-health` are in `config/sources.yaml` (#57, #55). The 5 energy sources are approved and collecting. Research signed off on the health sources on Oct 16, and #56 turns them on (all but `directtrust`, see below).

Keep tuning keywords as real items come in. Matching is whole-word and ignores case, so list plurals separately. If you add or rename a topic, update `reader/lib/topics.ts` too, or CI fails.

**Feeds that block bots:** `directtrust` returns 403 (a Cloudflare challenge) to automated requests, so it can't be collected. Always run `--dry-run` on a source before it's approved.

### 2. Find 8 to 10 sources
Look for credible sources on the two topics: government agencies, standards bodies, research institutions, university labs, and respected industry groups.

**Each source must have an RSS feed or an API.** The collector can't read paywalled sites (like WSJ), normal web pages, or one-off PDFs. To find a feed, look for an RSS icon or `/feed` or `/rss` on the site, or search "<site name> RSS" or "<site name> API". If a great source has neither, list it anyway and mark it "no feed" so we can decide later.

For each source, open a **New source** issue with:
- the name and the feed or API URL
- what it gives us and which topic or topics it covers
- its access rules: rate limits, required User-Agent, API key needed (yes or no)

**Done when:** 8 to 10 issues are open.

### 3. Get Research's approval
Work with Liaison. Research decides whether a source is credible enough, including whether university papers and preprints count. The approval goes in writing on the issue.

**Done when:** each source's issue shows Research's yes or no.

### 4. Add sources to the config
- **RSS sources:** add each one to `sources.yaml` with `approved: false` and its topic `tags`, then check it with `python run.py --dry-run --source <id>` from `collectors/`. You should see real titles, links, dates and sensible tags. One source per PR.
- **API sources:** tell Collectors in Slack. They're building the API collector this week, and your first API source is what they build it around.
- After Research approves, a curator flips it to `approved: true` in a separate small PR that links the approval.

## Work with
- **Liaison:** approvals
- **Collectors:** which sources are APIs
- **Archive:** tags that look wrong

## Start here
Read the SEC entry in `config/sources.yaml`, since every new source copies its shape. Then run `python run.py --dry-run --source sec-press-releases` from `collectors/` to see what a working source looks like.
