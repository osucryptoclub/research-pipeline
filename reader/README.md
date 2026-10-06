# Reader

The Next.js app Research uses to browse and search the archive. Reader team owns this folder.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

With no `.env.local`, the page shows sample items from `lib/sample-items.json`, so you can build the layout before the database exists.

## Connect the real database

Copy `.env.example` to `.env.local` and fill in the Supabase URL and **anon** key (a lead will share them). The anon key can only read `items`. Never put the service role key in this app.

## Where things are

- `app/page.tsx`: the home page (latest items)
- `lib/items.ts`: the database query, with a fallback to sample data
- `app/globals.css`: styles, deliberately plain for now

Milestone 1: the home page lists real items, newest first, with title, source, date, tags, and a link to the original.
