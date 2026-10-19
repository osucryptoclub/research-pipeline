import type { Group } from "@/lib/groups";
import { ItemRow } from "./ItemRow";

// Renders items already grouped by age. Filtering happens in Explorer.
export function ItemList({ groups, emptyText }: { groups: Group[]; emptyText: string }) {
  if (groups.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <>
      {groups.map((g) => (
        <section key={g.label}>
          <h2 className="group">
            {g.label} <span className="count">{g.items.length}</span>
          </h2>
          <ul className="items">
            {g.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
