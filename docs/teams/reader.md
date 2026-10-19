# Reader: this week

**Your job:** build the site Research uses. It's the only part of the project they see, so if it's confusing, the whole project looks broken.

**Goal by around Oct 20:** Research can search and filter real sources for their two papers on the live site.

## Tasks

### 1. Everyone builds a mockup (first 1 or 2 days)
Each person designs their own version of the Reader with fake data: a search box, topic and source filters, and a list of items. Post a screenshot or link in Slack.

Think like a researcher writing a paper on data center energy use or healthcare digital identity. What do they need to see first? How do they find the one item they remember from last week?

**Done when:** everyone has posted a mockup.

### 2. Pick the best parts and agree on one design
Meet as a team, pick what works from each mockup, and write the agreed design in a GitHub issue so everyone builds the same thing. Aiden has the final say.

### 3. Build it in `reader/`
- A **search box**. Satya is wiring it in #30 (due Oct 21) with supabase-js `.textSearch('search', q, { type: 'websearch' })` and a `?q=` param that works together with `?topic=`. Aidan reviews it.
- **Filters** by topic tag and by source. Clicking a tag should filter by it.
- **Every item links to its original source.** Show the source and the date on every item.
- Summaries are plain text. Never render HTML from a source.
- It has to keep working with sample data when no keys are set. See `lib/items.ts`.

Keep pages as server components unless something needs interactivity. Use TypeScript strict mode and avoid `any`.

**Done when:** it works locally with sample data, and `npm run typecheck` and `npm run build` pass.

### 4. Connect real data
Once Archive's search function is live and new sources are in, switch it on and check it on the live site (research-pipeline-zeta.vercel.app). Every merge to `main` redeploys it.

## Rules for this team
- Only ever use the public key, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The secret key never goes in `reader/`.
- Keys live in `reader/.env.local`, which is gitignored. Never commit it.

## Work with
- **Archive:** the search function
- **Liaison:** what Research thinks of the site

## Start here
`cd reader && npm install && npm run dev`, then read `app/page.tsx` and `lib/items.ts`.
