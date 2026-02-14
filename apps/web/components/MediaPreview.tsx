type MediaAssetItem = {
  id: string;
  type: string;
  url: string;
  meta?: {
    altText?: string;
  };
};

function isVideoAsset(asset: MediaAssetItem): boolean {
  if (asset.type.toLowerCase() === "video") {
    return true;
  }

  return /\.(mp4|webm|m4v|mov|ogv)(\?.*)?$/i.test(asset.url);
}

function isImageAsset(asset: MediaAssetItem): boolean {
  const type = asset.type.toLowerCase();
  if (type === "image" || type === "icon" || type === "cover") {
    return true;
  }

  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(asset.url);
}

export function MediaPreview({
  asset,
  locale,
  fallbackAlt
}: {
  asset: MediaAssetItem;
  locale: "zh" | "en";
  fallbackAlt: string;
}) {
  const isEn = locale === "en";
  const altText = asset.meta?.altText ?? fallbackAlt;
  const video = isVideoAsset(asset);
  const image = !video && isImageAsset(asset);

  return (
    <figure className="card media-preview-card">
      <div className="media-preview-frame">
        {video ? (
          <video controls preload="metadata" playsInline className="media-preview-video" src={asset.url} />
        ) : image ? (
          <img src={asset.url} alt={altText} loading="lazy" className="media-preview-image" />
        ) : (
          <a href={asset.url} target="_blank" rel="noreferrer" className="media-preview-link">
            {asset.url}
          </a>
        )}
      </div>

      <figcaption className="media-preview-caption">
        <span className="meta">
          {asset.type} {asset.meta?.altText ? `| ${asset.meta.altText}` : ""}
        </span>
        <a href={asset.url} target="_blank" rel="noreferrer" className="button ghost">
          {isEn ? "Open File" : "打开原文件"}
        </a>
      </figcaption>
    </figure>
  );
}
