export function JsonLdScript({ jsonld }: { jsonld: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />;
}
