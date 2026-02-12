"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type FeaturedItem = {
  badge?: string;
  reason?: string;
  card: {
    slug: string;
    name: string;
    summary: string;
    keywords: string[];
  };
};

export function FeaturedCarousel({ localePath, items }: { localePath: "zh" | "en"; items: FeaturedItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length < 2) {
      return;
    }

    const step = 1;
    const interval = window.setInterval(() => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) {
        return;
      }

      if (container.scrollLeft >= maxScroll) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: step * 8, behavior: "smooth" });
      }
    }, 180);

    return () => window.clearInterval(interval);
  }, [items.length]);

  return (
    <div ref={containerRef} className="featured-row" aria-label="Featured carousel">
      {items.map((item, index) => (
        <article key={`${item.card.slug}-${index}`} className="card">
          <div style={{ marginBottom: 8 }}>
            {item.badge ? <span className="badge">{item.badge}</span> : null}
            {item.reason ? <span className="meta">{item.reason}</span> : null}
          </div>
          <h3 style={{ marginTop: 0 }}>{item.card.name}</h3>
          <p>{item.card.summary}</p>
          <p className="meta">{item.card.keywords.join(" · ")}</p>
          <Link href={`/${localePath}/products/${item.card.slug}`} className="button">
            View
          </Link>
        </article>
      ))}
    </div>
  );
}
