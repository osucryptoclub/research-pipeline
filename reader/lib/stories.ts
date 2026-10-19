import type { Item } from "./items";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const PER_TOPIC_CAP = 2;

export type TopStory = { story: Item; topic: string; count: number };

// Picks specific articles to feature. There is no view or click data, so "top" is a plain rule:
//   1. Look at the 7 days up to the newest item (not "today", so a pause in collection doesn't empty the page).
//   2. Rank topics by how many items they got in that window.
//   3. Rank items by their hottest topic, then image first, then newest.
//   4. Take at most 2 per topic so one topic can't fill the block, then fill any gaps ignoring the cap.
// Items with no date or no topic are skipped: we can't say why they would be featured.
export function pickTopStories(items: Item[], n = 5): TopStory[] {
  const time = (i: Item) => (i.published_at ? new Date(i.published_at).getTime() : NaN);
  const dated = items.filter((i) => !Number.isNaN(time(i)));
  if (dated.length === 0) return [];
  const cutoff = Math.max(...dated.map(time)) - WEEK;
  const recent = dated.filter((i) => time(i) >= cutoff && i.tags.length > 0);

  const heat = new Map<string, number>();
  for (const i of recent) for (const t of i.tags) heat.set(t, (heat.get(t) ?? 0) + 1);

  const ranked = recent
    .map((story) => {
      const topic = [...story.tags].sort((a, b) => heat.get(b)! - heat.get(a)! || a.localeCompare(b))[0];
      return { story, topic, count: heat.get(topic)! };
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        Number(!!b.story.image_url) - Number(!!a.story.image_url) ||
        time(b.story) - time(a.story) ||
        a.story.id - b.story.id,
    );

  const used = new Map<string, number>();
  const picked = ranked.filter((r) => {
    if ((used.get(r.topic) ?? 0) >= PER_TOPIC_CAP) return false;
    used.set(r.topic, (used.get(r.topic) ?? 0) + 1);
    return true;
  });
  const out = picked.slice(0, n);
  for (const r of ranked) {
    if (out.length >= n) break;
    if (!out.includes(r)) out.push(r);
  }
  return out;
}
