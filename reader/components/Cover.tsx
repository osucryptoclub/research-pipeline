"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/lib/items";

// Small seeded random generator so the same article always gets the same artwork.
function rng(seed: number) {
  let a = seed * 2654435761 + 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 400;
const H = 250;

// One drawing style per topic. These are abstract covers, never presented as photos of the story.
function art(topic: string, rand: () => number) {
  const els: React.ReactNode[] = [];
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);

  if (topic === "stablecoins") {
    const cx = between(130, 270), cy = between(95, 155);
    for (let i = 0; i < 5; i++) els.push(<circle key={i} cx={cx} cy={cy} r={28 + i * 26} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.55 - i * 0.07} />);
    els.push(<circle key="f" cx={cx} cy={cy} r={22} fill="currentColor" opacity={0.28} />);
  } else if (topic === "tokenization") {
    const hot = new Set(Array.from({ length: 12 }, () => Math.floor(rand() * 40)));
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 8; c++) {
        const on = hot.has(r * 8 + c);
        els.push(<rect key={`${r}${c}`} x={20 + c * 45} y={15 + r * 44} width={36} height={36} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} opacity={on ? 0.3 : 0.4} />);
      }
  } else if (topic === "regulation") {
    for (let i = 0; i < 11; i++) {
      const h = between(60, 190);
      els.push(<rect key={i} x={30 + i * 33} y={H - 30 - h} width={14} height={h} fill="currentColor" opacity={0.22 + (i % 3) * 0.1} />);
    }
    els.push(<rect key="base" x={16} y={H - 30} width={W - 32} height={5} fill="currentColor" opacity={0.6} />);
  } else if (topic === "bitcoin-institutional") {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 7; c++) {
        const x = 40 + c * 52 + (r % 2) * 26, y = 36 + r * 54;
        els.push(<polygon key={`${r}${c}`} points={`${x},${y - 26} ${x + 24},${y - 13} ${x + 24},${y + 13} ${x},${y + 26} ${x - 24},${y + 13} ${x - 24},${y - 13}`} fill={rand() > 0.72 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} opacity={0.38} />);
      }
  } else if (topic === "ai-crypto") {
    const pts = Array.from({ length: 10 }, () => [between(25, W - 25), between(25, H - 25)]);
    pts.forEach((p, i) => {
      const q = pts[(i + 3) % pts.length];
      els.push(<line key={`l${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="currentColor" strokeWidth={1.5} opacity={0.35} />);
    });
    pts.forEach((p, i) => els.push(<circle key={`c${i}`} cx={p[0]} cy={p[1]} r={i % 3 === 0 ? 9 : 5} fill="currentColor" opacity={0.55} />));
  } else if (topic === "prediction-markets") {
    let y = between(120, 190);
    const line: string[] = [];
    for (let i = 0; i < 14; i++) {
      const h = between(30, 170);
      els.push(<rect key={i} x={18 + i * 27} y={H - 20 - h} width={18} height={h} fill="currentColor" opacity={0.18} />);
      y = Math.min(220, Math.max(30, y + between(-45, 40)));
      line.push(`${27 + i * 27},${y}`);
    }
    els.push(<polyline key="p" points={line.join(" ")} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.7} />);
  } else {
    for (let i = -6; i < 16; i++) els.push(<line key={i} x1={i * 30} y1={H} x2={i * 30 + 160} y2={0} stroke="currentColor" strokeWidth={2} opacity={0.2 + (i % 4) * 0.08} />);
  }
  return els;
}

type Props = { item: Pick<Item, "id" | "tags" | "image_url">; className?: string };

// Article image when the source gave us one; otherwise generated artwork in the topic's color.
export function Cover({ item, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const topic = item.tags[0] ?? "";
  const img = useRef<HTMLImageElement>(null);

  // The image can finish loading (or fail) before React attaches onLoad/onError, so check once on mount.
  useEffect(() => {
    const el = img.current;
    if (!el?.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else setFailed(true);
  }, []);

  return (
    <div className={`cover ${className}`} data-topic={topic || "none"} data-loaded={loaded}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {art(topic, rng(item.id))}
      </svg>
      {item.image_url && !failed && (
        // Plain <img>: sources are arbitrary hosts, so next/image's allow-list doesn't fit. Falls back to the art on error.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={item.image_url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
