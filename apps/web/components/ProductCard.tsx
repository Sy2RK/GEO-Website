import Link from "next/link";

type ProductCardProps = {
  localePath: "zh" | "en";
  item: {
    canonicalId: string;
    slug: string;
    name: string;
    summary: string;
    typeTaxonomy: string[];
    platforms: string[];
    keywords: string[];
  };
};

export function ProductCard({ localePath, item }: ProductCardProps) {
  return (
    <article className="card">
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.name}</h3>
      <p className="meta" style={{ marginTop: 0 }}>
        {item.canonicalId}
      </p>
      <p>{item.summary}</p>
      <p className="meta">
        <strong>Type:</strong> {item.typeTaxonomy.join(", ")} <br />
        <strong>Platforms:</strong> {item.platforms.join(", ")}
      </p>
      <p className="meta">{item.keywords.join(" · ")}</p>
      <Link href={`/${localePath}/products/${item.slug}`} className="button">
        View
      </Link>
    </article>
  );
}
