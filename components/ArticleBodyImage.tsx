import Image from "next/image";
import {urlFor} from "@/sanity/lib/image";

export type ArticleBodyImageValue = {
  _type?: "image";
  asset?: {_ref?: string};
  alt?: string;
  crop?: {top?: number; bottom?: number; left?: number; right?: number};
  hotspot?: {x: number; y: number; width: number; height: number};
};

export default function ArticleBodyImage({value}: {value: ArticleBodyImageValue}) {
  if (!value.asset?._ref) return null;
  const dimensions = /-(\d+)x(\d+)-[a-z0-9]+$/i.exec(value.asset._ref);
  if (!dimensions) return null;
  const crop = value.crop;
  const originalWidth = Number(dimensions[1]) * (1 - (crop?.left || 0) - (crop?.right || 0));
  const originalHeight = Number(dimensions[2]) * (1 - (crop?.top || 0) - (crop?.bottom || 0));
  if (originalWidth <= 0 || originalHeight <= 0) return null;
  const width = Math.min(1200, Math.round(originalWidth));
  const height = Math.max(1, Math.round(width * originalHeight / originalWidth));
  return <figure className="my-8">
    <Image
      src={urlFor(value).width(width).auto("format").url()}
      alt={value.alt || ""}
      width={width}
      height={height}
      sizes="(max-width: 1024px) 100vw, 760px"
      className="h-auto w-full rounded-xl"
    />
  </figure>;
}
