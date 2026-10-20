import type { DayGroup } from "@/lib/days";
import type { Filters } from "@/lib/params";
import { ItemRow } from "./ItemRow";

type Props = { groups: DayGroup[]; filters: Filters; terms: string[]; emptyText: string };

// The archive as a timeline: one section per day it was published, newest first.
export function ItemList({ groups, filters, terms, emptyText }: Props) {
  if (groups.length === 0) return <p className="empty">{emptyText}</p>;
  return (
    <div className="timeline">
      {groups.map((g) => (
        <section key={g.key ?? "undated"} className="day" aria-labelledby={`day-${g.key ?? "undated"}`}>
          <h2 className="day-heading" id={`day-${g.key ?? "undated"}`}>
            {g.relative && <span className="day-relative">{g.relative}</span>}
            <span className="day-date">{g.heading}</span>
            <span className="day-count">
              {g.items.length} {g.items.length === 1 ? "item" : "items"}
            </span>
          </h2>
          <ul className="items">
            {g.items.map((item) => (
              <ItemRow key={item.id} item={item} filters={filters} terms={terms} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
